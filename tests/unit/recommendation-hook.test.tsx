import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http } from 'msw';
import { setupServer } from 'msw/node';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useRecommendation } from '@/hooks/useRecommendation';
import type { ProfilePreferences, Address } from '@/lib/profile/types';

const RECOMMEND_URL = '*/api/recommend';

const PREFS: ProfilePreferences = {
  cuisines: ['japanese'],
  free_text: '',
  vibes: ['cozy'],
  budget_tier: '$$',
  allergies: [],
};
const ADDR: Address = { raw: '447 Valencia St SF' };
const ADDR_2: Address = { raw: '900 Market St SF' };

function sseStream(events: { event: string; data: unknown }[], delayMs = 0): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const e of events) {
        if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
        controller.enqueue(
          encoder.encode(`event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`),
        );
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  });
}

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
});
afterAll(() => server.close());

const mockHero = {
  restaurant_id: 'abc',
  name: 'Mensho',
  url: 'https://www.ubereats.com/store/mensho/abc',
  store_uuid: 'abc',
};
const mockResult = {
  recommendation: {
    restaurant: mockHero,
    dish: { id: 'd-1', name: 'Tonkotsu', price_cents: 1850, description: 'ramen' },
    reasoning: 'a rich and warming bowl that fits a cozy vibe nicely',
  },
  deep_link: 'https://www.ubereats.com/store/mensho/abc/d-1',
};

describe('useRecommendation', () => {
  it('mounts and POSTs to /api/recommend', async () => {
    let captured: { mode: string } | null = null;
    server.use(
      http.post(RECOMMEND_URL, async ({ request }) => {
        captured = (await request.json()) as { mode: string };
        return sseStream([{ event: 'phase', data: { type: 'phase', phase: 'address_received' } }]);
      }),
    );
    renderHook(() => useRecommendation({ preferences: PREFS, address: ADDR }));
    await waitFor(() => expect(captured).not.toBeNull());
    expect(captured!.mode).toBe('initial');
  });

  it('transitions through phase → previewing → ready', async () => {
    server.use(
      http.post(RECOMMEND_URL, () =>
        sseStream([
          { event: 'phase', data: { type: 'phase', phase: 'searching_restaurants' } },
          {
            event: 'candidates',
            data: {
              type: 'candidates',
              hero: mockHero,
              alternatives: [],
            },
          },
          { event: 'phase', data: { type: 'phase', phase: 'done' } },
          { event: 'result', data: { type: 'result', ...mockResult } },
        ]),
      ),
    );
    const { result } = renderHook(() => useRecommendation({ preferences: PREFS, address: ADDR }));
    await waitFor(() => expect(result.current.state.kind).toBe('ready'));
    if (result.current.state.kind !== 'ready') return;
    expect(result.current.state.deep_link).toContain('mensho');
  });

  it('error event sets state.kind=error', async () => {
    server.use(
      http.post(RECOMMEND_URL, () =>
        sseStream([
          {
            event: 'error',
            data: {
              type: 'error',
              error: { code: 'no_candidates', message: 'limited coverage' },
            },
          },
        ]),
      ),
    );
    const { result } = renderHook(() => useRecommendation({ preferences: PREFS, address: ADDR }));
    await waitFor(() => expect(result.current.state.kind).toBe('error'));
  });

  it('address change aborts existing pipeline and starts a new one', async () => {
    let postCount = 0;
    server.use(
      http.post(RECOMMEND_URL, () => {
        postCount += 1;
        return sseStream(
          [{ event: 'phase', data: { type: 'phase', phase: 'address_received' } }],
          50,
        );
      }),
    );
    const { rerender } = renderHook(
      ({ address }: { address: Address }) =>
        useRecommendation({ preferences: PREFS, address }),
      { initialProps: { address: ADDR } },
    );
    await waitFor(() => expect(postCount).toBe(1));
    rerender({ address: ADDR_2 });
    await waitFor(() => expect(postCount).toBe(2));
  });

  it('selectAlternative(0) POSTs mode=alternative', async () => {
    let lastBody: { mode?: string } = {};
    server.use(
      http.post(RECOMMEND_URL, async ({ request }) => {
        lastBody = (await request.json()) as { mode?: string };
        return sseStream([
          {
            event: 'candidates',
            data: {
              type: 'candidates',
              hero: mockHero,
              alternatives: [{ candidate: mockHero, tag: 'lighter' }],
            },
          },
        ]);
      }),
    );
    const { result } = renderHook(() => useRecommendation({ preferences: PREFS, address: ADDR }));
    await waitFor(() => expect(result.current.state.kind).toBe('previewing'));
    act(() => result.current.selectAlternative(0));
    await waitFor(() => expect(lastBody.mode).toBe('alternative'));
  });

  it('retry aborts current and posts mode=initial again', async () => {
    let postCount = 0;
    server.use(
      http.post(RECOMMEND_URL, () => {
        postCount += 1;
        return sseStream([{ event: 'phase', data: { type: 'phase', phase: 'address_received' } }]);
      }),
    );
    const { result } = renderHook(() => useRecommendation({ preferences: PREFS, address: ADDR }));
    await waitFor(() => expect(postCount).toBe(1));
    act(() => result.current.retry());
    await waitFor(() => expect(postCount).toBe(2));
  });

  it('hydrates from sessionStorage cache without refetching when fingerprint matches', async () => {
    let postCount = 0;
    server.use(
      http.post(RECOMMEND_URL, () => {
        postCount += 1;
        return sseStream([
          { event: 'phase', data: { type: 'phase', phase: 'searching_restaurants' } },
          { event: 'result', data: { type: 'result', ...mockResult } },
        ]);
      }),
    );
    // First mount: pipeline runs, writes cache.
    const first = renderHook(() => useRecommendation({ preferences: PREFS, address: ADDR }));
    await waitFor(() => expect(first.result.current.state.kind).toBe('ready'));
    expect(postCount).toBe(1);
    first.unmount();

    // Second mount with the same prefs/address: must hydrate from cache, no fetch.
    const second = renderHook(() => useRecommendation({ preferences: PREFS, address: ADDR }));
    expect(second.result.current.state.kind).toBe('ready');
    expect(postCount).toBe(1);
  });

  it('retry skips the cache and forces a refetch', async () => {
    let postCount = 0;
    server.use(
      http.post(RECOMMEND_URL, () => {
        postCount += 1;
        return sseStream([
          { event: 'phase', data: { type: 'phase', phase: 'searching_restaurants' } },
          { event: 'result', data: { type: 'result', ...mockResult } },
        ]);
      }),
    );
    const { result } = renderHook(() => useRecommendation({ preferences: PREFS, address: ADDR }));
    await waitFor(() => expect(result.current.state.kind).toBe('ready'));
    expect(postCount).toBe(1);
    act(() => result.current.retry());
    await waitFor(() => expect(postCount).toBe(2));
  });
});
