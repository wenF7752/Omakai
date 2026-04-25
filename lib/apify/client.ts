import type { Result } from '@/lib/types';
import { Err, Ok } from '@/lib/types';
import type { DishId, RestaurantId, StoreUuid } from '@/lib/types';
import { getEnv } from '@/lib/env';
import { log } from '@/lib/log';
import type { ApifyError, Menu, MenuItem } from '@/lib/apify/types';

const DEFAULT_TIMEOUT_MS = 90_000;

// Actor row schema for `datacach/ubereats-menu-scraper` — the actor returns a
// FLAT array of menu items (one row per dish), with restaurant metadata
// duplicated on each row. Field names use snake_case `menu_item_*`.
interface ActorRow {
  menu_item_id?: string;
  menu_item_name?: string;
  menu_item_price?: number;
  menu_item_price_tagline?: { text?: string };
  menu_item_description?: string | null;
  menu_item_image?: string;
  store_id?: string;
  store_url?: string;
  subsection_name?: string;
  is_available?: boolean;
  is_sold_out?: boolean;

  // Backward-compat with the synthetic test fixtures that use a nested shape.
  name?: string;
  title?: string;
  storeName?: string;
  items?: LegacyItem[];
  menuItems?: LegacyItem[];
}

interface LegacyItem {
  id?: string;
  itemId?: string;
  name?: string;
  title?: string;
  price?: string | number;
  priceCents?: number;
  description?: string;
  ingredients?: string[];
  modifiers?: string[];
  photoUrl?: string;
  photo_url?: string;
}

function parseStoreUuid(url: string): StoreUuid | null {
  const match = url.match(/\/store\/[^/]+\/([^/?#]+)/);
  if (!match || !match[1]) return null;
  return match[1] as StoreUuid;
}

function priceTaglineToCents(tagline: string): number {
  const cleaned = tagline.replace(/[^\d.]/g, '');
  if (!cleaned) return 0;
  return Math.round(Number.parseFloat(cleaned) * 100);
}

function legacyPriceToCents(p: string | number | undefined): number {
  if (typeof p === 'number') return Math.round(p);
  if (typeof p !== 'string') return 0;
  const cleaned = p.replace(/[^\d.]/g, '');
  if (!cleaned) return 0;
  return Math.round(Number.parseFloat(cleaned) * 100);
}

function rowsLookFlat(rows: ActorRow[]): boolean {
  return rows.some((r) => r.menu_item_id !== undefined || r.menu_item_name !== undefined);
}

function slugToName(url: string): string {
  const match = url.match(/\/store\/([^/]+)\//);
  if (!match || !match[1]) return 'Unknown';
  return match[1]
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function normalizeFlatRows(rows: ActorRow[]): { items: MenuItem[]; restaurantName: string; storeUuid: StoreUuid | null } {
  const items: MenuItem[] = [];
  let storeUuid: StoreUuid | null = null;
  let restaurantName = 'Unknown';

  for (const row of rows) {
    if (row.is_sold_out || row.is_available === false) continue;
    const id = row.menu_item_id;
    const name = row.menu_item_name;
    if (!id || !name) continue;

    const priceCents =
      typeof row.menu_item_price === 'number'
        ? row.menu_item_price
        : row.menu_item_price_tagline?.text
        ? priceTaglineToCents(row.menu_item_price_tagline.text)
        : 0;

    const item: MenuItem = {
      id: id as DishId,
      name,
      description: row.menu_item_description ?? '',
      price_cents: priceCents,
    };
    if (row.menu_item_image) item.photo_url = row.menu_item_image;
    if (row.subsection_name) item.subsection_name = row.subsection_name;
    items.push(item);

    if (!storeUuid && row.store_id) storeUuid = row.store_id as StoreUuid;
    if (row.store_url) restaurantName = slugToName(row.store_url);
  }

  return { items, restaurantName, storeUuid };
}

function normalizeLegacyRow(row: ActorRow): { items: MenuItem[]; restaurantName: string } {
  const raw = row.items ?? row.menuItems ?? [];
  const items: MenuItem[] = raw
    .map((r): MenuItem | null => {
      const id = r.id ?? r.itemId;
      const name = r.name ?? r.title;
      if (!id || !name) return null;
      const priceCents = r.priceCents ?? legacyPriceToCents(r.price);
      const item: MenuItem = {
        id: id as DishId,
        name,
        description: r.description ?? '',
        price_cents: priceCents,
      };
      if (r.ingredients) item.ingredients = r.ingredients;
      if (r.modifiers) item.modifiers = r.modifiers;
      const photo = r.photoUrl ?? r.photo_url;
      if (photo) item.photo_url = photo;
      return item;
    })
    .filter((i): i is MenuItem => i !== null);

  return {
    items,
    restaurantName: row.name ?? row.title ?? row.storeName ?? 'Unknown',
  };
}

export async function fetchMenu(args: {
  url: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<Result<Menu, ApifyError>> {
  const env = getEnv();
  const storeUuid = parseStoreUuid(args.url);
  if (!storeUuid) {
    return Err({ code: 'menu_fetch_failed', cause: `Could not parse store_uuid from URL: ${args.url}` });
  }

  const actorPath = env.APIFY_ACTOR_ID.replace('/', '~');
  const apiUrl = new URL(`https://api.apify.com/v2/acts/${actorPath}/run-sync-get-dataset-items`);
  apiUrl.searchParams.set('token', env.APIFY_TOKEN);

  const timeoutMs = args.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  const compositeSignal = args.signal
    ? AbortSignal.any([args.signal, timeoutController.signal])
    : timeoutController.signal;

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The datacach/ubereats-menu-scraper actor expects `store_urls: string[]`.
      body: JSON.stringify({ store_urls: [args.url] }),
      signal: compositeSignal,
    });
  } catch (cause) {
    clearTimeout(timeoutId);
    if (args.signal?.aborted) {
      const abortErr = new Error('aborted');
      abortErr.name = 'AbortError';
      throw abortErr;
    }
    if (timeoutController.signal.aborted) {
      log('warn', 'apify_timeout', { ms: timeoutMs, url: args.url });
      return Err({ code: 'timeout', ms: timeoutMs });
    }
    if (cause instanceof Error && cause.name === 'AbortError') throw cause;
    log('warn', 'apify_network_error', {
      url: args.url,
      cause: cause instanceof Error ? cause.message : String(cause),
    });
    return Err({
      code: 'network_error',
      cause: cause instanceof Error ? cause.message : String(cause),
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401) {
    log('warn', 'apify_auth_failed', { url: args.url });
    return Err({ code: 'auth_failed' });
  }
  if (response.status >= 500) {
    const body = await response.text();
    log('warn', 'apify_http_5xx', { status: response.status, url: args.url, body: body.slice(0, 400) });
    return Err({ code: 'menu_fetch_failed', cause: `HTTP ${response.status}: ${body.slice(0, 200)}` });
  }
  if (!response.ok) {
    const body = await response.text();
    log('warn', 'apify_http_non_ok', { status: response.status, url: args.url, body: body.slice(0, 400) });
    return Err({ code: 'menu_fetch_failed', cause: `HTTP ${response.status}: ${body.slice(0, 200)}` });
  }

  const rows = (await response.json()) as ActorRow[];
  if (!Array.isArray(rows) || rows.length === 0) {
    log('warn', 'apify_empty_dataset', {
      url: args.url,
      is_array: Array.isArray(rows),
      length: Array.isArray(rows) ? rows.length : 0,
    });
    return Err({ code: 'empty_menu' });
  }

  let items: MenuItem[];
  let restaurantName: string;
  let parsedStoreUuid: StoreUuid = storeUuid;

  if (rowsLookFlat(rows)) {
    const flat = normalizeFlatRows(rows);
    items = flat.items;
    restaurantName = flat.restaurantName;
    if (flat.storeUuid) parsedStoreUuid = flat.storeUuid;
  } else {
    const legacy = normalizeLegacyRow(rows[0]!);
    items = legacy.items;
    restaurantName = legacy.restaurantName;
  }

  if (items.length === 0) {
    log('warn', 'apify_empty_after_normalize', {
      url: args.url,
      raw_rows: rows.length,
      shape: rowsLookFlat(rows) ? 'flat' : 'legacy',
      sample_keys: Object.keys(rows[0] ?? {}).slice(0, 12),
    });
    return Err({ code: 'empty_menu' });
  }
  log('info', 'apify_menu_ok', {
    url: args.url,
    item_count: items.length,
    shape: rowsLookFlat(rows) ? 'flat' : 'legacy',
  });

  return Ok({
    restaurant_id: parsedStoreUuid as unknown as RestaurantId,
    restaurant_name: restaurantName,
    store_uuid: parsedStoreUuid,
    items,
    fetched_at: Date.now(),
  });
}
