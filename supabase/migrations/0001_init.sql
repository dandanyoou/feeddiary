-- feeddiary v0 schema
-- Run this once in the Supabase SQL editor before first deploy.
--
-- Schema rationale:
--   - cards is the share-addressable unit (slug-keyed, public-by-design at v0)
--   - items joins to cards (one card = many saved video items)
--   - metrics is denormalized into cards.metrics jsonb so card render
--     never touches items table — single-row read on the hot OG path
--
--    cards  1 ──< many  items
--      │
--      └─ slug (unique, 8 char base62) — public URL key
--      └─ metrics jsonb — denormalized for read-side performance

create extension if not exists pgcrypto;

create table if not exists cards (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  metrics      jsonb not null,
  created_at   timestamptz not null default now()
);

create table if not exists items (
  id           uuid primary key default gen_random_uuid(),
  card_id      uuid not null references cards(id) on delete cascade,
  url          text not null,
  title        text,
  category     text,
  created_at   timestamptz not null default now()
);

create index if not exists items_card_idx    on items(card_id);
create index if not exists cards_slug_idx    on cards(slug);
create index if not exists cards_created_idx on cards(created_at desc);

-- v0: no row-level security. Cards are public-by-design (slug = capability).
-- v1 TODO: add RLS if user accounts are introduced.
