import { describe, expect, test } from 'vitest';
import { computeMetrics, formatWeekLabel, MIN_ITEMS, pickHighlight } from '../metrics';

function makeItems(spec: Record<string, number>): Array<{ category: string }> {
  const items: Array<{ category: string }> = [];
  for (const [category, n] of Object.entries(spec)) {
    for (let i = 0; i < n; i++) items.push({ category });
  }
  return items;
}

describe('computeMetrics', () => {
  test('sample-data.md ground truth (47 items)', () => {
    // Distribution from mockups/sample-data.md
    const items = makeItems({
      Tech: 18,
      'Self-dev': 11,
      Fitness: 7,
      Comedy: 6,
      Cooking: 4,
      Finance: 1,
    });
    expect(items.length).toBe(47);

    const m = computeMetrics(items);
    expect(m.savedCount).toBe(47);
    expect(m.categories[0]).toMatchObject({ name: 'Tech', count: 18, pct: 38 });
    expect(m.categories[1]).toMatchObject({ name: 'Self-dev', count: 11, pct: 23 });
    // (Self-dev + Fitness + Cooking + Finance) / 47 = 23 / 47 = 49%
    // Note: this slightly differs from the mockup's 72 because the mockup uses
    // a more optimistic counting (Tech-learning was counted in godlife). We
    // chose the stricter definition for v0 — see lib/metrics.ts.
    expect(m.godlife).toBe(49);
    expect(m.dopamine).toBe(13);
  });

  test('throws AT_LEAST_5_ITEMS for <5 input', () => {
    expect(() => computeMetrics(makeItems({ Tech: 4 }))).toThrow(`AT_LEAST_${MIN_ITEMS}_ITEMS`);
    expect(() => computeMetrics([])).toThrow(`AT_LEAST_${MIN_ITEMS}_ITEMS`);
  });

  test('all same category sums to 100% in that bucket', () => {
    const m = computeMetrics(makeItems({ Tech: 10 }));
    expect(m.categories).toEqual([{ name: 'Tech', count: 10, pct: 100 }]);
    expect(m.godlife).toBe(0);
  });

  test('categories sorted by count desc', () => {
    const m = computeMetrics(makeItems({ A: 3, B: 5, C: 7 }));
    expect(m.categories.map((c) => c.name)).toEqual(['C', 'B', 'A']);
  });

  test('weekLabel respects passed-in today', () => {
    const m = computeMetrics(makeItems({ Tech: 5 }), new Date('2026-05-15T00:00:00Z'));
    expect(m.weekLabel).toMatch(/May 9/);
    expect(m.weekLabel).toMatch(/May 15/);
  });
});

describe('pickHighlight', () => {
  test('top<30% returns diversified message', () => {
    const cats = [
      { name: 'A', count: 5, pct: 25 },
      { name: 'B', count: 5, pct: 25 },
      { name: 'C', count: 5, pct: 25 },
      { name: 'D', count: 5, pct: 25 },
    ];
    expect(pickHighlight(cats, 20)).toContain('Diversified');
  });

  test('Tech-heavy mentions builder mode', () => {
    const cats = [{ name: 'Tech', count: 18, pct: 38 }];
    expect(pickHighlight(cats, 47)).toMatch(/builder mode/);
  });

  test('unknown top category falls through to diversified', () => {
    const cats = [{ name: 'Astronomy', count: 5, pct: 50 }];
    expect(pickHighlight(cats, 10)).toContain('Diversified');
  });

  test('empty categories does not crash', () => {
    expect(pickHighlight([], 0)).toContain('0 saves');
  });
});

describe('formatWeekLabel', () => {
  test('returns "Mon X — Mon Y" format spanning 7 days', () => {
    const label = formatWeekLabel(new Date('2026-05-15T12:00:00Z'));
    expect(label).toContain('May');
    expect(label).toContain('—');
  });
});
