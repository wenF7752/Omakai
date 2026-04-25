import { describe, it, expect, vi, afterEach } from 'vitest';
import { assertConsistency } from '@/lib/pipeline/validator';
import type { Menu, MenuItem, RestaurantCandidate } from '@/lib/apify/types';
import type { DishPick } from '@/lib/kimi/schemas';
import type { DishId, RestaurantId, StoreUuid } from '@/lib/types';

function makeCandidate(id: string): RestaurantCandidate {
  return {
    restaurant_id: id as RestaurantId,
    name: `r-${id}`,
    url: `https://www.ubereats.com/store/${id}/${id}`,
    store_uuid: id as StoreUuid,
  };
}

function makeMenu(restaurantId: string, items: MenuItem[]): Menu {
  return {
    restaurant_id: restaurantId as RestaurantId,
    restaurant_name: `r-${restaurantId}`,
    store_uuid: restaurantId as StoreUuid,
    items,
    fetched_at: 0,
  };
}

const peanutDish: MenuItem = {
  id: 'd-peanut' as DishId,
  name: 'Pad Thai',
  price_cents: 1500,
  description: 'rice noodles with peanuts',
};

const safeDish: MenuItem = {
  id: 'd-safe' as DishId,
  name: 'Tom Yum',
  price_cents: 1200,
  description: 'spicy lemongrass soup',
};

afterEach(() => vi.restoreAllMocks());

describe('assertConsistency', () => {
  it('happy path: returns Result.ok with the chosen dish', () => {
    const candidates = [makeCandidate('r-1')];
    const menu = makeMenu('r-1', [safeDish]);
    const dish_pick: DishPick = {
      dish_id: 'd-safe',
      reasoning: 'a clean spicy soup that fits your vibe nicely tonight',
    };
    const result = assertConsistency({
      candidates,
      menu,
      dish_pick,
      reasoning: dish_pick.reasoning,
      declared_allergies: [],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.dish).toBe(safeDish);
    expect(result.value.restaurant).toBe(candidates[0]);
  });

  it('dish_id_unknown: returns Err and logs structured warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const candidates = [makeCandidate('r-1')];
    const menu = makeMenu('r-1', [safeDish]);
    const dish_pick: DishPick = {
      dish_id: 'd-not-real',
      reasoning: 'nope this is hallucinated by the model unfortunately',
    };
    const result = assertConsistency({
      candidates,
      menu,
      dish_pick,
      reasoning: dish_pick.reasoning,
      declared_allergies: [],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('dish_id_unknown');
    expect(warn).toHaveBeenCalled();
  });

  it('allergen_violation via dish.allergens field', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const candidates = [makeCandidate('r-1')];
    const peanutWithAllergens: MenuItem = { ...peanutDish, allergens: ['peanut'] };
    const menu = makeMenu('r-1', [peanutWithAllergens]);
    const dish_pick: DishPick = {
      dish_id: 'd-peanut',
      reasoning: 'mistakenly chose peanut dish for an allergic diner',
    };
    const result = assertConsistency({
      candidates,
      menu,
      dish_pick,
      reasoning: dish_pick.reasoning,
      declared_allergies: ['peanut'],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('allergen_violation');
    if (result.error.code !== 'allergen_violation') return;
    expect(result.error.allergen).toBe('peanut');
    expect(warn).toHaveBeenCalled();
  });

  it('allergen_violation via description fallback (no allergens field)', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const candidates = [makeCandidate('r-1')];
    const menu = makeMenu('r-1', [peanutDish]);
    const dish_pick: DishPick = {
      dish_id: 'd-peanut',
      reasoning: 'description mentions peanut and validator should catch it',
    };
    const result = assertConsistency({
      candidates,
      menu,
      dish_pick,
      reasoning: dish_pick.reasoning,
      declared_allergies: ['peanut'],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('allergen_violation');
  });

  it('allergen_violation via ingredients fallback', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const candidates = [makeCandidate('r-1')];
    const dish: MenuItem = {
      id: 'd-3' as DishId,
      name: 'Mystery noodles',
      price_cents: 1300,
      description: 'noodles',
      ingredients: ['rice noodle', 'peanut sauce', 'tofu'],
    };
    const menu = makeMenu('r-1', [dish]);
    const dish_pick: DishPick = {
      dish_id: 'd-3',
      reasoning: 'ingredients list contains peanut and validator should catch',
    };
    const result = assertConsistency({
      candidates,
      menu,
      dish_pick,
      reasoning: dish_pick.reasoning,
      declared_allergies: ['peanut'],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('allergen_violation');
  });

  it('no silent substitution: success path returns the EXACT input dish object', () => {
    const candidates = [makeCandidate('r-1')];
    const menu = makeMenu('r-1', [safeDish]);
    const dish_pick: DishPick = {
      dish_id: 'd-safe',
      reasoning: 'identity check that we never swap the dish silently',
    };
    const result = assertConsistency({
      candidates,
      menu,
      dish_pick,
      reasoning: dish_pick.reasoning,
      declared_allergies: [],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.dish).toBe(safeDish);
  });
});
