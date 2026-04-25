# omakai.food — MVP Design Concept

## Status

Design Concept: Approved (2026-04-24)
Research: Complete, Ready for plan (2026-04-24)

## Problem

People are increasingly indecisive about food ordering. Browsing 80 restaurants and 1,200 menu items on UberEats induces choice fatigue and wastes time. Existing apps optimize for variety; nobody optimizes for **"just tell me what to eat tonight."**

omakai.food is an LLM-powered chooser that asks a few short questions (budget, vibe, preferences, allergies), grounds itself in what's actually deliverable to the user's address, and produces **one** confident recommendation with a reasoning blurb and a one-tap deep-link to UberEats. The user skips browsing entirely.

Name is a deliberate twist on the Japanese *omakase* ("I leave it up to you"), with **AI** embedded in the second half. Domain: `omakai.food`.

## Product decisions (locked)

| Decision | Choice |
|---|---|
| Recommendation autonomy | **Suggest then confirm.** Bot asks → presents one best option with reasoning → user confirms → deep-link out. Not full auto. |
| Onboarding inputs (in order) | Address → budget tier (`$ / $$ / $$$`) → vibe (multi-select chips) → preferences (chips + free text) → allergies (checkbox list) |
| Input modality | **Wizard with chips and checkboxes**, not a free-form chat. |
| Number of recommendations shown | **One** at a time. |
| Fulfillment model | **Recommendation + affiliate deep-link only.** App does not place the order itself. |
| Catalog grounding strategy | **Hybrid:** LLM general knowledge + scraped UberEats catalog at user's address. LLM picks; output validator confirms the chosen dish exists in the scraped catalog before showing. |
| Delivery platform (MVP) | **UberEats, US only.** Single scraper, single deep-link format, single affiliate integration. DoorDash / Grubhub / international deferred. |
| Scraping infrastructure | **ScrapFly** (paid scraping middleware) — sidesteps the cat-and-mouse with UberEats anti-bot. Estimated ~$50/mo at low volume. |
| Personalization & auth | **Anonymous + on-device memory** (localStorage). **Deferred login wall** prompts account creation after the 3rd successful recommendation. |
| Feedback loop | After deep-link return, ask "Did it land?" Logs to localStorage initially, syncs to backend once user creates account. |
| Tech platform | **Web first (PWA, Next.js).** React Native port deferred until loop is validated. |
| LLM provider | **Claude Sonnet 4.6** with prompt caching on system prompt + scraped catalog. |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  omakai.food — Next.js PWA                                  │
│                                                              │
│  Frontend                                                    │
│   - Onboarding wizard (address → budget → vibe → prefs       │
│     → allergies)                                             │
│   - localStorage profile store                               │
│   - Recommendation card + deep-link CTA                      │
│   - "Did it land?" feedback                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ POST /api/recommend
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend (Next.js API routes — single Vercel deploy)        │
│                                                              │
│   ┌──────────────────┐      ┌──────────────────────────┐    │
│   │ UberEats scraper │      │ LLM recommender          │    │
│   │ (ScrapFly API)   │  →   │ (Claude Sonnet 4.6,      │    │
│   │                  │      │  prompt-cached system +  │    │
│   │                  │      │  RAG context)            │    │
│   └──────────────────┘      └──────────────────────────┘    │
│            ↓                          ↓                      │
│   restaurants + menus        picked dish + reasoning +       │
│   at user address            UberEats deep-link              │
│                                       ↓                      │
│                              Output validator               │
│                              (verifies dish exists in        │
│                              scraped catalog; verifies       │
│                              allergens respected)            │
└─────────────────────────────────────────────────────────────┘
```

## User flow (MVP)

1. Land on homepage → one-line pitch + CTA: "Tell me what you're craving."
2. **Address.** Browser geolocation API with typed-address fallback.
3. **Budget tier.** `$ / $$ / $$$` with rough dollar ranges per chip.
4. **Vibe.** Multi-select chips: *comfort, light, spicy, fresh, indulgent, healthy, fast,* etc.
5. **Preferences.** Cuisine chips + optional free-text note.
6. **Allergies.** Checkbox list: *peanut, tree nut, shellfish, dairy, gluten, egg, soy, sesame, none.*
7. **Loading screen.** "Asking the chef…" — entertaining copy because 8-20s is realistic end-to-end.
8. **Recommendation card.** Restaurant + dish + 1-paragraph reasoning + dish photo (if scrapeable).
9. **CTA: "Order on UberEats"** → deep-link with affiliate tag.
10. **On return:** "Did it land?" yes/no. After 3rd ✅, prompt to save profile (deferred signup wall).

## Components

Each component is small, single-purpose, and isolated through a clear interface so it can be understood and tested independently.

| Component | Lives | Job | Depends on |
|---|---|---|---|
| Onboarding wizard | Frontend | Multi-step form: address → budget → vibe → prefs → allergies; manages step state | Profile store |
| Profile store | Frontend | Read/write prefs, allergies, recent picks, feedback to localStorage; abstracts storage so a backend sync can be plugged in later | Browser localStorage |
| Recommendation orchestrator | Backend (`/api/recommend`) | Pipeline: validate inputs → invoke scraper → invoke LLM → invoke validator → return structured response | Scraper, LLM recommender, Output validator |
| UberEats scraper | Backend | Given an address, returns JSON `{ restaurants: [{ id, name, menu: [{ id, name, price, description, ... }] }] }` | ScrapFly API |
| LLM recommender | Backend | System prompt + scraped catalog (RAG context) + user inputs → strict JSON output `{ restaurant_id, dish_id, reasoning }` | Claude API, prompt caching |
| Output validator | Backend | Verifies `restaurant_id` and `dish_id` exist in scraped catalog; verifies the chosen dish does not violate any declared allergy. **Treat as non-optional** — without this, hallucinated dishes ship broken deep-links. | None |
| Deep-link builder | Backend | Constructs UberEats URL with affiliate tag, restaurant ID, optional cart pre-fill | None |
| Feedback collector | Frontend → backend (later) | "Did it land?" yes/no after return; logs to localStorage initially, syncs once user creates account | Profile store |

## Visual design direction

**Direction: Yuzu Sticker** (Direction A from the design exploration archived in-repo at `design/mockups/dir-a-yuzu.jsx`; original source `G:\Download\omakai\` / WSL `/mnt/g/Download/omakai/`).

Aesthetic: pastel peach/butter/sage palette, mascot-forward, sticker energy, oversized lowercase type, hard 2.5px black borders with 4px hard offset shadows (neo-brutalism / sticker stamp feel). Anti-corporate, playful, anti-AI-slop.

### Design tokens (locked from `dir-a` namespace in `styles.css`)

| Token | Value | Use |
|---|---|---|
| `--a-cream` | `#fdf6e8` | Page background |
| `--a-mist` | `#f3e8d2` | Alt background tint |
| `--a-peach` | `#ffb89a` | Accent / chip backgrounds |
| `--a-peach-deep` | `#ff8a5c` | Primary CTA, headline accent |
| `--a-butter` | `#f7d65a` | Stickers, highlight callouts |
| `--a-sage` | `#b6cfa3` | Affordances, status pills |
| `--a-sage-deep` | `#7ea36a` | Confirmed/positive states |
| `--a-ink` | `#2a1f17` | Body text, borders |

### Typography

- **Display:** Fraunces (Google Fonts, variable, opsz/wght/SOFT axes), 700 weight, letter-spacing -0.03em, line-height 0.92. Used for oversized lowercase headlines like "tell me what to eat tonight."
- **Body / UI:** Zen Kaku Gothic New (Google Fonts, weights 400/500/700/900). Japanese-flavored geometric sans, fits the omakase brand.
- **Mono / labels:** DM Mono (Google Fonts, 400/500). Used for `ALL CAPS` letter-spaced labels ("TONIGHT'S PICK", "STEP 1 OF 5", "WHY THIS").

### Screen inventory (mockups → MVP screens)

| Mockup component | MVP screen |
|---|---|
| `ALanding` | Homepage / entry point — hero with mascot, marquee strip of food words, CTA "tell me what I'm craving" |
| `AAddress` | Step 1 — address card with signal-strength bar and "47 places nearby" callout |
| `ABudget` | Step 2 — three stacked cards ($, $$, $$$) with labels (cheap eats / comfort zone / treat night) and food emoji |
| `AVibe` | Step 3 — multi-select mood chips (comfort, light, spicy, fresh, indulgent, healthy, fast, cozy, crispy, saucy, umami, bright) + "we're thinking…" preview |
| `APrefs` | Step 4 — cuisine chips + free-text optional note with highlighted-word affordance |
| `AAllergies` | Step 5 — 2×2 grid of toggleable allergens + "no allergies — bring it on" CTA + severe-allergy disclaimer |
| `ALoading` | Loading state — animated mascot with rotating phrases ("scanning 47 restaurants near you", "sniffing the broth") + status checklist |
| `ARec` | Recommendation card — magazine-style hero photo, "OMAKAI APPROVED" sticker, price/kcal/eta/heat callouts, "WHY THIS" reasoning blurb with mascot, ingredients list, allergy disclaimer, "try another" + "order on UberEats" CTAs |
| `AFeedback` | Post-return — "did it land?" with two big tilted buttons ("nailed it" / "not quite") |
| `ASignup` | Deferred signup wall (after 3rd ✅) — "save your taste, omakai gets sharper" with social auth + taste-profile preview |

### Visual signature elements (must preserve in production)

- Sticker badges (`StickerBadge`) at rotated angles (-18°, 12°, 20°, etc.) with `OMAKAI`, `OMAKAI APPROVED`, `STEP 1 OF 5`.
- Maki/sushi mascot (`MaskotMaki`) with floating animation (`float-y` keyframe, 2.4s ease-in-out).
- Hard offset shadows on buttons and active cards: `4px 4px 0 var(--a-ink)`. Press-down state: shadow shrinks to `1px 1px 0` and transform shifts.
- Active chips/cards rotate 1-2° to feel hand-stuck.
- Marquee strip on landing page (food words scrolling at 22s linear infinite).
- Lowercase display headlines as a brand voice rule. **No Title Case in headings.**
- ALL-CAPS letter-spaced mono labels as section markers.

### Production translation notes

The mockups are React JSX with inline styles, scoped via the `dir-a` class. For the Next.js PWA build, lift the design tokens to either:

- **Option 1 (recommended):** CSS custom properties at `:root` plus a thin Tailwind theme extension that references them via `theme.colors.cream: 'var(--a-cream)'`. Best of both worlds: tokens stay editable, Tailwind utilities work normally.
- **Option 2:** Pure Tailwind theme — paste the palette into `tailwind.config.ts`. Simpler, but loses the runtime token affordance for theming.

Mascot assets (`MaskotMaki`, `StickerBadge`, `Chopsticks`, `DishPlaceholder`) live in `design/mockups/mascots.jsx` — port these as React components into the Next.js codebase as-is or rebuild as SVG components.

## Tech stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Fonts:** Fraunces (display), Zen Kaku Gothic New (UI), DM Mono (labels). Loaded via `next/font/google` for self-hosted optimization, not the runtime Google Fonts CSS import used in the mockups.
- **Design tokens:** CSS custom properties at `:root` (palette, typography, shadow tokens) with a Tailwind theme extension referencing them. Source of truth for the Yuzu palette is the table in the **Visual design direction** section.
- **Mascot / sticker assets:** ported from `design/mockups/mascots.jsx` into the Next.js codebase as React/SVG components.
- **Backend:** Next.js API routes (single deployment), TypeScript
- **Hosting:** Vercel
- **LLM:** Claude Sonnet 4.6 via Anthropic SDK (`@anthropic-ai/sdk`), with prompt caching on the system prompt and on the scraped catalog block
- **Scraping:** ScrapFly (paid middleware) targeting UberEats US
- **Storage (MVP):** browser localStorage only — no database
- **Storage (post-deferred-signup):** Supabase or Clerk for auth + lightweight user table
- **Geolocation:** browser Geolocation API (HTML5) + manual address typing fallback. **Not** IP-based geo.
- **Analytics:** Vercel Analytics for MVP (no A/B infra yet)
- **Affiliate:** UberEats native affiliate program if approved; backup via Skimlinks or Awin (broader self-serve affiliate networks that include UberEats links)

## Testing strategy

- **Unit:** allergen filter, deep-link builder, output validator, profile store. Vitest.
- **Integration:** mocked ScrapFly + mocked LLM responses, end-to-end pipeline. Specifically verify the validator catches hallucinated dishes.
- **Browser (chrome-devtools MCP, per project workflow):** wizard happy path, recommendation render, deep-link click navigates correctly to a real UberEats URL.
- **LLM eval harness:** fixture set of user-input scenarios with assertions on output category. Critical assertions: vegan request never returns meat dish; declared peanut allergy never returns peanut-containing dish; budget cap respected.
- **Founder dogfooding:** order through the app daily for the first 3 weeks. Most important test there is.

## Risks

1. **Scraping fragility / ToS exposure.** UberEats prohibits scraping. ScrapFly mitigates the technical side (handles rotation, captchas, fingerprinting) but does not change the legal posture. **Action:** at any real scale, evaluate **MealMe** (food-delivery aggregator API) as a legitimate replacement; budget engineering time to migrate when traction justifies.
2. **LLM hallucination of dishes.** Even with RAG grounding, the model may invent items. **Mitigation:** the prompt explicitly constrains the LLM to pick from the supplied JSON catalog only, the output is strict JSON containing IDs, and the **Output validator** rejects any output whose IDs aren't present in the scraped catalog.
2a. **Allergen safety is bounded by catalog data quality.** UberEats dish descriptions are inconsistent — some list full ingredients, some don't. The output validator can only enforce allergen rules on what the catalog actually discloses. **Mitigation:** in the recommendation card, surface a clear "Always confirm ingredients with the restaurant if you have a severe allergy" disclaimer; in the prompt, instruct the LLM to err on the side of skipping any dish whose ingredients are ambiguous when an allergy is declared.
3. **Latency.** Scrape (5-15s) + LLM (3-8s) ≈ typically 8-20s per recommendation, worst case ~23s. **Mitigation:** entertaining loading UX ("Asking the chef…"), prompt caching on the system prompt + scraped catalog, parallelize where possible (e.g., kick off scrape on address-submit, before user has finished the wizard).
4. **UberEats deep-link granularity.** Dish-level deep links may not be reliable across all restaurants. **Mitigation:** verify in week 1 of build. If only restaurant-level URLs work, fallback shows recommendation with a "find this dish on UberEats" CTA that lands the menu page.
5. **Affiliate eligibility.** UberEats affiliate is gated and may reject a brand-new app. **Mitigation:** apply early; while pending, route through Skimlinks or Awin (which can include UberEats links and accept self-serve signups).
6. **LLM cost at scale.** ~10k tokens per recommendation × Claude Sonnet 4.6 ≈ $0.05/rec. At 1k recs/day ≈ $50/day = $1.5k/mo. **Mitigation:** prompt caching cuts 3-5×; system prompt and scraped catalog block are both highly cacheable. Build with caching from day one.

## Explicitly out of scope (YAGNI for MVP)

- Account-based login at signup time (deferred wall is post-MVP path)
- Group ordering / multi-user input
- Scheduled future-time orders ("dinner at 7pm")
- DoorDash / Grubhub / non-US platforms
- Restaurant partner program / direct deals
- Real-time order tracking (UberEats handles it post deep-link)
- Push notifications (deferred to RN port)
- Loyalty, gamification, social features
- A/B testing infrastructure beyond Vercel Analytics

## Open questions to track during implementation

1. **UberEats affiliate program approval timeline** — apply on day one; if rejected, default to Skimlinks/Awin without blocking launch.
2. **UberEats deep-link granularity** — verify dish-level URLs in week 1. Fallback path is restaurant-level deep link.
3. **ScrapFly cost at expected MVP traffic** — model out at 100, 500, 1000 recs/day to confirm budget.
4. **Geolocation accuracy** — confirm browser Geolocation API resolution is sufficient for address-level UberEats catalog scraping; if not, require typed address.
5. **Prompt caching cache-hit rate** — instrument Claude API responses for `cache_creation_input_tokens` vs `cache_read_input_tokens`. Target ≥70% cache-read on warmed sessions.
6. **Design source files location.** ✓ Resolved 2026-04-24. Copied all 12 design files (10 JSX + `styles.css` + `omakai.food.html`) into `design/mockups/` rather than the originally-proposed `design/yuzu-mockups/`, because the HTML harness imports all three direction files (`dir-a-yuzu.jsx`, `dir-b-mincho.jsx`, `dir-c-block.jsx`) plus scaffolding (`design-canvas.jsx`, `app.jsx`, `desktop.jsx`, `ios-frame.jsx`, `browser-window.jsx`, `tweaks-panel.jsx`) — stripping any of them breaks the live preview. Yuzu remains the locked direction; the alternates are kept as in-repo reference only.

## Definition of done (for the MVP launch)

- A user in any UberEats US service area can complete the wizard and receive a real, deliverable, allergen-respecting dish recommendation within 25 seconds end-to-end.
- The deep-link CTA opens UberEats on the correct restaurant (dish-level if supported).
- The output validator has zero hallucinated dishes in a 100-recommendation founder-dogfood run.
- localStorage persists prefs and allergies across sessions.
- Deferred signup wall fires after the 3rd successful recommendation.

---

_Next phase per CLAUDE.md workflow: research → plan → type contract → test plan → execute. This document is the design concept seed for the research phase._

---

## Implementation architecture (research-phase consolidation, 2026-04-24)

This section supersedes the LLM-vendor and tool-pipeline details in the original Design Concept above. Original sections are kept for history; **implementation must follow this consolidation.** Brand promise, user journey, allergen safety rules, and Yuzu visual direction are unchanged.

### Stack updates from the original Design Concept

| Layer | Original | Consolidated | Rationale |
|---|---|---|---|
| LLM | Claude Sonnet 4.6 (Anthropic) | **Moonshot Kimi 2.5** via OpenAI-compatible API | Lower cost; structured-pipeline pattern doesn't need top-tier reasoning. Trade-offs accepted: data residency, ~150-400ms extra round-trip per call, faster API churn. Fallback to a cheap US LLM behind an env flag. |
| Catalog grounding | Scrape all ~47 menus per rec via ScrapFly | **Brave Search for discovery + Apify for hero-only menu fetch (lazy on alternatives)** | ~80-90% Apify cost reduction. AI picks restaurant from search snippets; validator confirms dish exists in fetched menu. |
| Recommendation shape | One final pick | **One hero pick + three tagged alternatives** (e.g., "lighter", "spicier", "cheaper") | Preserves omakase magic (default tap on hero) while giving agency. Hero menu eager; alternatives lazy on tap. |
| Pipeline pattern | Single LLM call with full RAG catalog | **Structured 3-call pipeline** (query-gen → restaurant-pick → dish-pick) with JSON-schema-bound outputs at every step | Prevents agent drift, eliminates loops, predictable cost and latency. Reinforces the "silent auto-correction" gotcha (Finding 5) — validator must reject + log on hallucination, never silently substitute. |

### Updated architecture

```
┌──────────────────────────────────────────────────────────────┐
│  omakai.food — Next.js PWA (Yuzu Sticker)                    │
│                                                               │
│  Frontend                                                     │
│   - Onboarding wizard (chips + checkboxes)                    │
│   - Pipeline event stream client (SSE)                        │
│   - Hero card + 3 alternative chips                           │
│   - Deep-link CTA + feedback loop                             │
└───────────────────────────┬──────────────────────────────────┘
                            │ POST /api/recommend (SSE stream)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  Backend (Next.js API routes — Vercel us-east)               │
│                                                               │
│   Pipeline orchestrator (deterministic step sequencer)        │
│      │                                                        │
│      ├─► 1. Brave Search           (~200ms)                  │
│      │      ~10 candidate restaurants near user               │
│      │                                                        │
│      ├─► 2. Kimi: hero + 3 alts    (~800ms, JSON-bound)      │
│      │      from Brave snippets                               │
│      │                                                        │
│      ├─► 3. Apify: hero menu only  (~3-5s)                   │
│      │      structured menu items                             │
│      │                                                        │
│      ├─► 4. Kimi: pick dish        (~1s, JSON-bound)         │
│      │      restaurant_id + dish_id + reasoning               │
│      │                                                        │
│      ├─► 5. Output validator       (instant)                 │
│      │      asserts dish exists, allergens respected          │
│      │      REJECT + LOG on miss (no silent substitution)     │
│      │                                                        │
│      └─► 6. Deep-link builder      (instant)                 │
│             UberEats item-UUID URL + affiliate tag            │
└──────────────────────────────────────────────────────────────┘

Lazy path (user taps an alternative chip):
  → Apify fetches that alt's menu
  → Kimi dish-pick + validator on that menu
  → Updated card renders (~3-5s)
```

### Updated user flow with parallelization

| Phase | User-visible | Background work | T+ |
|---|---|---|---|
| 0 | Land on app, tap "tell me what I'm craving" | — | 0s |
| 1 | Enter address (geo or typed) | — | ~1s |
| 2 | Pick budget tier ($/$$/$$$) | **Brave Search fires** on (address + budget) submit | ~3s |
| 3 | Pick vibe chips (multi-select) | Brave returns → **Kimi Step 1** (hero + 3 alts JSON) | ~5s |
| 4 | Pick cuisine prefs + free text | Step 1 returns → **Apify fetches hero menu** | ~7s |
| 5 | Pick allergies (checkbox grid) | Apify returns → **Kimi Step 2** picks dish → **validator** runs | ~9s |
| 6 | "Asking the chef…" loader (only if pipeline still running) | Pipeline finishes if not already | ~9-12s |
| 7 | **Hero card renders** + 3 alt chips below it | — | ~10-12s |
| 8 | Tap "Open on UberEats" → deep-link out | — | — |
| 8' | Or tap an alt chip → loader → fetch → render | Apify + Kimi for that alt's menu | +3-5s |
| 9 | On return: "Did it land?" → after 3rd ✅, deferred signup wall | — | — |

**Perceived latency between final wizard tap and hero card render: 0-3 seconds** in steady state where the pipeline finishes during wizard input.

### Updated components

| Component | Lives | Job | Depends on |
|---|---|---|---|
| Onboarding wizard | Frontend | Multi-step chip/checkbox form; manages step state and triggers background pipeline events | Profile store, Pipeline event stream |
| Profile store | Frontend | localStorage adapter for prefs, allergies, recent picks, feedback | Browser localStorage |
| Pipeline event stream | Frontend | SSE client receiving step-by-step pipeline progress; updates loading UI; renders hero + alts when ready | `/api/recommend` SSE |
| Pipeline orchestrator | Backend (`/api/recommend`) | Deterministic step sequencer: Brave → Kimi → Apify → Kimi → Validator → Deep-link. Streams progress events via SSE. | All below |
| Brave Search client | Backend | Single search call per rec for restaurant discovery near address. Returns ~10 candidates with name, snippet, URL, rating if available. | Brave Search API |
| Kimi 2.5 client | Backend | OpenAI-compatible HTTP client (`openai` SDK with `baseURL` override). Two distinct call sites: (1) hero+alts pick from Brave results, (2) dish pick from menu. Both schema-bound JSON outputs. Context caching on the stable system prompt only. | Moonshot API |
| Apify menu fetcher | Backend | Given restaurant URL, fetches structured menu (dishes with id/name/price/description/modifiers). Eager for hero, lazy on alt tap. | Apify actor |
| Output validator | Backend | Verifies returned `restaurant_id` and `dish_id` exist in the fetched menu and that the dish does not violate declared allergens. **Rejects + logs on any miss — never silently substitutes.** Per `~/.claude/knowledge/` gotcha. | None |
| Alternatives manager | Backend | Holds the 3 alternative restaurant IDs from Step 1; on lazy-tap, drives Apify + Kimi pick for that alt | Apify, Kimi |
| Deep-link builder | Backend | Constructs UberEats item-UUID URL with affiliate tag if available; falls back to restaurant-level URL on UUID-resolution failure | None |
| Feedback collector | Frontend → backend (post-signup) | "Did it land?" yes/no after return; logs to localStorage initially, syncs after deferred signup | Profile store |

### Updated tech stack delta

Unchanged from original: Next.js 15 (App Router), TypeScript, Tailwind, fonts via `next/font/google`, CSS-custom-property design tokens, Vercel hosting, browser localStorage, Yuzu Sticker visuals.

Changed:

- **LLM:** **Moonshot Kimi K2.6** (not K2.5 — K2.5 stays available but the older `kimi-k2-0905-preview / -turbo / -thinking / -thinking-turbo` variants deprecate **2026-05-25**). OpenAI-compatible client (`openai` SDK with `baseURL: "https://api.moonshot.ai/v1"` — global, not `.cn`). Pin the model ID in code. Each Kimi call wrapped with a **Zod validator + 1 retry** on JSON-schema parse failure (Kimi strict mode is solid but occasionally drifts on nested schemas). Context caching is automatic with no `cache_control` markers — keep system prompt + tool schemas byte-identical across calls to maximize the ~83% input-cost discount on cache hits. Env-flagged fallback to a cheap US LLM (Haiku 4.5 / GPT-4o-mini) when Moonshot is degraded.
- **Search:** **Brave Search API — web search with `site:ubereats.com` operator** (single query per recommendation). This deliberately *avoids* Place Search to skip the paid Search plan subscription. Trade-off: lose Brave's structured rating/hours data; Kimi picks from web snippets only. Acceptable because UberEats menu pages will give us rating data at the Apify step. ~$25/mo at MVP volume after the $5/mo credit.
- **Scraping:** Apify (`datacach/ubereats-menu-scraper` or v2 alternative). Fired per-restaurant — eager for hero, lazy for alts. ScrapFly Pro retained as documented fallback.
- **Streaming:** Server-Sent Events from `/api/recommend` so the frontend can render progressive loading states ("scanning…", "asking the chef…", etc.) tied to real backend phases.

### New risks (additions)

- **Risk 7 — Data residency.** User addresses + meal preferences flow through Moonshot's Chinese servers. Disclose in privacy policy. Not a hard regulatory blocker for non-PII food preferences but a trust/marketing concern for some users.
- **Risk 8 — Kimi API stability.** Chinese AI APIs iterate faster than US peers; breaking changes more common. Pin model version. Maintain env-flagged fallback to a cheap US LLM.
- **Risk 9 — Brave Search restaurant data quality varies geographically.** Major US cities solid; smaller markets sparse. If Brave returns <3 plausible candidates, surface a "we don't have great coverage here yet" message rather than fabricating alternatives via LLM general knowledge alone.

### Updated cost model (concrete, post-Finding 6)

| Line item | MVP volume (200 recs/day) | Validation volume (1k/day) |
|---|---|---|
| Brave Search (1 web query/rec, no Place Search) | **~$25/mo** ($30 raw − $5 credit) | **~$145/mo** ($150 raw − $5 credit) |
| Apify (≈1.2 menus/rec average — hero + ~20% alt clicks) | ~$5-10/mo | ~$25-50/mo |
| Kimi K2.6 (3 calls/rec, ~$0.007-0.009/rec with system-prompt cache hits) | **~$45-55/mo** | **~$225-275/mo** |
| Vercel hosting | $0-20/mo | ~$20/mo |
| Domain (omakai.food) | ~$6/mo | ~$6/mo |
| **Total monthly** | **~$80-115/mo** | **~$425-500/mo** |

Affiliate revenue assumed **$0**.

### Visual design — extension for alternatives strip

The current Yuzu mockups in `design/mockups/dir-a-yuzu.jsx::ARec` show a single hero card. The consolidated architecture adds a row of three "alternative" chips immediately below the hero card, each labeled with a short tag like "🥗 lighter", "🌶 spicier", "💸 cheaper". Implementation should follow Yuzu sticker conventions (border 2px ink, slight rotation on active, hard offset shadow) and keep the hero visually dominant — alts are escape hatches, not equal options.

### Mockup → production porting checklist

**Files to port** (from `design/mockups/`):

| Source | Port to | Refactors needed |
|---|---|---|
| `mascots.jsx` | `app/components/mascots/` (5 SVG components: `MaskotMaki` with `mood='happy'\|'thinking'`, `StickerBadge`, `Chopsticks`, `DishPlaceholder`) | Drop `MaskotDaruma` and `MaskotBowl` (directions B/C). Refactor hardcoded fills to accept color props or use CSS `var(--a-*)` tokens. |
| `dir-a-yuzu.jsx` | 10 React screen components (`ALanding`, `AAddress`, `ABudget`, `AVibe`, `APrefs`, `AAllergies`, `ALoading`, `ARec`, `AFeedback`, `ASignup`) mapped to Next.js routes / wizard steps | Convert inline-style hex values to CSS custom properties (`var(--a-peach-deep)` etc.) and Tailwind utilities where it doesn't break the sticker animation behaviors. Wire the `ALoading` checklist to real SSE events from `/api/recommend` (currently driven by a local `setInterval`). Add the alternatives strip below the hero on `ARec`. |
| `styles.css` | `app/styles/tokens.css` (keep the `.dir-a` block at `:root`) | Drop `.dir-b` and `.dir-c` token blocks. Keep shared keyframes (`wobble`, `float-y`, `spin-slow`, `pulse-ring`, `steam`, `slide-up`, `pop-in`, `marquee`, `blink`) and the `.sticker` / `.no-scrollbar` utilities. |

**Files to ignore** (mockup harness only, no production value):

- `app.jsx`, `design-canvas.jsx`, `desktop.jsx`, `ios-frame.jsx`, `browser-window.jsx`, `tweaks-panel.jsx`, `omakai.food.html` — these power the artboard-style design viewer, not the product
- `dir-b-mincho.jsx`, `dir-c-block.jsx` — alternative directions, archived as reference only

**Two production-only UI extensions not in the mockups:**

1. **Alternatives strip** under `ARec` hero card — three Yuzu-style chips (border 2px ink, hard offset shadow, light rotation on active) tagged "🥗 lighter", "🌶 spicier", "💸 cheaper". Tap fires a lazy Apify + Kimi pipeline for that alt's menu.
2. **SSE-driven loading state** on `ALoading` — replace the local `setInterval` with subscription to `/api/recommend` SSE events so the checklist (`address received`, `menus loaded`, `chef is choosing`, `double-checking allergens`) reflects real backend phase transitions.

**Reduced-motion gate** (per `~/.claude/knowledge/` Finding 5): both the CSS keyframe animations and the `setInterval` driving the loading-phrase rotator must check `matchMedia('(prefers-reduced-motion: reduce)')` and pause/skip when set.

---

## Research findings (appended 2026-04-24)

Conducted via three parallel research subagents (UberEats integration, scraping infrastructure, Claude API prompt caching) plus a knowledge-index review of prior gotchas at `~/.claude/knowledge/INDEX.md`. Several findings warrant changes to the approved Design Concept and need explicit user approval before this research phase can be marked complete.

### Finding 1 — UberEats deep-link granularity (open question #2 from spec)

**Result:** Item-level URLs of the form `https://www.ubereats.com/store/{slug}/{store-uuid}/{item-uuid}` exist and are produced by UberEats's own UI. They open the dish customization modal directly on web, and behave as **universal links** on iOS/Android (open the app if installed, fall back to web). The legacy `ubereats://` scheme also works for installed apps but is undocumented for third parties.

**Hard limit:** **There is no publicly supported way for a third party to pre-fill an UberEats cart.** The ceiling is "open the app/web on the dish modal — user taps Add to Cart themselves."

**Spec implications:**
- Recommendation card CTA copy should be honest: "Open on UberEats" rather than "Add to Cart" — the user still has one tap left.
- The item-UUID URL contract is **stable but undocumented** — treat as best-effort. Build a fallback to restaurant-level URL in the deep-link builder when item-UUID resolution fails.

### Finding 2 — Affiliate program reality (open question #1 from spec)

**Result:** As of early 2026, UberEats does **not** run a public consumer affiliate program a small app can self-serve onboard to. Impact / CJ / Awin / Rakuten coverage is intermittent and historically invitation-only. Skimlinks (auto-monetize outbound links) is the most realistic self-serve path but UberEats coverage and rates fluctuate.

**Spec implications:**
- **Plan MVP economics assuming $0 affiliate revenue.** Treat any commission as upside. Affiliate concerns must not block launch.
- Update Risk 5 (was "affiliate eligibility") to reflect that the realistic baseline is no affiliate at all, with Skimlinks/Impact as opportunistic-bonus paths.
- This shifts the unit economics conversation: Phase 1 monetization is **deferred entirely**; the MVP is a free utility while the loop is validated.

### Finding 3 — Recommended scraping vendor change: **ScrapFly → Apify**

The original Design Concept locked **ScrapFly**. Research shows ScrapFly does **not** have a first-class UberEats template — it's a generic anti-bot shield. UberEats coverage on ScrapFly costs ~50 credits/request at the residential+ASP+JS config, working out to **~$100/mo at 200 reqs/day** on the Pro plan.

**Better fit for our MVP scale:** **Apify actors** specifically for UberEats:

| Actor | Cost | What it returns |
|---|---|---|
| `datacach/ubereats-menu-scraper` | $6.90 / 1,000 menu items | Parsed JSON menus |
| `crscrapers/ubereats-menu-scraper-v2` | comparable | Names, images, products, prices, descriptions, modifiers |

At 200 reqs/day this is **$10-40/mo, fully self-serve, parsed JSON, no HTML parsing or Cloudflare-maintenance burden** — someone else owns breakage. Legal posture is comparable to ScrapFly (both push the gray-area contract onto the vendor / user).

**MealMe** remains the cleanest legal option (legitimate aggregator with publisher contracts) but is **sales-gated with no public pricing tier**, almost certainly blowing the $100/mo MVP cap. Defer until post-revenue.

**Spec change recommended:**
- Replace ScrapFly with Apify (`datacach/ubereats-menu-scraper` or v2 alternative) as the MVP scraping layer.
- Keep ScrapFly in the spec as the documented fallback for the case where the Apify actor breaks and isn't repaired quickly enough.
- Keep MealMe as the post-revenue legitimate-data target.

### Finding 4 — Prompt caching strategy (open question #5 from spec)

**Result:** The dynamic per-user scraped catalog (~5-10k tokens, different every request) **should not be cached** — every request would pay the 1.25× cache-write premium and never get a read, strictly worse than no caching.

**The cacheable-prefix-only strategy:**
```
[tools]                          ← cache_control on last tool
[system: stable instructions]    ← cache_control on last system block
[messages: scraped catalog]      ← NOT cached, dynamic per request
[messages: user inputs]          ← NOT cached
```

**Confirmed parameters (Claude Sonnet 4.6, April 2026):**
- Min cacheable tokens: **2,048** (Sonnet 4.6)
- Max cache breakpoints per request: **4**
- TTLs: **5-min** (no surcharge) and **1-hour** (`"ttl": "1h"`, 2× input write cost)
- Cache read: **0.10×** input cost = $0.30 / MTok
- Cache write: **1.25×** input cost = $3.75 / MTok (5-min TTL)
- Breakeven: ~1 read pays back the write — caching is a net positive on the *first* hit.

**Concrete cost-per-recommendation estimate** (10k total input, 500 output, ~3k cached system, ~7k uncached catalog):
- Cache read: 3,000 × $0.30/M = $0.0009
- Uncached input: 7,000 × $3.00/M = $0.0210
- Output: 500 × $15.00/M = $0.0075
- **Total ≈ $0.0294 per recommendation** (~22% savings vs no caching, ~$0.0375)

**At MVP volume (200 recs/day): ~$5.88/day ≈ $176/mo for LLM.**

**Instrumentation requirement (must implement):** log `usage.cache_creation_input_tokens`, `usage.cache_read_input_tokens`, `usage.input_tokens` on every call to verify hit rate. Target: `cache_read_input_tokens > 0` and `cache_creation_input_tokens == 0` on every request after the first within the TTL.

### Finding 5 — Relevant gotchas from `~/.claude/knowledge/INDEX.md`

| Gotcha entry | Relevance to this MVP |
|---|---|
| **Silent Auto-Correction at Boundaries Hides Contract Violations** | The Output Validator must **reject and log/warn** when the LLM picks a non-existent dish — not silently substitute. Otherwise prompt regressions stay invisible. Treat as a hard rule. |
| **TTL Caches Should Cache Only Stable States** | Reinforces Finding 4: don't cache transient/dynamic states (the per-request catalog). Cache only the stable system prompt. |
| **Cross-Concern Cancellation Gap** | If we ever add the "kick off scrape on address-submit before user finishes wizard" optimization, in-flight scrapes must cancel when the user goes back and edits the address. Otherwise stale results corrupt the recommendation. |
| **color-mix() for Alpha-Blended Design Tokens** | When porting the Yuzu palette to CSS custom properties + Tailwind, use `color-mix(in srgb, var(--a-ink) 10%, transparent)` instead of hardcoded rgba — keeps one source of truth. |
| **prefers-reduced-motion Only Covers CSS; JS Timers Keep Running** | The loading-screen mascot has CSS animations (`float-y`, `wobble`) and a JS `setInterval` rotating loading phrases. Both need a `matchMedia('(prefers-reduced-motion: reduce)')` gate. |

### Updated cost model (post-research)

| Line item | MVP volume (200 recs/day) | Validation volume (1k/day) |
|---|---|---|
| Apify scraping | ~$40/mo | ~$200/mo |
| Claude Sonnet 4.6 (with caching) | ~$176/mo | ~$880/mo |
| Vercel hosting | $0-20/mo (free tier likely fits) | ~$20/mo |
| Domain (omakai.food) | ~$70/yr | ~$70/yr |
| **Total monthly** | **~$220/mo** | **~$1,100/mo** |

Affiliate revenue assumed **$0**.

### Decisions pending user approval before this phase can be closed

To honor the phase-gate handshake, the following decisions need an explicit "approved" or "change" before I write `Research: Complete, Ready for plan`:

1. **Swap ScrapFly → Apify** for MVP scraping (with ScrapFly retained as documented fallback). [Finding 3]
2. **Plan MVP economics with $0 affiliate revenue** baseline; mark affiliate as opportunistic upside, not blocker. [Finding 2]
3. **Adopt the cacheable-prefix-only caching strategy** (system cached, catalog not cached) and implement cache-hit-rate instrumentation from day one. [Finding 4]
4. **Honest deep-link CTA copy** — "Open on UberEats" not "Order on UberEats" (since cart pre-fill isn't supported). [Finding 1]
5. **Adopt all five knowledge-index gotchas** as binding constraints in the implementation. [Finding 5]

### Finding 6 — Kimi + Brave specifics (background research agent, returned 2026-04-24)

**Kimi (Moonshot):**

- **Model:** Latest GA is **Kimi K2.6** (released 2026-04-20). K2.5 still available but the older `kimi-k2-0905-preview`, `kimi-k2-turbo-preview`, `kimi-k2-thinking`, `kimi-k2-thinking-turbo` variants are **scheduled for deprecation 2026-05-25**. **Pin to K2.6.**
- **Pricing (USD per 1M tokens):**
  - K2.6: **$0.95 input · $4.00 output · $0.16 cache-hit input**
  - K2.5: $0.60 input · $2.50 output (cheaper but not the default forward path)
  - Built-in `$web_search` tool: $0.005/call plus tokens (we won't use it; we use Brave directly)
- **API surface:** OpenAI-compatible. Global base URL: **`https://api.moonshot.ai/v1`** (the `.cn` endpoint is China-only — do not use). Auth: `Bearer <MOONSHOT_API_KEY>`. Official `openai` SDK works with `base_url` override; Moonshot publishes a migration guide.
- **Function calling and JSON output:** OpenAI-style `tools` parameter (use `tools`, not deprecated `functions`). `response_format` supports `json_object` and `json_schema` with `strict: true`. Strict mode is solid on K2.5+ but with **occasional schema drift on long context or deeply nested schemas** — wrap each call with a Zod (TS) validator and **one retry on parse failure**.
- **Context caching:** Automatic, no `cache_control` markers needed. Cache-hit billed at ~17% of normal input ($0.16 vs $0.95 on K2.6). No published min-token threshold or explicit TTL — Moonshot describes it as transparent. Keep system prompt + tool schemas byte-identical across calls to maximize hit rate. Optional `prompt_cache_key` hint for grouping.
- **Latency:** No US PoP. From us-east-1 to Asia: **300-500ms pure network** + 800-1500ms TTFT for K2.5 non-thinking. Three sequential calls → ~8-12s of just LLM. Mitigation: consider parallelizing the hero+alts pick (Step 1) with starting a speculative Apify menu fetch on the user's geographic top-rated candidate.
- **Rate limits:** Tier-based by spend. $10 spend → 200 RPM / 50 concurrent. Plenty for MVP volume.

**Brave Search:**

- **Pricing (changed Feb 2026 — important):** Permanent free tier is **gone**. New accounts get **$5/month in credits** (~1,000 queries) then metered at **$5 per 1,000 web requests**. At 6,000 queries/mo (200 recs/day): **~$25/mo net** ($30 raw − $5 credit).
- **Local search:** **Place Search** endpoint at `/res/v1/local/place_search` returns structured business data (name, address, rating, phone, hours, coordinates). **Requires the paid Search plan, not just credits** — confirm subscription before launch.
- **Response shape:** `title`, `postal_address`, `rating: {ratingValue, bestRating, reviewCount}`, `contact`, `opening_hours`, `url`, `coordinates`, `description`, ephemeral `id` (~8h, usable for `/local/pois` enrichment).
- **UberEats filtering:** No first-class "delivery available" flag. Use `site:ubereats.com "<restaurant name>"` web queries to confirm UberEats presence and capture menu URL. **Two-step pattern:** (1) Place Search for restaurant discovery with structured ratings/hours, (2) per-candidate `site:ubereats.com` web query to grab the deep-link URL.
- **US coverage quality:** Competitive with Bing in mainstream metros (NYC/SF/LA/Chicago/Seattle). Weaker in tier-2/3 cities and brand-new openings (<3 months). Bing API was discontinued mid-2025, so Brave is effectively the only independent Western index at API scale — no shopping around.

### Updates this triggers in the consolidation section

The cost model and tech stack in **Implementation architecture (research-phase consolidation)** now have concrete numbers. The relevant changes:

- **LLM:** pin to **Kimi K2.6** (not K2.5). Note 2026-05-25 deprecation deadline for older variants.
- **Endpoint:** `https://api.moonshot.ai/v1` (global), not `.cn`.
- **Cost model — MVP (200 recs/day):**
  - Brave Search: **~$25/mo** ($30 raw − $5 credit)
  - Apify: ~$5-10/mo
  - Kimi K2.6 (≈$0.007-0.009/rec with caching on stable system prompt): **~$45-55/mo**
  - Vercel: $0-20/mo
  - Domain: ~$6/mo
  - **Total: ~$80-115/mo**
- **JSON output reliability:** wrap each Kimi call with a Zod validator + **1 retry** on parse failure.
- **Brave Place Search subscription:** confirm paid Search plan is active before launch (line item beyond per-query cost).
- **Two-step Brave pattern:** Place Search → per-candidate `site:ubereats.com` web query. Means **~4 Brave queries per recommendation** at launch, not 1. Re-check the cost: 4 × 200 × 30 = 24k queries/mo = $120/mo raw − $5 credit = **~$115/mo**. Worth flagging — significantly higher than the single-call assumption.
