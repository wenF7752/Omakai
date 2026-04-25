export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export type RestaurantId = string & { readonly __brand: 'RestaurantId' };
export type DishId = string & { readonly __brand: 'DishId' };
export type StoreUuid = string & { readonly __brand: 'StoreUuid' };
export type ItemUuid = string & { readonly __brand: 'ItemUuid' };

export type BudgetTier = '$' | '$$' | '$$$';

export type Allergen =
  | 'peanut'
  | 'tree_nut'
  | 'shellfish'
  | 'dairy'
  | 'gluten'
  | 'egg'
  | 'soy'
  | 'sesame';

export type AlternativeTag = 'lighter' | 'spicier' | 'cheaper';

export type FeedbackKind = 'nailed_it' | 'not_quite';
