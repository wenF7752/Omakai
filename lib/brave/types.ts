export interface BraveResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  rating?: { value: number; count: number };
}

export function extractRating(text: string): { value: number; count: number } | undefined {
  const norm = text.replace(/[★☆]/g, '').toLowerCase();
  const value = norm.match(/(\d(?:\.\d)?)\s*(?:\/\s*5|out of 5|stars?)/);
  const count = norm.match(/([\d,]+)\s*(?:reviews?|ratings?)/);
  if (!value) return undefined;
  const v = Number.parseFloat(value[1] ?? '');
  if (!Number.isFinite(v) || v < 0 || v > 5) return undefined;
  const c = count ? Number.parseInt(count[1]?.replace(/,/g, '') ?? '', 10) : 0;
  return { value: v, count: Number.isFinite(c) ? c : 0 };
}

export type BraveError =
  | { code: 'auth_failed' }
  | { code: 'rate_limited'; retry_after_ms: number }
  | { code: 'network_error'; cause: string }
  | { code: 'no_results' };

export interface BraveApiResponse {
  web?: {
    results?: Array<{
      title?: string;
      url?: string;
      description?: string;
      age?: string;
    }>;
  };
}
