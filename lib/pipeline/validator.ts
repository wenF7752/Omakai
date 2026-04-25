import type { Result, Allergen, DishId } from '@/lib/types';
import { Err, Ok } from '@/lib/types';
import { log } from '@/lib/log';
import type { Menu, MenuItem, RestaurantCandidate } from '@/lib/apify/types';
import type { DishPick, Sentiment } from '@/lib/kimi/schemas';

export interface ValidatedRecommendation {
  restaurant: RestaurantCandidate;
  dish: MenuItem;
  reasoning: string;
  warning?: string;
  sentiment?: Sentiment;
}

export type ValidationError =
  | { code: 'restaurant_id_unknown'; got: string; expected_one_of: string[] }
  | { code: 'dish_id_unknown'; got: string; expected_one_of: DishId[] }
  | { code: 'allergen_violation'; allergen: Allergen; dish: MenuItem };

const ALLERGEN_KEYWORDS: Record<Allergen, string[]> = {
  peanut: ['peanut'],
  tree_nut: ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'macadamia', 'tree nut'],
  shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'oyster', 'clam', 'mussel', 'shellfish'],
  dairy: ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'dairy'],
  gluten: ['wheat', 'gluten', 'flour', 'bread', 'noodle', 'pasta', 'soy sauce'],
  egg: ['egg'],
  soy: ['soy', 'tofu', 'edamame', 'miso', 'tempeh'],
  sesame: ['sesame', 'tahini'],
};

function dishViolatesAllergen(dish: MenuItem, allergen: Allergen): boolean {
  if (dish.allergens?.includes(allergen)) return true;
  const keywords = ALLERGEN_KEYWORDS[allergen];
  const haystack = [
    dish.name,
    dish.description,
    ...(dish.ingredients ?? []),
  ]
    .join(' ')
    .toLowerCase();
  return keywords.some((kw) => haystack.includes(kw));
}

export function assertConsistency(args: {
  candidates: RestaurantCandidate[];
  menu: Menu;
  dish_pick: DishPick;
  reasoning: string;
  declared_allergies: Allergen[];
}): Result<ValidatedRecommendation, ValidationError> {
  const { candidates, menu, dish_pick, reasoning, declared_allergies } = args;

  const matchingCandidate = candidates.find((c) => c.restaurant_id === menu.restaurant_id);
  if (!matchingCandidate) {
    const err: ValidationError = {
      code: 'restaurant_id_unknown',
      got: menu.restaurant_id,
      expected_one_of: candidates.map((c) => c.restaurant_id),
    };
    log('warn', 'validator_reject', { code: err.code, got: err.got });
    return Err(err);
  }

  const dish = menu.items.find((m) => m.id === dish_pick.dish_id);
  if (!dish) {
    const err: ValidationError = {
      code: 'dish_id_unknown',
      got: dish_pick.dish_id,
      expected_one_of: menu.items.map((m) => m.id),
    };
    log('warn', 'validator_reject', {
      code: err.code,
      got: err.got,
      menu_ids: err.expected_one_of,
      menu_names: menu.items.map((m) => m.name),
    });
    return Err(err);
  }

  for (const allergen of declared_allergies) {
    if (dishViolatesAllergen(dish, allergen)) {
      const err: ValidationError = { code: 'allergen_violation', allergen, dish };
      log('warn', 'validator_reject', {
        code: err.code,
        allergen,
        dish_id: dish.id,
        dish_name: dish.name,
      });
      return Err(err);
    }
  }

  const validated: ValidatedRecommendation = {
    restaurant: matchingCandidate,
    dish,
    reasoning,
  };
  if (dish_pick.warning) validated.warning = dish_pick.warning;
  return Ok(validated);
}
