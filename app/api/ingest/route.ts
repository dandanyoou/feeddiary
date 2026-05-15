// POST /api/ingest
//
// Pipeline:
//   body.urls → dedupe+validate → ratelimit by IP → parallel oEmbed → Claude
//   categorize → computeMetrics → generateUnique slug → INSERT card+items
//   → respond { slug }
//
//   request ────────────────────────────────────────────► response
//      │                                                      ▲
//      ▼                                                      │
//   validate (5..50 youtube URLs, dedupe)                     │
//      │ 400 on bad shape ──────────────────────────────────► │
//      ▼                                                      │
//   ratelimit(ip) — in-memory, sliding window                 │
//      │ 429 on cap ───────────────────────────────────────► │
//      ▼                                                      │
//   fetchTitles(parallel) — oEmbed, ~3s budget each           │
//      ▼                                                      │
//   categorize(items) — 1 Claude call, batch                  │
//      ▼                                                      │
//   computeMetrics(items)                                     │
//      ▼                                                      │
//   generateUnique slug → INSERT cards + items                │
//      │ 500 on DB error ──────────────────────────────────► │
//      ▼                                                      │
//   200 { slug } ──────────────────────────────────────────► ┘

import { NextRequest, NextResponse } from 'next/server';
import { categorize, type InputItem } from '@/lib/claude';
import { createCard, cardSlugExists, type NewItem } from '@/lib/card';
import { computeMetrics } from '@/lib/metrics';
import { rateLimit } from '@/lib/ratelimit';
import { generateUnique } from '@/lib/slug';
import { dedupeVideos, fetchTitles, parseUrls } from '@/lib/youtube';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIN_URLS = 5;
const MAX_URLS = 50;

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

function err(code: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: code, ...extra }, { status });
}

export async function POST(req: NextRequest) {
  // --- 1. Parse body
  let body: { urls?: unknown };
  try {
    body = await req.json();
  } catch {
    return err('INVALID_JSON', 400);
  }
  const urlsField = body.urls;
  if (!Array.isArray(urlsField)) return err('URLS_MUST_BE_ARRAY', 400);
  if (urlsField.some((u) => typeof u !== 'string')) {
    return err('URLS_MUST_BE_STRINGS', 400);
  }

  // --- 2. Validate + dedupe
  const text = (urlsField as string[]).join('\n');
  const videos = dedupeVideos(parseUrls(text));
  if (videos.length < MIN_URLS) return err('AT_LEAST_5_VALID_YOUTUBE_URLS', 400);
  if (videos.length > MAX_URLS) return err('MAX_50_URLS', 400);

  // --- 3. Rate limit (per IP, in-memory sliding 5/hr)
  const ip = getClientIp(req);
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return err('RATE_LIMITED', 429, { retryAfterMs: rl.retryAfterMs });
  }

  // --- 4. Fetch titles in parallel (each has its own 3s timeout)
  const titled = await fetchTitles(videos);

  // --- 5. Categorize via Claude (single batch call)
  const inputItems: InputItem[] = titled.map((t) => ({ id: t.id, title: t.title }));
  const categorized = await categorize(inputItems);
  const catById = new Map(categorized.map((c) => [c.id, c.category]));

  // --- 6. Compute metrics
  const itemsForMetrics = titled.map((t) => ({ category: catById.get(t.id) ?? 'Other' }));
  let metrics;
  try {
    metrics = computeMetrics(itemsForMetrics);
  } catch (e) {
    return err('METRICS_FAILED', 500, { message: String((e as Error).message) });
  }

  // --- 7. Mint unique slug + write
  const newItems: NewItem[] = titled.map((t) => ({
    url: t.url,
    title: t.title,
    category: catById.get(t.id) ?? 'Other',
  }));

  try {
    const slug = await generateUnique((s) => cardSlugExists(s));
    await createCard(slug, metrics, newItems);
    return NextResponse.json({ slug });
  } catch (e) {
    return err('DB_WRITE_FAILED', 500, { message: String((e as Error).message) });
  }
}
