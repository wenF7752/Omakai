import { z } from 'zod';

export const RestaurantPickSchema = z.object({
  hero_url: z.string().url(),
  alternatives: z
    .array(
      z.object({
        url: z.string().url(),
        tag: z.enum(['lighter', 'spicier', 'cheaper']),
      }),
    )
    .length(3),
});
export type RestaurantPick = z.infer<typeof RestaurantPickSchema>;

export const DishPickSchema = z.object({
  dish_id: z.string().min(1),
  reasoning: z.string().min(20).max(400),
  warning: z.string().optional(),
});
export type DishPick = z.infer<typeof DishPickSchema>;

export const SentimentSchema = z.object({
  score: z.number().min(1).max(5),
  summary: z.string().min(10).max(200),
});
export type Sentiment = z.infer<typeof SentimentSchema>;

export type KimiError =
  | { code: 'parse_drift'; attempts: number; raw: string }
  | { code: 'http_5xx'; status: number; body: string }
  | { code: 'rate_limited'; retry_after_ms: number }
  | { code: 'network_error'; cause: string }
  | { code: 'fallback_unavailable' };

export interface KimiUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
}
