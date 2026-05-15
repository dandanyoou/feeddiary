// Compute the metrics jsonb shape stored on the cards row.
//
// Pure, no I/O. Tested with sample-data.md numbers as ground truth.

const GODLIFE_CATS = new Set(['Self-dev', 'Fitness', 'Cooking', 'Finance']);
const DOPAMINE_CATS = new Set(['Comedy']);

export const MIN_ITEMS = 5;

export interface MetricsItem {
  category: string;
}

export interface CategoryBreakdown {
  name: string;
  count: number;
  pct: number;
}

export interface Metrics {
  savedCount: number;
  categories: CategoryBreakdown[];
  godlife: number;
  dopamine: number;
  highlight: string;
  weekLabel: string;
}

export function computeMetrics(items: MetricsItem[], today: Date = new Date()): Metrics {
  const total = items.length;
  if (total < MIN_ITEMS) {
    throw new Error(`AT_LEAST_${MIN_ITEMS}_ITEMS`);
  }

  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }

  const categories: CategoryBreakdown[] = [...counts.entries()]
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const godlifeCount = items.filter((i) => GODLIFE_CATS.has(i.category)).length;
  const dopamineCount = items.filter((i) => DOPAMINE_CATS.has(i.category)).length;

  return {
    savedCount: total,
    categories,
    godlife: Math.round((godlifeCount / total) * 100),
    dopamine: Math.round((dopamineCount / total) * 100),
    highlight: pickHighlight(categories, total),
    weekLabel: formatWeekLabel(today),
  };
}

export function pickHighlight(categories: CategoryBreakdown[], total: number): string {
  if (categories.length === 0) return `${total} saves this week.`;
  const top = categories[0];

  if (top.pct < 30) {
    return `${total} saves across ${categories.length} categories. Diversified taste.`;
  }

  const hours = Math.max(1, Math.round((top.count * 10) / 60));

  switch (top.name) {
    case 'Tech':
      return `${hours} hours of Tech content this week. You're deep in builder mode.`;
    case 'Self-dev':
      return `${top.count} self-improvement videos. The grind is real.`;
    case 'Fitness':
      return `${top.count} fitness videos. Your gym era is on.`;
    case 'Comedy':
      return `${top.count} comedy hits. You earned the dopamine.`;
    case 'Cooking':
      return `${top.count} cooking videos. Embracing the home-chef era.`;
    case 'Finance':
      return `${top.count} finance videos. Money brain activated.`;
    default:
      return `${total} saves across ${categories.length} categories. Diversified taste.`;
  }
}

export function formatWeekLabel(today: Date): string {
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  const fmt = (d: Date) =>
    d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} — ${fmt(today)}`;
}
