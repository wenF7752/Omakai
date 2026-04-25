# omakai.food — project-level CLAUDE.md

This file holds project-specific rules and learned gotchas. The user's global rules at `~/.claude/CLAUDE.md` take precedence; this file augments them with omakai-specific context.

## Source-of-truth files

- **Spec / Design Concept:** `research/omakai-mvp.md`
- **Implementation Plan:** `plans/omakai-mvp.md`
- **Type Contract:** `plans/omakai-mvp-types.md`
- **Test Plan:** `plans/omakai-mvp-tests.md`
- **Visual mockups (reference, do not edit):** `design/mockups/`

When the spec and any other doc conflict, the spec wins. Surface the conflict and update the doc — never silently diverge.

## Learned Rules (gotchas captured during execution)

### Next.js App Router private folders

Folders inside `app/` whose names start with one or more underscores (e.g. `_test`, `__test`) are **private folders** and are excluded from routing — `page.tsx` files inside them return 404. Use a non-underscore-prefixed path for any dev-only routable scratch route.

- ✅ `app/dev/tokens/page.tsx` → `/dev/tokens`
- ❌ `app/__test/tokens/page.tsx` → 404 (private folder)

Source: discovered 2026-04-24 while building Task 2 token smoke route. The Test Plan originally specified `/__test/tokens` URLs; corrected to `/dev/...` and the Test Plan has been updated.

### Turbopack stale-CSS cache after `globals.css` edits

Turbopack (Next.js 16's default bundler in dev mode) sometimes serves a stale CSS bundle after edits to `app/globals.css` — even after `Ctrl-R` reload, killing the dev server, restarting, and `ignoreCache: true` reload. The dev-server log says it's recompiling, but the served bundle URL keeps returning pre-edit content with no Tailwind utilities or custom-property declarations from your changes.

**Workaround that worked:** make any small edit to `globals.css` (e.g., add a comment line), save again, and reload. This re-triggers compilation reliably.

If the workaround fails, escalate to `rm -rf .next` and full server restart (requires user permission for the `rm`).

Source: discovered 2026-04-24 while building Task 2.

### Dev-only scratch routes

Per Test Plan, three scratch routes exist for verification only:

- `/dev/tokens` — Yuzu palette + animation smoke (Task 2)
- `/dev/motion` — reduced-motion CSS verification (Task 14b, not yet built)
- `?force_error=<code>` query handling on `/thinking` — pipeline error injection (Tasks 19, 24, not yet built)

All three must be gated by `process.env.NODE_ENV !== 'production'` (call `notFound()` from `next/navigation` in production). Confirm this gate in every dev-only page before merging.

### `useSyncExternalStore` requires referentially stable snapshots

If `getSnapshot` returns a freshly-allocated object on every call (e.g. `getProfile()` reading from localStorage and constructing a new default each time), React detects that the snapshot "changed" between renders and triggers an infinite re-render loop with the error:

`Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate.`

**Fix pattern:** cache the snapshot keyed by the underlying serialized state. Return the cached object reference whenever the serialized content matches what we last computed:

```ts
let cachedSnapshot: Profile | null = null;
let cachedRaw: string | null = null;

function getProfile(): Profile {
  const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY);
  if (cachedSnapshot && raw === cachedRaw) return cachedSnapshot;
  cachedSnapshot = readStorage() ?? defaultProfile();
  cachedRaw = raw;
  return cachedSnapshot;
}
```

Invalidate the cache on every write path (`writeStorage`, `clearProfile`, cross-tab `storage` event). Tests that bypass `writeStorage` to set localStorage directly still work because the `raw === cachedRaw` comparison detects the change.

Source: discovered 2026-04-24 while building Task 17 (`/address` page) — the wizard route crashed immediately because `useProfile` was called from a client component, hitting the loop.

### Moonshot Kimi: avoid thinking variants for synchronous calls

`kimi-k2.5` and `kimi-k2.6` emit `reasoning_content` (chain-of-thought) that counts against the `max_tokens` budget but is **not** returned in `choices[0].message.content`. With our two sequential Kimi calls (`pickCandidates` + `pickDish`), this turns the pipeline into a 60-120s wait and frequently caps mid-reasoning, returning empty `content` (which we mislabel as `kimi_drift`).

**Fix:** `MOONSHOT_MODEL_ID=kimi-k2-0905-preview` (non-thinking variant) — drops dish-pick from 60-120s to ~4s.

The spec called for non-preview/non-turbo/non-thinking variants. Preview is necessary here for usable UX; treat the rule as "no thinking variants" rather than "no preview variants". Revisit if Moonshot ships a non-preview, non-thinking k2.x.

Also: kimi-k2.5 only accepts `temperature: 1` (HTTP 400 on any other value). Keep that fixed in `lib/kimi/client.ts`.

Source: discovered 2026-04-25 during Task 23 live happy-path run.

### Brave returns stale UberEats URLs — orchestrator must fall back

Brave's index lags behind UberEats restaurant churn. A real-looking URL like `.../store/japanese-soba-noodle-tsuta/rg4riw0jThq9xjOnhSdGmA` can return `[]` from the Apify actor because the store no longer exists at that UUID. This will happen often in production.

**Fix:** `lib/pipeline/orchestrator.ts` runs `fetchMenu` against `[hero, ...alternatives]` in order, breaking on the first non-empty result. A single stale URL no longer kills the pipeline.

Trade-off: each dead candidate costs ~6-8s. We surface a generic `menu_fetch_failed` only if all 4 candidates fail. If you tighten this loop (e.g. parallel fetch then pick first non-empty), keep first-candidate-priority semantics — Kimi's hero pick should still win when it's valid.

Source: discovered 2026-04-25 during Task 23 live happy-path run.

### Apify `datacach/ubereats-menu-scraper` schema is FLAT, not nested

Input: `{store_urls: string[]}` (snake_case, array of plain strings) — **not** `{startUrls: [{url}]}`. Output: a **flat array of menu items** where each row carries `menu_item_*` fields plus duplicated restaurant metadata (`store_id`, `store_url`, `subsection_name`, etc.). Prices in `menu_item_price` are **already in cents** (integer); no need to multiply by 100.

Empty results return `[]` not `{items: []}`. Cold-start runs can take 50s; default timeout in `lib/apify/client.ts` is 90_000ms.

`lib/apify/client.ts` discriminates flat vs legacy nested shapes via `rowsLookFlat` so synthetic test fixtures using `{name, items: [...]}` continue to work — but the actor itself only ever returns flat.

Source: discovered 2026-04-25 during Task 23 live happy-path run.

### Empty `__test` directories

`app/__test/` and `app/__test/tokens/` exist as empty dirs — `rmdir` was permission-blocked when cleaning up after the routing-name correction. They are routing-inert (private folders + empty) so they cause no problem; remove them whenever you have shell access.

## Phase / gate state (2026-04-24)

All five gate markers in place:

- `Design Concept: Approved (2026-04-24)` — `research/omakai-mvp.md`
- `Research: Complete, Ready for plan (2026-04-24)` — `research/omakai-mvp.md`
- `Plan: Approved by user (2026-04-24)` — `plans/omakai-mvp.md`
- `Type Contract: Approved (2026-04-24)` — `plans/omakai-mvp-types.md`
- `Test Plan: Approved (2026-04-24)` — `plans/omakai-mvp-tests.md`

Phase 3 Execute is in progress.

**Tasks fully complete in code:** 1-23, plus Task 24 partial (force-error injection).
**Deferred:**
- Task 24 (per-error-code message tailoring + browser specs)
- Task 25 (LLM eval harness)
- Task 26 (Vercel deploy + custom domain + og-image)
- Task 27 (Vercel Analytics + production log alerts)

**Live happy-path verified 2026-04-25:** wizard → `/result` end-to-end ~22s with hero fallback, ~14s on cache-warm path. Hero dish "Dry Tom Yum Noodle" from Lers Ros Thai - Mission rendered with reasoning, warning, and item-level UberEats deep-link.

**Test count:** 107 unit/integration tests across 17 files, all green. `npm run typecheck`, `npm run lint`, `npm test` all clean.
