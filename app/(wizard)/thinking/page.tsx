'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';
import { useRecommendation } from '@/hooks/useRecommendation';
import type {
  LogEntry,
  LogKind,
  LogStage,
  PipelineError,
  PipelinePhase,
} from '@/lib/pipeline/events';

const FORCE_ERROR_CODES = new Set<PipelineError['code']>([
  'no_candidates',
  'menu_fetch_failed',
  'kimi_drift',
  'allergen_violation',
  'validator_reject',
  'aborted',
  'unknown',
]);

const STAGES: { key: LogStage; pct: number; title: string; sub: string }[] = [
  { key: 'looking', pct: 0, title: 'looking', sub: 'scanning restaurants near you' },
  { key: 'matching', pct: 33, title: 'matching', sub: 'lining up your prefs against menus' },
  { key: 'ranking', pct: 66, title: 'ranking', sub: 'tasting the top picks' },
  { key: 'ready', pct: 100, title: 'ready!', sub: 'your dish is plated' },
];

const PHASE_TO_PCT: Record<PipelinePhase, number> = {
  address_received: 5,
  searching_restaurants: 18,
  picking_candidates: 38,
  fetching_menu: 55,
  picking_dish: 72,
  validating: 88,
  done: 100,
  error: 0,
};

const STAGE_COLOR: Record<LogStage, string> = {
  looking: 'var(--a-sage)',
  matching: 'var(--a-butter)',
  ranking: 'var(--a-peach)',
  ready: 'var(--a-peach-deep)',
};

const KIND_STYLE: Record<LogKind, { dot: string; prefix: string }> = {
  system: { dot: 'var(--a-ink)', prefix: '⌘' },
  info: { dot: 'var(--a-sage-deep)', prefix: '·' },
  read: { dot: 'var(--a-sage-deep)', prefix: '▸' },
  flag: { dot: 'var(--a-flag)', prefix: '✗' },
  pick: { dot: 'var(--a-peach-deep)', prefix: '★' },
};

const TIPS: { k: string; v: string }[] = [
  { k: 'DID YOU KNOW', v: 'Tonkotsu broth simmers for 12+ hours — what’s 20 seconds?' },
  { k: 'OMABITE TIP', v: 'omakase = 御任せ = "I leave it up to you."' },
  { k: 'WHILE YOU WAIT', v: 'Set the table. Pour a drink. Trust the process.' },
  { k: 'FUN FACT', v: 'We read every menu and review snippet before picking yours.' },
  { k: 'DID YOU KNOW', v: 'Maki tastes hundreds of dishes before settling on yours.' },
  { k: 'DID YOU KNOW', v: 'The slowest dishes are usually the most worth waiting for.' },
];

function pctFromPhase(phase: PipelinePhase | null): number {
  if (!phase) return 0;
  return PHASE_TO_PCT[phase] ?? 0;
}

function currentStage(pct: number): { idx: number; stage: (typeof STAGES)[number] } {
  let idx = 0;
  for (let i = STAGES.length - 1; i >= 0; i -= 1) {
    if (pct >= (STAGES[i]?.pct ?? 0)) {
      idx = i;
      break;
    }
  }
  return { idx, stage: STAGES[idx] ?? STAGES[0]! };
}

export default function ThinkingPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '60px 24px', textAlign: 'center', opacity: 0.6 }}>
          <p className="mono">cooking up the pick…</p>
        </div>
      }
    >
      <ThinkingInner />
    </Suspense>
  );
}

function ThinkingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profile = useProfile();
  const [tipIdx, setTipIdx] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);

  const forceErrorRaw = searchParams.get('force_error');
  const forcedError =
    process.env.NODE_ENV !== 'production' &&
    forceErrorRaw &&
    FORCE_ERROR_CODES.has(forceErrorRaw as PipelineError['code'])
      ? (forceErrorRaw as PipelineError['code'])
      : null;

  const { state: realState, logEntries, retry } = useRecommendation({
    preferences: profile.preferences,
    address: profile.address ?? { raw: '' },
    recent_picks: profile.recent_picks,
  });

  const state = forcedError
    ? ({
        kind: 'error',
        error: { code: forcedError, message: 'forced for dev testing' } as PipelineError,
      } as const)
    : realState;

  useEffect(() => {
    const t = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (state.kind === 'ready') router.push('/result');
  }, [state.kind, router]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logEntries.length]);

  const phase: PipelinePhase | null =
    state.kind === 'loading'
      ? state.phase
      : state.kind === 'previewing' || state.kind === 'ready'
      ? 'done'
      : null;
  const pct = pctFromPhase(phase);
  const { idx: currentIdx, stage } = currentStage(pct);

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
    <div
      style={{
        padding: '60px 0 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100vh',
      }}
    >
      <div style={{ padding: '0 22px' }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 2, opacity: 0.6 }}>
          OMABITE · WORKING
        </div>
      </div>

      <div style={{ padding: '0 22px', display: 'flex', gap: 6 }}>
        {STAGES.map((s, i) => {
          const reached = pct >= s.pct;
          const active = i === currentIdx;
          return (
            <div
              key={s.key}
              style={{
                flex: 1,
                padding: '8px 6px',
                border: '2px solid var(--a-ink)',
                borderRadius: 12,
                background: reached ? STAGE_COLOR[s.key] : 'transparent',
                opacity: reached ? 1 : 0.4,
                boxShadow: active ? '2px 2px 0 var(--a-ink)' : 'none',
                transform: active ? 'translate(-1px,-1px)' : 'none',
                textAlign: 'center',
                transition: 'all .3s',
              }}
            >
              <div className="mono" style={{ fontSize: 9, letterSpacing: 1.5, fontWeight: 700 }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  marginTop: 2,
                  textTransform: 'lowercase',
                }}
              >
                {s.title.replace('!', '')}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '0 24px' }}>
        <div className="display" style={{ fontSize: 36, lineHeight: 0.95 }}>
          {stage.title.replace('!', '')}
          <span style={{ color: 'var(--a-peach-deep)' }}>…</span>
        </div>
        <div className="mono" style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
          STEP {currentIdx + 1} / {STAGES.length} · {stage.sub}
        </div>
      </div>

      <div style={{ padding: '0 22px' }}>
        <div
          style={{
            background: 'var(--a-mist)',
            border: '2.5px solid var(--a-ink)',
            borderRadius: 16,
            boxShadow: '4px 4px 0 var(--a-ink)',
            overflow: 'hidden',
          }}
        >
          <div
            ref={logRef}
            className="no-scrollbar"
            data-testid="activity-log"
            style={{
              height: 348,
              overflowY: 'auto',
              padding: '12px 12px',
              fontFamily: 'var(--font-dm-mono), monospace',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {logEntries.map((entry, i) => (
              <LogRow
                key={`${entry.ts}-${i}`}
                entry={entry}
                isLast={i === logEntries.length - 1}
                showSeparator={i < logEntries.length - 1}
              />
            ))}
            {pct < 100 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 0 2px',
                  opacity: 0.7,
                }}
              >
                <span style={{ color: 'var(--a-peach-deep)', fontWeight: 700 }}>▸</span>
                <span className="blink">_</span>
              </div>
            )}
          </div>

          <div
            style={{
              borderTop: '2px solid var(--a-ink)',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--a-cream)',
            }}
          >
            <div
              style={{
                flex: 1,
                height: 8,
                background: 'var(--a-mist)',
                border: '1.5px solid var(--a-ink)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                className="shimmer-stripe"
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background:
                    'repeating-linear-gradient(45deg, var(--a-peach-deep) 0 8px, var(--a-peach-deeper) 8px 16px)',
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <div
              className="mono"
              style={{ fontSize: 11, fontWeight: 700, minWidth: 36, textAlign: 'right' }}
            >
              {Math.floor(pct)}%
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 22px 12px' }}>
        <div
          style={{
            padding: 12,
            background: 'var(--a-mist)',
            border: '2px solid var(--a-ink)',
            borderRadius: 14,
            boxShadow: '3px 3px 0 var(--a-ink)',
            minHeight: 64,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div key={tipIdx} className="slide-up">
            <div
              className="mono"
              style={{ fontSize: 9, letterSpacing: 2, opacity: 0.6, marginBottom: 4 }}
            >
              {TIPS[tipIdx]!.k} · {tipIdx + 1}/{TIPS.length}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.4, fontStyle: 'italic' }}>
              &ldquo;{TIPS[tipIdx]!.v}&rdquo;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogRow({
  entry,
  isLast,
  showSeparator,
}: {
  entry: LogEntry;
  isLast: boolean;
  showSeparator: boolean;
}) {
  const style = KIND_STYLE[entry.kind];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '4px 0',
        borderBottom: showSeparator ? '1px dashed var(--a-ink-dim)' : 'none',
        animation: isLast ? 'slide-up 0.35s ease-out' : 'none',
      }}
    >
      <span
        style={{
          flex: '0 0 auto',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 1,
          padding: '2px 6px',
          borderRadius: 6,
          background: STAGE_COLOR[entry.stage],
          border: '1px solid var(--a-ink)',
          minWidth: 56,
          textAlign: 'center',
        }}
      >
        {entry.stage.toUpperCase()}
      </span>
      <span style={{ flex: '0 0 auto', color: style.dot, fontWeight: 700, marginTop: 1 }}>
        {style.prefix}
      </span>
      <span style={{ flex: 1, color: 'var(--a-ink)' }}>
        {entry.text}
        {entry.count && (
          <span
            style={{
              marginLeft: 6,
              padding: '1px 6px',
              background: 'var(--a-ink)',
              color: 'var(--a-cream)',
              borderRadius: 5,
              fontSize: 10,
            }}
          >
            {entry.count}
          </span>
        )}
        {entry.status && (
          <span style={{ marginLeft: 6, opacity: 0.7, fontStyle: 'italic' }}>· {entry.status}</span>
        )}
      </span>
    </div>
  );
}
