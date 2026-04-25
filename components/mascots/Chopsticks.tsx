import type { CSSProperties } from 'react';

type ChopsticksProps = {
  size?: number;
  color?: string;
  style?: CSSProperties;
};

export function Chopsticks({ size = 60, color = 'var(--a-ink)', style }: ChopsticksProps) {
  return (
    <svg width={size} height={size * 0.3} viewBox="0 0 100 30" style={style}>
      <rect x="2" y="6" width="96" height="3" rx="1.5" fill={color} transform="rotate(-2 50 8)" />
      <rect x="2" y="20" width="96" height="3" rx="1.5" fill={color} transform="rotate(-2 50 22)" />
    </svg>
  );
}
