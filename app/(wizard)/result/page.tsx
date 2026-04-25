'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeroCard } from '@/components/result/HeroCard';
import { AlternativesStrip } from '@/components/result/AlternativesStrip';
import { useProfile } from '@/hooks/useProfile';
import { useRecommendation } from '@/hooks/useRecommendation';

export default function ResultPage() {
  const router = useRouter();
  const profile = useProfile();
  const [loadingAlt, setLoadingAlt] = useState<0 | 1 | 2 | null>(null);

  const { state, selectAlternative, retry } = useRecommendation({
    preferences: profile.preferences,
    address: profile.address ?? { raw: '' },
  });

  useEffect(() => {
    // Clearing the alt-loading indicator once a fresh `ready` arrives is a
    // controlled subscription to the SSE state machine, not a render-driven cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.kind === 'ready') setLoadingAlt(null);
  }, [state.kind]);

  if (state.kind === 'idle' || state.kind === 'loading' || state.kind === 'previewing') {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center', opacity: 0.6 }}>
        <p className="mono">cooking up the pick…</p>
      </div>
    );
  }

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
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <HeroCard
        recommendation={state.recommendation}
        deep_link={state.deep_link}
        onTryAnother={retry}
        declared_allergies_present={profile.preferences.allergies.length > 0}
      />
      <AlternativesStrip
        alternatives={[]}
        onSelect={(i) => {
          setLoadingAlt(i);
          selectAlternative(i);
        }}
        loading_index={loadingAlt}
      />
      <div style={{ padding: '0 22px 40px' }}>
        <button
          type="button"
          onClick={() => router.push('/feedback')}
          style={{
            width: '100%',
            padding: 12,
            border: '2px dashed var(--a-ink)',
            background: 'transparent',
            borderRadius: 14,
            fontFamily: 'inherit',
            fontWeight: 700,
            cursor: 'pointer',
            color: 'var(--a-ink)',
          }}
        >
          back from ordering? tell us how it landed →
        </button>
      </div>
    </div>
  );
}
