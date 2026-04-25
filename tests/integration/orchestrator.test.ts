import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { runPipeline, runAlternative } from '@/lib/pipeline/orchestrator';
import type { PipelineEvent } from '@/lib/pipeline/events';
import type { Address, ProfilePreferences } from '@/lib/profile/types';
import type { RestaurantCandidate } from '@/lib/apify/types';
import type { RestaurantId, StoreUuid } from '@/lib/types';

const BRAVE_URL = 'https://api.search.brave.com/res/v1/web/search';
const KIMI_URL = 'https://api.moonshot.ai/v1/chat/completions';
const APIFY_URL = 'https://api.apify.com/v2/acts/datacach~ubereats-menu-scraper/run-sync-get-dataset-items';

const PREFS: ProfilePreferences = {
  cuisines: ['japanese'],
  free_text: '',
  vibes: ['cozy'],
  budget_tier: '$$',
  allergies: [],
};

const PREFS_PEANUT_ALLERGY: ProfilePreferences = { ...PREFS, allergies: ['peanut'] };

const ADDRESS: Address = { raw: '447 Valencia St SF' };

const BRAVE_RESPONSE = {
  web: {
    results: [
      { title: 'Mensho', url: 'https://www.ubereats.com/store/mensho/abc', description: 'ramen' },
      { title: 'Ippudo', url: 'https://www.ubereats.com/store/ippudo/def', description: 'tonkotsu' },
      { title: 'Marufuku', url: 'https://www.ubereats.com/store/marufuku/ghi', description: 'noodles' },
      { title: 'Hinodeya', url: 'https://www.ubereats.com/store/hinodeya/jkl', description: 'shio' },
    ],
  },
};

const VALID_PICK = {
  hero_url: 'https://www.ubereats.com/store/mensho/abc',
  alternatives: [
    { url: 'https://www.ubereats.com/store/ippudo/def', tag: 'lighter' },
    { url: 'https://www.ubereats.com/store/marufuku/ghi', tag: 'spicier' },
    { url: 'https://www.ubereats.com/store/hinodeya/jkl', tag: 'cheaper' },
  ],
};

const APIFY_RESPONSE = [
  {
    name: 'Mensho Tokyo SF',
    items: [
      { id: 'd-1', name: 'Tonkotsu', price: '$18.50', description: 'pork bone broth ramen' },
      { id: 'd-2', name: 'Shoyu', price: '$16.50', description: 'soy ramen' },
    ],
  },
];

const VALID_DISH_PICK = {
  dish_id: 'd-1',
  reasoning: 'a rich and warming bowl that fits a cozy vibe nicely',
};

const KIMI_USAGE = { prompt_tokens: 1000, completion_tokens: 50, cached_tokens: 800 };
const kimiBody = (content: unknown) => ({
  choices: [{ message: { role: 'assistant', content: typeof content === 'string' ? content : JSON.stringify(content) } }],
  usage: KIMI_USAGE,
});

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function happyPathHandlers() {
  let kimiCall = 0;
  return [
    http.get(BRAVE_URL, () => HttpResponse.json(BRAVE_RESPONSE)),
    http.post(KIMI_URL, () => {
      kimiCall += 1;
      const content = kimiCall === 1 ? VALID_PICK : VALID_DISH_PICK;
      return HttpResponse.json(kimiBody(content));
    }),
    http.post(APIFY_URL, () => HttpResponse.json(APIFY_RESPONSE)),
  ];
}

async function collect(gen: AsyncGenerator<PipelineEvent, void, void>): Promise<PipelineEvent[]> {
  const events: PipelineEvent[] = [];
  for await (const e of gen) events.push(e);
  return events;
}

describe('runPipeline happy path', () => {
  it('yields phases in order, emits candidates + result', async () => {
    server.use(...happyPathHandlers());
    const controller = new AbortController();
    const events = await collect(runPipeline({ inputs: PREFS, address: ADDRESS, signal: controller.signal }));

    const types = events.map((e) => e.type).filter((t) => t !== 'log');
    expect(types).toEqual([
      'phase',
      'phase',
      'phase',
      'candidates',
      'phase',
      'phase',
      'phase',
      'phase',
      'result',
    ]);

    const logs = events.filter((e): e is Extract<PipelineEvent, { type: 'log' }> => e.type === 'log');
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0]?.entry.stage).toBe('looking');

    const phases = events
      .filter((e): e is Extract<PipelineEvent, { type: 'phase' }> => e.type === 'phase')
      .map((e) => e.phase);
    expect(phases).toEqual([
      'address_received',
      'searching_restaurants',
      'picking_candidates',
      'fetching_menu',
      'picking_dish',
      'validating',
      'done',
    ]);

    const result = events.find((e): e is Extract<PipelineEvent, { type: 'result' }> => e.type === 'result');
    expect(result).toBeDefined();
    expect(result!.deep_link).toMatch(/^https:\/\/www\.ubereats\.com\/store\/mensho\/abc/);
    expect(result!.recommendation.dish.id).toBe('d-1');
  });
});

describe('runPipeline error paths', () => {
  it('Brave 0 results → error no_candidates', async () => {
    server.use(http.get(BRAVE_URL, () => HttpResponse.json({ web: { results: [] } })));
    const events = await collect(
      runPipeline({ inputs: PREFS, address: ADDRESS, signal: new AbortController().signal }),
    );
    const err = events.find((e): e is Extract<PipelineEvent, { type: 'error' }> => e.type === 'error');
    expect(err).toBeDefined();
    expect(err!.error.code).toBe('no_candidates');
  });

  it('Apify menu_fetch_failed → error menu_fetch_failed', async () => {
    let kimiCall = 0;
    server.use(
      http.get(BRAVE_URL, () => HttpResponse.json(BRAVE_RESPONSE)),
      http.post(KIMI_URL, () => {
        kimiCall += 1;
        return HttpResponse.json(kimiBody(kimiCall === 1 ? VALID_PICK : VALID_DISH_PICK));
      }),
      http.post(APIFY_URL, () => new HttpResponse('boom', { status: 502 })),
    );
    const events = await collect(
      runPipeline({ inputs: PREFS, address: ADDRESS, signal: new AbortController().signal }),
    );
    const err = events.find((e): e is Extract<PipelineEvent, { type: 'error' }> => e.type === 'error');
    expect(err).toBeDefined();
    expect(err!.error.code).toBe('menu_fetch_failed');
  });

  it('Kimi parse_drift after retry → error kimi_drift', async () => {
    server.use(
      http.get(BRAVE_URL, () => HttpResponse.json(BRAVE_RESPONSE)),
      http.post(KIMI_URL, () => HttpResponse.json(kimiBody('not json prose'))),
    );
    const events = await collect(
      runPipeline({ inputs: PREFS, address: ADDRESS, signal: new AbortController().signal }),
    );
    const err = events.find((e): e is Extract<PipelineEvent, { type: 'error' }> => e.type === 'error');
    expect(err).toBeDefined();
    expect(err!.error.code).toBe('kimi_drift');
  });

  it('validator allergen_violation → error allergen_violation', async () => {
    let kimiCall = 0;
    const peanutMenu = [
      {
        name: 'Mensho',
        items: [{ id: 'd-1', name: 'Pad Thai', price: '$15.00', description: 'noodles with peanut sauce' }],
      },
    ];
    server.use(
      http.get(BRAVE_URL, () => HttpResponse.json(BRAVE_RESPONSE)),
      http.post(KIMI_URL, () => {
        kimiCall += 1;
        return HttpResponse.json(kimiBody(kimiCall === 1 ? VALID_PICK : VALID_DISH_PICK));
      }),
      http.post(APIFY_URL, () => HttpResponse.json(peanutMenu)),
    );
    const events = await collect(
      runPipeline({
        inputs: PREFS_PEANUT_ALLERGY,
        address: ADDRESS,
        signal: new AbortController().signal,
      }),
    );
    const err = events.find((e): e is Extract<PipelineEvent, { type: 'error' }> => e.type === 'error');
    expect(err).toBeDefined();
    expect(err!.error.code).toBe('allergen_violation');
  });
});

describe('runPipeline cancellation', () => {
  it('abort during Brave → error aborted', async () => {
    server.use(
      http.get(BRAVE_URL, async () => {
        await new Promise((r) => setTimeout(r, 200));
        return HttpResponse.json(BRAVE_RESPONSE);
      }),
    );
    const controller = new AbortController();
    const promise = collect(runPipeline({ inputs: PREFS, address: ADDRESS, signal: controller.signal }));
    setTimeout(() => controller.abort(), 30);
    const events = await promise;
    const err = events.find((e): e is Extract<PipelineEvent, { type: 'error' }> => e.type === 'error');
    expect(err).toBeDefined();
    expect(err!.error.code).toBe('aborted');
  });

  it('abort during Apify → error aborted', async () => {
    let kimiCall = 0;
    server.use(
      http.get(BRAVE_URL, () => HttpResponse.json(BRAVE_RESPONSE)),
      http.post(KIMI_URL, () => {
        kimiCall += 1;
        return HttpResponse.json(kimiBody(kimiCall === 1 ? VALID_PICK : VALID_DISH_PICK));
      }),
      http.post(APIFY_URL, async () => {
        await new Promise((r) => setTimeout(r, 200));
        return HttpResponse.json(APIFY_RESPONSE);
      }),
    );
    const controller = new AbortController();
    const promise = collect(runPipeline({ inputs: PREFS, address: ADDRESS, signal: controller.signal }));
    setTimeout(() => controller.abort(), 60);
    const events = await promise;
    const err = events.find((e): e is Extract<PipelineEvent, { type: 'error' }> => e.type === 'error');
    expect(err).toBeDefined();
    expect(err!.error.code).toBe('aborted');
  });
});

describe('runAlternative', () => {
  it('skips Brave + initial Kimi pick, starts from fetching_menu', async () => {
    server.use(
      http.post(KIMI_URL, () => HttpResponse.json(kimiBody(VALID_DISH_PICK))),
      http.post(APIFY_URL, () => HttpResponse.json(APIFY_RESPONSE)),
    );
    const alt: RestaurantCandidate = {
      restaurant_id: 'def' as RestaurantId,
      name: 'Ippudo',
      url: 'https://www.ubereats.com/store/ippudo/def',
      store_uuid: 'def' as StoreUuid,
    };
    const events = await collect(
      runAlternative({
        inputs: PREFS,
        alternative: alt,
        declared_allergies: [],
        signal: new AbortController().signal,
      }),
    );
    const phases = events
      .filter((e): e is Extract<PipelineEvent, { type: 'phase' }> => e.type === 'phase')
      .map((e) => e.phase);
    expect(phases[0]).toBe('fetching_menu');
    expect(phases).not.toContain('searching_restaurants');
    expect(phases).not.toContain('picking_candidates');

    const result = events.find((e): e is Extract<PipelineEvent, { type: 'result' }> => e.type === 'result');
    expect(result).toBeDefined();
    expect(result!.recommendation.restaurant.url).toContain('ippudo');
  });
});

describe('runPipeline excludes', () => {
  it('drops Brave candidates whose store_uuid matches a recent pick', async () => {
    let candidatesPrompt: string | null = null;
    server.use(
      http.get(BRAVE_URL, () => HttpResponse.json(BRAVE_RESPONSE)),
      http.post(KIMI_URL, async ({ request }) => {
        const body = (await request.json()) as { messages: { content: string }[] };
        const userMsg = body.messages.find((m) => m.content.includes('Candidate restaurants'));
        if (userMsg) {
          candidatesPrompt = userMsg.content;
          return HttpResponse.json(
            kimiBody({
              hero_url: 'https://www.ubereats.com/store/ippudo/def',
              alternatives: [
                { url: 'https://www.ubereats.com/store/marufuku/ghi', tag: 'lighter' },
                { url: 'https://www.ubereats.com/store/hinodeya/jkl', tag: 'spicier' },
                { url: 'https://www.ubereats.com/store/marufuku/ghi', tag: 'cheaper' },
              ],
            }),
          );
        }
        return HttpResponse.json(kimiBody(VALID_DISH_PICK));
      }),
      http.post(APIFY_URL, () => HttpResponse.json(APIFY_RESPONSE)),
    );

    const events = await collect(
      runPipeline({
        inputs: PREFS,
        address: ADDRESS,
        recent_picks: [
          {
            timestamp: 1,
            restaurant_id: 'abc' as RestaurantId,
            restaurant_name: 'Mensho',
            dish_id: 'd-old' as never,
            dish_name: 'Old Tonkotsu',
            feedback: null,
          },
        ],
        signal: new AbortController().signal,
      }),
    );

    expect(candidatesPrompt).toBeTruthy();
    expect(candidatesPrompt!).not.toContain('https://www.ubereats.com/store/mensho/abc');
    expect(candidatesPrompt!).toContain('Diner just had: Mensho');

    const result = events.find((e): e is Extract<PipelineEvent, { type: 'result' }> => e.type === 'result');
    expect(result?.recommendation.restaurant.url).not.toContain('mensho');
  });

  it('falls back to unfiltered when every candidate is excluded', async () => {
    server.use(...happyPathHandlers());
    const events = await collect(
      runPipeline({
        inputs: PREFS,
        address: ADDRESS,
        recent_picks: BRAVE_RESPONSE.web.results.map((r, i) => ({
          timestamp: i,
          restaurant_id: r.url.split('/').pop()! as RestaurantId,
          restaurant_name: r.title,
          dish_id: `dx-${i}` as never,
          dish_name: `dish ${i}`,
          feedback: null,
        })),
        signal: new AbortController().signal,
      }),
    );
    const result = events.find((e): e is Extract<PipelineEvent, { type: 'result' }> => e.type === 'result');
    expect(result).toBeDefined();
    expect(result!.recommendation.restaurant.url).toContain('mensho');
  });
});
