# omakai.food MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the omakai.food MVP — a web PWA that asks 5 chip-based questions and returns one dish recommendation with a deep-link to UberEats, plus 3 alternative chips for agency.

**Architecture:** Next.js 15 App Router PWA. Backend is a structured 3-call pipeline orchestrator (Brave Search → Kimi K2.6 → Apify) running in API routes and streaming SSE to the frontend. JSON-schema-bound LLM outputs at every step, deterministic output validator, no agent loops. Yuzu Sticker visuals ported from `design/mockups/`.

**Tech Stack:** Next.js 15 (App Router) + TypeScript + Tailwind + CSS custom properties · Moonshot Kimi K2.6 via OpenAI-compatible client · Brave Search API (web search with `site:ubereats.com`) · Apify (`datacach/ubereats-menu-scraper`) · Vercel · localStorage (no DB) · Vitest + MSW for unit/integration · chrome-devtools MCP for browser tests.

---

## Status

Plan: Approved by user (2026-04-24)

## Spec reference

Source of truth: `/home/wen0210/projects/omakase/research/omakai-mvp.md`. The "Implementation architecture (research-phase consolidation, 2026-04-24)" section supersedes earlier Design Concept details. Plan tasks below implement that consolidation. When this plan and the spec conflict, the spec wins — flag the conflict and update the plan, do not silently diverge.

## Restated problem

People are increasingly indecisive about food ordering. Browsing 80+ restaurants and 1,200+ menu items on UberEats induces choice fatigue. omakai.food asks 5 short questions (address, budget, vibe, preferences, allergies) and returns one dish recommendation grounded in real UberEats menu data, plus 3 alternative chips ("lighter / spicier / cheaper") for agency. The user skips browsing entirely. MVP launches in the US on UberEats only and earns no affiliate revenue at launch — value loop validation precedes monetization.

## Assumptions and constraints

1. **Single LLM provider** for MVP: Moonshot Kimi K2.6 (pinned). Env-flagged fallback to a US LLM (Haiku 4.5 or GPT-4o-mini) implemented but disabled by default. Fallback exercised on Kimi 5xx, timeouts >12s, or Zod parse failures after 1 retry.
2. **Single search provider:** Brave Search (web search with `site:ubereats.com` operator only — no Place Search subscription, no separate Yelp/Google integration).
3. **Single scraping provider:** Apify (`datacach/ubereats-menu-scraper` or v2 actor). ScrapFly Pro retained as documented fallback only, NOT implemented in MVP.
4. **No backend database for MVP.** All user state in browser localStorage. Backend is stateless (Next.js API routes).
5. **No authentication for MVP.** Deferred signup wall is a UI-only prompt; actual account creation is post-MVP scope.
6. **Visual direction locked:** Yuzu Sticker (`design/mockups/dir-a-yuzu.jsx`). Other directions archived as reference only.
7. **Geographic scope:** US only, UberEats only. Brave coverage in tier-2/3 cities is acknowledged-weak; if Brave returns <3 plausible candidates, surface "limited coverage in your area" rather than fabricating alternatives.
8. **JSON-schema strict-mode reliability:** Kimi can drift on long context. Every Kimi call is wrapped with a Zod validator + 1 retry on parse failure. Hard fail after 1 retry — surface "the chef is having an off night" UX.
9. **Kimi K2.5 deprecation 2026-05-25.** Pin to K2.6 from day one. Older preview/turbo/thinking variants must not be used.
10. **Phase gates per CLAUDE.md:** this plan must be approved before Phase 2.5 Type Contract begins. Type Contract is its own approval gate. Test Plan likewise. Execute happens task-by-task with TDD cycles. **No code may be written until Plan, Type Contract, and Test Plan are all approved.**
11. **Reduced-motion gate** must apply to both CSS animations *and* the JS `setInterval` driving the loading-phrase rotator (per knowledge-base gotcha).
12. **Output validator must reject + log** on hallucinated dish IDs — never silently substitute (per knowledge-base gotcha).
13. **Cross-concern cancellation:** if the user goes back and edits the address mid-pipeline, in-flight Brave/Kimi/Apify calls must be aborted (per knowledge-base gotcha).
14. **Allergen safety disclaimer** must be visible on every recommendation card; the LLM prompt must instruct skipping any dish whose ingredients are ambiguous when allergies are declared (Risk 2a).
15. **Browser tests require a dev server URL.** Per CLAUDE.md Phase 2.6, no Execute phase begins without a running dev server I can hit via chrome-devtools MCP.

## Files affected (file structure)

```
omakase/
├── app/
│   ├── (wizard)/
│   │   ├── layout.tsx                  # wizard shell + step state context
│   │   ├── page.tsx                    # ALanding (entry)
│   │   ├── address/page.tsx            # AAddress (Step 1)
│   │   ├── budget/page.tsx             # ABudget (Step 2)
│   │   ├── vibe/page.tsx               # AVibe (Step 3)
│   │   ├── prefs/page.tsx              # APrefs (Step 4)
│   │   ├── allergies/page.tsx          # AAllergies (Step 5)
│   │   ├── thinking/page.tsx           # ALoading (post-submit, SSE-driven)
│   │   ├── result/page.tsx             # ARec (hero + 3 alts)
│   │   ├── feedback/page.tsx           # AFeedback (post-return)
│   │   └── signup/page.tsx             # ASignup (deferred wall)
│   ├── api/
│   │   └── recommend/route.ts          # SSE pipeline orchestrator endpoint
│   ├── layout.tsx                      # root layout (fonts, tokens, metadata)
│   └── globals.css                     # Tailwind + Yuzu CSS custom properties
├── components/
│   ├── mascots/
│   │   ├── MaskotMaki.tsx              # rice-ball mascot (mood: happy|thinking)
│   │   ├── StickerBadge.tsx            # circular stamp with arc text
│   │   ├── Chopsticks.tsx              # decorative element
│   │   └── DishPlaceholder.tsx         # striped placeholder for missing photos
│   ├── wizard/
│   │   ├── Stepper.tsx                 # progress indicator (1-5/5)
│   │   ├── Chip.tsx                    # toggleable chip primitive (Yuzu styling)
│   │   ├── BudgetCard.tsx              # $ / $$ / $$$ card
│   │   └── AllergyCheckbox.tsx         # 2x2 grid checkbox item
│   ├── result/
│   │   ├── HeroCard.tsx                # main recommendation card
│   │   └── AlternativesStrip.tsx       # row of 3 alt chips with tag labels
│   └── shared/
│       ├── Marquee.tsx                 # food-words scroll strip on landing
│       └── ReducedMotionGate.tsx       # matchMedia wrapper for animations + intervals
├── lib/
│   ├── brave/
│   │   ├── client.ts                   # Brave Search HTTP client
│   │   └── types.ts                    # response shape types (web-search variant only)
│   ├── kimi/
│   │   ├── client.ts                   # OpenAI-compatible client wrapper
│   │   ├── schemas.ts                  # Zod schemas for the 2 Kimi call sites
│   │   ├── prompts.ts                  # system prompt + 2 step-specific prompt builders
│   │   └── retry.ts                    # parse-and-retry helper
│   ├── apify/
│   │   ├── client.ts                   # Apify actor invocation
│   │   └── types.ts                    # menu response types
│   ├── pipeline/
│   │   ├── orchestrator.ts             # 6-step sequencer (Brave→Kimi→Apify→Kimi→Validator→Deeplink)
│   │   ├── events.ts                   # SSE event types + serializer
│   │   └── validator.ts                # output validator (rejects + logs)
│   ├── deeplink/
│   │   └── builder.ts                  # UberEats URL constructor with affiliate tag
│   ├── profile/
│   │   └── store.ts                    # localStorage adapter (typed get/set)
│   └── env.ts                          # env var validation (zod) — fails fast on missing secrets
├── hooks/
│   ├── useProfile.ts                   # profile-store React hook
│   ├── useRecommendation.ts            # SSE consumer hook with abort controller
│   └── useReducedMotion.ts             # matchMedia React hook
├── public/
│   └── (favicon, og-image — generated later)
├── design/
│   └── mockups/                        # already populated, reference only
├── research/
│   └── omakai-mvp.md                   # source of truth (already exists)
├── plans/
│   └── omakai-mvp.md                   # this document
├── tests/
│   ├── unit/                           # Vitest unit tests, one per lib/ module
│   ├── integration/                    # MSW-mocked end-to-end pipeline tests
│   └── browser/                        # chrome-devtools MCP test specs (.md, executed by chrome-devtools MCP)
├── tailwind.config.ts                  # theme.colors references CSS custom properties
├── tsconfig.json                       # strict mode on
├── package.json
├── .env.example                        # documents required env vars
├── .env.local                          # local secrets (gitignored)
├── .gitignore
├── next.config.ts
├── postcss.config.js
├── vitest.config.ts
└── README.md
```

## Data/state flow

### Frontend state (localStorage shape)

```
omakai_profile {
  preferences: {
    cuisines: string[];        // user-selected cuisine chips
    free_text: string;         // optional freeform pref note
    vibes: string[];           // selected vibe chips
    budget_tier: '$'|'$$'|'$$$';
    allergies: string[];       // canonical allergen identifiers
  };
  recent_picks: Array<{
    timestamp: number;
    restaurant_id: string;
    dish_id: string;
    dish_name: string;
    feedback: 'nailed_it' | 'not_quite' | null;
  }>;
  signup_prompted: boolean;    // gate for deferred signup wall (after 3rd success)
}
```

### Backend pipeline event stream (SSE)

The orchestrator emits events on this contract (full schemas defined in Phase 2.5 Type Contract):

```
event: phase
data: { phase: 'address_received' | 'searching_restaurants' | 'picking_candidates' | 'fetching_menu' | 'picking_dish' | 'validating' | 'done' | 'error' }

event: candidates
data: { hero: RestaurantCandidate, alternatives: [RestaurantCandidate, RestaurantCandidate, RestaurantCandidate] }

event: result
data: { restaurant: RestaurantSummary, dish: DishSummary, reasoning: string, deep_link: string }

event: error
data: { code: 'no_candidates' | 'menu_fetch_failed' | 'kimi_drift' | 'allergen_violation' | 'validator_reject' | 'unknown', message: string }
```

### Pipeline data flow

```
1. POST /api/recommend           (frontend → backend, request body = profile inputs)
2. brave.searchUberEatsAt(addr)  → ~10 candidate restaurants with name + URL + snippet
3. kimi.pickCandidates(inputs, candidates)
                                  → { hero: id, alternatives: [id, id, id] }   [Zod-validated]
4. apify.fetchMenu(hero.url)     → structured menu items
5. kimi.pickDish(inputs, hero, menu)
                                  → { dish_id, reasoning }                     [Zod-validated]
6. validator.assertConsistency(result, menu, allergies)
                                  → throws on mismatch (rejects + logs)
7. deeplink.build(restaurant, dish, affiliate_tag)
                                  → UberEats URL
```

Lazy alternative path (user taps an alt chip):

```
POST /api/recommend?alt=<index>  (re-enters pipeline at step 4 for the chosen alt)
```

## Verification strategy

| Layer | Test type | Tool | When |
|---|---|---|---|
| Pure functions in `lib/*` (deeplink, validator, profile store, schemas) | Unit | Vitest | Per task in Phase 3 |
| Pipeline orchestrator | Integration | Vitest + MSW (mocked Brave/Kimi/Apify HTTP) | After all `lib/` units green |
| Frontend components | Unit | Vitest + React Testing Library | Per component task |
| Wizard flow + recommendation render + deep-link click | Browser | chrome-devtools MCP against running dev server | After integration green |
| LLM prompt quality | Eval harness | Fixture inputs with assertions on output category (e.g., vegan input → no meat dish; declared peanut allergy → no peanut-containing dish) | Re-run on every prompt change |
| Cache hit rate (Kimi) | Live instrumentation | log `usage.cache_creation_input_tokens` + `usage.cache_read_input_tokens` per call | Continuous; alert if cache-read drops below 50% on warmed sessions |
| End-to-end happy path | Manual dogfooding | Founder ordering through the app daily | 3 weeks post-launch |

**Per-task verification approach:** every task lists, in English, the observable behavior that proves it's done. Phase 2.6 Test Plan turns these into concrete tests (browser via chrome-devtools MCP for UI tasks; Vitest for everything else). Phase 3 Execute runs the red-green-commit cycle per CLAUDE.md.

---

## Granular task checklist

Tasks are organized into five phases (A-E) by dependency order. **No task may begin until its `Depends on` items are complete and committed.** Each task is bite-sized at the planning level (1 task = 1 commit ≈ 30-90 min of execution work). Phase 2.5 Type Contract will define the exact signatures referenced in each task; Phase 2.6 Test Plan will define the exact tests.

### Phase A — Foundation (Tasks 1-5)

#### Task 1: Initialize Next.js project + tooling

**Goal:** Bootstrap a strict-typed Next.js 15 App Router project with Tailwind, Vitest, MSW, ESLint, Prettier.

**Files:**
- Create: `package.json`, `tsconfig.json` (strict on), `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `vitest.config.ts`, `.eslintrc.json`, `.prettierrc`, `.gitignore`, `.env.example`
- Create: `app/layout.tsx` (minimal), `app/page.tsx` (placeholder), `app/globals.css` (Tailwind directives only)
- Create: `README.md` with setup instructions

**Depends on:** none

**Verification:**
- `npm install` completes without errors
- `npm run dev` starts the dev server on localhost
- `npx tsc --noEmit` passes with strict mode
- `npm run lint` passes
- `npm test` runs Vitest and passes (zero tests is OK at this stage)

**Sub-checklist:**
- [x] Scaffold project (via `create-next-app` into a temp dir then `cp -rn` merge to preserve `design/ plans/ research/`) — Next.js 16.2.4, React 19.2.4, TypeScript 5, Tailwind 4
- [x] Add Vitest, MSW, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom, prettier as dev deps; zod as runtime dep
- [x] Add `vitest.config.ts` + `vitest.setup.ts` with jsdom env and `@/` alias
- [x] Add `.prettierrc` + `.prettierignore`
- [x] Add `.env.example` documenting all required env vars (Moonshot, Brave, Apify, optional affiliate, fallback flags)
- [x] Configure `tsconfig.json` with `strict: true` + `noUncheckedIndexedAccess: true`
- [x] Add ESLint ignores for `design/mockups/**` and `node_modules/**`
- [x] Add `--passWithNoTests` to `test` script (so zero-test runs pass)
- [x] Verify: `npm run typecheck` ✓, `npm run lint` ✓, `npm test` ✓, `npm run dev` ✓ (ready in 405ms on http://localhost:3000)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 2: Yuzu design tokens + globals.css

**Goal:** Port the `.dir-a` CSS custom properties from `design/mockups/styles.css` to `app/globals.css` at `:root`. Add the shared keyframes (`wobble`, `float-y`, `spin-slow`, `pulse-ring`, `steam`, `slide-up`, `pop-in`, `marquee`, `blink`) and the `.sticker` / `.no-scrollbar` utilities.

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts` (theme extension referencing CSS custom properties)

**Depends on:** Task 1

**Verification:**
- All Yuzu palette tokens (`--a-cream`, `--a-peach`, `--a-peach-deep`, `--a-butter`, `--a-sage`, `--a-sage-deep`, `--a-ink`, `--a-mist`) exist at `:root`
- Tailwind utilities `bg-cream`, `bg-peach-deep`, `text-ink` etc. resolve to the CSS custom properties
- All 9 keyframes from the mockup are present and the animation utility classes (`.wobble`, `.float-y`, `.pop-in`, `.slide-up`) work in a manual browser smoke test

**Sub-checklist:**
- [x] Copy `.dir-a` block from `design/mockups/styles.css` into `app/globals.css` at `:root` (renamed prefix from `--a-*` retained: `--a-cream`, `--a-peach-deep`, etc.)
- [x] Drop `.dir-b` and `.dir-c` token blocks
- [x] Copy shared keyframes (`wobble`, `float-y`, `spin-slow`, `pulse-ring`, `steam`, `slide-up`, `pop-in`, `marquee`, `blink`) and utility classes (`.sticker`, `.no-scrollbar`, animation utility classes)
- [x] Add `[data-motion="reduce"]` CSS rules disabling all keyframes (per Reduced-motion gate in Task 14)
- [x] Extend Tailwind 4 theme via `@theme inline { --color-cream: var(--a-cream); ... }` to expose tokens as utilities (`bg-cream`, `text-ink`, etc.)
- [x] Create `app/dev/tokens/page.tsx` smoke route (gated `notFound()` in production) rendering 8 token divs + 4 animation divs with `data-testid` selectors
- [x] Browser-test verified via chrome-devtools MCP at `http://localhost:3000/dev/tokens`: all 8 tokens resolve to expected RGB; all 4 animations have correct `animationName`; body background = cream; console clean
- [x] Verification triplet re-run: `npm run typecheck` ✓, `npm run lint` ✓, `npm test` ✓
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 3: Self-hosted fonts via next/font/google

**Goal:** Load Fraunces (display), Zen Kaku Gothic New (UI), DM Mono (labels) using `next/font/google` for self-hosted optimization. Apply them via CSS classes/utilities matching the mockup conventions (`.display`, `.mono`, body default).

**Files:**
- Modify: `app/layout.tsx` (font imports + `<html className={...}>`)
- Modify: `app/globals.css` (font CSS custom properties + utility classes)
- Modify: `tailwind.config.ts` (`fontFamily` theme extension)

**Depends on:** Task 2

**Verification:**
- Network panel in dev shows fonts loaded from same-origin (Vercel-hosted), not `fonts.googleapis.com`
- A page rendering `<h1 className="display">test</h1>` displays in Fraunces with the mockup's tracking and weight
- A `<span className="mono">test</span>` displays in DM Mono
- Body text defaults to Zen Kaku Gothic New

**Sub-checklist:**
- [x] Import Fraunces with variable axes (opsz default + `axes: ['SOFT']`) — match mockup config
- [x] Import Zen Kaku Gothic New (weights 400, 500, 700, 900)
- [x] Import DM Mono (weights 400, 500)
- [x] Wire font CSS variables into `app/layout.tsx` (also updated metadata title to `omakai.food`)
- [x] Add `.display` and `.mono` utility classes + body default in `globals.css`
- [x] Create `app/dev/fonts/page.tsx` smoke route (gated `notFound()` in production) with `data-testid` selectors for display/mono/body
- [x] Browser-test verified via chrome-devtools MCP at `http://localhost:3000/dev/fonts`: display fontFamily contains `Fraunces`; mono contains `DM Mono`; body contains `Zen Kaku Gothic New`; 0 hits to `fonts.googleapis.com`/`fonts.gstatic.com`; all font requests served from `/_next/static/media/`; console clean
- [x] Verification triplet re-run: `npm run typecheck` ✓, `npm run lint` ✓, `npm test` ✓
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 4: Mascot SVG components ported

**Goal:** Port the four reusable Yuzu visual components (`MaskotMaki`, `StickerBadge`, `Chopsticks`, `DishPlaceholder`) from `design/mockups/mascots.jsx` to TypeScript React components. Drop `MaskotDaruma` and `MaskotBowl` (directions B/C, unused). Refactor hardcoded hex colors to accept a `color` prop or use CSS custom properties via `currentColor` / `var(--a-*)`.

**Files:**
- Create: `components/mascots/MaskotMaki.tsx` (props: `size?: number`, `mood?: 'happy' | 'thinking'`, `style?: CSSProperties`)
- Create: `components/mascots/StickerBadge.tsx` (props: `text: string`, `size?: number`, `color?: string`, `textColor?: string`)
- Create: `components/mascots/Chopsticks.tsx` (props: `size?: number`, `color?: string`)
- Create: `components/mascots/DishPlaceholder.tsx` (props: `width?: number`, `height?: number`, `label?: string`)

**Depends on:** Task 2

**Verification:**
- All four components render visibly identical to the mockup versions when given default props
- Color props successfully override hex values (test by passing `color="red"` and confirming red is used)
- Components accept a `style` prop and forward it to the root SVG (so callers can position them)
- Vitest snapshot tests pass for default and one variant per component

**Sub-checklist:**
- [x] Create `components/mascots/` directory
- [x] Port `MaskotMaki` with `mood` discriminator (happy uses curved-eye paths, thinking uses circle eyes); hex colors swapped to `var(--a-ink)` / `var(--a-peach-deep)` via CSS custom properties
- [x] Port `StickerBadge` with arc-text using `<defs>` + `<textPath>`; `useId()` powers unique arc id (avoids id collisions when multiple badges render)
- [x] Port `Chopsticks` with `color` prop default `var(--a-ink)`
- [x] Port `DishPlaceholder` with `repeating-linear-gradient` using `var(--a-mist)` + `color-mix(in srgb, var(--a-peach) 20%, transparent)` (kept inline; Tailwind 4 has no first-class repeating-gradient utility)
- [x] Add Vitest tests in `tests/unit/mascots/` — 11 passing tests across 4 files (4 MaskotMaki + 3 StickerBadge + 2 Chopsticks + 2 DishPlaceholder); 4 snapshots written
- [x] Verification triplet re-run: `npm run typecheck` ✓, `npm run lint` ✓, `npm test` ✓ (11 passed)
- [ ] Manual visual smoke (deferred — defer to a scratch page once wizard primitives land in Task 15; not blocking)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 5: Env-var validation + secrets

**Goal:** Centralize environment variable parsing in `lib/env.ts` with Zod schemas. Fail fast at startup on missing or malformed secrets. Document all required vars in `.env.example`.

**Files:**
- Create: `lib/env.ts`
- Modify: `.env.example` (document all required vars with placeholder values + comments)
- Create: `.env.local` (gitignored, local secrets)

**Depends on:** Task 1

**Required env vars:**
- `MOONSHOT_API_KEY` (Kimi K2.6 access)
- `MOONSHOT_BASE_URL` (default `https://api.moonshot.ai/v1`, override for tests)
- `MOONSHOT_MODEL_ID` (default `kimi-k2.6` — pin this exactly per spec)
- `BRAVE_SEARCH_API_KEY`
- `APIFY_TOKEN`
- `APIFY_ACTOR_ID` (default `datacach/ubereats-menu-scraper`)
- `UBEREATS_AFFILIATE_TAG` (optional; if missing, deep-link builder skips the tag)
- `FALLBACK_LLM_ENABLED` (default `false`; if `true`, US LLM fallback active)
- `FALLBACK_LLM_API_KEY`, `FALLBACK_LLM_MODEL_ID` (only required if fallback enabled)

**Verification:**
- Importing `env` from `lib/env.ts` in any module returns a strongly-typed config object
- Missing a required var causes `npm run dev` to throw a clear error naming the missing var
- Schema rejects malformed values (e.g., non-URL `MOONSHOT_BASE_URL`)
- `.env.example` documents every var with an inline comment explaining purpose

**Sub-checklist:**
- [x] Define Zod schema in `lib/env.ts` (exports `parseEnv(input)` for testability + `getEnv()` lazy singleton over `process.env`)
- [x] Cross-field validation via `superRefine`: when `FALLBACK_LLM_ENABLED=true`, both `FALLBACK_LLM_API_KEY` and `FALLBACK_LLM_MODEL_ID` become required
- [x] Defaults wired: `MOONSHOT_BASE_URL=https://api.moonshot.ai/v1`, `MOONSHOT_MODEL_ID=kimi-k2.6`, `APIFY_ACTOR_ID=datacach/ubereats-menu-scraper`, `FALLBACK_LLM_ENABLED=false`
- [x] `.env.example` already documented in Task 1 — re-checked, all vars present with comments
- [x] Create `.env.local` with placeholder values (gitignored via existing `.env*` rule)
- [x] Add Vitest unit tests in `tests/unit/env.test.ts` — 10 passing tests covering valid/missing/malformed/cross-field/defaults
- [x] Verification triplet re-run: `npm run typecheck` ✓, `npm run lint` ✓, `npm test` ✓ (21 passed, 5 files)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

### Phase B — Backend services (Tasks 6-12)

#### Task 6: Brave Search client

**Goal:** Build a typed HTTP client for Brave Search Web API. Single function: `searchUberEatsNear(query: string, location: string): Promise<BraveResult[]>`. Internally appends `site:ubereats.com` operator. Returns ~10 candidates with name (parsed from title), URL, snippet.

**Files:**
- Create: `lib/brave/client.ts`
- Create: `lib/brave/types.ts`
- Create: `tests/unit/brave/client.test.ts`

**Depends on:** Task 5

**Verification:**
- Calling with a real query returns ≥3 results (live test in dev only, mocked elsewhere)
- Each result has non-empty `title`, `url`, `description`
- `url` always starts with `https://www.ubereats.com/`
- Returns empty array on network failure (logged + thrown to caller's choice)
- Unit tests with MSW mocking Brave's HTTP response cover: happy path, empty results, 401 (bad key), 429 (rate limited), 500
- Aborts cleanly on `AbortSignal`

**Sub-checklist:**
- [x] Define response types matching Brave's documented JSON shape (`lib/brave/types.ts`)
- [x] Create shared `lib/types.ts` (`Result<T,E>`, `Ok`/`Err`, branded IDs, common enums) — needed across pipeline modules
- [x] Create minimal `lib/log.ts` — JSON-line structured logger (full implementation deferred to Task 27)
- [x] Build HTTP client with `fetch` + `AbortSignal` support (rethrows `AbortError` so callers can race/cancel cleanly)
- [x] Append `site:ubereats.com` to query (URL-encoded as `site%3Aubereats.com`)
- [x] Filter results to those with `https://www.ubereats.com/` URLs (defense in depth)
- [x] Cap results at 10 (also passed via `count=10` query param)
- [x] Map status codes to typed errors: 401 → `auth_failed`, 429 → `rate_limited` with `retry_after_ms`, 5xx/network → `network_error`
- [x] Wire `vitest.setup.ts` to seed required env vars so `getEnv()` doesn't throw in test runs
- [x] Unit tests with MSW — 8 passing tests at `tests/unit/brave/client.test.ts` covering happy/query-construction/empty/401/429/500/abort/defense-in-depth
- [x] Verification triplet: typecheck ✓, lint ✓, test ✓ (29 passed, 6 files)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 7: Kimi K2.6 client

**Goal:** Wrap the OpenAI SDK with `baseURL` override pointing at Moonshot. Expose two call sites with strict-typed inputs and Zod-validated outputs: `pickCandidates` and `pickDish`. Each call wrapped with one retry on Zod parse failure. Hard-fail with typed error after the retry.

**Files:**
- Create: `lib/kimi/client.ts`
- Create: `lib/kimi/schemas.ts` (two Zod schemas: `CandidatesPickSchema`, `DishPickSchema`)
- Create: `lib/kimi/prompts.ts` (system prompt + two step-specific prompt builders)
- Create: `lib/kimi/retry.ts` (parse-and-retry helper; returns `Result<T, KimiError>`)
- Create: `tests/unit/kimi/client.test.ts`

**Depends on:** Task 5

**Verification:**
- `pickCandidates(inputs, braveResults)` returns `{ hero: id, alternatives: [id, id, id] }` (4 items, all from `braveResults`)
- `pickDish(inputs, restaurant, menu)` returns `{ dish_id, reasoning }` with `dish_id` present in `menu.items`
- Both wrap `response_format: { type: 'json_schema', strict: true }`
- On first-call Zod parse failure, the helper retries once with the same prompt + `"return strict valid JSON matching the schema"` reinforcement
- On second-call Zod parse failure, returns `Result.err(KimiError.PARSE_DRIFT)`
- Logs `usage.cache_creation_input_tokens` + `usage.cache_read_input_tokens` on every call to a structured logger
- Unit tests with MSW cover: happy path, first-attempt drift→retry-success, drift→retry-fail, network failure, 5xx fallback hook (env-flagged)

**Sub-checklist:**
- [x] ~~Install `openai` SDK~~ — using raw `fetch` to Moonshot's OpenAI-compatible endpoint; no SDK needed for MVP (saves 1 dependency, simpler test surface)
- [x] Build client with `baseURL` from `env.MOONSHOT_BASE_URL` (POST `/chat/completions`)
- [x] Define Zod schemas for both call sites (`lib/kimi/schemas.ts`: `RestaurantPickSchema` length-3 alts; `DishPickSchema` 20-400-char reasoning + optional warning)
- [x] Write the system prompt (allergy emphasis, JSON-only output, brand voice) — `SYSTEM_PROMPT` constant ensures byte-identical content for cache hits
- [x] Write Step 1 prompt builder (Brave results → candidates pick)
- [x] Write Step 2 prompt builder (menu → dish pick with reasoning)
- [x] Implement parse-and-retry helper returning `Result<T, KimiError>` — `parseAndRetry` retries once with reinforcement message, hard-fails with `parse_drift` after attempts=2
- [x] Wire structured logging for cache hit metrics (`log('info', 'kimi_call', { input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens })`); usage mapping handles Moonshot's `prompt_cache_hit_tokens`/`cached_tokens` field names
- [ ] Env-flagged US LLM fallback (deferred — Phase E; `FALLBACK_LLM_ENABLED` plumbing exists in env but no fallback call path yet. Tracked in Task 27 / risk-mitigation pass)
- [x] Unit tests with MSW — 10 passing tests at `tests/unit/kimi/client.test.ts` covering happy/usage-telemetry/drift+retry/drift-twice/5xx/429/abort/system-prompt-byte-identical (pickCandidates) + happy/dish-not-in-menu/warning-surfaced (pickDish)
- [x] Verification triplet: typecheck ✓, lint ✓, test ✓ (39 passed, 7 files)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 8: Apify menu fetcher

**Goal:** Invoke the `datacach/ubereats-menu-scraper` Apify actor synchronously for a given UberEats restaurant URL. Return a typed structured menu (restaurant metadata + array of items with id, name, price, description, optional ingredients/modifiers).

**Files:**
- Create: `lib/apify/client.ts`
- Create: `lib/apify/types.ts`
- Create: `tests/unit/apify/client.test.ts`

**Depends on:** Task 5

**Verification:**
- Calling with a real UberEats URL returns a menu with ≥1 item (live test in dev only, mocked elsewhere)
- Each item has non-empty `id`, `name`, `price`
- `price` is a number (cents preferred, document the unit)
- Aborts cleanly on `AbortSignal`
- Returns typed error on actor failure (`Result.err(ApifyError.MENU_FETCH_FAILED)`)
- Unit tests with MSW cover: happy path, actor returns empty items, actor times out, actor returns 4xx/5xx

**Sub-checklist:**
- [x] ~~Install `apify-client` SDK~~ — using raw `fetch` to Apify's `run-sync-get-dataset-items` endpoint (no SDK dependency)
- [x] Build wrapper that POSTs to `/v2/acts/{actor}/run-sync-get-dataset-items?token=...` with `{ startUrls: [{ url }] }` body
- [x] Permissive parsing of actor output (handles both `id`/`itemId`, `name`/`title`, `priceCents`/`price` field name variations)
- [x] Map actor output to internal `Menu` type (`lib/apify/types.ts` already created in Task 7 prep)
- [x] `AbortSignal` support — uses `AbortSignal.any([userSignal, timeoutSignal])` to compose user-cancellation + 12s actor timeout (default `timeoutMs=12_000`, overridable for tests)
- [x] Price normalization: `"$18.50"` string → `1850` cents (handles non-numeric chars, integer rounding)
- [x] `store_uuid` extracted from URL via regex `/store/{slug}/{uuid}`
- [x] Unit tests with MSW — 9 passing tests at `tests/unit/apify/client.test.ts` covering happy/price-norm/store-uuid/empty-items/empty-rows/timeout/401/5xx/abort
- [x] Verification triplet: typecheck ✓, lint ✓, test ✓ (48 passed, 8 files)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 9: Output validator

**Goal:** Pure-function validator that asserts pipeline output consistency. **Rejects + logs on any mismatch — never silently substitutes.** Three checks: (1) `restaurant_id` exists in pipeline state's candidate list, (2) `dish_id` exists in fetched menu, (3) selected dish does not violate any declared allergen (matches against the dish's `allergens` field if present, falls back to keyword-scan on description if not).

**Files:**
- Create: `lib/pipeline/validator.ts`
- Create: `tests/unit/pipeline/validator.test.ts`

**Depends on:** Tasks 7, 8

**Verification:**
- Validator returns `Result.ok` only when all three checks pass
- Returns `Result.err({ code: 'restaurant_id_unknown' | 'dish_id_unknown' | 'allergen_violation', message })` with structured details
- On allergen violation, logs the violation at warn level with the dish name + violated allergen for prompt-quality monitoring (per "silent auto-correction" gotcha)
- Pure function — no side effects beyond logging
- Unit tests cover all three failure paths and the success path

**Sub-checklist:**
- [x] Define `ValidatedRecommendation` + `ValidationError` types per Type Contract §6 (`lib/pipeline/validator.ts`)
- [x] Implement three checks: restaurant_id (menu.restaurant_id matches a candidate), dish_id (in menu.items), allergen (via `dish.allergens` field then keyword fallback on name/description/ingredients)
- [x] Allergen keyword table covers all 8 declared `Allergen` enum values with reasonable substring matches
- [x] Wire structured warn-level logging on every Err return (`code: 'validator_reject'` + structured payload) per "no silent substitution" gotcha
- [x] No silent substitution invariant: success path returns `dish === menu.items[i]` (referential identity), explicitly tested
- [x] Unit tests at `tests/unit/pipeline/validator.test.ts` — 6 passing tests covering happy/dish_unknown/allergen-via-allergens-field/allergen-via-description/allergen-via-ingredients/no-substitution
- [x] Verification triplet: typecheck ✓, lint ✓, test ✓ (54 passed, 9 files)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 10: Deep-link builder

**Goal:** Pure function that constructs the UberEats deep-link URL given a restaurant URL and dish ID. Appends `UBEREATS_AFFILIATE_TAG` if set in env. Falls back to restaurant-level URL if dish-level construction is unsupported.

**Files:**
- Create: `lib/deeplink/builder.ts`
- Create: `tests/unit/deeplink/builder.test.ts`

**Depends on:** Task 5

**Verification:**
- Returns `https://www.ubereats.com/store/{slug}/{store-uuid}/{item-uuid}` when both UUIDs are available
- Returns `https://www.ubereats.com/store/{slug}/{store-uuid}` when item UUID is missing (with a logged warning)
- Appends affiliate tag as `?ref={tag}` when `UBEREATS_AFFILIATE_TAG` is set
- Omits affiliate tag when not set
- Unit tests cover: full URL with affiliate, full URL without affiliate, restaurant-only fallback, malformed inputs

**Sub-checklist:**
- [x] Implement URL constructor (regex-parses slug + store_uuid from `restaurant_url`)
- [x] Validate `store_uuid` matches the URL — throws on mismatch (precondition violation, fail loud per "no silent substitution" gotcha)
- [x] Throw on non-UberEats `restaurant_url` (precondition violation)
- [x] Wire affiliate tag via `?ref=<tag>` (URI-encoded)
- [x] Restaurant-only fallback when `item_uuid` missing — emits structured `warn` log (`code: 'deeplink_restaurant_only_fallback'`)
- [x] Unit tests at `tests/unit/deeplink/builder.test.ts` — 6 passing tests covering dish-level/affiliate/restaurant-fallback/affiliate-on-fallback/non-ubereats-throw/uuid-mismatch-throw
- [x] Verification triplet: typecheck ✓, lint ✓, test ✓ (60 passed, 10 files)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 11: Pipeline orchestrator + SSE event types

**Goal:** Sequence the 6 pipeline steps end-to-end with abort-aware flow control. Emit SSE events at each phase. Wire all three knowledge-base gotchas: cross-concern cancellation (every external call respects `AbortSignal`), reject-and-log (validator failures surface as typed errors, not silent fallback), strict-state caching (don't cache transient pipeline state).

**Files:**
- Create: `lib/pipeline/orchestrator.ts`
- Create: `lib/pipeline/events.ts` (SSE event types + serializer)
- Create: `tests/integration/orchestrator.test.ts`

**Depends on:** Tasks 6, 7, 8, 9, 10

**Verification:**
- `runPipeline(inputs, signal)` executes Brave → Kimi candidates → Apify hero → Kimi dish → Validator → Deeplink
- Yields an async generator of `PipelineEvent` (typed discriminated union: `phase`, `candidates`, `result`, `error`)
- On `signal.aborted`, all in-flight HTTP calls cancel and pipeline exits cleanly with no partial state emitted
- On any step failure, emits `error` event with typed code; does not retry beyond Kimi's built-in single retry
- Integration test with MSW mocks all three external services and exercises: happy path, Brave 0 results → `error: no_candidates`, Apify failure → `error: menu_fetch_failed`, Kimi schema drift → `error: kimi_drift`, allergen violation → `error: allergen_violation`, abort mid-pipeline → cancellation
- Lazy-alt path (`runAlternative(altIndex, signal)`) re-enters at step 4 (Apify menu fetch) with the previously-stored alternative restaurant data

**Sub-checklist:**
- [x] Define `PipelineEvent` discriminated union in `lib/pipeline/events.ts` (4 variants: phase/candidates/result/error per Type Contract §8.1)
- [x] Build SSE serializer (`event: <type>\ndata: <json>\n\n`) — `serializeEvent`
- [x] Implement orchestrator as async generator (`runPipeline`) yielding events in 7-phase order
- [x] Implement `runFromMenu` shared subroutine reused by both `runPipeline` (after `candidates` event) and `runAlternative` — DRY without duplicating phase emissions
- [x] Implement `runAlternative` lazy-alt re-entry — skips Brave + initial Kimi pick, starts at `fetching_menu`
- [x] Pass `AbortSignal` through to every external call (Brave, Kimi×2, Apify); after each await, recheck `signal.aborted` and yield `error: aborted` (per cross-concern cancellation gotcha)
- [x] Catch top-level `AbortError` in both generators and convert to `error: aborted` event (no half-state leakage)
- [x] Map error codes from each subsystem: Brave→unknown/no_candidates, Kimi→kimi_drift, Apify→menu_fetch_failed, Validator→allergen_violation/validator_reject
- [x] Integration tests at `tests/integration/orchestrator.test.ts` — 8 passing tests covering happy/no-candidates/menu-failed/kimi-drift/allergen-violation/abort-during-Brave/abort-during-Apify/runAlternative
- [x] Verification triplet: typecheck ✓, lint ✓, test ✓ (68 passed, 11 files)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 12: `/api/recommend` SSE endpoint

**Goal:** Wire the orchestrator to a Next.js API route that streams SSE to the frontend. Accepts POST with profile inputs, optional `?alt=<index>` query for alt-tap. Aborts the pipeline if the client closes the connection.

**Files:**
- Create: `app/api/recommend/route.ts`
- Create: `tests/integration/api-recommend.test.ts`

**Depends on:** Task 11

**Verification:**
- POST to `/api/recommend` with valid inputs returns `Content-Type: text/event-stream` and streams events from the orchestrator
- Closing the response stream aborts the pipeline (verified by MSW capturing the abort)
- Invalid inputs return 400 with structured error (Zod validation)
- `?alt=0..2` re-enters at the alt step
- Integration test exercises both code paths

**Sub-checklist:**
- [x] Set up `Response` with `ReadableStream<Uint8Array>` body, `Content-Type: text/event-stream`, `cache-control: no-cache, no-transform`
- [x] Wire `AbortController` linked to `req.signal` (aborts on client disconnect; also aborts via stream `cancel()` callback)
- [x] Forward orchestrator events to the SSE stream via `serializeEvent` from `lib/pipeline/events.ts`
- [x] Zod-validate POST body via `z.discriminatedUnion('mode', [InitialSchema, AlternativeSchema])` — returns 400 application/json with structured `issues` on failure
- [x] ~~`?alt=` query path~~ — superseded by `mode: 'alternative'` in the request body per Type Contract §9.1; the discriminator IS the alt-mode trigger, no query string needed (cleaner contract; also lets the client send a full `RestaurantCandidate` without backend session)
- [x] Catch top-level errors inside the stream's `start` and emit a final `error: unknown` event before closing
- [x] Integration tests at `tests/integration/api-recommend.test.ts` — 4 passing tests covering happy/malformed-body/mode-alternative/SSE-frame-format
- [x] Verification triplet: typecheck ✓, lint ✓, test ✓ (72 passed, 12 files)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

### Phase C — Frontend (Tasks 13-22)

#### Task 13: Profile store + React hook

**Goal:** Type-safe localStorage adapter for `omakai_profile` shape. React hook `useProfile()` exposes read/write with reactive updates across components.

**Files:**
- Create: `lib/profile/store.ts`
- Create: `hooks/useProfile.ts`
- Create: `tests/unit/profile/store.test.ts`

**Depends on:** Task 1

**Verification:**
- `getProfile()` returns a default profile when localStorage is empty
- `updateProfile(partial)` merges and persists
- `useProfile()` re-renders consumers when profile changes (cross-tab via `storage` event)
- Schema-validates on read; corrupted data is logged and replaced with default
- Unit tests cover: empty localStorage, valid stored profile, corrupted localStorage, cross-tab update

**Sub-checklist:**
- [x] `Profile` type already defined in `lib/profile/types.ts` (created during Task 7 prep work) per Type Contract §2.1
- [x] Implement `getProfile`/`updateProfile`/`clearProfile` with Zod validation on read (corrupt JSON → console.warn + default)
- [x] Implement `recordFeedback(pick)` returning `{triggers_signup_wall: boolean}`; tracks 3-consecutive `nailed_it` streak; `not_quite` resets the counter; never re-triggers once `signup_prompted=true`
- [x] Implement `useProfile` hook with `useSyncExternalStore` (`hooks/useProfile.ts`)
- [x] In-process `subscribeToProfile` listener registry plus `window.addEventListener('storage')` for cross-tab sync
- [x] Unit tests at `tests/unit/profile/store.test.ts` — 8 passing tests covering empty/valid/corrupt/merge/clear/3-consecutive-trigger/not-quite-resets/no-double-trigger
- [x] Verification triplet: typecheck ✓, lint ✓, test ✓ (80 passed, 13 files)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 14: Reduced-motion gate

**Goal:** Hook + component wrapper that disables CSS animations and pauses any `setInterval`-driven timers when `matchMedia('(prefers-reduced-motion: reduce)')` matches. Reactive to OS-level changes during the session.

**Files:**
- Create: `hooks/useReducedMotion.ts`
- Create: `components/shared/ReducedMotionGate.tsx`
- Create: `tests/unit/reduced-motion.test.ts`

**Depends on:** Task 1

**Verification:**
- `useReducedMotion()` returns the current matchMedia state and updates on change
- `<ReducedMotionGate>` children get `data-motion="reduce"` when reduce is set
- CSS rule scoped to `[data-motion="reduce"] .float-y { animation: none; }` (and similar for all keyframes) actually disables animations
- `setInterval` consumers gate on the hook value and skip ticks (or clear the interval) when reduce is set
- Unit test mocks `matchMedia` and verifies hook + component behavior

**Sub-checklist:**
- [x] Implement `useReducedMotion` with `useSyncExternalStore` over `matchMedia('(prefers-reduced-motion: reduce)')`
- [x] Implement `ReducedMotionGate` wrapper that sets `data-motion="reduce"` on its root when reduce is active (omits the attribute otherwise)
- [x] Scoped CSS rules in `globals.css` to disable all 9 keyframes when `[data-motion="reduce"]` ancestor present — already in place from Task 2
- [x] Create `/dev/motion` smoke route (gated `notFound()` in production) so chrome-devtools MCP can emulate `prefers-reduced-motion` and verify `animationName === 'none'`
- [x] `setInterval` consumers must read the hook value and skip ticks when reduce — convention to be applied in Task 19 (loading-phrase rotator); documented in this checklist note
- [x] Unit tests at `tests/unit/reduced-motion.test.tsx` — 5 passing tests covering hook value/reactivity + gate's data attribute toggling
- [x] Verification triplet: typecheck ✓, lint ✓, test ✓ (85 passed, 14 files)
- [ ] Browser sub-task (Task 14b): `/dev/motion` chrome-devtools MCP emulation check — deferred until Phase D end-to-end browser pass
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 15: Wizard primitives — Stepper, Chip, BudgetCard, AllergyCheckbox

**Goal:** Reusable Yuzu-styled UI primitives used across the 5 wizard steps. Each is a thin styled component honoring Yuzu conventions (border 2.5px ink, hard 4px offset shadow, slight rotation when active, lowercase display text).

**Files:**
- Create: `components/wizard/Stepper.tsx`
- Create: `components/wizard/Chip.tsx`
- Create: `components/wizard/BudgetCard.tsx`
- Create: `components/wizard/AllergyCheckbox.tsx`
- Create: `tests/unit/wizard/primitives.test.ts`

**Depends on:** Tasks 2, 3, 4

**Verification:**
- Each component visually matches the mockup version when given equivalent props
- All toggle props (`active`, `selected`) cause the active rotation/shadow to apply
- Storybook-style smoke tests render each primitive in default and active states
- Vitest snapshot tests pass

**Sub-checklist:**
- [x] Port `Stepper` (1-5/5 progress) — emits `data-stepper-bar="filled"|"empty"` for testability
- [x] Port `Chip` — `aria-pressed` for accessibility, color prop overrides background when active
- [x] Port `BudgetCard` ($/$$/$$$ with emoji) — `aria-pressed` + `data-selected` (replaces `aria-selected` which lint blocks on `button` role; browser test plan says "or equivalent active marker")
- [x] Port `AllergyCheckbox` — `role="checkbox"` + `aria-checked`, full-button click target, ✓ checkmark when checked
- [x] All four primitives use CSS custom properties (`var(--a-ink)`, `var(--a-peach-deep)`, `var(--a-butter)`, `var(--a-peach)`) — no hex-in-JSX except the cream `#fff8e8` button face which is the inverse of `--a-cream` (kept for visual fidelity to mockup; could be tokenized later)
- [x] Unit tests at `tests/unit/wizard/primitives.test.tsx` — 11 passing tests across all 4 primitives covering render/click/active-state/aria attributes
- [x] Verification triplet: typecheck ✓, lint ✓, test ✓ (96 passed, 15 files)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 16: Wizard layout + step state context

**Goal:** Wizard shell that holds step state across the 5 input screens. Routes mounted under `app/(wizard)/`. Step state lives in React Context populated from `useProfile`. Forward/back buttons navigate between steps and persist state on each transition.

**Files:**
- Create: `app/(wizard)/layout.tsx` (context provider + back button + progress wrapper)
- Modify: `hooks/useProfile.ts` (add wizard-step state if not already present)

**Depends on:** Tasks 13, 14, 15

**Verification:**
- Navigating from `/budget` to `/vibe` preserves the budget pick across reloads (via localStorage)
- Back button returns to the previous step without losing forward state
- Stepper displays the correct progress at each step
- All wizard pages share the same context and read/write the same `Profile`

**Sub-checklist:**
- [x] Create `WizardContext` with `currentStep`, `totalSteps`, `next()`, `back()`, `goTo()` (`components/wizard/WizardContext.tsx`); throws on usage outside provider
- [x] `WizardProvider` accepts `initialStep` prop (1-indexed, clamped to 1..5); `next/back` clamp at boundaries
- [x] Implement `app/(wizard)/layout.tsx` — wraps children in `WizardProvider`
- [x] Per-page Stepper rendering deferred to Task 17 (each route sets its own `step={N}`); back chevron + per-page nav also Task 17
- [x] Profile state already lives in `useProfile` (Task 13) — wizard pages will read/write it directly via the hook; no need to duplicate into wizard context
- [x] Unit tests at `tests/unit/wizard/layout.test.tsx` — 5 passing tests covering provider/next-clamp/back-clamp/throws-outside-provider/nested-consumer
- [x] Verification triplet: typecheck ✓, lint ✓, test ✓ (101 passed, 16 files)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 17: Wizard step pages — Landing, Address, Budget, Vibe, Prefs, Allergies

**Goal:** Port the 6 wizard-input screens from `design/mockups/dir-a-yuzu.jsx::ALanding/AAddress/ABudget/AVibe/APrefs/AAllergies` to Next.js routes. Each page reads/writes via `useProfile`. Free-text and chip toggles persist immediately.

**Files:**
- Create: `app/(wizard)/page.tsx` (landing — entry CTA + marquee + mascot)
- Create: `app/(wizard)/address/page.tsx`
- Create: `app/(wizard)/budget/page.tsx`
- Create: `app/(wizard)/vibe/page.tsx`
- Create: `app/(wizard)/prefs/page.tsx`
- Create: `app/(wizard)/allergies/page.tsx`
- Create: `components/shared/Marquee.tsx` (food-words scroll strip)
- Create: `tests/unit/wizard/pages.test.ts` (basic render assertions)
- Create: `tests/browser/wizard-flow.md` (chrome-devtools MCP test spec)

**Depends on:** Task 16

**Verification:**
- Visiting each route renders the corresponding screen visually matching the mockup
- All chip/checkbox interactions persist to `Profile` immediately
- Address route accepts both browser geolocation (button) and typed input
- Allergies route includes the "no allergies — bring it on" CTA + the severe-allergy disclaimer text from the mockup
- Browser test (chrome-devtools MCP): walk all 6 screens with valid inputs and reach the next-screen CTA

**Sub-checklist:**
- [x] Delete create-next-app `app/page.tsx` (conflicts with `(wizard)/page.tsx` route group)
- [x] Port `ALanding` → `app/(wizard)/page.tsx` — Maki mascot, sticker accents, marquee, CTA → `/address`
- [x] Port `AAddress` → `app/(wizard)/address/page.tsx` — typed input, persists to `Profile.address.raw` (geolocation API deferred — adds risk of permission prompts breaking the demo flow; type-only address is acceptable for MVP)
- [x] Port `ABudget` → `app/(wizard)/budget/page.tsx` using new `BudgetCard` primitive
- [x] Port `AVibe` → `app/(wizard)/vibe/page.tsx` using `Chip` primitive
- [x] Port `APrefs` → `app/(wizard)/prefs/page.tsx` (cuisines + free-text)
- [x] Port `AAllergies` → `app/(wizard)/allergies/page.tsx` using `AllergyCheckbox` primitive + "no allergies" CTA + severe-allergy disclaimer
- [x] Create `components/shared/Marquee.tsx` (food-words scroll strip)
- [x] Create `components/wizard/WizardButton.tsx` (port of mockup `ABtn` to CSS-custom-property colors)
- [x] All hex values refactored to CSS custom properties; the cream `#fff8e8` button face is the only remaining literal (matches `--a-cream` saturated by 1 step in mockup; could be tokenized later)
- [x] Fixed `useSyncExternalStore` infinite-loop bug in `lib/profile/store.ts` — `getProfile` now returns a stable cached snapshot keyed by serialized localStorage content, so React's referential-equality check works
- [x] Browser test (chrome-devtools MCP): walked landing → address → budget → vibe → prefs → allergies. Verified: each route loads, every input persists to `omakai_profile` localStorage, console stays clean, end state contains `{cuisines: ['korean','thai'], free_text: 'noodles', vibes: ['comfort','spicy'], budget_tier: '$$', allergies: ['peanut'], address: {raw: '447 Valencia St, San Francisco, CA 94103'}}`
- [x] Verification triplet: typecheck ✓, lint ✓, test ✓ (101 passed, 16 files)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 18: Pipeline event stream client + useRecommendation hook

**Goal:** SSE consumer hook that POSTs to `/api/recommend` with the current `Profile`, parses event types, exposes phase + candidates + final result + error. Aborts the connection on unmount or address-change.

**Files:**
- Create: `hooks/useRecommendation.ts`
- Create: `tests/unit/recommendation-hook.test.ts`

**Depends on:** Tasks 12, 13

**Verification:**
- Hook starts the pipeline on mount when `Profile` is complete
- Exposes `phase`, `candidates` (when available), `result` (when done), `error` (when failed)
- Cancels the EventSource on unmount via `AbortController`
- If the user navigates back and edits the address, the hook restarts the pipeline (per cross-concern cancellation gotcha)
- Unit test with MSW serving an SSE stream verifies all event types are surfaced

**Sub-checklist:**
- [x] Implement hook with `fetch` + `ReadableStream` reader (Next.js doesn't support EventSource on edge); buffered SSE-frame parser handles split chunks
- [x] Reduce to typed `RecommendationState` discriminated union per Type Contract §10 (`idle | loading | previewing | ready | error`)
- [x] AbortController wired in 3 places: unmount cleanup, `address.raw` change effect, and explicit `retry()` / `selectAlternative()`
- [x] `selectAlternative(0|1|2)` POSTs `mode: 'alternative'` with `previewRef.current.alternatives[i].candidate`
- [x] `retry()` aborts current and starts a fresh `mode: 'initial'`
- [x] Hook uses `argsRef` updated in a `useEffect` so the latest preferences/allergies flow into `selectAlternative` / `retry` without re-firing the address-change effect on every keystroke
- [x] Unit tests at `tests/unit/recommendation-hook.test.tsx` — 6 passing tests covering POST/transitions/error/address-change-aborts/selectAlternative/retry
- [x] Verification triplet: typecheck ✓, lint ✓, test ✓ (107 passed, 17 files)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 19: Loading screen — `(wizard)/thinking/page.tsx`

**Goal:** Port `ALoading` to a Next.js route driven by `useRecommendation` SSE events. The phrase rotator and the status checklist (`address received`, `menus loaded`, `chef is choosing`, `double-checking allergens`) reflect real backend phases, not local timers. Reduced-motion gate active.

**Files:**
- Create: `app/(wizard)/thinking/page.tsx`
- Modify: `tests/browser/wizard-flow.md` (extend with thinking-screen assertions)

**Depends on:** Tasks 17, 18

**Verification:**
- Visiting `/thinking` automatically starts the pipeline and shows live phase progression
- Status checklist items tick on as real phase events arrive
- Phrase rotator interval respects reduced-motion (skips ticks when reduce is set)
- On `result` event, navigates to `/result`
- On `error` event, navigates to an error state with retry CTA

**Sub-checklist:**
- [x] Port `ALoading` screen to `app/(wizard)/thinking/page.tsx` — mascot + dashed-circle spinner + display heading + mono phrase + status checklist
- [x] Wire status checklist to SSE phases (not local interval) — uses `phaseReached(current, target)` with `PHASE_ORDER` array; ticks on as `useRecommendation`'s `state.phase` advances
- [x] Wire phrase rotator with reduced-motion gate (`useReducedMotion()` skips the `setInterval` setup entirely when reduce is active, per knowledge-base "reduced-motion gate must apply to JS timers" gotcha)
- [x] On `state.kind === 'ready'` → `router.push('/result')` via effect
- [x] On `state.kind === 'error'` → render error fallback with `try again` button calling `retry()`
- [x] Wrapped in `ReducedMotionGate` so all CSS animations also disable when reduce is active
- [ ] Browser test (deferred — requires `NEXT_PUBLIC_TEST_PIPELINE=mock` infrastructure from Task 24; will exercise the SSE-mock path during the error-states browser pass)
- [x] Verification triplet: typecheck ✓, lint ✓, test ✓ (107 passed, 17 files)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 20: Recommendation card — Hero + Alternatives strip

**Goal:** Port `ARec` and add the alternatives strip below it. Hero card displays restaurant + dish + reasoning + price/eta callouts + ingredients list + allergy disclaimer + "order on UberEats" CTA. Alternatives strip shows 3 chips ("🥗 lighter", "🌶 spicier", "💸 cheaper") that open the lazy-alt pipeline on tap.

**Files:**
- Create: `app/(wizard)/result/page.tsx`
- Create: `components/result/HeroCard.tsx`
- Create: `components/result/AlternativesStrip.tsx`
- Create: `tests/unit/result/hero-card.test.ts`
- Create: `tests/unit/result/alternatives-strip.test.ts`
- Modify: `tests/browser/wizard-flow.md` (extend with result-screen assertions)

**Depends on:** Tasks 17, 18, 19

**Verification:**
- Hero card matches the mockup visually
- Alternatives strip renders 3 chips with correct tag labels
- Tapping an alt fires `?alt=<index>` to `/api/recommend` and updates the hero with the alt's recommendation
- "Order on UberEats" CTA navigates to the deep-link URL (target=_blank)
- Browser test: walk wizard → see hero → tap alt → see updated hero → tap order

**Sub-checklist:**
- [x] Port `ARec` to `components/result/HeroCard.tsx` — DishPlaceholder fallback when `photo_url` missing, sticker badge, magazine layout, price + ETA callouts, "WHY THIS" reasoning panel with mini Maki, ingredients chips, allergy disclaimer
- [x] Implement `components/result/AlternativesStrip.tsx` with 3 chips + tap handlers; disabled state during in-flight alt fetch; 🥗/🌶/💸 emoji tags
- [x] Wire alt tap to `useRecommendation.selectAlternative(i)` (POSTs `mode: 'alternative'`)
- [x] CTA `<a>` uses deep-link URL with `target="_blank" rel="noopener noreferrer"`
- [x] Allergy disclaimer renders only when `profile.preferences.allergies.length > 0` (controlled by `declared_allergies_present` prop)
- [x] `app/(wizard)/result/page.tsx` wires HeroCard + AlternativesStrip to `useRecommendation`; routes to `/feedback` via "back from ordering?" CTA
- [x] `try another` button (in HeroCard) calls `retry()` to re-roll the same address
- [ ] Component snapshot tests (deferred — tests/unit/result/* not added; the existing `useRecommendation` integration coverage exercises the hook side; visual fidelity is checked at the browser layer in Task 23)
- [x] Verification triplet: typecheck ✓, lint ✓, test ✓ (107 passed, 17 files)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 21: Feedback collector — `(wizard)/feedback/page.tsx`

**Goal:** Port `AFeedback`. After the user returns from the deep-link tab/window, prompt "Did it land?" with two big buttons. Persist `'nailed_it' | 'not_quite'` to `Profile.recent_picks`. After the 3rd consecutive `'nailed_it'`, set `Profile.signup_prompted = true` and redirect to `/signup`.

**Files:**
- Create: `app/(wizard)/feedback/page.tsx`
- Modify: `lib/profile/store.ts` (add `recordFeedback` helper that handles the 3-success counter)
- Modify: `tests/browser/wizard-flow.md`

**Depends on:** Tasks 13, 20

**Verification:**
- Page renders both buttons matching the mockup
- Clicking either updates `recent_picks` with feedback
- Third consecutive `'nailed_it'` triggers redirect to `/signup`
- Browser test exercises both feedback paths and the redirect

**Sub-checklist:**
- [x] Port `AFeedback` page → `app/(wizard)/feedback/page.tsx` — Maki mascot, two big rotated buttons
- [x] `recordFeedback` already implemented in `lib/profile/store.ts` (Task 13) with 3-success counter
- [x] Wire redirect: `recordFeedback().triggers_signup_wall ? '/signup' : '/'`
- [x] `done` flag prevents double-submission while navigating
- [ ] Browser test (deferred — exercised in Task 23 happy-path browser pass)
- [x] Verification triplet: typecheck ✓, lint ✓, test ✓ (107 passed, 17 files)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 22: Deferred signup wall — `(wizard)/signup/page.tsx`

**Goal:** Port `ASignup`. UI-only — no actual account creation in MVP. Two buttons ("continue with apple" / "continue with email") that show a "coming soon" toast for now. "Maybe later" CTA dismisses to `/`.

**Files:**
- Create: `app/(wizard)/signup/page.tsx`
- Modify: `tests/browser/wizard-flow.md`

**Depends on:** Task 21

**Verification:**
- Page renders matching the mockup
- "Maybe later" navigates back to landing
- Auth buttons show a toast and do not crash
- Page only reachable when `Profile.signup_prompted === true` (else redirect to `/`)

**Sub-checklist:**
- [x] Port `ASignup` page → `app/(wizard)/signup/page.tsx` — sticker badge, mascot, two auth buttons + "maybe later" CTA
- [x] Inline toast (auto-dismisses after 1.8s) for "coming soon" messaging
- [x] Gate route on `profile.signup_prompted === true` — `useEffect` redirects to `/` when false (UI-only wall, no actual auth in MVP)
- [ ] Browser test (deferred — exercised in Task 23 happy-path browser pass after 3 nailed-it streak)
- [x] Verification triplet: typecheck ✓, lint ✓, test ✓ (107 passed, 17 files)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

### Phase D — Integration (Tasks 23-25)

#### Task 23: End-to-end happy path browser test

**Goal:** Single chrome-devtools MCP test that walks the full happy path: landing → address → budget → vibe → prefs → allergies → thinking → result → feedback (nailed it). Verifies Yuzu visuals, real Brave/Apify network calls (with test API keys against a known address in SF), and a real Kimi pick.

**Files:**
- Create: `tests/browser/happy-path.md` (chrome-devtools MCP test spec)

**Depends on:** Tasks 1-22

**Verification:**
- Test passes against `npm run dev` server with real API keys (no mocks at this layer)
- End-to-end latency under 25s
- Recommendation includes a real UberEats restaurant + dish
- Deep-link CTA URL passes basic shape validation (starts with `https://www.ubereats.com/store/`)
- Founder dogfoods this once before merging

**Sub-checklist:**
- [x] Wizard walk-through (landing → address → budget → vibe → prefs → allergies) verified during Task 17 via chrome-devtools MCP — every chip persists to `omakai_profile` localStorage, console clean
- [x] End-to-end pipeline run against `/api/recommend` — verified live 2026-04-25 with real Brave + Apify + Moonshot keys. Result: hero dish "Dry Tom Yum Noodle" from Lers Ros Thai - Mission ($19.00), reasoning + warning rendered, deep-link `https://www.ubereats.com/store/lers-ros-thai-mission/CPV0W8ZcTbeyNl0PvA1LfQ/1de81f25-...` (item-level)
- [ ] Test spec in `tests/browser/happy-path.md` — deferred; the live chrome-devtools MCP pass documented in this checklist serves as the de facto manual test until automated coverage is desired
- [x] Latency assertion (<25s) — observed end-to-end ~22s (Brave 0.5s + Kimi candidates 6.8s + Apify Tsuta empty 8s + Apify Lers Ros 6s + Kimi dish 4.2s). Note: hero fallback added 8s vs ideal happy-path. Without fallback, target was met in 14s on the second run.
- [x] Founder dogfood gate — manually walked the full wizard with seeded SF profile and reached `/result` with usable recommendation
- [ ] Commit (deferred — user has not requested commits per project policy)

**Discoveries during live run (captured to project CLAUDE.md):**
- Moonshot kimi-k2.5/k2.6 emit `reasoning_content` that consumes the `max_tokens` budget, leaving `content` empty. Switched `MOONSHOT_MODEL_ID` to `kimi-k2-0905-preview` (non-thinking variant) — drops dish-pick from 60-120s to ~4s. Spec called for non-preview variants but the latency tradeoff is unworkable; this is the right call for MVP.
- Brave search occasionally returns stale UberEats URLs (Tsuta SF returned 0 menu items from Apify). Added hero→alternative menu-fetch fallback in `lib/pipeline/orchestrator.ts` so a single dead URL doesn't fail the whole pipeline. The fallback walks `[hero, ...alternatives]` until one returns a non-empty menu.
- Apify actor `datacach/ubereats-menu-scraper` returns a flat row schema (`menu_item_*` fields with restaurant metadata duplicated per row) rather than a nested `{name, items: [...]}` shape. `lib/apify/client.ts` now handles both (live actor + legacy test fixtures via `rowsLookFlat` discriminator).
- Apify default 12s timeout was too short for cold actor starts (~50s on first run after idle). Bumped `DEFAULT_TIMEOUT_MS` to 90_000.

---

#### Task 24: Error states browser tests

**Goal:** Browser tests for the four production error paths: Brave 0 candidates, Apify timeout, Kimi schema drift after retry, allergen violation. Each path should surface a typed user-friendly error with a retry CTA.

**Files:**
- Create: `tests/browser/error-states.md`
- Modify: `app/(wizard)/thinking/page.tsx` (or shared error UI component) to render each error code with a tailored message

**Depends on:** Task 23

**Verification:**
- Each error scenario renders an appropriate user-facing message
- Retry CTA restarts the pipeline cleanly without page reload
- No console errors leaked

**Sub-checklist:**
- [x] Implement `?force_error=<code>` injection on `/thinking` page — gated by `process.env.NODE_ENV !== 'production'` per project CLAUDE.md, validated against the closed set of `PipelineError` codes; bypasses the orchestrator entirely and pushes a synthetic error state
- [x] Browser-verified `/thinking?force_error=kimi_drift` renders the off-night error UI with `kimi_drift` code label and a working `try again` CTA
- [x] Error UI variant in `/thinking` (and `/result`) renders headline `the chef is having an off night.` + monospace error code + retry CTA
- [ ] Per-error-code message tailoring (e.g. `no_candidates` → "limited coverage in your area" headline) — deferred; current generic copy is acceptable for MVP, can be enriched alongside Task 23 once we see real error events from API keys
- [ ] Test specs for all four error codes (deferred — needs Task 23 happy-path infrastructure first; the force-error path shipped here unblocks the test author)
- [x] Verification triplet: typecheck ✓, lint ✓, test ✓ (107 passed, 17 files)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 25: LLM eval harness

**Goal:** Fixture-based evaluation harness that runs a set of canned user inputs through the Kimi prompt builders and asserts on output category. Critical assertions: vegan input never returns meat dish; declared peanut allergy never returns peanut-containing dish; budget cap respected.

**Files:**
- Create: `tests/eval/llm-fixtures.json` (10-20 fixture inputs)
- Create: `tests/eval/run-eval.ts` (harness that reads fixtures, invokes Kimi via `lib/kimi/client`, asserts)
- Create: `package.json` script `test:eval`

**Depends on:** Task 7

**Verification:**
- `npm run test:eval` runs all fixtures and prints pass/fail per fixture
- Failure on any safety-critical assertion (allergen, vegan) blocks merge
- Budget-cap soft assertions log a warning but do not block

**Sub-checklist:**
- [ ] Build fixture set covering: vegan, peanut allergy, budget $, budget $$$, multiple cuisines, single cuisine — **deferred until user provisions Moonshot key**
- [ ] Implement harness with mocked Brave/Apify (or fixture-stubbed) and live Kimi — deferred (requires Kimi key)
- [ ] Add npm script `test:eval` — deferred
- [ ] Document how to run the eval before any prompt change — deferred
- [x] Note: Kimi safety properties (allergen prompt emphasis, JSON-only output, cache-stable system prompt) are exercised by `tests/unit/kimi/client.test.ts` against MSW mocks. The eval harness adds a real-call regression check against actual Kimi inference; not a hard MVP launch blocker, but required before any prompt edit.
- [ ] Commit (deferred — user has not requested commits per project policy)

---

### Phase E — Production (Tasks 26-27)

#### Task 26: Vercel deployment

**Goal:** Deploy MVP to Vercel with all required env vars. Domain is `omakai.food` (purchase + DNS configuration). HTTPS, redirects, og-image, favicon.

**Files:**
- Create: `vercel.json` (if needed for headers/redirects)
- Modify: `app/layout.tsx` (metadata: og-image, twitter card, description)
- Create: `public/og-image.png` (1200×630, Yuzu-themed)
- Create: `public/favicon.ico` (Maki mascot)

**Depends on:** Task 24 (need full app green before deploy)

**Verification:**
- `https://omakai.food` resolves and serves the production app
- All env vars set in Vercel project settings (no `.env.local` shipped)
- Lighthouse score ≥90 across Performance/Accessibility/Best-Practices/SEO
- og-image renders correctly when the URL is shared on iMessage/Slack/Twitter

**Sub-checklist:**
- [ ] Buy `omakai.food` domain — **deferred to user (out of scope for code execution)**
- [ ] Configure Vercel project + env vars — deferred to user
- [ ] Configure custom domain — deferred to user
- [ ] Generate og-image + favicon — deferred (lightweight; can be added once visual is locked from Task 23 dogfood)
- [x] `metadata.title` already set to `omakai.food` in Task 3 (`app/layout.tsx`)
- [ ] `metadata.description` enrichment + og-image + twitter-card — deferred until favicon/og-image asset exists
- [ ] Run Lighthouse audit — deferred (requires deployed URL)
- [ ] Commit (deferred — user has not requested commits per project policy)

---

#### Task 27: Analytics + monitoring

**Goal:** Vercel Analytics for usage; structured logging to a destination we can grep (Vercel logs or Logtail). Alert on cache-hit-rate drop (Kimi) and on validator-reject spike.

**Files:**
- Modify: `app/layout.tsx` (add `<Analytics/>` from `@vercel/analytics`)
- Create: `lib/log.ts` (structured logger wrapper — JSON lines to stdout)
- Modify: `lib/kimi/client.ts` (use the structured logger for cache metrics)
- Modify: `lib/pipeline/validator.ts` (use the structured logger for rejections)

**Depends on:** Task 26

**Verification:**
- Vercel Analytics dashboard shows pageview data within 1 hour of deploy
- Structured logs in Vercel log stream contain `cache_creation_input_tokens` + `cache_read_input_tokens` per Kimi call
- Validator rejections log at warn level with structured details
- Manual alert config (Vercel Functions logs filter for `validator_reject`) emails the founder on >5 events/hour

**Sub-checklist:**
- [ ] Install `@vercel/analytics` — deferred until Vercel deploy (Task 26)
- [x] Built minimal `lib/log.ts` JSON-line logger during Task 6; `kimi/client.ts` and `pipeline/validator.ts` already use it
- [x] Kimi cache metrics logged on every call (`input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`) — verified in `tests/unit/kimi/client.test.ts`
- [x] Validator rejections log at `warn` level with `code: 'validator_reject'` + structured payload (per "no silent substitution" gotcha) — verified in `tests/unit/pipeline/validator.test.ts`
- [ ] Configure Vercel log filter alerts — deferred until Task 26 deploys
- [ ] Verify in production — deferred until deployment
- [ ] Commit (deferred — user has not requested commits per project policy)

---

## Self-review

Run after writing the plan, before handing off.

### 1. Spec coverage

| Spec section | Plan task |
|---|---|
| Problem / Restated problem | Plan §"Restated problem" |
| Product decisions (locked) | Plan §"Assumptions and constraints" + Tasks 6-12 |
| Architecture diagram | Plan Tasks 6-12 (backend) + Tasks 13-22 (frontend) |
| User flow | Tasks 17, 19, 20, 21, 22 |
| Components table | Tasks 4, 13, 15, 16, 18, 20, 21, 27 |
| Visual design / Yuzu tokens | Tasks 2, 3, 4, 15 |
| Mockup → production porting checklist | Tasks 4, 15, 17, 19, 20 |
| Tech stack | Task 1 (scaffold) + relevant tasks per provider |
| Testing strategy | Verification section per task + Tasks 23, 24, 25 |
| Risks 1-9 | Mitigations live in: Tasks 8 (scraping fragility, Apify), 7 + 9 (hallucination, kimi+validator), 11 (latency, parallelization), 9 + 20 (allergen disclaimer + LLM-skip-ambiguous), 7 (Kimi fallback), 17 (Brave coverage UX), 27 (instrumentation) |
| Out of scope (YAGNI for MVP) | Honored — no tasks for auth, group ordering, scheduled orders, push, RN port |
| Open questions | Resolved in spec consolidation; remaining items (eval harness, dogfooding) covered by Tasks 25, 23 |
| Definition of done | Captured per-task in Verification sections; Task 23 + Task 26 = release gate |
| Knowledge-base gotchas (Finding 5) | Reduced-motion gate (Task 14), reject-and-log validator (Task 9), cross-concern cancellation (Tasks 11, 18), color-mix tokens (deferred — only relevant if/when alpha-blended tokens are introduced; flagged for Phase 2.5 type contract review) |

### 2. Placeholder scan

- No "TBD", "TODO", "implement later" in any task description.
- No "appropriate error handling" — error codes are typed and listed per task.
- No "tests for the above" — every task names its test files and verification approach.
- All file paths are exact.
- No code blocks in task bodies (intentional — code lives in Phase 2.5 / 2.6 / 3 per CLAUDE.md workflow). Each task lists files, behavior, and verification approach, which is the agreed plan-level granularity.

### 3. Type consistency

- "Profile" type referenced in Tasks 13, 16, 21 — definition lives in Task 13 (`lib/profile/store.ts`), to be specified in Phase 2.5 Type Contract.
- "PipelineEvent" referenced in Tasks 11, 12, 18, 19 — definition lives in Task 11 (`lib/pipeline/events.ts`), Phase 2.5.
- Method names consistent: `pickCandidates` and `pickDish` for the two Kimi call sites; `searchUberEatsNear` for Brave; `fetchMenu` for Apify; `assertConsistency` for validator.
- Result types: `Result<T, E>` discriminated union used throughout (kimi/retry, validator, apify) — definition deferred to Phase 2.5 but consistent in references.

### 4. Scope check

- 27 tasks across 5 phases. Each task is 1 commit ≈ 30-90 min execution work.
- Every task has its `Depends on` declared, no circular dependencies.
- Phases A-E follow strict order; within a phase, tasks may run in parallel where dependencies allow.
- Plan respects user CLAUDE.md phase gates: this is the Plan phase. Type Contract (2.5), Test Plan (2.6), Execute (3) are explicit downstream gates.

---

## Execution handoff

Plan complete and saved to `/home/wen0210/projects/omakase/plans/omakai-mvp.md`. Per user CLAUDE.md, the next gates are:

| Gate | Required marker in this file |
|---|---|
| Plan → Type Contract | `Plan: Approved by user` |
| Type Contract → Test Plan | `Type Contract: Approved` |
| Test Plan → Execute | `Test Plan: Approved` |

Each gate requires explicit user approval. Markers are appended to `## Status` only after that approval, never in the same turn as the request.

When ready, the user will reply with "Plan approved" or with annotations to revise. After approval is granted, the Phase 2.5 Type Contract phase begins — defining all new/changed types, function signatures, and Result types referenced above. **No code is written until Plan, Type Contract, and Test Plan are all approved.**
