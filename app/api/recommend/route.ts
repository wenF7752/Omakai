import { z } from 'zod';
import { runAlternative, runPipeline } from '@/lib/pipeline/orchestrator';
import { serializeEvent, type PipelineEvent } from '@/lib/pipeline/events';

const ALLERGENS = z.enum([
  'peanut',
  'tree_nut',
  'shellfish',
  'dairy',
  'gluten',
  'egg',
  'soy',
  'sesame',
]);

const PreferencesSchema = z.object({
  cuisines: z.array(z.string()),
  free_text: z.string(),
  vibes: z.array(z.string()),
  budget_tier: z.enum(['$', '$$', '$$$']),
  allergies: z.array(ALLERGENS),
});

const AddressSchema = z.object({
  raw: z.string().min(1),
  resolved: z.object({ lat: z.number(), lng: z.number() }).optional(),
});

const RestaurantCandidateSchema = z.object({
  restaurant_id: z.string(),
  name: z.string(),
  url: z.string().url(),
  store_uuid: z.string(),
  description: z.string().optional(),
  rating: z.object({ value: z.number(), count: z.number() }).optional(),
});

const InitialSchema = z.object({
  mode: z.literal('initial'),
  preferences: PreferencesSchema,
  address: AddressSchema,
});

const AlternativeSchema = z.object({
  mode: z.literal('alternative'),
  preferences: PreferencesSchema,
  declared_allergies: z.array(ALLERGENS),
  alternative: RestaurantCandidateSchema,
});

const RequestSchema = z.discriminatedUnion('mode', [InitialSchema, AlternativeSchema]);

export async function POST(req: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_request', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  if (req.signal.aborted) controller.abort();
  else req.signal.addEventListener('abort', () => controller.abort(), { once: true });

  const generator: AsyncGenerator<PipelineEvent, void, void> =
    parsed.data.mode === 'initial'
      ? runPipeline({
          inputs: parsed.data.preferences,
          address: parsed.data.address,
          signal: controller.signal,
        })
      : runAlternative({
          inputs: parsed.data.preferences,
          alternative: parsed.data.alternative as never,
          declared_allergies: parsed.data.declared_allergies,
          signal: controller.signal,
        });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(streamController) {
      try {
        for await (const event of generator) {
          streamController.enqueue(encoder.encode(serializeEvent(event)));
        }
      } catch (err) {
        streamController.enqueue(
          encoder.encode(
            serializeEvent({
              type: 'error',
              error: { code: 'unknown', cause: err instanceof Error ? err.message : String(err) },
            }),
          ),
        );
      } finally {
        streamController.close();
      }
    },
    cancel() {
      controller.abort();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  });
}
