# Architecture Reference

Loaded on-demand. Read sections when a task requires that detail.

## Pipeline (the core flow)

A single SSE endpoint (`app/api/recommend/route.ts`) drives an async generator (`lib/pipeline/orchestrator.ts`) that yields `phase | candidates | result | error` events. The hook `hooks/useRecommendation.ts` parses the stream into a state machine consumed by `/thinking` and `/result`.

Sequence:

1. **Brave search** (`lib/brave/client.ts:searchUberEatsNear`) — query is `site:ubereats.com {cuisines + vibes + free_text} {address}`; results filtered to UberEats, capped at 10. `extractRating()` regexes the description for `★/stars/X.X / 5/X reviews` and attaches `{value, count}` when found.
2. **Kimi candidate pick** (`lib/kimi/client.ts:pickCandidates`) — picks 1 hero + 3 tagged alternatives (`lighter|spicier|cheaper`) from the Brave list. Reinforcement-retry on schema drift via `lib/kimi/retry.ts`.
3. **Menu fetch with hero→alternative fallback** — orchestrator walks `[hero, ...alternatives]` and breaks on the first non-empty Apify response. Each candidate costs ~6–8 s when stale; total budget capped by `DEFAULT_TIMEOUT_MS = 90_000` per fetch. Logs `orchestrator_menu_fallback` per skip.
4. **Filter to mains** — `filterToMains(menu)` drops items whose `subsection_name` matches `/appetizer|starter|side|drink|beverage|dessert|sauce|soup|salad add-on|extra|kid|toppings?|condiment/i`. Falls back to the unfiltered menu if the filter empties everything.
5. **Kimi dish pick** (`pickDish`) — strict prompt: must be a substantial main course; output `{dish_id, reasoning, warning?}`; `dish_id` must be copy-verbatim from the prompt.
6. **Validator** (`lib/pipeline/validator.ts:assertConsistency`) — checks `restaurant_id` ∈ candidates, `dish_id` ∈ menu items, no allergen exposure (declared allergies vs `dish.allergens` then keyword fallback in `ALLERGEN_KEYWORDS`). Each rejection logs structured `validator_reject`.
7. **Sentiment** — `searchReviews({restaurantName})` → top 3 Brave snippets → `pickSentiment()` produces `{score 1-5, summary 10-200 chars}`. Failure path logs warn and degrades gracefully (no `sentiment` field set).
8. **Deep link** (`lib/deeplink/builder.ts`) — pure function. Throws on non-UberEats URL or store_uuid mismatch. Adds `?ref=<UBEREATS_AFFILIATE_TAG>` when set.

`runAlternative` (selected from `/result`'s alternatives strip) reuses the post-fetch path with a single candidate — no fallback there since the user explicitly picked it.

## Profile state (`lib/profile/store.ts`)

- localStorage key `omakai_profile` (underscore — not dot).
- Zod-validated on read; corrupt/mismatched JSON falls back to `defaultProfile()`.
- Snapshot caching keyed by serialized raw string. `getProfile` returns the cached object reference when `localStorage.getItem` returns the same string. Invalidated on `writeStorage`, `clearProfile`, and the cross-tab `storage` event.
- `hooks/useProfile.ts` wraps it in `useSyncExternalStore` with a frozen module-level `SERVER_SNAPSHOT` for SSR.
- `recordFeedback` is the only mutator outside `updateProfile`. Triggers signup-wall after 3 trailing `nailed_it` picks.

## Wizard flow

`app/(wizard)/` route group, all 5 steps share `WizardLayout` (`app/(wizard)/layout.tsx` → `WizardProvider`). Order: `/` (landing) → `/address` → `/budget` → `/vibe` → `/prefs` → `/allergies` → `/thinking` → `/result` → `/feedback` → `/signup`.

Keyboard accessibility:

- Each step is wrapped in `<form ref={formRef} onSubmit={...}>`.
- `hooks/useEnterToSubmit` adds a window-level keydown listener that calls `formRef.current?.requestSubmit()` on Enter, skipping only `<input>` text-types and `<textarea>`. Used by `/budget`, `/vibe`, `/prefs`, `/allergies`. Buttons get their click suppressed (`preventDefault` on keydown) so a focused chip won't double-fire toggle + submit.
- `WizardButton` in form pages uses `type="submit"`; inline buttons inside forms (`/allergies` "no allergies" toggle) must set `type="button"`.
- `BackLink` (`components/wizard/BackLink.tsx`) is on every step; `/address`'s back goes to `/` with label "start over".
- `/address` and `/prefs` text inputs are uncontrolled (`defaultValue` + `name`) and read via `FormData` on submit — see CLAUDE.md gotcha for the why.

`/thinking`:

- SSE consumer via `useRecommendation`. On `state.kind === 'ready'`, navigates to `/result`.
- `?force_error=<code>` (dev-only, `NODE_ENV !== 'production'`) injects a synthetic error state. Closed set: `no_candidates|menu_fetch_failed|kimi_drift|allergen_violation|validator_reject|aborted|unknown`.
- Phrase rotator + checklist gated on `useReducedMotion`.

`/result`:

- `HeroCard` renders `dish` + `restaurant` byline, PRICE/ETA/RATING/DINER VIBE callouts, WHY THIS reasoning, optional WHAT DINERS SAY summary, ingredient chips, allergy disclaimer, "try another" + "order on UberEats" CTAs.
- RATING callout hides when `restaurant.rating` is undefined; DINER VIBE block hides when `recommendation.sentiment` is undefined. Both are best-effort.
- Deep-link uses `target="_blank" rel="noopener noreferrer"`.

## API/route pattern

`app/api/recommend/route.ts` is the only API route.

1. `POST` body validated via `z.discriminatedUnion('mode', [InitialSchema, AlternativeSchema])`. Bad body → 400 `application/json` with Zod issues.
2. Builds an `AbortController`; `runPipeline`/`runAlternative` async generator wired into a `ReadableStream<Uint8Array>` with `controller.abort()` in the stream's `cancel` callback.
3. Each `PipelineEvent` serialized via `lib/pipeline/events.ts:serializeEvent` to `event: <type>\ndata: <json>\n\n`.

## Logging (`lib/log.ts`)

JSON-line structured logger. One-line entries with `{ts, level, message, ...context}`. `level === 'error'` → `console.error`, `warn` → `console.warn`, else `console.log`. Use sparingly; preferred names already in use: `kimi_call`, `kimi_dish_prompt`, `kimi_dish_pick`, `kimi_sentiment`, `kimi_parse_drift_attempt_{1,2}`, `kimi_parse_recovered_on_retry`, `apify_*`, `brave_search`, `orchestrator_picked`, `orchestrator_menu_fallback`, `validator_reject`, `sentiment_failed`, `review_search_failed`.

## Result types

`Result<T, E>` discriminated union from `lib/types.ts`. Branded IDs: `RestaurantId`, `DishId`, `StoreUuid`. Use `Ok(value)` / `Err(error)`. The orchestrator translates lib-level errors to `PipelineError` codes for the UI.

## Environment (`lib/env.ts`)

Zod-validated. `parseEnv` exported for tests; `getEnv()` is a lazy singleton. Required: `MOONSHOT_API_KEY`, `MOONSHOT_BASE_URL`, `MOONSHOT_MODEL_ID`, `BRAVE_SEARCH_API_KEY`, `APIFY_TOKEN`, `APIFY_ACTOR_ID`. Optional: `UBEREATS_AFFILIATE_TAG`. `FALLBACK_LLM_*` form a `superRefine` group: `FALLBACK_LLM_API_KEY` is required when `FALLBACK_LLM_ENABLED=true`.

## File & Folder Structure

- `app/` — Next.js App Router. `(wizard)/` is the wizard route group; `api/recommend/` the SSE endpoint; `dev/` scratch routes.
- `components/` — `mascots/` (Maki, StickerBadge, Chopsticks, DishPlaceholder), `wizard/` primitives, `result/` (HeroCard, AlternativesStrip), `shared/` (ReducedMotionGate).
- `hooks/` — `useProfile`, `useRecommendation`, `useReducedMotion`, `useEnterToSubmit`.
- `lib/` — `apify/`, `brave/`, `kimi/` (`client`, `prompts`, `retry`, `schemas`), `pipeline/` (`orchestrator`, `events`, `validator`), `profile/`, `deeplink/`, `env`, `log`, `types`.
- `tests/` — `unit/` mirror of `lib/` + components, `integration/` (orchestrator + api-recommend with MSW). 17 files, 112 tests.
- `design/mockups/` — JSX visual references. **Do not edit.** ESLint ignores them.
- `plans/`, `research/` — workflow artifacts (phase-gate markers live here).
- `public/` — static assets.

## Routing structure

`/` → landing; `/address`, `/budget`, `/vibe`, `/prefs`, `/allergies` — five-step wizard; `/thinking` — SSE consumer + error UI + dev `?force_error`; `/result` — recommendation render; `/feedback` → `/signup`; `/dev/{tokens,fonts,motion}` — scratch (NODE_ENV-gated).

## Design tokens

Yuzu Sticker palette declared in `app/globals.css` as CSS custom properties (`--a-cream`, `--a-peach`, `--a-peach-deep`, `--a-butter`, `--a-sage`, `--a-sage-deep`, `--a-ink`). Use these — do not hardcode hex. Fonts: Fraunces (display, SOFT axis), Zen Kaku Gothic New (body), DM Mono (mono); set up via `next/font/google` in `app/layout.tsx`.

## MCP servers (`.mcp.json`)

- **chrome-devtools** (`chrome-devtools-mcp@latest`) — drives a Chrome instance for live wizard testing (`navigate_page`, `take_snapshot`, `evaluate_script`, `type_text`, `press_key`, `take_screenshot`). The dev server must be running on `localhost:3000` for `evaluate_script`-based seeds to work.

## Available Tools

- **TypeScript LSP** — not configured globally. Prefer `npm run typecheck` to surface diagnostics. Path alias `@/*` maps to repo root.
- **Context7** — not configured. Use direct file reads.
- **Code Simplifier** — not installed.

## Known mockup-vs-spec divergences

- Spec said "no preview/turbo/thinking" Moonshot variants. We use `kimi-k2-0905-preview` because the non-preview thinking variants are unworkable for a sub-25s pipeline. Treat the rule as "no thinking variants."

## Phase / gate state at last init

All five gate markers in place (see CLAUDE.md source-of-truth list). Phase 3 Execute is in progress. Tasks 1-23 complete in code, plus Task 24 partial. Live happy-path verified end-to-end. Test count at last triplet run: 112/112.
