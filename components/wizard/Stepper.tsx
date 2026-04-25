import type { CSSProperties } from 'react';

export interface StepperProps {
  step: number;
  total: number;
}

export function Stepper({ step, total }: StepperProps) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < step;
        const style: CSSProperties = {
          flex: 1,
          height: 8,
          borderRadius: 4,
          border: '1.5px solid var(--a-ink)',
          background: filled ? 'var(--a-peach-deep)' : 'transparent',
        };
        return (
          <div
            key={i}
            data-stepper-bar={filled ? 'filled' : 'empty'}
            style={style}
          />
        );
      })}
      <span className="mono" style={{ fontSize: 11, marginLeft: 8, opacity: 0.6 }}>
        {step}/{total}
      </span>
    </div>
  );
}
