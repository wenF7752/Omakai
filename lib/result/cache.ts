'use client';

import type { Address, ProfilePreferences } from '@/lib/profile/types';
import type { ValidatedRecommendation } from '@/lib/pipeline/validator';

const KEY = 'omabite_result_cache';
const TTL_MS = 30 * 60 * 1000;

export interface CachedResult {
  fingerprint: string;
  recommendation: ValidatedRecommendation;
  deep_link: string;
  saved_at: number;
}

// Identity for "this is the same recommendation request as before". When
// preferences or address change between runs, the fingerprint changes and we
// re-fetch instead of showing a stale recommendation.
export function fingerprint(prefs: ProfilePreferences, address: Address): string {
  return JSON.stringify({
    cuisines: [...prefs.cuisines].sort(),
    vibes: [...prefs.vibes].sort(),
    allergies: [...prefs.allergies].sort(),
    free_text: prefs.free_text,
    budget_tier: prefs.budget_tier,
    address: address.raw,
  });
}

export function readCache(): CachedResult | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedResult;
    if (Date.now() - parsed.saved_at > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCache(entry: CachedResult): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage can throw QuotaExceeded in private mode. Cache is best-
    // effort; on failure /result falls back to refetching.
  }
}

export function clearCache(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(KEY);
}
