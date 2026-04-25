import { z } from 'zod';
import type { Profile, RecentPick } from '@/lib/profile/types';
import type { DishId, RestaurantId } from '@/lib/types';

const PROFILE_KEY = 'omabite_profile';
const LEGACY_PROFILE_KEY = 'omakai_profile';

const PreferencesSchema = z.object({
  cuisines: z.array(z.string()),
  free_text: z.string(),
  vibes: z.array(z.string()),
  budget_tier: z.enum(['$', '$$', '$$$']),
  allergies: z.array(
    z.enum(['peanut', 'tree_nut', 'shellfish', 'dairy', 'gluten', 'egg', 'soy', 'sesame']),
  ),
});

const RecentPickSchema = z.object({
  timestamp: z.number(),
  restaurant_id: z.string(),
  restaurant_name: z.string().default(''),
  dish_id: z.string(),
  dish_name: z.string(),
  feedback: z.enum(['nailed_it', 'not_quite']).nullable(),
});

const ProfileSchema = z.object({
  preferences: PreferencesSchema,
  address: z
    .object({
      raw: z.string(),
      resolved: z.object({ lat: z.number(), lng: z.number() }).optional(),
    })
    .optional(),
  recent_picks: z.array(RecentPickSchema),
  signup_prompted: z.boolean(),
});

export function defaultProfile(): Profile {
  return {
    preferences: {
      cuisines: [],
      free_text: '',
      vibes: [],
      budget_tier: '$$',
      allergies: [],
    },
    recent_picks: [],
    signup_prompted: false,
  };
}

function readStorage(): Profile | null {
  if (typeof localStorage === 'undefined') return null;
  let raw = localStorage.getItem(PROFILE_KEY);
  // One-time migration from the pre-rebrand key. After the first read it is
  // gone and only the new key is touched.
  if (!raw) {
    const legacy = localStorage.getItem(LEGACY_PROFILE_KEY);
    if (legacy) {
      localStorage.setItem(PROFILE_KEY, legacy);
      localStorage.removeItem(LEGACY_PROFILE_KEY);
      raw = legacy;
    }
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    const validated = ProfileSchema.safeParse(parsed);
    if (!validated.success) {
      console.warn('omabite_profile: schema mismatch, using default', validated.error.issues);
      return null;
    }
    return validated.data as Profile;
  } catch (err) {
    console.warn('omabite_profile: corrupt JSON, using default', err);
    return null;
  }
}

function writeStorage(profile: Profile): void {
  if (typeof localStorage === 'undefined') return;
  const serialized = JSON.stringify(profile);
  localStorage.setItem(PROFILE_KEY, serialized);
  cachedSnapshot = profile;
  cachedRaw = serialized;
}

let cachedSnapshot: Profile | null = null;
let cachedRaw: string | null = null;

export function getProfile(): Profile {
  const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(PROFILE_KEY);
  if (cachedSnapshot && raw === cachedRaw) return cachedSnapshot;
  cachedSnapshot = readStorage() ?? defaultProfile();
  cachedRaw = raw;
  return cachedSnapshot;
}

export function updateProfile(partial: Partial<Profile>): void {
  const current = getProfile();
  const merged: Profile = {
    ...current,
    ...partial,
    preferences: { ...current.preferences, ...partial.preferences },
  };
  writeStorage(merged);
  notifyListeners();
}

export function clearProfile(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(PROFILE_KEY);
  cachedSnapshot = null;
  cachedRaw = null;
  notifyListeners();
}

// Append a freshly-shown pick (feedback still null) to history. Drives the
// retry-diversity excludes — the orchestrator avoids the most recent
// restaurants and dishes when a user clicks "try another". Trimmed to 20
// entries so the list doesn't grow unbounded across long sessions.
export function recordPick(pick: RecentPick): void {
  const profile = getProfile();
  const next: RecentPick[] = [...profile.recent_picks, pick].slice(-20);
  writeStorage({ ...profile, recent_picks: next });
  notifyListeners();
}

export function recordFeedback(pick: RecentPick): { triggers_signup_wall: boolean } {
  const profile = getProfile();
  const updated: Profile = {
    ...profile,
    recent_picks: [...profile.recent_picks, pick],
  };

  let triggers_signup_wall = false;
  if (!profile.signup_prompted && pick.feedback === 'nailed_it') {
    const trailing = trailingNailedItStreak(updated.recent_picks);
    if (trailing >= 3) {
      updated.signup_prompted = true;
      triggers_signup_wall = true;
    }
  }

  writeStorage(updated);
  notifyListeners();
  return { triggers_signup_wall };
}

function trailingNailedItStreak(picks: RecentPick[]): number {
  let count = 0;
  for (let i = picks.length - 1; i >= 0; i -= 1) {
    if (picks[i]?.feedback === 'nailed_it') count += 1;
    else break;
  }
  return count;
}

const listeners = new Set<() => void>();

export function subscribeToProfile(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(): void {
  for (const l of listeners) l();
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === PROFILE_KEY) {
      cachedSnapshot = null;
      cachedRaw = null;
      notifyListeners();
    }
  });
}

export type { Profile, RecentPick };
export type { DishId, RestaurantId };
