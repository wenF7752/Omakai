'use client';

import { notFound } from 'next/navigation';
import { ReducedMotionGate } from '@/components/shared/ReducedMotionGate';

export default function MotionSmokePage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <ReducedMotionGate>
      <main style={{ padding: 24 }}>
        <h1 className="display" style={{ fontSize: 24, marginBottom: 16 }}>
          reduced-motion smoke
        </h1>
        <p>Animated boxes below should freeze when prefers-reduced-motion: reduce is emulated.</p>
        <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
          {(['wobble', 'float-y', 'spin-slow', 'pop-in'] as const).map((a) => (
            <div
              key={a}
              data-testid={`anim-${a}`}
              className={a}
              style={{
                width: 64,
                height: 64,
                background: 'var(--a-peach-deep)',
                border: '2px solid var(--a-ink)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: 'var(--a-cream)',
              }}
            >
              {a}
            </div>
          ))}
        </div>
      </main>
    </ReducedMotionGate>
  );
}
