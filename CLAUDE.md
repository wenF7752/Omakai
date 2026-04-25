# CLAUDE.md

Hard Rules are absolute. Everything else is "how it works today" — suggest changes if you see better.

**Deep-dive reference:** See `.claude/reference/architecture.md` for the pipeline, routing, profile state, design tokens, and folder structure. Read on demand.

**Maintenance:** After major changes, re-run the init skill.

## Project Overview

Next.js 16.2.4 (App Router, Turbopack) + React 19.2.4 + TypeScript 5 (`strict` + `noUncheckedIndexedAccess`). Wizard-driven dish picker that calls Brave → Kimi → Apify → Kimi via a single SSE endpoint. Tests: Vitest 4 + jsdom + MSW + Testing Library.

## Source-of-truth Docs

- Spec: `research/omakai-mvp.md` · Plan: `plans/omakai-mvp.md` · Type Contract: `plans/omakai-mvp-types.md` · Test Plan: `plans/omakai-mvp-tests.md`
- Visual mockups (do not edit): `design/mockups/`
- Spec wins on conflict. Surface and update — never silently diverge.

## Path Aliases

`@/*` → project root (both `tsconfig.json` and `vitest.config.ts`). Always use `@/lib/...`, `@/components/...`, `@/hooks/...`.

## Non-Obvious Gotchas

- **App Router private folders.** Any folder under `app/` whose name starts with `_` (e.g. `_test`, `__test`) is route-excluded → 404. Use `/dev/...` for scratch routes (gated by `process.env.NODE_ENV !== 'production'`, call `notFound()` in prod).
- **Turbopack stale CSS.** After editing `app/globals.css`, the served bundle can stay stale across reloads. Workaround: re-edit (e.g., add a comment), save, reload. Escalate to `rm -rf .next` only with permission.
- **`useSyncExternalStore` requires referentially stable snapshots.** `getSnapshot` and `getServerSnapshot` must return the same object reference when state is unchanged. `lib/profile/store.ts` caches by serialized localStorage; `hooks/useProfile.ts` uses a module-level `SERVER_SNAPSHOT`. Returning a fresh `defaultProfile()` per call causes "Maximum update depth exceeded".
- **Moonshot: no thinking variants.** `kimi-k2.5`/`k2.6` emit `reasoning_content` that consumes the `max_tokens` budget and leaves `content` empty (mislabelled as `kimi_drift`). Use `kimi-k2-0905-preview`. Also: k2.5 only accepts `temperature: 1`.
- **Brave returns stale UberEats URLs.** `lib/pipeline/orchestrator.ts` walks `[hero, ...alternatives]` and breaks on the first non-empty Apify result. Removing this fallback turns a single dead UUID into a pipeline-killing `menu_fetch_failed`.
- **Apify `datacach/ubereats-menu-scraper` is flat.** Input: `{store_urls: string[]}`. Output: a flat array of menu items where each row carries `menu_item_*` plus duplicated `store_id`/`subsection_name`. Prices in `menu_item_price` are already in cents. Empty result is `[]`. Cold-start runs ~50s; default timeout in `lib/apify/client.ts` is 90 000 ms. `rowsLookFlat` discriminates flat (live) vs legacy nested (test fixtures).
- **`useRecommendation` re-runs on `address.raw` only.** `preferences` are intentionally omitted from the effect deps so typing in the wizard does not restart the SSE pipeline. Two `eslint-disable react-hooks/...` comments mark the controlled-subscription pattern.
- **Wizard text inputs are uncontrolled.** `/address` and `/prefs` use `defaultValue` + `name="..."` and read via `new FormData(e.currentTarget)` on submit, because Enter-to-submit fires before a React-controlled `value` update flushes. Switching them back to controlled drops the typed text on Enter.
- **Profile localStorage key is `omakai_profile` (underscore).** Not `omakai.profile`. Test scripts that probe the wrong key silently read `null`.

## Hard Rules

- **Database / external services are READ ONLY.** Never run mutating SQL or destructive API calls. Apify, Brave, Moonshot are paid; treat live keys with care.
- **Never commit unless explicitly asked.** Never bypass hooks (`--no-verify`, etc.) without permission. Never `git config --global` without permission.
- **Phase gates are hard boundaries.** Don't cross a workflow phase without (a) reading the prereq file, (b) quoting the exact `## Status` marker, (c) naming the next phase, (d) explicit go-ahead. Markers in `research/omakai-mvp.md` and `plans/omakai-mvp.md`.
- **Never edit `design/mockups/`** — reference only, ESLint already ignores them.
- **Dev-only routes (`app/dev/*`, `?force_error=…` on `/thinking`) must call `notFound()` from `next/navigation` when `NODE_ENV === 'production'`.**
- **Verification gate before declaring a feature done:** `npm run typecheck`, `npm run lint`, `npm test` — all clean.

## Learned Rules

(See "Non-Obvious Gotchas" above. New gotchas discovered during work go there with date + source — `lib/...:NN` pointers preferred over prose.)
