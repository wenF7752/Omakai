# omakai.food MVP Test Plan

## Status

Test Plan: Approved (2026-04-24)

## Scope

For each of the 27 plan tasks in `plans/omakai-mvp.md`, this document defines the **red-half** test that proves the task done. Per CLAUDE.md Phase 2.6:

- **Browser-testable tasks** (UI behavior, interactive flow, rendered output, network call, console state) → chrome-devtools MCP test spec with URL path, interaction steps, observable assertions.
- **Non-browser-testable tasks** (pure logic, type-only, backend-with-no-UI-trigger) → Vitest test description OR exact typecheck/test command + the failure message that must disappear.

**Dev server URL:** `http://localhost:3000` (provided by user 2026-04-24, currently running)

**Execution prerequisite:** chrome-devtools MCP must be exposed in the executing Claude Code session for browser-test execution. If not exposed, the human user runs each spec manually against the dev server. This Test Plan is execution-tool-agnostic — the specs describe what to verify, not which tool runs them.

---

## Phase A — Foundation

### Task 1: Initialize Next.js project + tooling — DONE

**Test type:** CLI verification triplet (already executed 2026-04-24)

**Spec:**

```bash
npm run typecheck    # expect: clean exit, no output
npm run lint         # expect: clean exit, no output
npm test             # expect: "No test files found, exiting with code 0"
npm run dev          # expect: "Ready in <ms> ms" + "Local: http://localhost:3000"
curl -I http://localhost:3000/  # expect: HTTP/1.1 200 OK
```

**Observed result:** all four passed; dev server ready in 405ms. Task complete.

---

### Task 2: Yuzu design tokens + globals.css

**Test type:** Browser (verifies CSS custom properties resolve to expected colors)

**Spec:** browser test against a temporary scratch route `/dev/tokens` (created in this task, deleted before Phase 3 final verification).

- **Setup:** scratch page renders 8 `<div data-testid="token-{name}">` elements, each using one of the Yuzu palette tokens via Tailwind utility (`bg-cream`, `bg-peach`, `bg-peach-deep`, `bg-butter`, `bg-sage`, `bg-sage-deep`, `bg-ink`, `bg-mist`).
- **URL:** `http://localhost:3000/dev/tokens`
- **Interactions:** none (pure render check)
- **Observable assertions:**
  - `getComputedStyle(div[data-testid="token-cream"]).backgroundColor` resolves to `rgb(253, 246, 232)` (= `#fdf6e8`)
  - Same check for all 8 tokens against their hex equivalents
  - `getComputedStyle(div[data-testid="motion-test"]).animationName` is `"float-y"` when `.float-y` class is applied
- **Console:** no errors, no warnings

**Spec for animations (same scratch route):**
- 4 animated divs render (`.wobble`, `.float-y`, `.spin-slow`, `.pop-in`)
- Each has a non-empty `animationName` in computed style

---

### Task 3: Self-hosted fonts via next/font/google

**Test type:** Browser (verifies fonts load from same-origin)

**Spec:**

- **URL:** `http://localhost:3000/`
- **Interactions:** none
- **Observable assertions:**
  - Network panel: at least one font request to a Vercel-hosted (`/_next/static/media/...`) URL
  - Network panel: zero requests to `fonts.googleapis.com` or `fonts.gstatic.com`
  - On the page, an element with class `display` has `getComputedStyle(...).fontFamily` containing `"Fraunces"`
  - An element with class `mono` has `fontFamily` containing `"DM Mono"`
  - Body default has `fontFamily` containing `"Zen Kaku Gothic New"`

---

### Task 4: Mascot SVG components ported

**Test type:** Vitest unit (snapshot + behavior)

**Spec — `tests/unit/mascots/MaskotMaki.test.tsx`:**

```
- renders default props → snapshot matches
- renders mood='thinking' → snapshot differs from default (eyes are circles, not curves)
- accepts size prop → root <svg> has width and height attributes equal to prop
- accepts style prop → root <svg> has matching inline style
```

**Spec — `tests/unit/mascots/StickerBadge.test.tsx`:**

```
- renders with required text prop → snapshot matches
- text appears inside <textPath> element
- color and textColor props override defaults → root <circle> fill matches color prop
```

**Spec — `tests/unit/mascots/Chopsticks.test.tsx` and `DishPlaceholder.test.tsx`:**

```
- snapshot tests for default + 1 prop variant each
```

**Failure message that must disappear:** "Cannot find module '@/components/mascots/MaskotMaki'"

---

### Task 5: Env-var validation + secrets

**Test type:** Vitest unit

**Spec — `tests/unit/env.test.ts`:**

```
- valid env (all required vars set) → returns typed config object with parsed values
- missing MOONSHOT_API_KEY → throws ZodError with message containing "MOONSHOT_API_KEY"
- malformed MOONSHOT_BASE_URL (non-URL) → throws ZodError with message containing "MOONSHOT_BASE_URL"
- FALLBACK_LLM_ENABLED=true but FALLBACK_LLM_API_KEY missing → throws with message containing "FALLBACK_LLM_API_KEY required when FALLBACK_LLM_ENABLED=true"
- FALLBACK_LLM_ENABLED=false → FALLBACK_LLM_API_KEY can be empty, no throw
- defaults: MOONSHOT_BASE_URL defaults to "https://api.moonshot.ai/v1" when unset
- defaults: MOONSHOT_MODEL_ID defaults to "kimi-k2.6" when unset
```

**Failure message that must disappear:** "TypeError: Cannot read properties of undefined (reading 'MOONSHOT_API_KEY')" from any module that imports `lib/env.ts` without the var set.

---

## Phase B — Backend services

### Task 6: Brave Search client

**Test type:** Vitest unit + MSW

**Spec — `tests/unit/brave/client.test.ts`:**

```
- happy path: MSW serves a fixture Brave response → searchUberEatsNear returns Result.ok with parsed BraveResult[]
- query construction: passed query "ramen" + location "447 Valencia St SF" → MSW captures request URL containing "site:ubereats.com" and "ramen" and "Valencia"
- empty results: MSW returns {web: {results: []}} → returns Result.ok with empty array AND logs warn level "no_results"
- 401 auth_failed: MSW returns 401 → returns Result.err({code: 'auth_failed'})
- 429 rate_limited: MSW returns 429 with Retry-After: 10 → returns Result.err({code: 'rate_limited', retry_after_ms: 10000})
- 500 server error: MSW returns 500 → returns Result.err({code: 'network_error', cause: ...})
- abort: signal.abort() before resolution → throws AbortError (or returns Result.err with aborted-style code, depending on implementation choice in Phase 3)
- defense in depth: response containing non-ubereats.com URLs → those URLs are filtered out of the returned array
```

**Failure message that must disappear:** any "Cannot find module '@/lib/brave/client'" or "TypeError: searchUberEatsNear is not a function".

---

### Task 7: Kimi K2.6 client

**Test type:** Vitest unit + MSW

**Spec — `tests/unit/kimi/client.test.ts`:**

```
pickCandidates:
- happy path: MSW serves valid JSON matching RestaurantPickSchema → returns Result.ok with {pick, usage}
- usage telemetry: response includes usage fields → returned usage matches API response exactly
- schema drift first attempt + valid retry: MSW serves prose first then valid JSON → returns Result.ok, attempts=2 logged
- schema drift twice: MSW serves prose both times → returns Result.err({code: 'parse_drift', attempts: 2})
- 5xx: MSW serves 503 → returns Result.err({code: 'http_5xx', status: 503})
- 429: MSW serves 429 with Retry-After → returns Result.err({code: 'rate_limited', retry_after_ms: ...})
- abort: signal.abort() mid-request → respects signal, returns AbortError
- system prompt byte-identical: two consecutive calls → MSW captures both requests, asserts identical system message bytes (so context cache hits)

pickDish:
- happy path: returns Result.ok with valid DishPick (dish_id present in passed-in menu)
- dish_id not in menu: even if Kimi returns one not in menu, client returns the schema-valid result and lets validator handle it (separation of concerns)
- warning field surfaced when present in response
```

**Failure message that must disappear:** "AssertionError: expected Result.err but got Result.ok" on the schema-drift path; "TypeError: parseAndRetry is not a function".

---

### Task 8: Apify menu fetcher

**Test type:** Vitest unit + MSW

**Spec — `tests/unit/apify/client.test.ts`:**

```
- happy path: MSW serves Apify actor output → returns Result.ok with valid Menu (items array non-empty, all items have id/name/price_cents)
- price normalization: actor returns "$18.50" string → Menu.items[i].price_cents = 1850 (number)
- empty menu: actor returns empty items → returns Result.err({code: 'empty_menu'})
- timeout: MSW delays beyond actor timeout → returns Result.err({code: 'timeout', ms: ...})
- 401: returns Result.err({code: 'auth_failed'})
- 5xx: returns Result.err({code: 'menu_fetch_failed', cause: ...})
- abort: signal.abort() → respects signal
- store_uuid extraction: passed URL "https://www.ubereats.com/store/koja-kitchen/abc-123" → Menu.store_uuid === "abc-123"
```

**Failure message that must disappear:** "Cannot find module '@/lib/apify/client'".

---

### Task 9: Output validator

**Test type:** Vitest unit (pure function, no mocks)

**Spec — `tests/unit/pipeline/validator.test.ts`:**

```
- happy path: candidates list contains the picked restaurant_id, menu contains the picked dish_id, no allergen violations → Result.ok with ValidatedRecommendation
- restaurant_id_unknown: dish_pick.restaurant_id not in candidates → Result.err({code: 'restaurant_id_unknown', got, expected_one_of}) AND console.warn called with structured payload
- dish_id_unknown: dish_pick.dish_id not in menu → Result.err({code: 'dish_id_unknown'}) AND console.warn called
- allergen_violation via dish.allergens field: declared peanut, dish.allergens contains peanut → Result.err({code: 'allergen_violation', allergen: 'peanut', dish}) AND console.warn called
- allergen_violation via description fallback: declared peanut, dish.allergens absent, dish.description contains "peanut" → same Err
- allergen_violation via ingredients fallback: declared peanut, dish.allergens absent, dish.ingredients contains "peanut" → same Err
- no silent substitution: validator never returns a different dish than passed in (verified by checking output dish === input dish on success)
```

**Failure message that must disappear:** any test asserting "validator silently substituted dish" — explicit anti-pattern test that must remain green forever.

---

### Task 10: Deep-link builder

**Test type:** Vitest unit (pure function)

**Spec — `tests/unit/deeplink/builder.test.ts`:**

```
- with item_uuid + no affiliate_tag: returns "https://www.ubereats.com/store/{slug}/{store-uuid}/{item-uuid}"
- with item_uuid + affiliate_tag="omakai": returns same URL with "?ref=omakai" appended
- without item_uuid: returns restaurant-level URL "https://www.ubereats.com/store/{slug}/{store-uuid}" AND console.warn called with structured payload
- malformed restaurant_url (not ubereats.com): throws (precondition violation, caller bug — fail loud)
- store_uuid mismatch with restaurant_url: throws (precondition violation)
```

**Failure message that must disappear:** "Cannot find module '@/lib/deeplink/builder'".

---

### Task 11: Pipeline orchestrator + SSE event types

**Test type:** Vitest integration + MSW (mocks all 3 external services)

**Spec — `tests/integration/orchestrator.test.ts`:**

```
runPipeline happy path:
- yields events in order: phase:address_received → phase:searching_restaurants → phase:picking_candidates → candidates → phase:fetching_menu → phase:picking_dish → phase:validating → phase:done → result
- result event contains valid ValidatedRecommendation + deep_link string
- final phase event has phase='done'

runPipeline error paths:
- Brave 0 results → yields error: {code: 'no_candidates'}
- Apify menu_fetch_failed → yields error: {code: 'menu_fetch_failed', cause: ApifyError}
- Kimi parse_drift after retry → yields error: {code: 'kimi_drift', cause: KimiError}
- Validator allergen_violation → yields error: {code: 'allergen_violation', cause: ValidationError}

runPipeline cancellation:
- signal.abort() during Brave call → all in-flight cancel, yields error: {code: 'aborted'}, generator returns
- signal.abort() during Apify call → same
- signal.abort() during Kimi call → same

runAlternative:
- given a RestaurantCandidate, re-enters at fetching_menu phase
- yields phase events starting from phase:fetching_menu (skips Brave + first Kimi)
- final result references the alternative's restaurant
```

**Failure message that must disappear:** "AssertionError: expected events ['phase', 'phase', ..., 'result'] but got [...]"; cancellation tests start failing if the orchestrator doesn't pass signal through.

---

### Task 12: `/api/recommend` SSE endpoint

**Test type:** Vitest integration + MSW

**Spec — `tests/integration/api-recommend.test.ts`:**

```
- POST mode='initial' with valid body → 200 text/event-stream, events stream from orchestrator
- POST malformed body (missing preferences) → 400 application/json with Zod error details
- POST mode='alternative' with RestaurantCandidate → re-enters pipeline at fetching_menu
- client closes stream → backend AbortController fires (verified by MSW capturing abort signal)
- Content-Type response header is exactly "text/event-stream"
- SSE event format matches: "event: <type>\ndata: <json>\n\n"
```

**Failure message that must disappear:** "Cannot find module '@/app/api/recommend/route'"; "expected Content-Type 'text/event-stream' but got 'text/plain'".

---

## Phase C — Frontend

### Task 13: Profile store + React hook

**Test type:** Vitest unit (jsdom env)

**Spec — `tests/unit/profile/store.test.ts`:**

```
- empty localStorage → getProfile() returns default Profile (empty arrays, default budget_tier='$$', signup_prompted=false)
- valid stored profile → getProfile() returns parsed object
- corrupted JSON in localStorage → getProfile() returns default + console.warn logs
- updateProfile({preferences: {...}}) → merges and persists; getProfile() reflects merge
- recordFeedback after 3 nailed_it picks → returns {triggers_signup_wall: true}, sets signup_prompted=true
- recordFeedback with not_quite mid-streak → resets the counter (3 nailed_it must be consecutive)
- useProfile hook re-renders consumers when storage event fires (cross-tab sync)
```

**Failure message that must disappear:** "Cannot find module '@/lib/profile/store'"; "expected triggers_signup_wall=true but got false".

---

### Task 14: Reduced-motion gate

**Test type:** Vitest unit (jsdom + matchMedia mock)

**Spec — `tests/unit/reduced-motion.test.ts`:**

```
- matchMedia(reduce) === false → useReducedMotion() returns false
- matchMedia(reduce) === true → returns true
- mid-session change (mock matchMedia.dispatchEvent) → hook re-renders consumer with new value
- ReducedMotionGate sets data-motion="reduce" on its root when reduce active
- CSS rule [data-motion="reduce"] .float-y → animation: none verified via getComputedStyle (browser test, not jsdom)
```

**Spec — Browser portion (Task 14b):**

- **URL:** `http://localhost:3000/dev/motion`
- **Interactions:** simulate prefers-reduced-motion via Chrome DevTools rendering panel emulation
- **Observable:** when emulated reduce, an animated `.float-y` element has `animationName === 'none'` in computed style

---

### Task 15: Wizard primitives — Stepper, Chip, BudgetCard, AllergyCheckbox

**Test type:** Vitest unit (snapshot + behavior)

**Spec — `tests/unit/wizard/primitives.test.ts`:**

```
Stepper:
- renders correct number of dot/bar elements for total
- step prop highlights the right number of bars

Chip:
- onToggle fires when clicked
- active=true → element has the active styling (rotation transform present)
- color prop overrides default

BudgetCard:
- selected=true → element has tilted rotation + filled background
- onSelect fires on click

AllergyCheckbox:
- checked=true → checkmark is visible (renders ✓)
- onToggle fires on click
- accessible: clickable area is the full button, not just the checkmark
```

---

### Task 16: Wizard layout + step state context

**Test type:** Vitest unit (React Testing Library)

**Spec — `tests/unit/wizard/layout.test.tsx`:**

```
- WizardContext provider exposes currentStep, totalSteps, next(), back()
- next() advances currentStep by 1; doesn't exceed totalSteps
- back() decreases currentStep by 1; doesn't go below 1
- nested useWizard() hook in a child returns the same values
- error: useWizard() outside provider throws with helpful message
```

---

### Task 17: Wizard step pages — Landing, Address, Budget, Vibe, Prefs, Allergies

**Test type:** Browser (chrome-devtools MCP — happy-path walk-through)

**Spec:**

- **URL start:** `http://localhost:3000/`
- **Step 0 (landing):** assert presence of `<h1>` containing "tell me", a CTA button text matching `/tell me what i'm craving/i`, and the `Marquee` strip element. Click CTA.
- **Step 1 (`/address`):** assert URL is `/address`. Type `447 Valencia St, San Francisco, CA 94103` into the address input. Click "continue". Verify localStorage now contains `omakai_profile.address.raw === "447 Valencia St..."`.
- **Step 2 (`/budget`):** assert URL is `/budget`. Click the `$$` BudgetCard. Verify it has `aria-selected="true"` (or equivalent active marker). Click "next".
- **Step 3 (`/vibe`):** assert URL is `/vibe`. Click chips: `comfort`, `spicy`. Verify both have `aria-pressed="true"`. Click "almost there".
- **Step 4 (`/prefs`):** assert URL is `/prefs`. Click `korean` and `thai` cuisine chips. Type `noodles` in the free-text field. Click "last step".
- **Step 5 (`/allergies`):** assert URL is `/allergies`. Click `peanut` checkbox. Verify it shows ✓. Click "ask the chef".
- **End state:** verify URL is `/thinking`. Verify localStorage `omakai_profile` reflects every selection.
- **Console:** zero errors throughout the walk.
- **Visual smoke:** at each step, the body background computed-color matches `--a-cream` (`rgb(253, 246, 232)`).

---

### Task 18: Pipeline event stream client + useRecommendation hook

**Test type:** Vitest unit (mocked fetch streaming with MSW)

**Spec — `tests/unit/recommendation-hook.test.ts`:**

```
- mounts with valid Profile → starts pipeline (verified by MSW capturing the POST to /api/recommend)
- receives phase events → state.kind transitions: 'idle' → 'loading' with phase set
- receives candidates event → state.kind === 'previewing' with hero + alternatives
- receives result event → state.kind === 'ready' with deep_link
- receives error event → state.kind === 'error' with PipelineError
- address change in props → aborts existing pipeline (MSW captures abort), starts new one
- selectAlternative(0) → POSTs mode='alternative' with alternatives[0].candidate
- retry() → aborts current, starts mode='initial'
- unmount during loading → aborts in-flight pipeline (MSW captures abort)
```

---

### Task 19: Loading screen — `/thinking`

**Test type:** Browser (chrome-devtools MCP — verifies SSE-driven UI)

**Spec:**

- **Setup:** dev environment uses an env-flagged `NEXT_PUBLIC_TEST_PIPELINE=mock` which makes `/api/recommend` emit a scripted SSE sequence (mock Brave→Kimi→Apify, full happy path with 1.5s delay between phases).
- **URL:** `http://localhost:3000/thinking` after walking the wizard with valid inputs (or via direct nav with localStorage seeded from a previous successful walk).
- **Observable assertions:**
  - Loading mascot is visible and animated (when not in reduced-motion)
  - Phrase rotator changes text every ~1.8s (5 phrases cycling)
  - Status checklist items tick on in order: `address received` (immediate) → `menus loaded` → `chef is choosing` → `double-checking allergens`
  - On `result` event, page navigates to `/result` within 1s
- **Reduced-motion variant:** with prefers-reduced-motion emulated → mascot has no animation, phrase rotator does NOT advance (gated by hook), checklist still ticks (driven by SSE events, not timers)
- **Error variant:** with `?force_error=kimi_drift` query → error message + retry CTA renders, retry CTA navigates back to `/thinking` and restarts pipeline

---

### Task 20: Recommendation card — Hero + Alternatives strip

**Test type:** Browser (chrome-devtools MCP)

**Spec:**

- **URL:** `http://localhost:3000/result` (assumes pipeline ran via `/thinking` or seeded localStorage)
- **Hero card assertions:**
  - Visible elements: `OMAKAI APPROVED` sticker, restaurant name, dish name, reasoning paragraph, "WHY THIS" mascot label, ingredients chip list, "PRICE / KCAL / ETA / HEAT" callout boxes, severe-allergy disclaimer (always present when any allergen declared in profile)
  - "Order on UberEats" CTA has `target="_blank"` and href starting with `https://www.ubereats.com/store/`
- **Alternatives strip assertions:**
  - Three chips present, each with one of the tags `lighter` / `spicier` / `cheaper`
  - Tap chip 1 → loader spinner appears on chip 1, hero card swaps to alt's recommendation within 5s
  - During load, only chip 1 shows loader (chips 2 and 3 idle)
- **Try Another button (if implemented):** firing it restarts the pipeline; URL stays `/result`
- **Console:** zero errors

---

### Task 21: Feedback collector — `/feedback`

**Test type:** Browser (chrome-devtools MCP)

**Spec:**

- **URL:** `http://localhost:3000/feedback` (after returning from a deep-link click — simulate by direct nav with localStorage seeded with a recent pick)
- **Observable assertions:**
  - Two big tilted buttons: "nailed it" (with `✦`) and "not quite" (with `↺`)
  - Tap "nailed it" → localStorage `omakai_profile.recent_picks[last].feedback === 'nailed_it'`
  - On 3rd consecutive nailed_it (verify by seeding 2 prior nailed_it picks then tapping) → page redirects to `/signup`
  - Tap "not quite" → feedback recorded, redirect to `/` (no signup wall)

---

### Task 22: Deferred signup wall — `/signup`

**Test type:** Browser (chrome-devtools MCP)

**Spec:**

- **URL:** `http://localhost:3000/signup`
- **Gating:** with `signup_prompted: false` in localStorage → page redirects to `/`
- **Gating:** with `signup_prompted: true` → page renders
- **Observable assertions:**
  - "save your taste" headline visible
  - "continue with apple" + "continue with email" buttons visible
  - "maybe later" link visible
  - Tap "continue with apple" → toast appears with text matching `/coming soon/i`, no navigation
  - Tap "maybe later" → navigates to `/`
  - "your taste so far" summary card shows declared prefs

---

## Phase D — Integration

### Task 23: End-to-end happy path browser test

**Test type:** Browser (chrome-devtools MCP — real network, no mocks)

**Spec:**

- **Setup:** `.env.local` populated with real Moonshot/Brave/Apify keys. Dev server reachable.
- **URL:** `http://localhost:3000/`
- **Walk:**
  1. Click "tell me what i'm craving"
  2. Type `447 Valencia St, San Francisco, CA 94103` → continue
  3. Click `$$` → next
  4. Click `comfort`, `saucy` chips → almost there
  5. Click `korean` cuisine chip; type `noodles` → last step
  6. Click `peanut` checkbox → ask the chef
- **Assertions on result:**
  - `/thinking` shows live phase progression (status checklist ticks visibly)
  - Within 25s, `/result` renders
  - Hero card has a real UberEats restaurant name (not "Koja Kitchen" placeholder)
  - Hero CTA href starts with `https://www.ubereats.com/store/`
  - Three alternative chips present
  - No console errors
- **Manual verify:** founder dogfoods this once before merging the launch commit.

---

### Task 24: Error states browser tests

**Test type:** Browser (chrome-devtools MCP)

**Spec:** four sub-scenarios, each accessible via `?force_error=<code>` query param on `/thinking` (env-flagged dev-only mock route):

- **`?force_error=no_candidates`:** assertion: error UI shows "limited coverage in your area" copy, retry CTA visible, retry restarts pipeline
- **`?force_error=menu_fetch_failed`:** assertion: error UI shows "we couldn't grab the menu — try again" copy, retry CTA, retry works
- **`?force_error=kimi_drift`:** assertion: error UI shows "the chef is having an off night" copy, retry CTA, retry works
- **`?force_error=allergen_violation`:** assertion: error UI shows "we couldn't find a safe pick — try a different vibe" copy, navigates back to `/vibe`

**For every variant:** zero console errors, no infinite loop, retry CTA functional.

---

### Task 25: LLM eval harness

**Test type:** Vitest (eval suite, runs against live Kimi API by default)

**Spec — `tests/eval/run-eval.ts`:**

```
Fixture set (10-20 inputs covering):
- vegan input → assertion: returned dish has no meat keywords (beef, chicken, pork, fish, shellfish) in name/description
- declared peanut allergy → assertion: returned dish does not violate peanut (validator already does this; eval verifies prompt steers correctly)
- declared multi-allergen (peanut + tree nut + shellfish) → assertion: validator passes
- budget $ → returned dish.price_cents <= 1500
- budget $$$ → returned dish.price_cents > 3000 (loose; warn-only)
- single cuisine declared → returned restaurant matches that cuisine when possible
- empty cuisines + spicy vibe → returned dish has spice indicator in name/description

CLI:
- `npm run test:eval` runs all fixtures
- safety assertions (vegan, allergens) → fail blocks merge
- soft assertions (budget cap, cuisine match) → log warning, do not fail
```

---

## Phase E — Production

### Task 26: Vercel deployment

**Test type:** Manual production verification

**Spec:**

```
- DNS: dig omakai.food → resolves to Vercel IP
- HTTPS: https://omakai.food/ returns 200, valid TLS cert
- Security headers: HSTS, X-Frame-Options DENY (or SAMEORIGIN), X-Content-Type-Options nosniff
- Lighthouse audit (Chrome DevTools, mobile preset, 4G throttling):
  - Performance >=90
  - Accessibility >=90
  - Best Practices >=90
  - SEO >=90
- og-image: posting https://omakai.food/ to a Slack DM renders the og-image preview correctly
- Real wizard walk (production env): same as Task 23 spec, but against https://omakai.food
```

---

### Task 27: Analytics + monitoring

**Test type:** Live verification + log inspection

**Spec:**

```
- Vercel Analytics dashboard shows pageview data within 1 hour of a manual visit to https://omakai.food/
- Vercel function logs (via `vercel logs --since 1h`) contain JSON lines with:
  - {level: "info", msg: "kimi.usage", cache_creation_input_tokens, cache_read_input_tokens, input_tokens, output_tokens}
- After triggering a deliberate validator rejection in dev (force_error=allergen_violation), logs contain:
  - {level: "warn", code: "allergen_violation", allergen: "peanut", dish: {...}}
- Vercel log filter alert configured for `level=warn AND code=validator_reject` → emails founder when matched >5 times in 1 hour (verify by triggering 6 in a row in dev pointed at production logs intentionally)
```

---

## Self-review

### Coverage

Every task in `plans/omakai-mvp.md` (1-27) has a Test Plan entry above. Task 1 already executed and verified; entries for Tasks 2-27 specify how the red-half test will look at execution time.

### Browser-test scratch routes

Three scratch routes are required for tests:

- `/dev/tokens` (Task 2 + 14b) — token color + animation smoke
- `/dev/motion` (Task 14b) — reduced-motion CSS verification
- `?force_error=<code>` query parameter handling on `/thinking` (Tasks 19, 24) — pipeline error injection in dev

These are dev-only and gated by `process.env.NODE_ENV !== 'production'` (and explicit `NEXT_PUBLIC_TEST_PIPELINE=mock` for the SSE mock in Task 19). They must not ship to production.

### Test harness deps already installed

Vitest 4.1.5, MSW 2.13.6, @testing-library/react 16.3.2, jest-dom matchers, jsdom 29.0.2, user-event 14.6.1 — all installed in Task 1. No additional deps required.

### Execution-tool flexibility

Specs are framed as "URL → interactions → observable assertions" so they can be executed by:

- **chrome-devtools MCP** (preferred) — automated execution by Claude Code
- **Manual user execution** — human follows the spec and reports observed values
- **Playwright** (future) — straightforward port if we want CI-runnable browser tests later

The Test Plan does not mandate a specific execution tool.

### Open execution-time issue

chrome-devtools MCP is not currently exposed in the executing Claude Code session (verified via two ToolSearch passes 2026-04-24). Before Phase 3 begins for browser-testable tasks, one of:

- Expose chrome-devtools MCP in the session (settings change)
- Have the user manually walk each browser spec
- Defer browser tests to a Playwright suite added in a later milestone

This is a session-config issue, not a Test Plan issue. Flagged for the Plan → Execute gate handshake.

---

_When approved, the next phase per CLAUDE.md is 3 Execute. Per CLAUDE.md, before Execute begins for browser-testable tasks I must have the dev server URL — already provided as `http://localhost:3000`. Execute proceeds task by task with TDD red→implement→green→commit cycles._
