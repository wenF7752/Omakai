import type { BudgetTier } from '@/lib/types';

export interface BudgetCardProps {
  tier: BudgetTier;
  label: string;
  range: string;
  emoji: string;
  selected: boolean;
  onSelect: () => void;
}

export function BudgetCard({ tier, label, range, emoji, selected, onSelect }: BudgetCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-selected={selected}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 18,
        border: '2.5px solid var(--a-ink)',
        borderRadius: 20,
        background: selected ? 'var(--a-butter)' : '#fff8e8',
        boxShadow: selected ? '4px 4px 0 var(--a-ink)' : '2px 2px 0 var(--a-ink)',
        transform: selected ? 'rotate(-1deg)' : 'rotate(0)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        transition: 'all .15s',
        width: '100%',
      }}
    >
      <span className="display" style={{ fontSize: 36, color: 'var(--a-peach-deep)', minWidth: 60 }}>
        {tier}
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: 18, fontWeight: 700 }}>{label}</span>
        <span className="mono" style={{ display: 'block', fontSize: 12, opacity: 0.7 }}>
          {range}
        </span>
      </span>
      <span style={{ fontSize: 28 }}>{emoji}</span>
    </button>
  );
}
