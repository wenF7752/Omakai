'use client';

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  primary?: boolean;
  big?: boolean;
  children: ReactNode;
};

export function WizardButton({ primary, big, children, style, ...rest }: Props) {
  const merged: CSSProperties = {
    border: '2.5px solid var(--a-ink)',
    background: primary ? 'var(--a-peach-deep)' : '#fff8e8',
    color: 'var(--a-ink)',
    padding: big ? '18px 28px' : '12px 20px',
    borderRadius: 999,
    fontWeight: 700,
    fontFamily: 'inherit',
    fontSize: big ? 18 : 15,
    cursor: 'pointer',
    boxShadow: '4px 4px 0 var(--a-ink)',
    transition: 'transform .12s, box-shadow .12s',
    width: '100%',
    ...style,
  };
  return (
    <button {...rest} style={merged}>
      {children}
    </button>
  );
}
