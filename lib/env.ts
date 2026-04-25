import { z } from 'zod';

const boolFromString = z
  .union([z.boolean(), z.literal('true'), z.literal('false'), z.literal('1'), z.literal('0'), z.literal('')])
  .transform((v) => v === true || v === 'true' || v === '1');

const baseSchema = z.object({
  MOONSHOT_API_KEY: z.string().min(1, 'MOONSHOT_API_KEY is required'),
  MOONSHOT_BASE_URL: z.string().url({ message: 'MOONSHOT_BASE_URL must be a valid URL' }).default('https://api.moonshot.ai/v1'),
  MOONSHOT_MODEL_ID: z.string().min(1).default('kimi-k2.6'),

  BRAVE_SEARCH_API_KEY: z.string().min(1, 'BRAVE_SEARCH_API_KEY is required'),

  APIFY_TOKEN: z.string().min(1, 'APIFY_TOKEN is required'),
  APIFY_ACTOR_ID: z.string().min(1).default('datacach/ubereats-menu-scraper'),

  UBEREATS_AFFILIATE_TAG: z.string().min(1).optional(),

  FALLBACK_LLM_ENABLED: boolFromString.default(false),
  FALLBACK_LLM_API_KEY: z.string().min(1).optional(),
  FALLBACK_LLM_MODEL_ID: z.string().min(1).optional(),
});

const envSchema = baseSchema.superRefine((cfg, ctx) => {
  if (cfg.FALLBACK_LLM_ENABLED) {
    if (!cfg.FALLBACK_LLM_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['FALLBACK_LLM_API_KEY'],
        message: 'FALLBACK_LLM_API_KEY required when FALLBACK_LLM_ENABLED=true',
      });
    }
    if (!cfg.FALLBACK_LLM_MODEL_ID) {
      ctx.addIssue({
        code: 'custom',
        path: ['FALLBACK_LLM_MODEL_ID'],
        message: 'FALLBACK_LLM_MODEL_ID required when FALLBACK_LLM_ENABLED=true',
      });
    }
  }
});

export type EnvConfig = z.infer<typeof envSchema>;

export function parseEnv(input: Record<string, string | undefined>): EnvConfig {
  const result = envSchema.safeParse(input);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return result.data;
}

let cached: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (cached) return cached;
  cached = parseEnv(process.env as Record<string, string | undefined>);
  return cached;
}
