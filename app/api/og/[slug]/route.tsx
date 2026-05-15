import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getCardWithItems } from '@/lib/card';
import { CardTemplate, cardDimensions } from '@/lib/card-template';
import type { Metrics } from '@/lib/metrics';

export const runtime = 'nodejs';

// Mock metrics for ?preview=1, used while DB isn't wired up yet.
// Mirrors mockups/sample-data.md so the rendered output can be eyeballed
// against the HTML mockup.
const MOCK_METRICS: Metrics = {
  savedCount: 47,
  categories: [
    { name: 'Tech', count: 18, pct: 38 },
    { name: 'Self-dev', count: 11, pct: 24 },
    { name: 'Fitness', count: 7, pct: 14 },
    { name: 'Comedy', count: 6, pct: 12 },
    { name: 'Cooking', count: 4, pct: 8 },
    { name: 'Finance', count: 2, pct: 4 },
  ],
  godlife: 49,
  dopamine: 13,
  highlight: "8 hours of Rust content this week. You're embracing the borrow checker era.",
  weekLabel: 'May 9 — May 15',
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const isPreview = searchParams.get('preview') === '1';

  let metrics: Metrics;

  if (isPreview) {
    metrics = MOCK_METRICS;
  } else {
    try {
      const card = await getCardWithItems(slug);
      if (!card) return new Response('Not Found', { status: 404 });
      metrics = card.metrics;
    } catch (e) {
      return new Response(`DB error: ${(e as Error).message}`, { status: 500 });
    }
  }

  return new ImageResponse(<CardTemplate metrics={metrics} />, {
    width: cardDimensions.width,
    height: cardDimensions.height,
    headers: {
      'cache-control': isPreview ? 'no-store' : 'public, max-age=31536000, immutable',
    },
  });
}
