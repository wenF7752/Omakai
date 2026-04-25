import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { pickCandidates, pickDish } from '@/lib/kimi/client';
import type { ProfilePreferences } from '@/lib/profile/types';
import type { BraveResult } from '@/lib/brave/types';
import type { Menu, RestaurantCandidate } from '@/lib/apify/types';
import type { DishId, RestaurantId, StoreUuid } from '@/lib/types';

const KIMI_URL = 'https://api.moonshot.ai/v1/chat/completions';

const PREFS: ProfilePreferences = {
  cuisines: ['japanese'],
  free_text: '',
  vibes: ['cozy'],
  budget_tier: '$$',
  allergies: [],
};

const BRAVE_RESULTS: BraveResult[] = [
  { title: 'Mensho Tokyo SF', url: 'https://www.ubereats.com/store/mensho/abc', description: 'ramen' },
  { title: 'Ippudo SF', url: 'https://www.ubereats.com/store/ippudo/def', description: 'tonkotsu' },
  { title: 'Marufuku', url: 'https://www.ubereats.com/store/marufuku/ghi', description: 'noodles' },
  { title: 'Hinodeya', url: 'https://www.ubereats.com/store/hinodeya/jkl', description: 'shio' },
];

const VALID_PICK_RESPONSE = {
  hero_url: BRAVE_RESULTS[0]!.url,
  alternatives: [
    { url: BRAVE_RESULTS[1]!.url, tag: 'lighter' },
    { url: BRAVE_RESULTS[2]!.url, tag: 'spicier' },
    { url: BRAVE_RESULTS[3]!.url, tag: 'cheaper' },
  ],
};

const USAGE = {
  prompt_tokens: 1200,
  completion_tokens: 80,
  cached_tokens: 1100,
};

function kimiResponse(content: unknown, usage = USAGE) {
  return {
    id: 'cmpl-test',
    choices: [{ message: { role: 'assistant', content: typeof content === 'string' ? content : JSON.stringify(content) } }],
    usage,
  };
}

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('pickCandidates', () => {
  it('happy path: returns Result.ok with pick + usage', async () => {
    server.use(http.post(KIMI_URL, () => HttpResponse.json(kimiResponse(VALID_PICK_RESPONSE))));
    const result = await pickCandidates({ inputs: PREFS, candidates: BRAVE_RESULTS });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.pick.hero_url).toBe(BRAVE_RESULTS[0]!.url);
    expect(result.value.pick.alternatives).toHaveLength(3);
    expect(result.value.usage.input_tokens).toBe(1200);
    expect(result.value.usage.cache_read_input_tokens).toBe(1100);
  });

  it('schema drift first attempt + valid retry: succeeds with attempts=2', async () => {
    let attempt = 0;
    server.use(
      http.post(KIMI_URL, () => {
        attempt += 1;
        if (attempt === 1) return HttpResponse.json(kimiResponse('I cannot pick a JSON yes'));
        return HttpResponse.json(kimiResponse(VALID_PICK_RESPONSE));
      }),
    );
    const result = await pickCandidates({ inputs: PREFS, candidates: BRAVE_RESULTS });
    expect(attempt).toBe(2);
    expect(result.ok).toBe(true);
  });

  it('schema drift twice: returns Err parse_drift with attempts=2', async () => {
    server.use(http.post(KIMI_URL, () => HttpResponse.json(kimiResponse('not json'))));
    const result = await pickCandidates({ inputs: PREFS, candidates: BRAVE_RESULTS });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('parse_drift');
    if (result.error.code !== 'parse_drift') return;
    expect(result.error.attempts).toBe(2);
  });

  it('5xx: returns Err http_5xx with status', async () => {
    server.use(http.post(KIMI_URL, () => new HttpResponse('upstream', { status: 503 })));
    const result = await pickCandidates({ inputs: PREFS, candidates: BRAVE_RESULTS });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('http_5xx');
    if (result.error.code !== 'http_5xx') return;
    expect(result.error.status).toBe(503);
  });

  it('429: returns Err rate_limited with retry_after_ms', async () => {
    server.use(
      http.post(
        KIMI_URL,
        () => new HttpResponse(null, { status: 429, headers: { 'Retry-After': '5' } }),
      ),
    );
    const result = await pickCandidates({ inputs: PREFS, candidates: BRAVE_RESULTS });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('rate_limited');
    if (result.error.code !== 'rate_limited') return;
    expect(result.error.retry_after_ms).toBe(5000);
  });

  it('abort: signal.abort() pre-resolution rejects with AbortError', async () => {
    server.use(
      http.post(KIMI_URL, async () => {
        await new Promise((r) => setTimeout(r, 100));
        return HttpResponse.json(kimiResponse(VALID_PICK_RESPONSE));
      }),
    );
    const controller = new AbortController();
    const promise = pickCandidates({
      inputs: PREFS,
      candidates: BRAVE_RESULTS,
      signal: controller.signal,
    });
    controller.abort();
    await expect(promise).rejects.toThrow();
  });

  it('system prompt is byte-identical across consecutive calls (cache stability)', async () => {
    const captured: string[] = [];
    server.use(
      http.post(KIMI_URL, async ({ request }) => {
        const body = (await request.json()) as { messages: Array<{ role: string; content: string }> };
        const sys = body.messages.find((m) => m.role === 'system');
        if (sys) captured.push(sys.content);
        return HttpResponse.json(kimiResponse(VALID_PICK_RESPONSE));
      }),
    );
    await pickCandidates({ inputs: PREFS, candidates: BRAVE_RESULTS });
    await pickCandidates({ inputs: PREFS, candidates: BRAVE_RESULTS });
    expect(captured).toHaveLength(2);
    expect(captured[0]).toBe(captured[1]);
  });
});

describe('pickDish', () => {
  const MENU: Menu = {
    restaurant_id: 'r-1' as RestaurantId,
    restaurant_name: 'Mensho',
    store_uuid: 'abc' as StoreUuid,
    items: [
      { id: 'd-1' as DishId, name: 'Tonkotsu', price_cents: 1850, description: 'pork bone broth ramen' },
      { id: 'd-2' as DishId, name: 'Shoyu', price_cents: 1650, description: 'soy ramen' },
    ],
    fetched_at: Date.now(),
  };
  const RESTAURANT: RestaurantCandidate = {
    restaurant_id: 'r-1' as RestaurantId,
    name: 'Mensho',
    url: 'https://www.ubereats.com/store/mensho/abc',
    store_uuid: 'abc' as StoreUuid,
  };

  it('happy path: returns Result.ok with dish_id present in menu', async () => {
    const dishPick = { dish_id: 'd-1', reasoning: 'rich and warming on a cold day, you will love it' };
    server.use(http.post(KIMI_URL, () => HttpResponse.json(kimiResponse(dishPick))));
    const result = await pickDish({ inputs: PREFS, restaurant: RESTAURANT, menu: MENU });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.pick.dish_id).toBe('d-1');
  });

  it('returns dish_id even if not in menu (validator handles consistency)', async () => {
    const dishPick = {
      dish_id: 'd-not-in-menu',
      reasoning: 'this dish does not really exist but reasoning passes schema',
    };
    server.use(http.post(KIMI_URL, () => HttpResponse.json(kimiResponse(dishPick))));
    const result = await pickDish({ inputs: PREFS, restaurant: RESTAURANT, menu: MENU });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.pick.dish_id).toBe('d-not-in-menu');
  });

  it('warning field surfaces when present', async () => {
    const dishPick = {
      dish_id: 'd-1',
      reasoning: 'ingredients ambiguous regarding declared allergen exposure',
      warning: 'broth may contain trace shellfish',
    };
    server.use(http.post(KIMI_URL, () => HttpResponse.json(kimiResponse(dishPick))));
    const result = await pickDish({ inputs: PREFS, restaurant: RESTAURANT, menu: MENU });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.pick.warning).toBe('broth may contain trace shellfish');
  });
});
