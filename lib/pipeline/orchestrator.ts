import type { Address, ProfilePreferences, RecentPick } from '@/lib/profile/types';
import type { Allergen, RestaurantId, StoreUuid, AlternativeTag } from '@/lib/types';
import type { BraveResult } from '@/lib/brave/types';
import type { ApifyError, Menu, RestaurantCandidate } from '@/lib/apify/types';
import type { RestaurantPick } from '@/lib/kimi/schemas';
import type { AlternativeOption, LogEntry, LogKind, LogStage, PipelineEvent } from '@/lib/pipeline/events';
import { searchReviews, searchUberEatsNear } from '@/lib/brave/client';
import { pickCandidates, pickDish, pickSentiment } from '@/lib/kimi/client';
import { fetchMenu } from '@/lib/apify/client';
import { assertConsistency } from '@/lib/pipeline/validator';
import { buildDeepLink } from '@/lib/deeplink/builder';
import { getEnv } from '@/lib/env';
import { log } from '@/lib/log';

const STORE_UUID_RE = /\/store\/[^/]+\/([^/?#]+)/;
const NON_MAIN_SECTION_RE =
  /\b(appetizer|starter|side|drink|beverage|dessert|sauce|soup|salad add-on|extra|kid|toppings?|condiment)\b/i;

function filterToMains(menu: Menu): Menu {
  const mains = menu.items.filter((m) => !m.subsection_name || !NON_MAIN_SECTION_RE.test(m.subsection_name));
  if (mains.length === 0) return menu;
  return { ...menu, items: mains };
}

function logEvent(
  stage: LogStage,
  kind: LogKind,
  text: string,
  extras?: { count?: string; status?: string },
): { type: 'log'; entry: LogEntry } {
  const entry: LogEntry = { ts: Date.now(), stage, kind, text };
  if (extras?.count) entry.count = extras.count;
  if (extras?.status) entry.status = extras.status;
  return { type: 'log', entry };
}

function urlToCandidate(result: BraveResult): RestaurantCandidate | null {
  const match = result.url.match(STORE_UUID_RE);
  if (!match || !match[1]) return null;
  const storeUuid = match[1] as StoreUuid;
  const candidate: RestaurantCandidate = {
    restaurant_id: storeUuid as unknown as RestaurantId,
    name: result.title,
    url: result.url,
    store_uuid: storeUuid,
    description: result.description,
  };
  if (result.rating) candidate.rating = result.rating;
  return candidate;
}

function buildAlternatives(
  pick: RestaurantPick,
  candidatesByUrl: Map<string, RestaurantCandidate>,
): AlternativeOption[] {
  const alts: AlternativeOption[] = [];
  for (const a of pick.alternatives) {
    const c = candidatesByUrl.get(a.url);
    if (c) alts.push({ candidate: c, tag: a.tag as AlternativeTag });
  }
  return alts;
}

function composeQuery(prefs: ProfilePreferences): string {
  const parts = [...prefs.cuisines, ...prefs.vibes, prefs.free_text].filter(Boolean);
  return parts.join(' ').trim() || 'restaurant';
}

function countInputs(prefs: ProfilePreferences): number {
  return (
    prefs.cuisines.length +
    prefs.vibes.length +
    prefs.allergies.length +
    (prefs.free_text ? 1 : 0) +
    1 // budget
  );
}

function findItemUuid(menu: Menu, dishId: string): string | undefined {
  return menu.items.find((m) => m.id === dishId)?.id;
}

const EXCLUDE_WINDOW = 5;

interface Excludes {
  restaurant_uuids: Set<string>;
  dish_ids: Set<string>;
  recent_names: { restaurants: string[]; dishes: string[] };
}

function buildExcludes(recent: RecentPick[]): Excludes {
  const slice = recent.slice(-EXCLUDE_WINDOW);
  return {
    restaurant_uuids: new Set(slice.map((p) => String(p.restaurant_id))),
    dish_ids: new Set(slice.map((p) => String(p.dish_id))),
    recent_names: {
      restaurants: Array.from(new Set(slice.map((p) => p.restaurant_name).filter(Boolean))),
      dishes: slice.map((p) => p.dish_name).filter(Boolean),
    },
  };
}

export async function* runPipeline(args: {
  inputs: ProfilePreferences;
  address: Address;
  recent_picks?: RecentPick[];
  signal: AbortSignal;
}): AsyncGenerator<PipelineEvent, void, void> {
  const { inputs, address, signal } = args;
  const excludes = buildExcludes(args.recent_picks ?? []);

  try {
    yield { type: 'phase', phase: 'address_received' };
    yield logEvent('looking', 'system', 'job started', {
      count: `${countInputs(inputs)} inputs`,
    });
    yield logEvent('looking', 'info', `detected location · ${address.raw}`);
    if (signal.aborted) {
      yield { type: 'error', error: { code: 'aborted' } };
      return;
    }

    yield { type: 'phase', phase: 'searching_restaurants' };
    yield logEvent('looking', 'info', `searching restaurants · "${composeQuery(inputs)}"`);
    const braveResult = await searchUberEatsNear({
      query: composeQuery(inputs),
      location: address.raw,
      signal,
    });
    if (signal.aborted) {
      yield { type: 'error', error: { code: 'aborted' } };
      return;
    }
    if (!braveResult.ok) {
      yield {
        type: 'error',
        error: { code: 'unknown', cause: `brave_${braveResult.error.code}` },
      };
      return;
    }
    if (braveResult.value.length === 0) {
      yield {
        type: 'error',
        error: { code: 'no_candidates', message: 'limited coverage in your area' },
      };
      return;
    }
    // Brave mixes /store/<slug>/<uuid> pages with /neighborhood/... directory
    // pages. Only the former map to actual restaurants — drop the rest before
    // either Kimi sees them or excludes apply.
    const storeOnly = braveResult.value.filter((r) => STORE_UUID_RE.test(r.url));
    if (storeOnly.length === 0) {
      yield {
        type: 'error',
        error: { code: 'no_candidates', message: 'limited coverage in your area' },
      };
      return;
    }
    yield logEvent('looking', 'system', 'found candidates', {
      count: `${storeOnly.length} restaurants`,
    });

    // Hard filter: drop restaurants the diner just had. If the filter empties
    // the pool (rare — small market, or all 5 most-recent picks were here),
    // fall back to the unfiltered store list rather than failing.
    const filteredByExclude = excludes.restaurant_uuids.size > 0
      ? storeOnly.filter((r) => {
          const m = r.url.match(STORE_UUID_RE);
          return !m?.[1] || !excludes.restaurant_uuids.has(m[1]);
        })
      : storeOnly;
    const candidatePool = filteredByExclude.length > 0 ? filteredByExclude : storeOnly;
    if (excludes.restaurant_uuids.size > 0) {
      const dropped = storeOnly.length - candidatePool.length;
      if (dropped > 0) {
        yield logEvent('looking', 'flag', `skipping recent restaurants`, { count: `${dropped}` });
      }
    }
    for (const r of candidatePool.slice(0, 6)) {
      yield logEvent('looking', 'read', `read listing · ${r.title}`);
    }

    yield { type: 'phase', phase: 'picking_candidates' };
    yield logEvent('matching', 'system', 'matching against your prefs…');
    const pickResult = await pickCandidates({
      inputs,
      candidates: candidatePool,
      avoid_restaurants: excludes.recent_names.restaurants,
      signal,
    });
    if (signal.aborted) {
      yield { type: 'error', error: { code: 'aborted' } };
      return;
    }
    if (!pickResult.ok) {
      yield { type: 'error', error: { code: 'kimi_drift', cause: pickResult.error } };
      return;
    }

    const candidatesByUrl = new Map<string, RestaurantCandidate>();
    for (const r of candidatePool) {
      const c = urlToCandidate(r);
      if (c) candidatesByUrl.set(r.url, c);
    }
    const hero = candidatesByUrl.get(pickResult.value.pick.hero_url);
    if (!hero) {
      yield {
        type: 'error',
        error: { code: 'unknown', cause: 'kimi_picked_unknown_hero_url' },
      };
      return;
    }
    const alternatives = buildAlternatives(pickResult.value.pick, candidatesByUrl);
    log('info', 'orchestrator_picked', {
      query: composeQuery(inputs),
      hero_url: hero.url,
      alternative_urls: alternatives.map((a) => a.candidate.url),
    });
    yield logEvent('matching', 'pick', `shortlisted · ${hero.name}`);
    for (const a of alternatives) {
      yield logEvent('matching', 'pick', `shortlisted · ${a.candidate.name}`, { status: a.tag });
    }
    yield { type: 'candidates', hero, alternatives };

    yield { type: 'phase', phase: 'fetching_menu' };
    yield logEvent('matching', 'system', 'reading menus…');
    const menuChain = [hero, ...alternatives.map((a) => a.candidate)];
    let chosen: { restaurant: RestaurantCandidate; menu: Menu } | null = null;
    let lastFetchError: ApifyError | null = null;
    for (const candidate of menuChain) {
      if (signal.aborted) {
        yield { type: 'error', error: { code: 'aborted' } };
        return;
      }
      const menuResult = await fetchMenu({ url: candidate.url, signal });
      if (menuResult.ok) {
        chosen = {
          restaurant: candidate,
          menu: { ...menuResult.value, restaurant_id: candidate.restaurant_id },
        };
        yield logEvent('matching', 'read', `read menu · ${candidate.name}`, {
          count: `${menuResult.value.items.length} dishes`,
        });
        break;
      }
      lastFetchError = menuResult.error;
      yield logEvent('matching', 'flag', `skipped · ${candidate.name}`, { status: 'no menu data' });
      log('warn', 'orchestrator_menu_fallback', {
        failed_url: candidate.url,
        error: menuResult.error,
        remaining: menuChain.length - menuChain.indexOf(candidate) - 1,
      });
    }
    if (!chosen) {
      yield {
        type: 'error',
        error: {
          code: 'menu_fetch_failed',
          cause: lastFetchError ?? { code: 'menu_fetch_failed', cause: 'no candidates' },
        },
      };
      return;
    }

    yield* runFromFetchedMenu({
      inputs,
      restaurant: chosen.restaurant,
      menu: chosen.menu,
      candidates: menuChain,
      declared_allergies: inputs.allergies,
      excludes,
      signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      yield { type: 'error', error: { code: 'aborted' } };
      return;
    }
    yield {
      type: 'error',
      error: { code: 'unknown', cause: err instanceof Error ? err.message : String(err) },
    };
  }
}

export async function* runAlternative(args: {
  inputs: ProfilePreferences;
  alternative: RestaurantCandidate;
  declared_allergies: Allergen[];
  signal: AbortSignal;
}): AsyncGenerator<PipelineEvent, void, void> {
  try {
    yield* runFromMenu({
      inputs: args.inputs,
      restaurant: args.alternative,
      candidates: [args.alternative],
      declared_allergies: args.declared_allergies,
      signal: args.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      yield { type: 'error', error: { code: 'aborted' } };
      return;
    }
    yield {
      type: 'error',
      error: { code: 'unknown', cause: err instanceof Error ? err.message : String(err) },
    };
  }
}

async function* runFromMenu(args: {
  inputs: ProfilePreferences;
  restaurant: RestaurantCandidate;
  candidates: RestaurantCandidate[];
  declared_allergies: Allergen[];
  signal: AbortSignal;
}): AsyncGenerator<PipelineEvent, void, void> {
  const { inputs, restaurant, candidates, declared_allergies, signal } = args;

  yield { type: 'phase', phase: 'fetching_menu' };
  const menuResult = await fetchMenu({ url: restaurant.url, signal });
  if (signal.aborted) {
    yield { type: 'error', error: { code: 'aborted' } };
    return;
  }
  if (!menuResult.ok) {
    yield { type: 'error', error: { code: 'menu_fetch_failed', cause: menuResult.error } };
    return;
  }
  const menu: Menu = { ...menuResult.value, restaurant_id: restaurant.restaurant_id };
  yield* runFromFetchedMenu({ inputs, restaurant, menu, candidates, declared_allergies, signal });
}

async function* runFromFetchedMenu(args: {
  inputs: ProfilePreferences;
  restaurant: RestaurantCandidate;
  menu: Menu;
  candidates: RestaurantCandidate[];
  declared_allergies: Allergen[];
  excludes?: Excludes;
  signal: AbortSignal;
}): AsyncGenerator<PipelineEvent, void, void> {
  const { inputs, restaurant, menu, candidates, declared_allergies, signal } = args;
  const excludes = args.excludes;
  const env = getEnv();

  yield { type: 'phase', phase: 'picking_dish' };
  const mainsMenu = filterToMains(menu);
  const stripped = menu.items.length - mainsMenu.items.length;
  if (stripped > 0) {
    yield logEvent('ranking', 'flag', 'filtered out non-mains', { count: `${stripped} items` });
  }
  // Hard filter: drop dishes the diner just had. Same fallback rule as the
  // restaurant filter — never empty the pool.
  const dishExcludes = excludes?.dish_ids;
  const candidateMenu =
    dishExcludes && dishExcludes.size > 0
      ? (() => {
          const filtered = mainsMenu.items.filter((m) => !dishExcludes.has(String(m.id)));
          return filtered.length > 0 ? { ...mainsMenu, items: filtered } : mainsMenu;
        })()
      : mainsMenu;
  if (dishExcludes && candidateMenu.items.length < mainsMenu.items.length) {
    yield logEvent('ranking', 'flag', 'skipping recent dishes', {
      count: `${mainsMenu.items.length - candidateMenu.items.length}`,
    });
  }
  yield logEvent('ranking', 'system', `ranking ${candidateMenu.items.length} candidate dishes…`);
  const dishResult = await pickDish({
    inputs,
    restaurant,
    menu: candidateMenu,
    avoid_dishes: excludes?.recent_names.dishes ?? [],
    signal,
  });
  if (signal.aborted) {
    yield { type: 'error', error: { code: 'aborted' } };
    return;
  }
  if (!dishResult.ok) {
    yield { type: 'error', error: { code: 'kimi_drift', cause: dishResult.error } };
    return;
  }

  yield logEvent('ranking', 'pick', `picked · ${dishResult.value.pick.dish_id.slice(0, 8)}`);
  yield { type: 'phase', phase: 'validating' };
  yield logEvent('ranking', 'info', 'cross-checking allergens…');
  const validated = assertConsistency({
    candidates,
    menu: candidateMenu,
    dish_pick: dishResult.value.pick,
    reasoning: dishResult.value.pick.reasoning,
    declared_allergies,
  });
  if (!validated.ok) {
    const code = validated.error.code === 'allergen_violation' ? 'allergen_violation' : 'validator_reject';
    yield { type: 'error', error: { code, cause: validated.error } };
    return;
  }
  yield logEvent('ranking', 'info', 'reading diner reviews…');
  const reviewSearch = await searchReviews({ restaurantName: restaurant.name, signal });
  if (signal.aborted) {
    yield { type: 'error', error: { code: 'aborted' } };
    return;
  }
  if (reviewSearch.ok && reviewSearch.value.length > 0) {
    const sentimentResult = await pickSentiment({
      restaurantName: restaurant.name,
      snippets: reviewSearch.value,
      signal,
    });
    if (sentimentResult.ok) {
      validated.value.sentiment = sentimentResult.value.sentiment;
      yield logEvent('ranking', 'info', `diner sentiment · ${sentimentResult.value.sentiment.score.toFixed(1)} / 5`);
    } else {
      log('warn', 'sentiment_failed', { error: sentimentResult.error });
    }
  } else if (!reviewSearch.ok) {
    log('warn', 'review_search_failed', { error: reviewSearch.error });
  }

  const itemUuid = findItemUuid(candidateMenu, dishResult.value.pick.dish_id);
  const deep_link = buildDeepLink({
    restaurant_url: restaurant.url,
    store_uuid: restaurant.store_uuid,
    ...(itemUuid ? { item_uuid: itemUuid as never } : {}),
    ...(env.UBEREATS_AFFILIATE_TAG ? { affiliate_tag: env.UBEREATS_AFFILIATE_TAG } : {}),
  });

  yield logEvent('ready', 'system', 'plating up · opening recommendation');
  yield { type: 'phase', phase: 'done' };
  yield { type: 'result', recommendation: validated.value, deep_link };
}
