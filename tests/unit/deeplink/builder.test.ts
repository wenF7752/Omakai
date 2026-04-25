import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildDeepLink } from '@/lib/deeplink/builder';
import type { ItemUuid, StoreUuid } from '@/lib/types';

const STORE = 'abc-123' as StoreUuid;
const ITEM = 'item-uuid-456' as ItemUuid;
const RESTAURANT_URL = 'https://www.ubereats.com/store/koja-kitchen/abc-123';

afterEach(() => vi.restoreAllMocks());

describe('buildDeepLink', () => {
  it('with item_uuid + no affiliate_tag returns dish-level URL', () => {
    const url = buildDeepLink({ restaurant_url: RESTAURANT_URL, store_uuid: STORE, item_uuid: ITEM });
    expect(url).toBe('https://www.ubereats.com/store/koja-kitchen/abc-123/item-uuid-456');
  });

  it('with item_uuid + affiliate_tag appends ?ref=', () => {
    const url = buildDeepLink({
      restaurant_url: RESTAURANT_URL,
      store_uuid: STORE,
      item_uuid: ITEM,
      affiliate_tag: 'omabite',
    });
    expect(url).toBe('https://www.ubereats.com/store/koja-kitchen/abc-123/item-uuid-456?ref=omabite');
  });

  it('without item_uuid returns restaurant-level URL AND warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const url = buildDeepLink({ restaurant_url: RESTAURANT_URL, store_uuid: STORE });
    expect(url).toBe('https://www.ubereats.com/store/koja-kitchen/abc-123');
    expect(warn).toHaveBeenCalled();
  });

  it('without item_uuid + affiliate_tag still appends ?ref=', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const url = buildDeepLink({
      restaurant_url: RESTAURANT_URL,
      store_uuid: STORE,
      affiliate_tag: 'omabite',
    });
    expect(url).toBe('https://www.ubereats.com/store/koja-kitchen/abc-123?ref=omabite');
  });

  it('malformed restaurant_url (non-ubereats.com) throws', () => {
    expect(() =>
      buildDeepLink({
        restaurant_url: 'https://www.yelp.com/biz/koja-kitchen',
        store_uuid: STORE,
        item_uuid: ITEM,
      }),
    ).toThrowError(/restaurant_url/);
  });

  it('store_uuid mismatch with restaurant_url throws', () => {
    expect(() =>
      buildDeepLink({
        restaurant_url: RESTAURANT_URL,
        store_uuid: 'different-uuid' as StoreUuid,
        item_uuid: ITEM,
      }),
    ).toThrowError(/store_uuid/);
  });
});
