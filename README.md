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

## Getting started (from clone)

Full from-zero walkthrough for setting up feeddiary on a fresh machine.

### Prerequisites

- **Node.js 18.18+** (Next.js 15 requires it). Check: `node -v`
- **npm** (ships with Node)
- **Anthropic API key** — sign up at https://console.anthropic.com
- **Supabase project** — sign up at https://supabase.com and create a project (Seoul/Tokyo region recommended for KR users)

### 1. Clone the repo

```bash
git clone https://github.com/dandanyoou/feeddiary.git
cd feeddiary
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in:

```
ANTHROPIC_API_KEY=sk-ant-...           # from https://console.anthropic.com/settings/keys
SUPABASE_URL=https://xxx.supabase.co   # Supabase → Settings → API → Project URL
SUPABASE_SERVICE_KEY=eyJ...            # Supabase → Settings → API → service_role secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # leave as-is for local dev
```

> **Security note:** `SUPABASE_SERVICE_KEY` bypasses Row Level Security. Never expose it to the client or commit it.

### 4. Run the database migration

Open the Supabase dashboard → **SQL Editor** → paste the contents of `supabase/migrations/0001_init.sql` → click **Run**. This creates the `cards` and `card_items` tables.

### 5. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000.

### 6. Verify it works

```bash
npm test         # 48 unit tests should pass
npm run typecheck   # TypeScript strict, no errors
npm run build    # production build should succeed
```

### Deploy to Vercel

```bash
# Option A: GitHub integration (recommended)
# Push your fork to GitHub → Vercel → New Project → Import from GitHub
# Add the three env vars from .env.local in Vercel → Settings → Environment Variables

# Option B: Vercel CLI
npx vercel
npx vercel --prod
```

Make sure to register the same env vars (`ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`) in Vercel before the first production deploy.

### Common issues

- **`Module not found` errors after `npm install`** — delete `node_modules` and `package-lock.json`, then `npm install` again
- **Supabase errors on first run** — confirm the migration ran successfully; the `cards` table must exist
- **Claude returns non-JSON** — the parser has a fallback (all "Other" tags); if it happens consistently, check your `ANTHROPIC_API_KEY` is valid and has billing enabled
- **Korean text breaks in Satori output on Vercel** — local Mac renders fine because of system fonts; Vercel needs Noto Sans KR loaded explicitly (see `lib/card-template.tsx`)
