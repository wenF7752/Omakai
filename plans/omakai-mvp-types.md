# omakai.food MVP Type Contract

## Status

Type Contract: Approved (2026-04-24)

## Scope

Defines all types, function signatures, Zod schemas, and `Result<T, E>` / error unions referenced by `plans/omakai-mvp.md` Tasks 1-27. **No function bodies.** Once approved, these become binding under `tsc --strict`. Implementation must satisfy these signatures exactly.

When this contract and the spec/plan conflict, the spec (`research/omakai-mvp.md`) wins. Surface the conflict and update this contract — never silently diverge.

---

## 1. Foundations

### 1.1 `Result<T, E>` discriminated union

```typescript
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });
```

### 1.2 Branded ID types (prevent string-mix-ups under tsc --strict)

```typescript
export type RestaurantId = string & { readonly __brand: 'RestaurantId' };
export type DishId = string & { readonly __brand: 'DishId' };
export type StoreUuid = string & { readonly __brand: 'StoreUuid' };
export type ItemUuid = string & { readonly __brand: 'ItemUuid' };
```

### 1.3 Common domain enums

```typescript
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
```

---

## 2. Profile (`lib/profile/store.ts` · `hooks/useProfile.ts`)

### 2.1 Types

```typescript
export interface Address {
  raw: string;                                  // user-typed or geo-resolved string
  resolved?: { lat: number; lng: number };      // present when geolocation succeeded
}

export interface ProfilePreferences {
  cuisines: string[];                           // user-selected cuisine chips
  free_text: string;                            // optional freeform pref note
  vibes: string[];                              // selected vibe chips
  budget_tier: BudgetTier;
  allergies: Allergen[];
}

export interface RecentPick {
  timestamp: number;                            // unix epoch ms
  restaurant_id: RestaurantId;
  dish_id: DishId;
  dish_name: string;
  feedback: FeedbackKind | null;                // null until the user reports back
}

export interface Profile {
  preferences: ProfilePreferences;
  address?: Address;
  recent_picks: RecentPick[];
  signup_prompted: boolean;                     // true once 3 consecutive nailed_it triggered the wall
}
```

### 2.2 Function signatures

```typescript
// lib/profile/store.ts
export function getProfile(): Profile;
export function updateProfile(partial: Partial<Profile>): void;
export function clearProfile(): void;
export function recordFeedback(pick: RecentPick): { triggers_signup_wall: boolean };

// hooks/useProfile.ts
export function useProfile(): {
  profile: Profile;
  update: (partial: Partial<Profile>) => void;
  recordFeedback: (pick: RecentPick) => { triggers_signup_wall: boolean };
};
```

---

## 3. Brave Search (`lib/brave/`)

### 3.1 Types

```typescript
export interface BraveResult {
  title: string;
  url: string;                                  // always https://www.ubereats.com/...
  description: string;                          // snippet
  age?: string;                                 // optional, when present in response
}

export type BraveError =
  | { code: 'auth_failed' }
  | { code: 'rate_limited'; retry_after_ms: number }
  | { code: 'network_error'; cause: string }
  | { code: 'no_results' };
```

### 3.2 Function signature

```typescript
export function searchUberEatsNear(args: {
  query: string;                                // composed from preferences (cuisine, vibe)
  location: string;                             // address.raw
  signal?: AbortSignal;
}): Promise<Result<BraveResult[], BraveError>>;
```

---

## 4. Kimi K2.6 (`lib/kimi/`)

### 4.1 Zod schemas (runtime + type)

```typescript
import { z } from 'zod';

export const RestaurantPickSchema = z.object({
  hero_url: z.string().url(),                   // chosen from BraveResult[].url
  alternatives: z.array(
    z.object({
      url: z.string().url(),
      tag: z.enum(['lighter', 'spicier', 'cheaper']),
    })
  ).length(3),
});
export type RestaurantPick = z.infer<typeof RestaurantPickSchema>;

export const DishPickSchema = z.object({
  dish_id: z.string(),                          // must exist in fetched Menu.items
  reasoning: z.string().min(20).max(400),       // 1-2 sentence explanation
  warning: z.string().optional(),               // present when allergen ingredients are ambiguous
});
export type DishPick = z.infer<typeof DishPickSchema>;
```

### 4.2 Error union

```typescript
export type KimiError =
  | { code: 'parse_drift'; attempts: number; raw: string }
  | { code: 'http_5xx'; status: number; body: string }
  | { code: 'rate_limited'; retry_after_ms: number }
  | { code: 'network_error'; cause: string }
  | { code: 'fallback_unavailable' };           // emitted when Kimi fails and FALLBACK_LLM_ENABLED is false
```

### 4.3 Usage telemetry shape

```typescript
export interface KimiUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
}
```

### 4.4 Function signatures

```typescript
// lib/kimi/client.ts
export function pickCandidates(args: {
  inputs: ProfilePreferences;
  candidates: BraveResult[];
  signal?: AbortSignal;
}): Promise<Result<{ pick: RestaurantPick; usage: KimiUsage }, KimiError>>;

export function pickDish(args: {
  inputs: ProfilePreferences;
  restaurant: RestaurantCandidate;              // see Section 5
  menu: Menu;                                   // see Section 5
  signal?: AbortSignal;
}): Promise<Result<{ pick: DishPick; usage: KimiUsage }, KimiError>>;

// lib/kimi/retry.ts (internal helper)
export function parseAndRetry<T>(args: {
  schema: z.ZodSchema<T>;
  invoke: (reinforcement?: string) => Promise<{ raw: string; usage: KimiUsage }>;
}): Promise<Result<{ value: T; usage: KimiUsage }, KimiError>>;
```

---

## 5. Apify Menu Fetcher (`lib/apify/`)

### 5.1 Types

```typescript
export interface MenuItem {
  id: DishId;
  name: string;
  price_cents: number;                          // canonical: cents (e.g. $18.50 = 1850)
  description: string;
  ingredients?: string[];                       // present when actor exposes them
  allergens?: Allergen[];                       // present when actor exposes them; absent → validator falls back to keyword scan on description
  modifiers?: string[];
  photo_url?: string;
}

export interface Menu {
  restaurant_id: RestaurantId;
  restaurant_name: string;
  store_uuid: StoreUuid;                        // parsed from URL during fetch
  items: MenuItem[];
  fetched_at: number;                           // unix epoch ms
}

export interface RestaurantCandidate {
  restaurant_id: RestaurantId;                  // derived from store_uuid
  name: string;
  url: string;                                  // canonical UberEats URL
  store_uuid: StoreUuid;
  description?: string;                         // from Brave snippet
  rating?: { value: number; count: number };    // populated post-Apify when available
}

export type ApifyError =
  | { code: 'menu_fetch_failed'; cause: string }
  | { code: 'empty_menu' }
  | { code: 'timeout'; ms: number }
  | { code: 'auth_failed' }
  | { code: 'network_error'; cause: string };
```

### 5.2 Function signature

```typescript
export function fetchMenu(args: {
  url: string;                                  // UberEats restaurant URL
  signal?: AbortSignal;
}): Promise<Result<Menu, ApifyError>>;
```

---

## 6. Output Validator (`lib/pipeline/validator.ts`)

### 6.1 Types

```typescript
export interface ValidatedRecommendation {
  restaurant: RestaurantCandidate;
  dish: MenuItem;
  reasoning: string;
  warning?: string;                             // pass-through from Kimi's DishPick.warning
}

export type ValidationError =
  | { code: 'restaurant_id_unknown'; got: string; expected_one_of: RestaurantId[] }
  | { code: 'dish_id_unknown'; got: string; expected_one_of: DishId[] }
  | { code: 'allergen_violation'; allergen: Allergen; dish: MenuItem };
```

### 6.2 Function signature

```typescript
export function assertConsistency(args: {
  candidates: RestaurantCandidate[];
  menu: Menu;
  dish_pick: DishPick;
  reasoning: string;
  declared_allergies: Allergen[];
}): Result<ValidatedRecommendation, ValidationError>;
```

**Validator invariants (binding):**

- Returns `Err({ code: 'allergen_violation', ... })` if any declared allergen appears in `dish.allergens` (when present) OR matches a keyword in `dish.description`/`dish.ingredients` (when allergens field is absent).
- Returns `Err({ code: 'dish_id_unknown', ... })` if `dish_pick.dish_id` is not in `menu.items.map(i => i.id)`.
- Logs structured `warn` on every `Err` return — never silently substitutes a different dish (per knowledge-base "silent auto-correction" gotcha).

---

## 7. Deep-link Builder (`lib/deeplink/builder.ts`)

```typescript
export interface DeepLinkInput {
  restaurant_url: string;                       // canonical UberEats restaurant URL
  store_uuid: StoreUuid;
  item_uuid?: ItemUuid;                         // when present, returns dish-level URL; else restaurant-level fallback
  affiliate_tag?: string;                       // from env; appended as ?ref=<tag>
}

export function buildDeepLink(args: DeepLinkInput): string;
```

**Output shape (binding):**

- With `item_uuid`: `https://www.ubereats.com/store/{slug}/{store-uuid}/{item-uuid}[?ref={tag}]`
- Without `item_uuid`: `https://www.ubereats.com/store/{slug}/{store-uuid}[?ref={tag}]` + structured `warn` log.

---

## 8. Pipeline Orchestrator (`lib/pipeline/`)

### 8.1 Phase enum and event union

```typescript
export type PipelinePhase =
  | 'address_received'
  | 'searching_restaurants'
  | 'picking_candidates'
  | 'fetching_menu'
  | 'picking_dish'
  | 'validating'
  | 'done'
  | 'error';

export type PipelineEvent =
  | { type: 'phase'; phase: PipelinePhase }
  | { type: 'candidates'; hero: RestaurantCandidate; alternatives: AlternativeOption[] }
  | { type: 'result'; recommendation: ValidatedRecommendation; deep_link: string }
  | { type: 'error'; error: PipelineError };

export interface AlternativeOption {
  candidate: RestaurantCandidate;
  tag: AlternativeTag;
}

export type PipelineError =
  | { code: 'no_candidates'; message: string }
  | { code: 'menu_fetch_failed'; cause: ApifyError }
  | { code: 'kimi_drift'; cause: KimiError }
  | { code: 'allergen_violation'; cause: ValidationError }
  | { code: 'validator_reject'; cause: ValidationError }
  | { code: 'aborted' }
  | { code: 'unknown'; cause: string };
```

### 8.2 Pipeline state (internal, used by orchestrator)

```typescript
export interface PipelineState {
  inputs: ProfilePreferences;
  address: Address;
  brave_results?: BraveResult[];
  pick?: RestaurantPick;
  hero?: RestaurantCandidate;
  alternatives?: AlternativeOption[];
  hero_menu?: Menu;
  recommendation?: ValidatedRecommendation;
  deep_link?: string;
}
```

### 8.3 Orchestrator function signatures

```typescript
// lib/pipeline/orchestrator.ts
export function runPipeline(args: {
  inputs: ProfilePreferences;
  address: Address;
  signal: AbortSignal;
}): AsyncGenerator<PipelineEvent, void, void>;

export function runAlternative(args: {
  inputs: ProfilePreferences;
  alternative: RestaurantCandidate;             // passed in from frontend (no backend session)
  declared_allergies: Allergen[];
  signal: AbortSignal;
}): AsyncGenerator<PipelineEvent, void, void>;
```

### 8.4 SSE serializer (`lib/pipeline/events.ts`)

```typescript
export function serializeEvent(event: PipelineEvent): string;
// Returns: `event: <type>\ndata: <json>\n\n`
```

---

## 9. SSE Endpoint (`app/api/recommend/route.ts`)

### 9.1 Request body (discriminated by `mode`)

```typescript
export type RecommendRequest =
  | {
      mode: 'initial';
      preferences: ProfilePreferences;
      address: Address;
    }
  | {
      mode: 'alternative';
      preferences: ProfilePreferences;
      declared_allergies: Allergen[];           // duplicated from preferences for runAlternative convenience
      alternative: RestaurantCandidate;
    };
```

### 9.2 Response

```
Content-Type: text/event-stream

event: phase
data: {"phase":"searching_restaurants"}

event: candidates
data: {"hero":{...RestaurantCandidate},"alternatives":[{candidate:{...},tag:"lighter"},...]}

event: result
data: {"recommendation":{...ValidatedRecommendation},"deep_link":"..."}

event: error
data: {"error":{...PipelineError}}
```

### 9.3 Function signature

```typescript
export async function POST(req: Request): Promise<Response>;
```

**Endpoint invariants (binding):**

- Returns `400 application/json` with structured Zod error on malformed request body.
- Returns `200 text/event-stream` and streams `PipelineEvent`s for both modes.
- Aborts the orchestrator's `AbortController` when the response stream is closed by the client.

---

## 10. Recommendation Hook (`hooks/useRecommendation.ts`)

```typescript
export type RecommendationState =
  | { kind: 'idle' }
  | { kind: 'loading'; phase: PipelinePhase }
  | { kind: 'previewing'; hero: RestaurantCandidate; alternatives: AlternativeOption[] }
  | { kind: 'ready'; recommendation: ValidatedRecommendation; deep_link: string }
  | { kind: 'error'; error: PipelineError };

export function useRecommendation(args: {
  preferences: ProfilePreferences;
  address: Address;
}): {
  state: RecommendationState;
  selectAlternative: (index: 0 | 1 | 2) => void;
  retry: () => void;
};
```

**Hook invariants (binding):**

- Re-fires the pipeline if `address.raw` changes (per cross-concern cancellation gotcha — old in-flight pipeline aborts).
- `selectAlternative(i)` POSTs `mode: 'alternative'` with `alternatives[i].candidate` and re-enters the pipeline.
- `retry()` aborts current and starts a fresh `mode: 'initial'` pipeline.

---

## 11. Reduced Motion (`hooks/useReducedMotion.ts`)

```typescript
export function useReducedMotion(): boolean;
```

**Invariants (binding):**

- Returns the current `matchMedia('(prefers-reduced-motion: reduce)').matches` value.
- Re-renders the consumer when the media query changes during the session.
- Consumers using `setInterval` MUST gate ticks on this hook's value (per knowledge-base gotcha; CSS-only gating is insufficient).

---

## 12. Mascot Component Props (`components/mascots/*`)

```typescript
export interface MaskotMakiProps {
  size?: number;                                // default 80
  mood?: 'happy' | 'thinking';                  // default 'happy'
  style?: React.CSSProperties;
  className?: string;
}

export interface StickerBadgeProps {
  text: string;
  size?: number;                                // default 100
  color?: string;                               // default 'var(--a-peach-deep)'
  textColor?: string;                           // default 'var(--a-cream)'
  style?: React.CSSProperties;
  className?: string;
}

export interface ChopsticksProps {
  size?: number;                                // default 60
  color?: string;                               // default 'var(--a-ink)'
  style?: React.CSSProperties;
  className?: string;
}

export interface DishPlaceholderProps {
  width?: number;                               // default 200
  height?: number;                              // default 200
  label?: string;                               // default 'DISH PHOTO'
  style?: React.CSSProperties;
  className?: string;
}
```

---

## 13. Wizard Primitives (`components/wizard/*`)

```typescript
export interface StepperProps {
  step: number;                                 // 1-indexed current step
  total: number;                                // total steps (5 for the wizard)
}

export interface ChipProps {
  active: boolean;
  onToggle: () => void;
  color?: string;                               // default 'var(--a-peach)'
  children: React.ReactNode;
}

export interface BudgetCardProps {
  tier: BudgetTier;
  label: string;                                // 'cheap eats' / 'comfort zone' / 'treat night'
  range: string;                                // 'under $15' / '$15-30' / '$30+'
  emoji: string;                                // '🌶' / '🍣' / '✨'
  selected: boolean;
  onSelect: () => void;
}

export interface AllergyCheckboxProps {
  allergen: Allergen;
  checked: boolean;
  onToggle: () => void;
}
```

---

## 14. Result Components (`components/result/*`)

```typescript
export interface HeroCardProps {
  recommendation: ValidatedRecommendation;
  deep_link: string;
  onTryAnother: () => void;
}

export interface AlternativesStripProps {
  alternatives: AlternativeOption[];
  onSelect: (index: 0 | 1 | 2) => void;
  loading_index: 0 | 1 | 2 | null;              // shows loader on the chip being fetched
}
```

---

## 15. Shared Components (`components/shared/*`)

```typescript
export interface MarqueeProps {
  words: string[];                              // food words to scroll
  speed_ms?: number;                            // default 22000
  className?: string;
}

export interface ReducedMotionGateProps {
  children: React.ReactNode;
}
```

---

## 16. Env Config (`lib/env.ts`)

```typescript
export interface EnvConfig {
  // Kimi (Moonshot)
  MOONSHOT_API_KEY: string;
  MOONSHOT_BASE_URL: string;                    // default 'https://api.moonshot.ai/v1'
  MOONSHOT_MODEL_ID: string;                    // default 'kimi-k2.6'

  // Brave
  BRAVE_SEARCH_API_KEY: string;

  // Apify
  APIFY_TOKEN: string;
  APIFY_ACTOR_ID: string;                       // default 'datacach/ubereats-menu-scraper'

  // UberEats affiliate (optional)
  UBEREATS_AFFILIATE_TAG?: string;

  // Fallback LLM (env-flagged disabled by default)
  FALLBACK_LLM_ENABLED: boolean;                // default false
  FALLBACK_LLM_API_KEY?: string;                // required when FALLBACK_LLM_ENABLED=true
  FALLBACK_LLM_MODEL_ID?: string;               // required when FALLBACK_LLM_ENABLED=true
}

export const env: EnvConfig;                    // parsed and validated at module load; throws on missing/malformed
```

---

## 17. Logging (`lib/log.ts`)

```typescript
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export function log(level: LogLevel, message: string, context?: LogContext): void;
```

**Logging invariants (binding):**

- Output is JSON lines to stdout (Vercel log stream).
- Every `error` and `warn` line includes a `code` field for filterable alerts.
- Kimi calls log `usage.cache_creation_input_tokens`, `usage.cache_read_input_tokens`, `usage.input_tokens`, `usage.output_tokens` on every invocation.
- Validator rejections log at `warn` level with `code` set to one of the `ValidationError.code` values.

---

## Cross-references — Plan task ↔ Type Contract section

| Plan task | Type Contract section(s) |
|---|---|
| 1, 5, 16 (scaffolding, env) | §16 (EnvConfig), §17 (log) |
| 2, 3 (tokens, fonts) | (no types) |
| 4 (mascots) | §12 (Mascot Props) |
| 6 (Brave) | §3 (BraveResult, BraveError, searchUberEatsNear) |
| 7 (Kimi) | §4 (RestaurantPick, DishPick, KimiError, KimiUsage, pickCandidates, pickDish, parseAndRetry) |
| 8 (Apify) | §5 (Menu, MenuItem, RestaurantCandidate, ApifyError, fetchMenu) |
| 9 (Validator) | §6 (ValidatedRecommendation, ValidationError, assertConsistency) |
| 10 (Deep-link) | §7 (DeepLinkInput, buildDeepLink) |
| 11 (Orchestrator) | §8 (PipelinePhase, PipelineEvent, PipelineError, PipelineState, runPipeline, runAlternative, serializeEvent) |
| 12 (`/api/recommend`) | §9 (RecommendRequest, POST signature) |
| 13 (Profile + hook) | §2 (Profile, ProfilePreferences, RecentPick, getProfile, updateProfile, recordFeedback, useProfile) |
| 14 (Reduced motion) | §11 (useReducedMotion), §15 (ReducedMotionGate) |
| 15 (Wizard primitives) | §13 (Stepper, Chip, BudgetCard, AllergyCheckbox) |
| 16-22 (Wizard pages, hero, alts, feedback, signup) | §10 (RecommendationState, useRecommendation), §14 (HeroCard, AlternativesStrip), §15 (Marquee) |
| 23-25 (E2E, error states, eval) | (no new types — exercises existing contract) |
| 26-27 (deploy, analytics) | §17 (log) |

---

## Self-review

### Coverage

Every type, function, hook, and component referenced in `plans/omakai-mvp.md` Tasks 1-27 has an explicit contract here, or is intentionally omitted because no public type is exposed (Tasks 2-3 are CSS-only, Tasks 23-25 exercise existing contracts, Task 26 is config).

### Consistency

- All errors use discriminated unions with a `code` field — no `Error` subclassing, no string-typed errors.
- All async functions returning `Result<T, E>` use `Promise<Result<T, E>>`, never `throw`.
- All `signal?: AbortSignal` parameters are honored by every external HTTP call (Brave, Kimi, Apify) and by the orchestrator generators.
- Branded ID types prevent confusing `RestaurantId` for `DishId` at compile time.
- Allergen union is exhaustive (8 categories matching the wizard checkbox list).

### Type-safety properties

- `tsc --strict` is binding, including `noUncheckedIndexedAccess`. Implementations may not bypass this.
- Zod schemas (§4) are runtime sources of truth for LLM outputs; their `z.infer<>` types match the TypeScript declarations exactly.
- The discriminated `RecommendRequest` (§9) makes the two endpoint modes mutually-exclusive at the type level — TypeScript narrows correctly inside the handler.

### Open questions for user (none blocking)

- **Cross-tab profile sync via `storage` event**: the contract for `useProfile` (§2.2) doesn't mandate cross-tab sync. The plan task 13 verification mentions it. Decision: cross-tab sync is an *implementation property*, not a type contract. Tests will verify it; the contract just gives the hook shape. No change needed.
- **Fallback LLM type contract**: the env flag exists but the fallback's call sites use the same `pickCandidates`/`pickDish` signatures as Kimi. Decision: implementation will dispatch to Moonshot or fallback under the same exported API — no separate contract surface needed.

---

_When approved, the next phase is 2.6 Test Plan, which defines the `red`-half test for each plan task. Per CLAUDE.md, that is its own approval gate._
