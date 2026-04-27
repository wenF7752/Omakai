# omabite

A wizard-driven dish picker for UberEats. The user answers five short steps (address, budget, vibe, prefs, allergies) and the app lands them on **one** specific dish at **one** specific restaurant — with a reasoned "why this", a one-line diner-sentiment summary, and a deep link that opens the dish in UberEats.

The product surface is small. The interesting part is the pipeline behind `/thinking`: a single SSE endpoint orchestrates four external services, validates the result against the menu and the user's declared allergens, and degrades gracefully when any leg fails.

---

## Stack

- **Next.js 16.2.4** (App Router, Turbopack) on **React 19.2.4**
- **TypeScript 5** with `strict` + `noUncheckedIndexedAccess`
- **Zod 4** for runtime validation at every system boundary (env, request body, LLM output, profile storage)
- **Vitest 4** + jsdom + MSW + Testing Library for unit and integration tests

External services:

| Service | Used for | Cost shape |
|---|---|---|
| Brave Search API | Restaurant discovery (`site:ubereats.com`) and review snippets | Per-query, free tier covers dev |
| Moonshot Kimi (k2-0905-preview) | Restaurant shortlist, dish pick, sentiment summary | Per-token, paid |
| Apify (`datacach/ubereats-menu-scraper`) | Live menu scraping | Per-actor-run, paid |

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in MOONSHOT_API_KEY, BRAVE_SEARCH_API_KEY, APIFY_TOKEN
npm run dev                   # http://localhost:3000
```

Other scripts:

```bash
npm run typecheck   # tsc --noEmit (strict)
npm run lint        # eslint (next/core-web-vitals + next/typescript)
npm test            # vitest run
npm run format      # prettier --write .
```

A PostToolUse hook in `.claude/hooks/` lints the single edited file after every `Edit`/`Write` so the agent surfaces lint errors immediately. CI is the same `typecheck → lint → test` triplet.

---

## Workflow: how the user gets to a result

```
/  ──►  /address  ──►  /budget  ──►  /vibe  ──►  /prefs  ──►  /allergies
                                                                  │
                                                                  ▼
        /signup  ◄──  /feedback  ◄──  /result  ◄──  /thinking  ◄──┘
```

**Wizard (`app/(wizard)/`)** — five steps, all wrapped in one `<form>` so Enter submits the active step. `/address` and `/prefs` use uncontrolled text inputs (`defaultValue` + `name=…`, read via `FormData`) because Enter-to-submit fires before a controlled `value` flush would land. Each step writes to the persistent profile via `updateProfile()` before navigating.

**`/thinking`** — opens the SSE stream and renders a live activity feed (stages: `looking → matching → ranking → ready`). Phrase rotator and checklist are gated on `prefers-reduced-motion`. A dev-only `?force_error=<code>` query param injects a synthetic error state for design QA; the page calls `notFound()` in production.

**`/result`** — shows the picked dish with PRICE / ETA / RATING / DINER VIBE callouts, the LLM's "why this" reasoning, an optional sentiment summary, ingredient chips, an allergy disclaimer, and two CTAs: **try another** (cycles through pre-fetched alternatives) and **order on UberEats** (deep link).

**`/feedback`** — captures `nailed_it | not_quite`. After three trailing `nailed_it` picks the user is routed to `/signup`.

---

## Logic layers: how a recommendation is produced

A single API route — `app/api/recommend/route.ts` — accepts a Zod-validated POST and streams `text/event-stream` frames produced by `lib/pipeline/orchestrator.ts` (an async generator). The client (`hooks/useRecommendation.ts`) parses the stream into a state machine.

### Event types

The stream emits five event types, all serialized as `event: <type>\ndata: <json>\n\n`:

| Event | Payload | Purpose |
|---|---|---|
| `phase` | `'address_received' \| 'searching_restaurants' \| 'picking_candidates' \| 'fetching_menu' \| 'picking_dish' \| 'validating' \| 'done' \| 'error'` | Drives the loading-screen progress |
| `log` | `LogEntry` (stage + kind + text + optional count/status) | Live activity feed on `/thinking` |
| `candidates` | `{ hero, alternatives: [{candidate, tag}] }` | Shortlist preview while menus fetch |
| `result` | `{ recommendation, deep_link }` | Final pick, validated |
| `error` | `PipelineError` (closed set of codes) | Fail-fast or graceful degrade |

### Pipeline stages

```
[Profile + Address]
        │
        ▼
1. Brave search ─────────► restaurant URLs (site:ubereats.com)
        │                  • drop /neighborhood/ directory pages
        │                  • drop last-5 recently-picked restaurants (with fallback)
        ▼
2. Kimi: pickCandidates ─► 1 hero + 3 tagged alternatives (lighter|spicier|cheaper)
        │                  • emits  candidates  event so the UI can preview
        ▼
3. Apify: fetchMenu ─────► hero → alt₁ → alt₂ → alt₃  (first non-empty wins)
        │                  • each candidate ~6–8 s cold; 90 s timeout per fetch
        ▼
4. filterToMains ────────► drop appetizers/sides/drinks/desserts/etc.
        │                  • last-5 dishes excluded (with fallback)
        ▼
5. Kimi: pickDish ───────► {dish_id (verbatim), reasoning, warning?}
        │
        ▼
6. Validator ────────────► assertConsistency
        │                  • restaurant_id ∈ candidates
        │                  • dish_id ∈ menu items
        │                  • declared allergies vs dish.allergens, then keyword fallback
        ▼
7. Brave: searchReviews ─► top 3 snippets
        │
        ▼
8. Kimi: pickSentiment ──► {score 1-5, summary 10-200 chars}
        │                  • optional; failure logs warn and degrades quietly
        ▼
9. buildDeepLink ────────► validated UberEats URL + ?ref=<affiliate_tag>?
        │
        ▼
       result
```

`runAlternative` (called when the user clicks an alternative on `/result`) re-enters at stage 4 with the chosen candidate — no fallback chain, since the user picked it explicitly.

### Layer boundaries

Each external dependency is wrapped behind a typed client that returns `Result<T, E>`:

| Layer | Module | Responsibility |
|---|---|---|
| **Search** | `lib/brave/client.ts` | `searchUberEatsNear`, `searchReviews`. Filters to `https://www.ubereats.com/`, capped at 10. `extractRating()` parses `★/stars/X.X / 5/X reviews` from descriptions. |
| **LLM** | `lib/kimi/` (`client.ts`, `prompts.ts`, `retry.ts`, `schemas.ts`) | `pickCandidates`, `pickDish`, `pickSentiment`. All outputs are Zod-schema-validated; on parse drift, `parseAndRetry` issues one reinforcement turn before giving up. |
| **Menu** | `lib/apify/client.ts` | `fetchMenu`. Discriminates the actor's flat row schema (`menu_item_*`) from legacy nested fixtures via `rowsLookFlat`. Skips sold-out items, normalizes price taglines (`"Priced by add-ons"` → `price_label`). |
| **Validator** | `lib/pipeline/validator.ts` | `assertConsistency`. Pure function, no I/O. Allergen check first uses `dish.allergens` (declared by the menu), then falls back to `ALLERGEN_KEYWORDS` regex against name + description + ingredients. |
| **Deep link** | `lib/deeplink/builder.ts` | Pure. Throws on non-UberEats URL or `store_uuid` mismatch. Adds `?ref=<UBEREATS_AFFILIATE_TAG>` when set. |
| **Orchestrator** | `lib/pipeline/orchestrator.ts` | `runPipeline`, `runAlternative`. Async generators yielding `PipelineEvent`s. Honors a parent `AbortSignal` at every `await`. |
| **API** | `app/api/recommend/route.ts` | Zod-validates request body, builds an `AbortController`, pipes the generator into a `ReadableStream<Uint8Array>` with `controller.abort()` in the stream's `cancel`. |

---

## Persistence

Two browser storage layers, both keyed with underscores:

- **`omabite_profile`** (localStorage) — Zod-validated `Profile` carrying `preferences`, optional `address`, `recent_picks`, and `signup_prompted`. Long-lived. Wrapped in `useSyncExternalStore` (`hooks/useProfile.ts`) with a frozen module-level `SERVER_SNAPSHOT` for SSR. Snapshot caching is keyed by serialized raw localStorage so referential identity is stable across renders.
- **`omabite_result_cache`** (sessionStorage) — last successful recommendation, fingerprinted by sorted `cuisines + vibes + allergies + free_text + budget_tier + address.raw`. 30 min TTL. Hydrates `useRecommendation` on mount when the fingerprint matches; cleared on `retry()` or `selectAlternative()`.

`recordPick` (called when the `result` event arrives) appends to `recent_picks` (trimmed to 20). The orchestrator reads the last 5 entries and excludes them from the candidate pool to avoid serving the same restaurant or dish twice in a row.

`recordFeedback` is the only other mutator — it sets the feedback field on a prior pick and triggers the signup wall after three trailing `nailed_it` picks.

---

## Error handling

The closed `PipelineError` union — `no_candidates | menu_fetch_failed | kimi_drift | allergen_violation | validator_reject | aborted | unknown` — is the contract between the orchestrator and the UI. `/thinking` has copy for each code; an unknown code falls through to a generic retry screen.

Failure modes that **degrade quietly** instead of erroring:

- Sentiment search/pick failure → `recommendation.sentiment` is omitted, `/result` hides the DINER VIBE callout.
- Brave description has no rating regex match → `restaurant.rating` is undefined, RATING callout hides.
- `filterToMains()` filters everything out → falls back to the unfiltered menu.
- Recent-picks excludes empty the candidate pool → falls back to the full pool.
- Hero menu fetch returns empty → walks alternatives in order.

Failure modes that **fail fast**:

- No Brave results, or all Brave results were `/neighborhood/...` directory pages → `no_candidates`.
- All four candidate menus came back empty → `menu_fetch_failed`.
- LLM output fails Zod validation twice (initial + reinforcement) → `kimi_drift`.
- Validator finds the picked dish exposes a declared allergen → `allergen_violation`.
- Validator finds restaurant or dish ID outside the offered set → `validator_reject`.
- Request aborted (user navigated away or canceled) → `aborted`.

---

## Repo layout

```
app/                Next.js App Router
  (wizard)/         Wizard route group + layout
  api/recommend/    SSE endpoint (the only API route)
  dev/              Scratch routes (NODE_ENV !== 'production' only)
  globals.css       Yuzu Sticker design tokens
components/
  mascots/          Maki, StickerBadge, Chopsticks, DishPlaceholder
  wizard/           Chip, BudgetCard, Stepper, WizardButton, BackLink, AllergyCheckbox, WizardContext
  result/           HeroCard, AlternativesStrip
  shared/           ReducedMotionGate
hooks/              useProfile, useRecommendation, useReducedMotion, useEnterToSubmit
lib/
  brave/            Search client + types (extractRating regex lives here)
  kimi/             Moonshot client, prompts, schemas, parse-and-retry
  apify/            Menu scraper client + types (flat/legacy row discrimination)
  pipeline/         Orchestrator, SSE event types, validator
  profile/          localStorage store + types (Zod-validated)
  result/           sessionStorage recommendation cache
  deeplink/         Pure URL builder
  env.ts            Zod-validated env (lazy singleton)
  log.ts            JSON-line structured logger
  types.ts          Result<T,E>, branded IDs, BudgetTier, Allergen
tests/
  unit/             Mirrors lib/ + components
  integration/      Orchestrator + api-recommend (MSW)
public/             Static assets
```

---

## Design system

Tokens live in `app/globals.css` as CSS custom properties (Yuzu Sticker palette):

```
--a-cream  --a-peach  --a-peach-deep  --a-butter
--a-sage   --a-sage-deep  --a-ink
```

Always use these — do not hardcode hex. Fonts are loaded via `next/font/google` in `app/layout.tsx`: **Fraunces** (display, SOFT axis), **Zen Kaku Gothic New** (body), **DM Mono** (mono).

Visual mockups in `design/mockups/` are **reference only** (untracked, ESLint-ignored). The implementation is the source of truth.

---

## Conventions worth noting

- **Result types over thrown errors.** Network and parsing layers return `Result<T, E>`; the orchestrator translates lib-level errors into `PipelineError` codes for the UI. Throws are reserved for truly unrecoverable conditions (e.g., the deep-link builder rejecting a malformed URL).
- **Branded IDs.** `RestaurantId`, `DishId`, `StoreUuid` are nominal types from `lib/types.ts` — useful when an actor returns the same UUID under three different field names.
- **Structured logging only.** Every observable event has a stable name (e.g. `kimi_call`, `apify_menu_ok`, `orchestrator_menu_fallback`, `validator_reject`). Easy to grep, easy to wire to OTLP later.
- **Path alias `@/*`** maps to repo root in both `tsconfig.json` and `vitest.config.ts`. Always import as `@/lib/...`, `@/components/...`, `@/hooks/...`.

---

## Status

MVP. Live happy path verified end-to-end against real Brave + Apify + Moonshot keys. Test coverage spans every `lib/` module plus integration tests for the orchestrator and SSE route. Affiliate revenue is wired but disabled until the UberEats program approves the tag.
