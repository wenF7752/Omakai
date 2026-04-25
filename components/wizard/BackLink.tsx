'use client';

import { useRouter } from 'next/navigation';

export interface BackLinkProps {
  to: string;
  label?: string;
}

export function BackLink({ to, label = 'back' }: BackLinkProps) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(to)}
      className="mono"
      style={{
        background: 'var(--a-butter)',
        border: '2px solid var(--a-ink)',
        borderRadius: 999,
        padding: '6px 14px',
        marginBottom: 18,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 1.2,
        color: 'var(--a-ink)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: '2px 2px 0 var(--a-ink)',
        textTransform: 'uppercase',
      }}
    >
      ← {label}
    </button>
  );
}
