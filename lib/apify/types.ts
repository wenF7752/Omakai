import type { Allergen, DishId, RestaurantId, StoreUuid } from '@/lib/types';

export interface MenuItem {
  id: DishId;
  name: string;
  price_cents: number;
  description: string;
  ingredients?: string[];
  allergens?: Allergen[];
  modifiers?: string[];
  photo_url?: string;
  subsection_name?: string;
}

export interface Menu {
  restaurant_id: RestaurantId;
  restaurant_name: string;
  store_uuid: StoreUuid;
  items: MenuItem[];
  fetched_at: number;
}

export interface RestaurantCandidate {
  restaurant_id: RestaurantId;
  name: string;
  url: string;
  store_uuid: StoreUuid;
  description?: string;
  rating?: { value: number; count: number };
}

export type ApifyError =
  | { code: 'menu_fetch_failed'; cause: string }
  | { code: 'empty_menu' }
  | { code: 'timeout'; ms: number }
  | { code: 'auth_failed' }
  | { code: 'network_error'; cause: string };
