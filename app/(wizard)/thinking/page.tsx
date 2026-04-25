'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MaskotMaki } from '@/components/mascots/MaskotMaki';
import { ReducedMotionGate } from '@/components/shared/ReducedMotionGate';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useProfile } from '@/hooks/useProfile';
import { useRecommendation } from '@/hooks/useRecommendation';
import type { PipelineError, PipelinePhase } from '@/lib/pipeline/events';

const FORCE_ERROR_CODES = new Set<PipelineError['code']>([
  'no_candidates',
  'menu_fetch_failed',
  'kimi_drift',
  'allergen_violation',
  'validator_reject',
  'aborted',
  'unknown',
]);

const PHRASES = [
  'scanning restaurants near you…',
  'sniffing the broth…',
  'asking the chef for their pick…',
  'checking nothing has peanuts…',
  'one sec, plating up…',
];

const CHECKLIST: { phase: PipelinePhase; label: string }[] = [
  { phase: 'address_received', label: 'address received' },
  { phase: 'fetching_menu', label: 'menus loaded' },
  { phase: 'picking_dish', label: 'chef is choosing' },
  { phase: 'validating', label: 'double-checking allergens' },
];

const PHASE_ORDER: PipelinePhase[] = [
  'address_received',
  'searching_restaurants',
  'picking_candidates',
  'fetching_menu',
  'picking_dish',
  'validating',
  'done',
];

function phaseReached(current: PipelinePhase | null, target: PipelinePhase): boolean {
  if (!current) return false;
  return PHASE_ORDER.indexOf(current) >= PHASE_ORDER.indexOf(target);
}

export default function ThinkingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profile = useProfile();
  const reduce = useReducedMotion();
  const [phraseIdx, setPhraseIdx] = useState(0);

  const forceErrorRaw = searchParams.get('force_error');
  const forcedError =
    process.env.NODE_ENV !== 'production' &&
    forceErrorRaw &&
    FORCE_ERROR_CODES.has(forceErrorRaw as PipelineError['code'])
      ? (forceErrorRaw as PipelineError['code'])
      : null;

  const { state: realState, retry } = useRecommendation({
    preferences: profile.preferences,
    address: profile.address ?? { raw: '' },
  });

  const state = forcedError
    ? ({
        kind: 'error',
        error: { code: forcedError, message: 'forced for dev testing' } as PipelineError,
      } as const)
    : realState;

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setPhraseIdx((p) => (p + 1) % PHRASES.length), 1800);
    return () => clearInterval(t);
  }, [reduce]);

  useEffect(() => {
    if (state.kind === 'ready') router.push('/result');
  }, [state.kind, router]);

  const currentPhase: PipelinePhase | null =
    state.kind === 'loading'
      ? state.phase
      : state.kind === 'previewing' || state.kind === 'ready'
      ? 'done'
      : null;

  if (state.kind === 'error') {
    return (
      <div style={{ padding: '60px 24px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <h2 className="display" style={{ fontSize: 36, marginBottom: 12 }}>
          the chef is having an off night.
        </h2>
        <p className="mono" style={{ fontSize: 12, opacity: 0.7, marginBottom: 24 }}>
          {state.error.code}
        </p>
        <button
          type="button"
          onClick={retry}
          style={{
            padding: '14px 28px',
            border: '2.5px solid var(--a-ink)',
            background: 'var(--a-peach-deep)',
            color: 'var(--a-ink)',
            fontWeight: 700,
            borderRadius: 999,
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '4px 4px 0 var(--a-ink)',
          }}
        >
          try again
        </button>
      </div>
    );
  }

  return (
    <ReducedMotionGate>
      <div
        style={{
          padding: '40px 24px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
          maxWidth: 480,
          margin: '0 auto',
        }}
      >
        <div style={{ position: 'relative', width: 200, height: 200 }}>
          <div
            style={{
              position: 'absolute',
              inset: 30,
              border: '3px dashed var(--a-peach-deep)',
              borderRadius: '50%',
            }}
            className="spin-slow"
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div className="float-y">
              <MaskotMaki size={140} mood="thinking" />
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div className="display" style={{ fontSize: 32, marginBottom: 8 }}>
            asking
            <br />
            the chef…
          </div>
          <div
            className="mono"
            data-testid="phrase"
            style={{ fontSize: 13, opacity: 0.7, height: 20 }}
          >
            {PHRASES[phraseIdx]}
          </div>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, width: '100%', maxWidth: 320 }}>
          {CHECKLIST.map((item) => {
            const done = phaseReached(currentPhase, item.phase);
            return (
              <li
                key={item.phase}
                data-testid={`check-${item.phase}`}
                data-done={done}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 0',
                  fontSize: 14,
                  opacity: done ? 1 : 0.4,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    border: '2px solid var(--a-ink)',
                    background: done ? 'var(--a-sage)' : 'transparent',
                    fontSize: 14,
                    color: 'var(--a-ink)',
                  }}
                >
                  {done ? '✓' : ''}
                </span>
                {item.label}
              </li>
            );
          })}
        </ul>
      </div>
    </ReducedMotionGate>
  );
}
