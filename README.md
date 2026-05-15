# feeddiary

See what your week of saved videos looks like.

A web app that takes a list of pasted YouTube URLs and generates a shareable card showing your taste breakdown — categories, god-life vs dopamine index, and a one-line highlight. No login. Card lives at a public short URL.

## Stack

Next.js 15 App Router · TypeScript · Tailwind · Supabase Postgres · Anthropic Claude Sonnet 4.6 · Satori (via `next/og`) · Vitest · Vercel

## Local dev

```bash
cp .env.local.example .env.local
# fill in ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
npm install
npm run dev
```

Migrate Supabase before first run:

```bash
# In Supabase SQL editor, paste contents of supabase/migrations/0001_init.sql and run
```

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm test` — run unit tests
- `npm run typecheck` — TypeScript only, no emit

## Status

v0 sprint. Spec at `~/.gstack/projects/feeddiary/test-unknown-eng-spec-20260515-142459.md`. Design reference at `mockups/warm.html`.
