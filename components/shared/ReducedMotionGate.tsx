'use client';

import type { ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function ReducedMotionGate({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return <div {...(reduce ? { 'data-motion': 'reduce' } : {})}>{children}</div>;
}
