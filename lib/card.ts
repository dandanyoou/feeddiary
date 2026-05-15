// DB ops for cards + items. Single source of truth for INSERT/SELECT shapes.
//
//   createCard(slug, metrics, items)   → INSERTs cards row + items rows
//   cardSlugExists(slug)               → boolean (drives slug.generateUnique retry)
//   getCardWithItems(slug)             → joined read for /c/[slug] page

import type { Category } from './claude';
import type { Metrics } from './metrics';
import { getSupabase } from './supabase';

export interface NewItem {
  url: string;
  title: string;
  category: Category;
}

export interface CardRow {
  id: string;
  slug: string;
  metrics: Metrics;
  created_at: string;
}

export interface CardWithItems extends CardRow {
  items: Array<{ id: string; url: string; title: string; category: Category }>;
}

export async function cardSlugExists(slug: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from('cards')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(`DB_READ_FAILED: ${error.message}`);
  return data !== null;
}

export async function createCard(
  slug: string,
  metrics: Metrics,
  items: NewItem[],
): Promise<CardRow> {
  const sb = getSupabase();

  const { data: card, error: cardErr } = await sb
    .from('cards')
    .insert({ slug, metrics })
    .select()
    .single();
  if (cardErr || !card) {
    throw new Error(`DB_WRITE_FAILED: ${cardErr?.message ?? 'no row returned'}`);
  }

  const itemRows = items.map((it) => ({
    card_id: card.id,
    url: it.url,
    title: it.title,
    category: it.category,
  }));
  const { error: itemsErr } = await sb.from('items').insert(itemRows);
  if (itemsErr) {
    // Best-effort cleanup of the orphaned card row.
    await sb.from('cards').delete().eq('id', card.id);
    throw new Error(`DB_WRITE_FAILED: ${itemsErr.message}`);
  }

  return card as CardRow;
}

export async function getCardWithItems(slug: string): Promise<CardWithItems | null> {
  const sb = getSupabase();
  const { data: card, error: cardErr } = await sb
    .from('cards')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (cardErr) throw new Error(`DB_READ_FAILED: ${cardErr.message}`);
  if (!card) return null;

  const { data: items, error: itemsErr } = await sb
    .from('items')
    .select('id, url, title, category')
    .eq('card_id', card.id)
    .order('created_at', { ascending: true });
  if (itemsErr) throw new Error(`DB_READ_FAILED: ${itemsErr.message}`);

  return { ...(card as CardRow), items: (items as CardWithItems['items']) ?? [] };
}
