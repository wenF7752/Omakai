'use client';

import type { AlternativeOption } from '@/lib/pipeline/events';

const TAG_LABEL: Record<string, string> = {
  lighter: '🥗 lighter',
  spicier: '🌶 spicier',
  cheaper: '💸 cheaper',
};

export interface AlternativesStripProps {
  alternatives: AlternativeOption[];
  onSelect: (index: 0 | 1 | 2) => void;
  loading_index: 0 | 1 | 2 | null;
}

export function AlternativesStrip({ alternatives, onSelect, loading_index }: AlternativesStripProps) {
  if (alternatives.length === 0) return null;
  return (
    <div style={{ padding: '0 22px 24px' }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: 2, opacity: 0.6, marginBottom: 10 }}>
        OR TRY ANOTHER ANGLE
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {alternatives.slice(0, 3).map((a, i) => {
          const idx = i as 0 | 1 | 2;
          const loading = loading_index === idx;
          return (
            <button
              key={a.candidate.restaurant_id}
              type="button"
              onClick={() => onSelect(idx)}
              disabled={loading_index !== null}
              style={{
                flex: 1,
                padding: 12,
                border: '2px solid var(--a-ink)',
                borderRadius: 14,
                background: '#fff8e8',
                cursor: loading_index !== null ? 'wait' : 'pointer',
                opacity: loading_index !== null && !loading ? 0.5 : 1,
                fontFamily: 'inherit',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700 }}>{TAG_LABEL[a.tag] ?? a.tag}</div>
              <div className="mono" style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>
                {loading ? '…thinking' : a.candidate.name.slice(0, 18)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
