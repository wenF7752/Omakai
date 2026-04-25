import type { ItemUuid, StoreUuid } from '@/lib/types';
import { log } from '@/lib/log';

export interface DeepLinkInput {
  restaurant_url: string;
  store_uuid: StoreUuid;
  item_uuid?: ItemUuid;
  affiliate_tag?: string;
}

const STORE_URL_RE = /^https:\/\/www\.ubereats\.com\/store\/([^/]+)\/([^/?#]+)/;

export function buildDeepLink(args: DeepLinkInput): string {
  const match = args.restaurant_url.match(STORE_URL_RE);
  if (!match) {
    throw new Error(`buildDeepLink: restaurant_url is not a valid UberEats store URL: ${args.restaurant_url}`);
  }
  const slug = match[1]!;
  const urlStoreUuid = match[2]!;
  if (urlStoreUuid !== args.store_uuid) {
    throw new Error(
      `buildDeepLink: store_uuid mismatch — URL has "${urlStoreUuid}", arg has "${args.store_uuid}"`,
    );
  }

  let url = `https://www.ubereats.com/store/${slug}/${args.store_uuid}`;
  if (args.item_uuid) {
    url += `/${args.item_uuid}`;
  } else {
    log('warn', 'deeplink_restaurant_only_fallback', {
      reason: 'item_uuid_missing',
      store_uuid: args.store_uuid,
    });
  }
  if (args.affiliate_tag) {
    url += `?ref=${encodeURIComponent(args.affiliate_tag)}`;
  }
  return url;
}
