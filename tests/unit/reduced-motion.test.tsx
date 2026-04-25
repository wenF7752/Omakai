import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, render, renderHook } from '@testing-library/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ReducedMotionGate } from '@/components/shared/ReducedMotionGate';

type Listener = (e: MediaQueryListEvent) => void;

function installMatchMediaMock(initial: boolean) {
  const listeners: Listener[] = [];
  let matches = initial;
  const mql = {
    get matches() {
      return matches;
    },
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_: string, l: Listener) => {
      listeners.push(l);
    },
    removeEventListener: (_: string, l: Listener) => {
      const i = listeners.indexOf(l);
      if (i >= 0) listeners.splice(i, 1);
    },
    dispatchEvent: () => true,
  };
  window.matchMedia = vi.fn().mockReturnValue(mql);
  return {
    setMatches(next: boolean) {
      matches = next;
      for (const l of listeners) l({ matches: next } as MediaQueryListEvent);
    },
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useReducedMotion', () => {
  it('returns false when matchMedia(reduce) is false', () => {
    installMatchMediaMock(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when matchMedia(reduce) is true', () => {
    installMatchMediaMock(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('reactively updates when the OS preference changes mid-session', () => {
    const ctl = installMatchMediaMock(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => {
      ctl.setMatches(true);
    });
    expect(result.current).toBe(true);
  });
});

describe('ReducedMotionGate', () => {
  it('sets data-motion="reduce" on its root when reduce is active', () => {
    installMatchMediaMock(true);
    const { container } = render(
      <ReducedMotionGate>
        <div data-testid="child">hi</div>
      </ReducedMotionGate>,
    );
    const root = container.firstElementChild as HTMLElement | null;
    expect(root?.getAttribute('data-motion')).toBe('reduce');
  });

  it('omits data-motion when reduce is inactive', () => {
    installMatchMediaMock(false);
    const { container } = render(
      <ReducedMotionGate>
        <div>hi</div>
      </ReducedMotionGate>,
    );
    const root = container.firstElementChild as HTMLElement | null;
    expect(root?.getAttribute('data-motion')).toBeNull();
  });
});
