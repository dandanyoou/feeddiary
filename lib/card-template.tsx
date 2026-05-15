// Satori-renderable card JSX. Ported from mockups/warm.html.
//
// Satori constraints (vs browser CSS):
//   - Every <div> must have explicit display: flex or display: none.
//   - <div> with multiple children must have display: flex.
//   - No radial-gradient, no box-shadow blur, no grid, no filter.
//   - linear-gradient + flex layout are OK.
//   - Text wrapping inside a flex container: each text run lives in its own
//     leaf <div>; never put `{expr}text` adjacent (JSX makes 2 children
//     out of that, and a parent without display:flex throws).
//
// 1080x1350 → 4:5 Instagram portrait. Twitter share preview renders well.

import type { Metrics } from './metrics';

const CARD_W = 1080;
const CARD_H = 1350;

const COLOR = {
  bgFrom: '#F4ECDC',
  bgTo: '#ECE0CB',
  ink: '#2D2418',
  muted: '#6B5E48',
  divider: '#B5A88E',
  godlife: '#5C7A4F',
  dopamine: '#C47C58',
  quoteBox: 'rgba(255, 252, 245, 0.6)',
};

const BAR_GRADIENTS: Record<string, [string, string]> = {
  Tech: ['#6B8FB5', '#8FA8C7'],
  'Self-dev': ['#5C7A4F', '#8FA17C'],
  Fitness: ['#B86A6A', '#D08C8C'],
  Comedy: ['#C47C58', '#DBA17F'],
  Cooking: ['#C9A867', '#DCC18B'],
  Finance: ['#9783A6', '#B0A0BD'],
  Other: ['#9E948A', '#B5ADA3'],
};

function gradient(name: string): string {
  const [a, b] = BAR_GRADIENTS[name] ?? BAR_GRADIENTS.Other;
  return `linear-gradient(90deg, ${a}, ${b})`;
}

// Helper: explicit-display div with sensible defaults.
const flex = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  display: 'flex',
  ...extra,
});
const block = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  display: 'flex',
  ...extra,
});

export function CardTemplate({ metrics }: { metrics: Metrics }) {
  const maxCount = Math.max(...metrics.categories.map((c) => c.count), 1);

  return (
    <div
      style={flex({
        width: CARD_W,
        height: CARD_H,
        flexDirection: 'column',
        padding: '88px 96px',
        background: `linear-gradient(180deg, ${COLOR.bgFrom} 0%, ${COLOR.bgTo} 100%)`,
        color: COLOR.ink,
        fontFamily: 'sans-serif',
      })}
    >
      {/* Header */}
      <div
        style={flex({
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 56,
        })}
      >
        <div style={flex({ alignItems: 'center', fontSize: 32, fontStyle: 'italic' })}>
          <div
            style={flex({
              width: 14,
              height: 14,
              borderRadius: 7,
              background: COLOR.dopamine,
              marginRight: 12,
            })}
          />
          <div style={block()}>feeddiary</div>
        </div>
        <div
          style={block({
            fontSize: 18,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: COLOR.muted,
          })}
        >
          {metrics.weekLabel}
        </div>
      </div>

      {/* Hero */}
      <div style={flex({ flexDirection: 'column', marginBottom: 40 })}>
        <div
          style={block({
            fontSize: 18,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: COLOR.muted,
            marginBottom: 12,
          })}
        >
          You saved
        </div>
        <div style={flex({ alignItems: 'flex-end' })}>
          <div style={block({ fontSize: 192, lineHeight: 0.92, letterSpacing: '-0.04em' })}>
            {String(metrics.savedCount)}
          </div>
          <div
            style={block({
              fontSize: 40,
              fontStyle: 'italic',
              color: COLOR.muted,
              marginLeft: 16,
              marginBottom: 16,
            })}
          >
            things this week.
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={flex({ height: 1, background: COLOR.divider, opacity: 0.5, marginBottom: 36 })} />

      {/* Section label */}
      <div
        style={block({
          fontSize: 16,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: COLOR.muted,
          marginBottom: 24,
        })}
      >
        Your taste
      </div>

      {/* Categories */}
      <div style={flex({ flexDirection: 'column', marginBottom: 36 })}>
        {metrics.categories.slice(0, 6).map((cat) => (
          <div
            key={cat.name}
            style={flex({ alignItems: 'center', marginBottom: 16 })}
          >
            <div style={block({ width: 200, fontSize: 26 })}>{cat.name}</div>
            <div
              style={flex({
                flex: 1,
                height: 14,
                background: 'rgba(45, 36, 24, 0.08)',
                borderRadius: 7,
                overflow: 'hidden',
                marginRight: 24,
              })}
            >
              <div
                style={flex({
                  width: `${Math.max(8, (cat.count / maxCount) * 100)}%`,
                  height: '100%',
                  background: gradient(cat.name),
                  borderRadius: 7,
                })}
              />
            </div>
            <div style={block({ width: 60, justifyContent: 'flex-end', fontSize: 28 })}>
              {`${cat.pct}%`}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={flex({ height: 1, background: COLOR.divider, opacity: 0.5, marginBottom: 36 })} />

      {/* Indices */}
      <div
        style={flex({
          justifyContent: 'space-between',
          height: 200,
          marginBottom: 40,
        })}
      >
        <Index
          labelKo="갓생 지수"
          labelEn="God-life index"
          value={metrics.godlife}
          color={COLOR.godlife}
        />
        <Index
          labelKo="도파민 지수"
          labelEn="Dopamine index"
          value={metrics.dopamine}
          color={COLOR.dopamine}
        />
      </div>

      {/* Quote */}
      <div
        style={flex({
          padding: '32px 36px',
          background: COLOR.quoteBox,
          borderLeft: `3px solid ${COLOR.dopamine}`,
          borderRadius: 4,
        })}
      >
        <div style={block({ fontSize: 30, fontStyle: 'italic', lineHeight: 1.4, color: COLOR.ink })}>
          {metrics.highlight}
        </div>
      </div>

      {/* Footer */}
      <div
        style={flex({
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 24,
        })}
      >
        <div style={block({ fontSize: 18, fontStyle: 'italic', color: COLOR.muted })}>
          feeddiary.app
        </div>
        <div
          style={block({
            fontSize: 14,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: COLOR.muted,
          })}
        >
          v0
        </div>
      </div>
    </div>
  );
}

function Index({
  labelKo,
  labelEn,
  value,
  color,
}: {
  labelKo: string;
  labelEn: string;
  value: number;
  color: string;
}) {
  return (
    <div style={flex({ flexDirection: 'column', width: '45%' })}>
      <div style={block({ fontSize: 22, marginBottom: 4 })}>{labelKo}</div>
      <div style={block({ fontSize: 16, color: COLOR.muted, marginBottom: 12 })}>{labelEn}</div>
      <div style={flex({ alignItems: 'baseline' })}>
        <div style={block({ fontSize: 96, lineHeight: 1, color, letterSpacing: '-0.03em' })}>
          {String(value)}
        </div>
        <div style={block({ fontSize: 24, color: COLOR.muted, marginLeft: 8 })}>/100</div>
      </div>
    </div>
  );
}

export const cardDimensions = { width: CARD_W, height: CARD_H };
