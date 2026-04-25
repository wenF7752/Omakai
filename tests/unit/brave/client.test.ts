import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { searchUberEatsNear } from '@/lib/brave/client';
import { extractRating } from '@/lib/brave/types';

const BRAVE_URL = 'https://api.search.brave.com/res/v1/web/search';

const VALID_BRAVE_RESPONSE = {
  web: {
    results: [
      {
        title: 'Mensho Tokyo SF — UberEats',
        url: 'https://www.ubereats.com/store/mensho-tokyo-sf/abc123',
        description: 'Bowls of tonkotsu ramen, gyoza, and seasonal small plates.',
      },
      {
        title: 'Ippudo SF — UberEats',
        url: 'https://www.ubereats.com/store/ippudo-sf/def456',
        description: 'Tonkotsu and karaka-men with classic Hakata noodles.',
      },
    ],
  },
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('searchUberEatsNear', () => {
  it('happy path: returns Result.ok with parsed BraveResult[]', async () => {
    server.use(http.get(BRAVE_URL, () => HttpResponse.json(VALID_BRAVE_RESPONSE)));
    const result = await searchUberEatsNear({ query: 'ramen', location: '447 Valencia St SF' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(2);
    expect(result.value[0]?.title).toBe('Mensho Tokyo SF — UberEats');
    expect(result.value[0]?.url).toMatch(/^https:\/\/www\.ubereats\.com\//);
  });

  it('query construction: request URL contains site:ubereats.com, query, and location', async () => {
    let capturedUrl = '';
    server.use(
      http.get(BRAVE_URL, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(VALID_BRAVE_RESPONSE);
      }),
    );
    await searchUberEatsNear({ query: 'ramen', location: '447 Valencia St SF' });
    expect(capturedUrl).toContain('site%3Aubereats.com');
    expect(capturedUrl.toLowerCase()).toContain('ramen');
    expect(capturedUrl).toContain('Valencia');
  });

  it('empty results: returns Result.ok with [] AND logs warn level no_results', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.get(BRAVE_URL, () => HttpResponse.json({ web: { results: [] } })));
    const result = await searchUberEatsNear({ query: 'sushi', location: 'NYC' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual([]);
    expect(warn).toHaveBeenCalled();
    const messages = warn.mock.calls.flat().join(' ');
    expect(messages).toContain('no_results');
    warn.mockRestore();
  });

  it('401 returns Result.err with code auth_failed', async () => {
    server.use(http.get(BRAVE_URL, () => new HttpResponse(null, { status: 401 })));
    const result = await searchUberEatsNear({ query: 'pizza', location: 'NYC' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('auth_failed');
  });

  it('429 returns Result.err with code rate_limited and retry_after_ms', async () => {
    server.use(
      http.get(
        BRAVE_URL,
        () => new HttpResponse(null, { status: 429, headers: { 'Retry-After': '10' } }),
      ),
    );
    const result = await searchUberEatsNear({ query: 'tacos', location: 'LA' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('rate_limited');
    if (result.error.code !== 'rate_limited') return;
    expect(result.error.retry_after_ms).toBe(10000);
  });

  it('500 returns Result.err with code network_error', async () => {
    server.use(http.get(BRAVE_URL, () => new HttpResponse('boom', { status: 500 })));
    const result = await searchUberEatsNear({ query: 'pho', location: 'Chicago' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('network_error');
  });

  it('aborts cleanly when AbortSignal fires', async () => {
    server.use(
      http.get(BRAVE_URL, async () => {
        await new Promise((r) => setTimeout(r, 100));
        return HttpResponse.json(VALID_BRAVE_RESPONSE);
      }),
    );
    const controller = new AbortController();
    const promise = searchUberEatsNear({
      query: 'curry',
      location: 'Seattle',
      signal: controller.signal,
    });
    controller.abort();
    await expect(promise).rejects.toThrow();
  });

  it('defense in depth: filters out non-ubereats.com URLs', async () => {
    server.use(
      http.get(BRAVE_URL, () =>
        HttpResponse.json({
          web: {
            results: [
              {
                title: 'UberEats result',
                url: 'https://www.ubereats.com/store/abc/123',
                description: 'good',
              },
              {
                title: 'Yelp result',
                url: 'https://www.yelp.com/biz/something',
                description: 'should be dropped',
              },
              {
                title: 'Doordash result',
                url: 'https://www.doordash.com/store/whatever',
                description: 'should be dropped',
              },
            ],
          },
        }),
      ),
    );
    const result = await searchUberEatsNear({ query: 'sushi', location: 'SF' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);
    expect(result.value[0]?.url).toContain('ubereats.com');
  });
});

describe('extractRating', () => {
  it('parses "4.8 stars (1,234 reviews)"', () => {
    expect(extractRating('Mensho Tokyo · 4.8 stars (1,234 reviews)')).toEqual({ value: 4.8, count: 1234 });
  });

  it('parses "4.5 / 5" without count', () => {
    expect(extractRating('rated 4.5 / 5 by diners')).toEqual({ value: 4.5, count: 0 });
  });

  it('parses "4.2 out of 5 — 87 ratings"', () => {
    expect(extractRating('4.2 out of 5 — 87 ratings on UberEats')).toEqual({ value: 4.2, count: 87 });
  });

  it('returns undefined when no rating-like text', () => {
    expect(extractRating('Bowls of tonkotsu ramen, gyoza, and seasonal small plates.')).toBeUndefined();
  });

  it('rejects nonsensical scores', () => {
    expect(extractRating('rated 9.9 / 5 stars')).toBeUndefined();
  });
});
