import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { POST } from '@/app/api/recommend/route';

const BRAVE_URL = 'https://api.search.brave.com/res/v1/web/search';
const KIMI_URL = 'https://api.moonshot.ai/v1/chat/completions';
const APIFY_URL = 'https://api.apify.com/v2/acts/datacach~ubereats-menu-scraper/run-sync-get-dataset-items';

const BRAVE_RESPONSE = {
  web: {
    results: [
      { title: 'Mensho', url: 'https://www.ubereats.com/store/mensho/abc', description: 'ramen' },
      { title: 'Ippudo', url: 'https://www.ubereats.com/store/ippudo/def', description: 'tonkotsu' },
      { title: 'Marufuku', url: 'https://www.ubereats.com/store/marufuku/ghi', description: 'noodles' },
      { title: 'Hinodeya', url: 'https://www.ubereats.com/store/hinodeya/jkl', description: 'shio' },
    ],
  },
};

const VALID_PICK = {
  hero_url: 'https://www.ubereats.com/store/mensho/abc',
  alternatives: [
    { url: 'https://www.ubereats.com/store/ippudo/def', tag: 'lighter' },
    { url: 'https://www.ubereats.com/store/marufuku/ghi', tag: 'spicier' },
    { url: 'https://www.ubereats.com/store/hinodeya/jkl', tag: 'cheaper' },
  ],
};
const APIFY_RESPONSE = [
  { name: 'Mensho', items: [{ id: 'd-1', name: 'Tonkotsu', price: '$18.50', description: 'ramen' }] },
];
const VALID_DISH_PICK = {
  dish_id: 'd-1',
  reasoning: 'a rich and warming bowl that fits a cozy vibe nicely',
};
const kimiBody = (content: unknown) => ({
  choices: [{ message: { role: 'assistant', content: typeof content === 'string' ? content : JSON.stringify(content) } }],
  usage: { prompt_tokens: 100, completion_tokens: 50, cached_tokens: 80 },
});

const VALID_BODY = {
  mode: 'initial',
  preferences: {
    cuisines: ['japanese'],
    free_text: '',
    vibes: ['cozy'],
    budget_tier: '$$',
    allergies: [],
  },
  address: { raw: '447 Valencia St SF' },
};

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function happyHandlers() {
  let kimiCall = 0;
  return [
    http.get(BRAVE_URL, () => HttpResponse.json(BRAVE_RESPONSE)),
    http.post(KIMI_URL, () => {
      kimiCall += 1;
      return HttpResponse.json(kimiBody(kimiCall === 1 ? VALID_PICK : VALID_DISH_PICK));
    }),
    http.post(APIFY_URL, () => HttpResponse.json(APIFY_RESPONSE)),
  ];
}

async function readSseEvents(response: Response): Promise<{ event: string; data: unknown }[]> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const events: { event: string; data: unknown }[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';
    for (const frame of frames) {
      const eventLine = frame.split('\n').find((l) => l.startsWith('event: '));
      const dataLine = frame.split('\n').find((l) => l.startsWith('data: '));
      if (!eventLine || !dataLine) continue;
      events.push({
        event: eventLine.slice('event: '.length),
        data: JSON.parse(dataLine.slice('data: '.length)),
      });
    }
  }
  return events;
}

describe('POST /api/recommend', () => {
  it('happy path: returns 200 text/event-stream and streams events', async () => {
    server.use(...happyHandlers());
    const response = await POST(
      new Request('http://localhost/api/recommend', {
        method: 'POST',
        body: JSON.stringify(VALID_BODY),
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream');
    const events = await readSseEvents(response);
    expect(events.length).toBeGreaterThan(0);
    expect(events[events.length - 1]?.event).toBe('result');
  });

  it('malformed body returns 400 application/json with Zod errors', async () => {
    const response = await POST(
      new Request('http://localhost/api/recommend', {
        method: 'POST',
        body: JSON.stringify({ mode: 'initial' }), // missing preferences/address
      }),
    );
    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = (await response.json()) as { error: string; issues?: unknown[] };
    expect(body.error).toBeDefined();
  });

  it('mode=alternative re-enters at fetching_menu', async () => {
    server.use(
      http.post(KIMI_URL, () => HttpResponse.json(kimiBody(VALID_DISH_PICK))),
      http.post(APIFY_URL, () => HttpResponse.json(APIFY_RESPONSE)),
    );
    const altBody = {
      mode: 'alternative',
      preferences: VALID_BODY.preferences,
      declared_allergies: [],
      alternative: {
        restaurant_id: 'def',
        name: 'Ippudo',
        url: 'https://www.ubereats.com/store/ippudo/def',
        store_uuid: 'def',
      },
    };
    const response = await POST(
      new Request('http://localhost/api/recommend', {
        method: 'POST',
        body: JSON.stringify(altBody),
      }),
    );
    expect(response.status).toBe(200);
    const events = await readSseEvents(response);
    const phases = events
      .filter((e) => e.event === 'phase')
      .map((e) => (e.data as { phase: string }).phase);
    expect(phases[0]).toBe('fetching_menu');
    expect(phases).not.toContain('searching_restaurants');
  });

  it('SSE frames match event/data format', async () => {
    server.use(...happyHandlers());
    const response = await POST(
      new Request('http://localhost/api/recommend', {
        method: 'POST',
        body: JSON.stringify(VALID_BODY),
      }),
    );
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const { value } = await reader.read();
    const text = decoder.decode(value);
    expect(text).toMatch(/^event: phase\ndata: \{/);
    await reader.cancel();
  });
});
