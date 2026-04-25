import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  clearProfile,
  defaultProfile,
  getProfile,
  recordFeedback,
  updateProfile,
} from '@/lib/profile/store';
import type { RecentPick } from '@/lib/profile/types';
import type { DishId, RestaurantId } from '@/lib/types';

const PROFILE_KEY = 'omakai_profile';

function makePick(feedback: 'nailed_it' | 'not_quite', i: number): RecentPick {
  return {
    timestamp: 1_700_000_000_000 + i,
    restaurant_id: `r-${i}` as RestaurantId,
    restaurant_name: `Restaurant ${i}`,
    dish_id: `d-${i}` as DishId,
    dish_name: `Dish ${i}`,
    feedback,
  };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('profile store', () => {
  it('empty localStorage returns the default profile', () => {
    const p = getProfile();
    expect(p).toEqual(defaultProfile());
    expect(p.preferences.budget_tier).toBe('$$');
    expect(p.signup_prompted).toBe(false);
  });

  it('valid stored profile returns parsed object', () => {
    const stored = defaultProfile();
    stored.preferences.cuisines = ['japanese'];
    localStorage.setItem(PROFILE_KEY, JSON.stringify(stored));
    const p = getProfile();
    expect(p.preferences.cuisines).toEqual(['japanese']);
  });

  it('corrupted JSON returns default + warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem(PROFILE_KEY, '{not json');
    const p = getProfile();
    expect(p).toEqual(defaultProfile());
    expect(warn).toHaveBeenCalled();
  });

  it('updateProfile merges and persists', () => {
    updateProfile({ preferences: { ...defaultProfile().preferences, cuisines: ['thai'] } });
    expect(getProfile().preferences.cuisines).toEqual(['thai']);
    const persisted = JSON.parse(localStorage.getItem(PROFILE_KEY)!) as { preferences: { cuisines: string[] } };
    expect(persisted.preferences.cuisines).toEqual(['thai']);
  });

  it('clearProfile removes the entry', () => {
    updateProfile({ signup_prompted: true });
    clearProfile();
    expect(localStorage.getItem(PROFILE_KEY)).toBeNull();
    expect(getProfile()).toEqual(defaultProfile());
  });

  it('3 consecutive nailed_it triggers signup wall', () => {
    const r1 = recordFeedback(makePick('nailed_it', 1));
    expect(r1.triggers_signup_wall).toBe(false);
    const r2 = recordFeedback(makePick('nailed_it', 2));
    expect(r2.triggers_signup_wall).toBe(false);
    const r3 = recordFeedback(makePick('nailed_it', 3));
    expect(r3.triggers_signup_wall).toBe(true);
    expect(getProfile().signup_prompted).toBe(true);
  });

  it('not_quite mid-streak resets the counter', () => {
    recordFeedback(makePick('nailed_it', 1));
    recordFeedback(makePick('nailed_it', 2));
    recordFeedback(makePick('not_quite', 3));
    const r4 = recordFeedback(makePick('nailed_it', 4));
    expect(r4.triggers_signup_wall).toBe(false);
    expect(getProfile().signup_prompted).toBe(false);
  });

  it('does not re-trigger signup wall once already prompted', () => {
    recordFeedback(makePick('nailed_it', 1));
    recordFeedback(makePick('nailed_it', 2));
    recordFeedback(makePick('nailed_it', 3));
    const r4 = recordFeedback(makePick('nailed_it', 4));
    expect(r4.triggers_signup_wall).toBe(false);
  });
});
