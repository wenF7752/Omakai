'use client';

import { DishPlaceholder } from '@/components/mascots/DishPlaceholder';
import { StickerBadge } from '@/components/mascots/StickerBadge';
import { MaskotMaki } from '@/components/mascots/MaskotMaki';
import type { ValidatedRecommendation } from '@/lib/pipeline/validator';

export interface HeroCardProps {
  recommendation: ValidatedRecommendation;
  deep_link: string;
  onTryAnother: () => void;
  declared_allergies_present?: boolean;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function HeroCard({
  recommendation,
  deep_link,
  onTryAnother,
  declared_allergies_present,
}: HeroCardProps) {
  const { dish, restaurant, reasoning, warning } = recommendation;

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ position: 'relative', height: 280, background: 'var(--a-peach-deep)', overflow: 'hidden' }}>
        {dish.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dish.photo_url}
            alt={dish.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <DishPlaceholder
            label="HERO DISH PHOTO"
            style={{ width: '100%', height: '100%' }}
            width={400}
            height={280}
          />
        )}
        <div style={{ position: 'absolute', top: 24, left: 16 }} className="mono">
          <span
            style={{
              background: 'var(--a-ink)',
              color: 'var(--a-cream)',
              padding: '4px 10px',
              borderRadius: 12,
              fontSize: 10,
              letterSpacing: 2,
              display: 'inline-block',
            }}
          >
            TONIGHT&apos;S PICK
          </span>
        </div>
        <div
          style={{ position: 'absolute', top: 18, right: 14, transform: 'rotate(12deg)' }}
          className="sticker wobble"
        >
          <StickerBadge text="OMAKAI" size={86} color="var(--a-butter)" textColor="var(--a-ink)" />
        </div>
      </div>

      <div style={{ padding: '24px 22px 0' }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: 2, opacity: 0.6 }}>
          FROM · {restaurant.name.toUpperCase()}
        </div>
        <h1 className="display" style={{ fontSize: 44, margin: '6px 0 4px' }}>
          {dish.name}
        </h1>
        <div style={{ fontSize: 15, opacity: 0.7 }}>{dish.description}</div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <Callout label="PRICE" value={formatPrice(dish.price_cents)} bg="var(--a-butter)" />
          <Callout label="ETA" value="~25 min" bg="var(--a-peach)" />
          {restaurant.rating && (
            <Callout
              label="RATING"
              value={`★ ${restaurant.rating.value.toFixed(1)}${
                restaurant.rating.count > 0 ? ` (${restaurant.rating.count.toLocaleString()})` : ''
              }`}
              bg="var(--a-sage)"
            />
          )}
          {recommendation.sentiment && (
            <Callout
              label="DINER VIBE"
              value={`${recommendation.sentiment.score.toFixed(1)} / 5`}
              bg="var(--a-peach)"
            />
          )}
        </div>

        {recommendation.sentiment && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              border: '2px solid var(--a-ink)',
              borderRadius: 14,
              background: '#fff8e8',
              fontSize: 13,
              fontStyle: 'italic',
              boxShadow: '2px 2px 0 var(--a-ink)',
            }}
          >
            <span className="mono" style={{ fontSize: 9, letterSpacing: 1.5, opacity: 0.6, marginRight: 8 }}>
              WHAT DINERS SAY
            </span>
            {recommendation.sentiment.summary}
          </div>
        )}

        <div
          style={{
            marginTop: 24,
            padding: 18,
            background: '#fff8e8',
            border: '2.5px solid var(--a-ink)',
            borderRadius: 20,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -16,
              left: 14,
              background: 'var(--a-cream)',
              padding: '0 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MaskotMaki size={28} />
            <span className="mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }}>
              WHY THIS
            </span>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.5, margin: 0 }}>{reasoning}</p>
          {warning && (
            <p
              style={{
                fontSize: 13,
                marginTop: 12,
                padding: '8px 10px',
                background: 'var(--a-butter)',
                borderRadius: 10,
                fontStyle: 'italic',
              }}
            >
              ⚠ {warning}
            </p>
          )}
        </div>

        {dish.ingredients && dish.ingredients.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: 2, opacity: 0.6, marginBottom: 8 }}>
              WHAT&apos;S IN IT
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 13 }}>
              {dish.ingredients.map((x) => (
                <span
                  key={x}
                  style={{ padding: '4px 10px', border: '1.5px solid var(--a-ink)', borderRadius: 999 }}
                >
                  {x}
                </span>
              ))}
            </div>
          </div>
        )}

        {declared_allergies_present && (
          <div
            style={{
              marginTop: 24,
              padding: 12,
              background: 'var(--a-sage)',
              border: '2px solid var(--a-ink)',
              borderRadius: 14,
              fontSize: 12,
              fontStyle: 'italic',
            }}
          >
            ⚠ severe allergy? confirm with restaurant. our model only sees what UberEats publishes.
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button
            type="button"
            onClick={onTryAnother}
            style={{
              flex: 1,
              border: '2px solid var(--a-ink)',
              background: 'transparent',
              borderRadius: 14,
              padding: 14,
              fontFamily: 'inherit',
              fontWeight: 700,
              cursor: 'pointer',
              color: 'var(--a-ink)',
            }}
          >
            ↻ try another
          </button>
          <a
            href={deep_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 2,
              textAlign: 'center',
              border: '2.5px solid var(--a-ink)',
              background: 'var(--a-peach-deep)',
              color: 'var(--a-ink)',
              borderRadius: 14,
              padding: '14px 16px',
              fontFamily: 'inherit',
              fontWeight: 700,
              boxShadow: '4px 4px 0 var(--a-ink)',
              textDecoration: 'none',
            }}
          >
            order on UberEats →
          </a>
        </div>
      </div>
    </div>
  );
}

function Callout({ label, value, bg }: { label: string; value: string; bg: string }) {
  return (
    <div
      style={{
        border: '2px solid var(--a-ink)',
        background: bg,
        padding: '8px 12px',
        borderRadius: 14,
        boxShadow: '2px 2px 0 var(--a-ink)',
      }}
    >
      <div className="mono" style={{ fontSize: 9, letterSpacing: 1.5, opacity: 0.7 }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, fontSize: 16 }}>{value}</div>
    </div>
  );
}
