import { describe, it, expect } from 'vitest';
import { parseEnv } from '@/lib/env';

const VALID = {
  MOONSHOT_API_KEY: 'sk-test-moonshot',
  BRAVE_SEARCH_API_KEY: 'brave-test-key',
  APIFY_TOKEN: 'apify-test-token',
};

describe('parseEnv', () => {
  it('valid env returns typed config with parsed values', () => {
    const cfg = parseEnv(VALID);
    expect(cfg.MOONSHOT_API_KEY).toBe('sk-test-moonshot');
    expect(cfg.BRAVE_SEARCH_API_KEY).toBe('brave-test-key');
    expect(cfg.APIFY_TOKEN).toBe('apify-test-token');
    expect(cfg.FALLBACK_LLM_ENABLED).toBe(false);
  });

  it('missing MOONSHOT_API_KEY throws with the var name in the message', () => {
    const { MOONSHOT_API_KEY: _omit, ...rest } = VALID;
    void _omit;
    expect(() => parseEnv(rest)).toThrowError(/MOONSHOT_API_KEY/);
  });

  it('malformed MOONSHOT_BASE_URL (non-URL) throws with the var name in the message', () => {
    expect(() => parseEnv({ ...VALID, MOONSHOT_BASE_URL: 'not-a-url' })).toThrowError(
      /MOONSHOT_BASE_URL/,
    );
  });

  it('FALLBACK_LLM_ENABLED=true with FALLBACK_LLM_API_KEY missing throws', () => {
    expect(() =>
      parseEnv({ ...VALID, FALLBACK_LLM_ENABLED: 'true' }),
    ).toThrowError(/FALLBACK_LLM_API_KEY required when FALLBACK_LLM_ENABLED=true/);
  });

  it('FALLBACK_LLM_ENABLED=false allows empty FALLBACK_LLM_API_KEY', () => {
    const cfg = parseEnv({ ...VALID, FALLBACK_LLM_ENABLED: 'false' });
    expect(cfg.FALLBACK_LLM_ENABLED).toBe(false);
    expect(cfg.FALLBACK_LLM_API_KEY).toBeUndefined();
  });

  it('MOONSHOT_BASE_URL defaults to https://api.moonshot.ai/v1', () => {
    const cfg = parseEnv(VALID);
    expect(cfg.MOONSHOT_BASE_URL).toBe('https://api.moonshot.ai/v1');
  });

  it('MOONSHOT_MODEL_ID defaults to kimi-k2.6', () => {
    const cfg = parseEnv(VALID);
    expect(cfg.MOONSHOT_MODEL_ID).toBe('kimi-k2.6');
  });

  it('APIFY_ACTOR_ID defaults to datacach/ubereats-menu-scraper', () => {
    const cfg = parseEnv(VALID);
    expect(cfg.APIFY_ACTOR_ID).toBe('datacach/ubereats-menu-scraper');
  });

  it('UBEREATS_AFFILIATE_TAG is optional and undefined by default', () => {
    const cfg = parseEnv(VALID);
    expect(cfg.UBEREATS_AFFILIATE_TAG).toBeUndefined();
  });

  it('FALLBACK_LLM_ENABLED=true with all fallback vars set parses successfully', () => {
    const cfg = parseEnv({
      ...VALID,
      FALLBACK_LLM_ENABLED: 'true',
      FALLBACK_LLM_API_KEY: 'fb-key',
      FALLBACK_LLM_MODEL_ID: 'gpt-4o-mini',
    });
    expect(cfg.FALLBACK_LLM_ENABLED).toBe(true);
    expect(cfg.FALLBACK_LLM_API_KEY).toBe('fb-key');
    expect(cfg.FALLBACK_LLM_MODEL_ID).toBe('gpt-4o-mini');
  });
});
