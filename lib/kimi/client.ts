import type { Result } from '@/lib/types';
import { Err, Ok } from '@/lib/types';
import { getEnv } from '@/lib/env';
import { log } from '@/lib/log';
import type { BraveResult } from '@/lib/brave/types';
import type { Menu, RestaurantCandidate } from '@/lib/apify/types';
import type { ProfilePreferences } from '@/lib/profile/types';
import {
  DishPickSchema,
  type DishPick,
  type KimiError,
  type KimiUsage,
  RestaurantPickSchema,
  type RestaurantPick,
  SentimentSchema,
  type Sentiment,
} from '@/lib/kimi/schemas';
import { SYSTEM_PROMPT, buildCandidatesPrompt, buildDishPrompt, buildSentimentPrompt } from '@/lib/kimi/prompts';
import { parseAndRetry } from '@/lib/kimi/retry';

interface MoonshotResponse {
  choices: Array<{ message: { role: string; content: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    cached_tokens?: number;
    prompt_cache_hit_tokens?: number;
    prompt_cache_miss_tokens?: number;
  };
}

function mapUsage(u: MoonshotResponse['usage']): KimiUsage {
  const cacheHit = u?.prompt_cache_hit_tokens ?? u?.cached_tokens ?? 0;
  const cacheMiss = u?.prompt_cache_miss_tokens ?? Math.max((u?.prompt_tokens ?? 0) - cacheHit, 0);
  return {
    input_tokens: u?.prompt_tokens ?? 0,
    output_tokens: u?.completion_tokens ?? 0,
    cache_creation_input_tokens: cacheMiss,
    cache_read_input_tokens: cacheHit,
  };
}

async function callKimi(args: {
  systemPrompt: string;
  userPrompt: string;
  reinforcement?: string;
  signal?: AbortSignal;
}): Promise<Result<{ raw: string; usage: KimiUsage }, KimiError>> {
  const env = getEnv();
  const url = `${env.MOONSHOT_BASE_URL}/chat/completions`;
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: args.systemPrompt },
    { role: 'user', content: args.userPrompt },
  ];
  if (args.reinforcement) {
    messages.push({ role: 'user', content: args.reinforcement });
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.MOONSHOT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.MOONSHOT_MODEL_ID,
        messages,
        // Moonshot's kimi-k2.5 requires temperature: 1; k2.6 also accepts it.
        // Sending 0.3 produces HTTP 400 "invalid temperature: only 1 is allowed
        // for this model" on k2.5, which we'd otherwise mislabel as parse drift.
        temperature: 1,
        // Cap output. Both k2.5 and k2.6 emit `reasoning_content` (chain-of-
        // thought that doesn't appear in `content`) which counts against this
        // budget. With 4 Brave candidates the reasoning runs ~600 tokens, then
        // the JSON `content` needs another 250-400. 2048 leaves headroom; lower
        // values caused empty `content` (output capped mid-reasoning).
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      }),
      signal: args.signal,
    });
  } catch (cause) {
    if (cause instanceof Error && cause.name === 'AbortError') throw cause;
    return Err({ code: 'network_error', cause: cause instanceof Error ? cause.message : String(cause) });
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After') ?? '0');
    return Err({ code: 'rate_limited', retry_after_ms: Math.max(0, retryAfter) * 1000 });
  }
  if (response.status >= 500) {
    const body = await response.text();
    return Err({ code: 'http_5xx', status: response.status, body });
  }
  if (!response.ok) {
    const body = await response.text();
    log('warn', 'kimi_http_non_ok', { status: response.status, body: body.slice(0, 400) });
    return Err({ code: 'network_error', cause: `HTTP ${response.status}: ${body.slice(0, 200)}` });
  }

  const body = (await response.json()) as MoonshotResponse;
  const raw = body.choices[0]?.message.content ?? '';
  const usage = mapUsage(body.usage);
  log('info', 'kimi_call', {
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    cache_creation_input_tokens: usage.cache_creation_input_tokens,
    cache_read_input_tokens: usage.cache_read_input_tokens,
  });
  return Ok({ raw, usage });
}

export async function pickCandidates(args: {
  inputs: ProfilePreferences;
  candidates: BraveResult[];
  avoid_restaurants?: string[];
  signal?: AbortSignal;
}): Promise<Result<{ pick: RestaurantPick; usage: KimiUsage }, KimiError>> {
  const userPrompt = buildCandidatesPrompt({
    inputs: args.inputs,
    candidates: args.candidates,
    avoid_restaurants: args.avoid_restaurants ?? [],
  });
  const result = await parseAndRetry({
    schema: RestaurantPickSchema,
    invoke: (reinforcement) =>
      callKimi({ systemPrompt: SYSTEM_PROMPT, userPrompt, reinforcement, signal: args.signal }),
  });
  if (!result.ok) return result;
  return Ok({ pick: result.value.value, usage: result.value.usage });
}

export async function pickDish(args: {
  inputs: ProfilePreferences;
  restaurant: RestaurantCandidate;
  menu: Menu;
  avoid_dishes?: string[];
  signal?: AbortSignal;
}): Promise<Result<{ pick: DishPick; usage: KimiUsage }, KimiError>> {
  const userPrompt = buildDishPrompt({
    inputs: args.inputs,
    restaurant: args.restaurant,
    menu: args.menu,
    avoid_dishes: args.avoid_dishes ?? [],
  });
  log('info', 'kimi_dish_prompt', {
    menu_ids: args.menu.items.map((m) => m.id),
    menu_names: args.menu.items.map((m) => m.name),
    item_count: args.menu.items.length,
  });
  const result = await parseAndRetry({
    schema: DishPickSchema,
    invoke: (reinforcement) =>
      callKimi({ systemPrompt: SYSTEM_PROMPT, userPrompt, reinforcement, signal: args.signal }),
  });
  if (!result.ok) return result;
  log('info', 'kimi_dish_pick', { dish_id: result.value.value.dish_id });
  return Ok({ pick: result.value.value, usage: result.value.usage });
}

export async function pickSentiment(args: {
  restaurantName: string;
  snippets: { title: string; description: string }[];
  signal?: AbortSignal;
}): Promise<Result<{ sentiment: Sentiment; usage: KimiUsage }, KimiError>> {
  const userPrompt = buildSentimentPrompt({
    restaurantName: args.restaurantName,
    snippets: args.snippets,
  });
  const result = await parseAndRetry({
    schema: SentimentSchema,
    invoke: (reinforcement) =>
      callKimi({ systemPrompt: SYSTEM_PROMPT, userPrompt, reinforcement, signal: args.signal }),
  });
  if (!result.ok) return result;
  log('info', 'kimi_sentiment', { score: result.value.value.score });
  return Ok({ sentiment: result.value.value, usage: result.value.usage });
}
