import type { Result } from '@/lib/types';
import { Err, Ok } from '@/lib/types';
import { getEnv } from '@/lib/env';
import { log } from '@/lib/log';
import type { BraveApiResponse, BraveError, BraveResult } from '@/lib/brave/types';
import { extractRating } from '@/lib/brave/types';

const BRAVE_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search';
const MAX_RESULTS = 10;

export async function searchReviews(args: {
  restaurantName: string;
  signal?: AbortSignal;
}): Promise<Result<{ title: string; description: string }[], BraveError>> {
  const env = getEnv();
  const url = new URL(BRAVE_ENDPOINT);
  url.searchParams.set('q', `"${args.restaurantName}" review`);
  url.searchParams.set('count', '5');

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json', 'X-Subscription-Token': env.BRAVE_SEARCH_API_KEY },
      signal: args.signal,
    });
  } catch (cause) {
    if (cause instanceof Error && cause.name === 'AbortError') throw cause;
    return Err({ code: 'network_error', cause: cause instanceof Error ? cause.message : String(cause) });
  }

  if (response.status === 401) return Err({ code: 'auth_failed' });
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After') ?? '0');
    return Err({ code: 'rate_limited', retry_after_ms: Math.max(0, retryAfter) * 1000 });
  }
  if (!response.ok) return Err({ code: 'network_error', cause: `HTTP ${response.status}` });

  const body = (await response.json()) as BraveApiResponse;
  const raw = body.web?.results ?? [];
  const snippets = raw
    .filter((r): r is { title: string; description: string; url?: string } =>
      typeof r.title === 'string' && typeof r.description === 'string',
    )
    .slice(0, 3)
    .map((r) => ({ title: r.title, description: r.description }));

  return Ok(snippets);
}

export async function searchUberEatsNear(args: {
  query: string;
  location: string;
  signal?: AbortSignal;
}): Promise<Result<BraveResult[], BraveError>> {
  const { query, location, signal } = args;
  const env = getEnv();

  const q = `site:ubereats.com ${query} ${location}`.trim();
  const url = new URL(BRAVE_ENDPOINT);
  url.searchParams.set('q', q);
  url.searchParams.set('count', String(MAX_RESULTS));

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': env.BRAVE_SEARCH_API_KEY,
      },
      signal,
    });
  } catch (cause) {
    if (cause instanceof Error && cause.name === 'AbortError') throw cause;
    return Err({ code: 'network_error', cause: cause instanceof Error ? cause.message : String(cause) });
  }

  if (response.status === 401) return Err({ code: 'auth_failed' });
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After') ?? '0');
    return Err({ code: 'rate_limited', retry_after_ms: Math.max(0, retryAfter) * 1000 });
  }
  if (!response.ok) {
    return Err({ code: 'network_error', cause: `HTTP ${response.status}` });
  }

  const body = (await response.json()) as BraveApiResponse;
  const raw = body.web?.results ?? [];

  const filtered: BraveResult[] = raw
    .filter((r): r is Required<Pick<NonNullable<typeof r>, 'title' | 'url' | 'description'>> & { age?: string } =>
      typeof r.title === 'string' &&
      typeof r.url === 'string' &&
      typeof r.description === 'string' &&
      r.url.startsWith('https://www.ubereats.com/'),
    )
    .slice(0, MAX_RESULTS)
    .map((r) => {
      const rating = extractRating(`${r.title} ${r.description}`);
      return {
        title: r.title,
        url: r.url,
        description: r.description,
        ...(r.age ? { age: r.age } : {}),
        ...(rating ? { rating } : {}),
      };
    });

  log('info', 'brave_search', {
    query: q,
    raw_count: raw.length,
    filtered_count: filtered.length,
    urls: filtered.map((r) => r.url),
  });

  if (filtered.length === 0) {
    log('warn', 'no_results', { query, location });
  }

  return Ok(filtered);
}
