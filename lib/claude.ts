import Anthropic from '@anthropic-ai/sdk';

// Categorize saved YouTube videos using Claude Sonnet 4.6 in a single batch call.
//
// Flow:
//   buildPrompt(items) → string
//   client.messages.create(...)  →  text response
//   parseResponse(text, expectedIds) → CategorizedItem[]   (defensive: parses
//                                                           markdown-wrapped JSON,
//                                                           invalid category → 'Other',
//                                                           missing id     → 'Other')

export const CATEGORIES = [
  'Tech',
  'Self-dev',
  'Fitness',
  'Comedy',
  'Cooking',
  'Finance',
  'Other',
] as const;
export type Category = (typeof CATEGORIES)[number];

const CATEGORY_SET = new Set<string>(CATEGORIES);

export interface InputItem {
  id: string;
  title: string;
}

export interface CategorizedItem {
  id: string;
  category: Category;
}

const MODEL_ID = 'claude-sonnet-4-6';
const MAX_TOKENS = 4000;

let cached: Anthropic | null = null;

function getClient(): Anthropic {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  cached = new Anthropic({ apiKey });
  return cached;
}

const PROMPT_HEADER = `You are categorizing YouTube videos a user saved this week.

Categories (must use exactly one per item):
- Tech (programming, AI, dev tools, software news)
- Self-dev (productivity, career growth, learning, finance education)
- Fitness (gym, workout, health, nutrition)
- Comedy (memes, humor, entertainment)
- Cooking (recipes, food vlogs, restaurants)
- Finance (investing, real estate, crypto, business news)
- Other (anything that does not clearly fit)

You will receive a JSON array of items with { id, title }.
Return ONLY a JSON array with { id, category } for each item, in the same order.
No explanation, no markdown, no preamble. JSON only.`;

export function buildPrompt(items: InputItem[]): string {
  return `${PROMPT_HEADER}\n\nItems:\n${JSON.stringify(items, null, 2)}`;
}

export function parseResponse(text: string, expectedIds: string[]): CategorizedItem[] {
  const fallback = (): CategorizedItem[] =>
    expectedIds.map((id) => ({ id, category: 'Other' as const }));

  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return fallback();
  }
  if (!Array.isArray(parsed)) return fallback();

  const lookup = new Map<string, Category>();
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') continue;
    const obj = entry as Record<string, unknown>;
    if (typeof obj.id !== 'string' || typeof obj.category !== 'string') continue;
    lookup.set(obj.id, CATEGORY_SET.has(obj.category) ? (obj.category as Category) : 'Other');
  }

  return expectedIds.map((id) => ({ id, category: lookup.get(id) ?? 'Other' }));
}

export async function categorize(items: InputItem[]): Promise<CategorizedItem[]> {
  if (items.length === 0) return [];
  const expectedIds = items.map((i) => i.id);
  try {
    const client = getClient();
    const response = await client.messages.create({
      model: MODEL_ID,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: buildPrompt(items) }],
    });
    const first = response.content[0];
    const text = first && first.type === 'text' ? first.text : '';
    return parseResponse(text, expectedIds);
  } catch {
    return expectedIds.map((id) => ({ id, category: 'Other' as const }));
  }
}
