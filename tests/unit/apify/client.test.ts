import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fetchMenu } from '@/lib/apify/client';

const APIFY_RUN_SYNC = 'https://api.apify.com/v2/acts/datacach~ubereats-menu-scraper/run-sync-get-dataset-items';
const STORE_URL = 'https://www.ubereats.com/store/koja-kitchen/abc-123';

const VALID_ACTOR_OUTPUT = [
  {
    name: 'Koja Kitchen',
    items: [
      { id: 'd-1', name: 'Bulgogi Box', price: '$13.50', description: 'beef over rice' },
      { id: 'd-2', name: 'Tofu Box', price: '$11.00', description: 'fried tofu' },
    ],
  },
];

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fetchMenu', () => {
  it('happy path: returns Result.ok with valid Menu', async () => {
    server.use(http.post(APIFY_RUN_SYNC, () => HttpResponse.json(VALID_ACTOR_OUTPUT)));
    const result = await fetchMenu({ url: STORE_URL });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.items.length).toBeGreaterThanOrEqual(1);
    expect(result.value.items[0]?.id).toBeDefined();
    expect(result.value.items[0]?.name).toBeDefined();
    expect(typeof result.value.items[0]?.price_cents).toBe('number');
  });

  it('price normalization: "$18.50" string → 1850 cents', async () => {
    const output = [
      {
        name: 'Test',
        items: [{ id: 'x-1', name: 'Thing', price: '$18.50', description: 'desc' }],
      },
    ];
    server.use(http.post(APIFY_RUN_SYNC, () => HttpResponse.json(output)));
    const result = await fetchMenu({ url: STORE_URL });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.items[0]?.price_cents).toBe(1850);
  });

  it('store_uuid extracted from URL', async () => {
    server.use(http.post(APIFY_RUN_SYNC, () => HttpResponse.json(VALID_ACTOR_OUTPUT)));
    const result = await fetchMenu({ url: STORE_URL });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.store_uuid).toBe('abc-123');
  });

  it('empty items returns Err empty_menu', async () => {
    server.use(http.post(APIFY_RUN_SYNC, () => HttpResponse.json([{ name: 'x', items: [] }])));
    const result = await fetchMenu({ url: STORE_URL });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('empty_menu');
  });

  it('actor returning no rows returns Err empty_menu', async () => {
    server.use(http.post(APIFY_RUN_SYNC, () => HttpResponse.json([])));
    const result = await fetchMenu({ url: STORE_URL });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('empty_menu');
  });

  it('timeout: actor exceeds timeoutMs → Err timeout', async () => {
    server.use(
      http.post(APIFY_RUN_SYNC, async () => {
        await new Promise((r) => setTimeout(r, 200));
        return HttpResponse.json(VALID_ACTOR_OUTPUT);
      }),
    );
    const result = await fetchMenu({ url: STORE_URL, timeoutMs: 50 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('timeout');
    if (result.error.code !== 'timeout') return;
    expect(result.error.ms).toBe(50);
  });

  it('401 returns Err auth_failed', async () => {
    server.use(http.post(APIFY_RUN_SYNC, () => new HttpResponse(null, { status: 401 })));
    const result = await fetchMenu({ url: STORE_URL });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('auth_failed');
  });

  it('5xx returns Err menu_fetch_failed', async () => {
    server.use(http.post(APIFY_RUN_SYNC, () => new HttpResponse('boom', { status: 502 })));
    const result = await fetchMenu({ url: STORE_URL });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('menu_fetch_failed');
  });

  it('abort: signal.abort() before resolution rejects', async () => {
    server.use(
      http.post(APIFY_RUN_SYNC, async () => {
        await new Promise((r) => setTimeout(r, 200));
        return HttpResponse.json(VALID_ACTOR_OUTPUT);
      }),
    );
    const controller = new AbortController();
    const promise = fetchMenu({ url: STORE_URL, signal: controller.signal });
    controller.abort();
    await expect(promise).rejects.toThrow();
  });
});
