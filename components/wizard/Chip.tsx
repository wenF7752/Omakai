import type { ReactNode } from 'react';

export interface ChipProps {
  active: boolean;
  onToggle: () => void;
  color?: string;
  children: ReactNode;
}

export function Chip({ active, onToggle, color = 'var(--a-peach)', children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      style={{
        border: '2px solid var(--a-ink)',
        background: active ? color : '#fff8e8',
        color: 'var(--a-ink)',
        padding: '8px 14px',
        borderRadius: 999,
        fontWeight: 600,
        fontFamily: 'inherit',
        fontSize: 13,
        cursor: 'pointer',
        boxShadow: active ? '2px 2px 0 var(--a-ink)' : 'none',
        transform: active ? 'rotate(-1.5deg)' : 'rotate(0)',
        transition: 'all .15s',
      }}
    >
      {children}
    </button>
  );
}
