import type { CSSProperties } from 'react';

type DishPlaceholderProps = {
  width?: number;
  height?: number;
  label?: string;
  style?: CSSProperties;
};

export function DishPlaceholder({
  width = 200,
  height = 200,
  label = 'DISH PHOTO',
  style,
}: DishPlaceholderProps) {
  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        background:
          'repeating-linear-gradient(45deg, var(--a-mist) 0 12px, color-mix(in srgb, var(--a-peach) 20%, transparent) 12px 24px)',
        ...style,
      }}
    >
      <div
        className="mono"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          letterSpacing: 2,
          color: 'var(--a-ink)',
          opacity: 0.55,
        }}
      >
        {label}
      </div>
    </div>
  );
}
