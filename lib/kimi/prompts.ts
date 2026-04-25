import type { ProfilePreferences } from '@/lib/profile/types';
import type { BraveResult } from '@/lib/brave/types';
import type { Menu, RestaurantCandidate } from '@/lib/apify/types';

export const SYSTEM_PROMPT = `You are omakai, a culinary chef-of-choice for indecisive eaters. The user has shared their preferences, vibes, budget, and any food allergies. Your job is to choose ONE specific restaurant or dish from a curated list — never invent options outside what is provided.

Hard rules:
1. Output ONLY a single JSON object matching the schema described in the user message. No prose, no preamble, no code fences.
2. If allergies are declared, refuse to pick any item whose ingredients risk exposure. Flag ambiguous items via the optional "warning" field rather than choosing them.
3. Pick decisively. If the user is indecisive, that is your job. Do not hedge.
4. Reasoning fields must be 1-2 sentences, lowercase-friendly, no marketing fluff.

The user message will state which schema applies (RestaurantPick or DishPick). Match it exactly.`;

export function buildCandidatesPrompt(args: {
  inputs: ProfilePreferences;
  candidates: BraveResult[];
}): string {
  const { inputs, candidates } = args;
  const candidateLines = candidates
    .map((c, i) => `${i + 1}. ${c.title} — ${c.url}\n   ${c.description}`)
    .join('\n');
  return [
    'Schema: RestaurantPick { hero_url: string (url, must be one of the candidates), alternatives: Array<{ url: string, tag: "lighter"|"spicier"|"cheaper" }> length 3 }',
    '',
    `Diner preferences:`,
    `- cuisines: ${inputs.cuisines.join(', ') || 'no preference'}`,
    `- vibes: ${inputs.vibes.join(', ') || 'no preference'}`,
    `- budget: ${inputs.budget_tier}`,
    `- allergies: ${inputs.allergies.join(', ') || 'none declared'}`,
    `- free text: ${inputs.free_text || '(empty)'}`,
    '',
    'Candidate restaurants (pick exactly 1 hero + 3 alternatives, each with a distinct tag):',
    candidateLines,
    '',
    'Rules: hero_url and all 3 alternative urls MUST be drawn from the candidates above. Use distinct restaurants across hero+alternatives. Output JSON only.',
  ].join('\n');
}

export function buildDishPrompt(args: {
  inputs: ProfilePreferences;
  restaurant: RestaurantCandidate;
  menu: Menu;
}): string {
  const { inputs, restaurant, menu } = args;
  const itemLines = menu.items
    .map((m) => {
      const section = m.subsection_name ? ` [${m.subsection_name}]` : '';
      return `- id="${m.id}" | ${m.name}${section} | $${(m.price_cents / 100).toFixed(2)} | ${m.description}`;
    })
    .join('\n');
  return [
    'Schema: DishPick { dish_id: string (must match an id from the menu below), reasoning: string (20-400 chars, 1-2 sentences), warning?: string (only if allergen exposure is ambiguous) }',
    '',
    `Diner preferences:`,
    `- cuisines: ${inputs.cuisines.join(', ') || 'no preference'}`,
    `- vibes: ${inputs.vibes.join(', ') || 'no preference'}`,
    `- budget: ${inputs.budget_tier}`,
    `- allergies: ${inputs.allergies.join(', ') || 'none declared'}`,
    `- free text: ${inputs.free_text || '(empty)'}`,
    '',
    `Restaurant: ${restaurant.name}`,
    'Menu items:',
    itemLines,
    '',
    'Rules:',
    '- dish_id must be one of the ids above (copy verbatim).',
    '- Pick a substantial main course / entrée — something that stands as a meal on its own. Do NOT pick an appetizer, side, sauce, drink, dessert, or topping.',
    '- If allergies are declared and any candidate item is ambiguous, prefer a clearly safe item or set warning.',
    '- Output JSON only.',
  ].join('\n');
}

export function buildSentimentPrompt(args: {
  restaurantName: string;
  snippets: { title: string; description: string }[];
}): string {
  const { restaurantName, snippets } = args;
  const lines = snippets
    .map((s, i) => `${i + 1}. ${s.title}\n   ${s.description}`)
    .join('\n');
  return [
    'Schema: Sentiment { score: number (1-5, one decimal), summary: string (10-200 chars, 1 sentence) }',
    '',
    `Restaurant: ${restaurantName}`,
    '',
    'Online review snippets:',
    lines || '(no snippets found)',
    '',
    'Rules:',
    '- score reflects overall diner sentiment from the snippets above. Higher = better.',
    '- summary is one short sentence that captures what diners say about this place. Lowercase-friendly, no marketing fluff.',
    '- If snippets are sparse or contradictory, default to score 3 and say so in the summary.',
    '- Output JSON only.',
  ].join('\n');
}
