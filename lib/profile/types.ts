import type { Allergen, BudgetTier, DishId, FeedbackKind, RestaurantId } from '@/lib/types';

export interface Address {
  raw: string;
  resolved?: { lat: number; lng: number };
}

export interface ProfilePreferences {
  cuisines: string[];
  free_text: string;
  vibes: string[];
  budget_tier: BudgetTier;
  allergies: Allergen[];
}

export interface RecentPick {
  timestamp: number;
  restaurant_id: RestaurantId;
  restaurant_name: string;
  dish_id: DishId;
  dish_name: string;
  feedback: FeedbackKind | null;
}

export interface Profile {
  preferences: ProfilePreferences;
  address?: Address;
  recent_picks: RecentPick[];
  signup_prompted: boolean;
}
