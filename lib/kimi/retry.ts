import type { z } from 'zod';
import type { Result } from '@/lib/types';
import { Err, Ok } from '@/lib/types';
import { log } from '@/lib/log';
import type { KimiError, KimiUsage } from '@/lib/kimi/schemas';

const RETRY_REINFORCEMENT =
  'Your previous response did not match the required schema. Return strict valid JSON matching the schema. No prose, no preamble, no code fences.';

function tryParse<T>(schema: z.ZodSchema<T>, raw: string): { ok: true; value: T } | { ok: false } {
  let candidate: unknown;
  try {
    candidate = JSON.parse(raw);
  } catch {
    return { ok: false };
  }
  const parsed = schema.safeParse(candidate);
  if (!parsed.success) return { ok: false };
  return { ok: true, value: parsed.data };
}

export async function parseAndRetry<T>(args: {
  schema: z.ZodSchema<T>;
  invoke: (reinforcement?: string) => Promise<Result<{ raw: string; usage: KimiUsage }, KimiError>>;
}): Promise<Result<{ value: T; usage: KimiUsage }, KimiError>> {
  const { schema, invoke } = args;

  const first = await invoke();
  if (!first.ok) return first;

  const firstParsed = tryParse(schema, first.value.raw);
  if (firstParsed.ok) {
    return Ok({ value: firstParsed.value, usage: first.value.usage });
  }

  log('warn', 'kimi_parse_drift_attempt_1', { raw_preview: first.value.raw.slice(0, 200) });

  const second = await invoke(RETRY_REINFORCEMENT);
  if (!second.ok) return second;

  const secondParsed = tryParse(schema, second.value.raw);
  if (secondParsed.ok) {
    log('info', 'kimi_parse_recovered_on_retry', { attempts: 2 });
    return Ok({ value: secondParsed.value, usage: second.value.usage });
  }

  log('warn', 'kimi_parse_drift_attempt_2', { raw_preview: second.value.raw.slice(0, 400) });
  return Err({ code: 'parse_drift', attempts: 2, raw: second.value.raw });
}
