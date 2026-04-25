'use client';

import { useRouter } from 'next/navigation';
import { useRef, type FormEvent } from 'react';
import { BackLink } from '@/components/wizard/BackLink';
import { Stepper } from '@/components/wizard/Stepper';
import { Chip } from '@/components/wizard/Chip';
import { WizardButton } from '@/components/wizard/WizardButton';
import { useProfile } from '@/hooks/useProfile';
import { useEnterToSubmit } from '@/hooks/useEnterToSubmit';
import { updateProfile } from '@/lib/profile/store';

const VIBES = ['comfort', 'light', 'spicy', 'fresh', 'indulgent', 'healthy', 'fast', 'cozy', 'crispy', 'saucy', 'umami', 'bright', 'vegan', 'protein'];
const COLORS = ['var(--a-peach)', 'var(--a-butter)', 'var(--a-sage)', 'var(--a-peach-deep)'];

export default function VibePage() {
  const router = useRouter();
  const profile = useProfile();
  const selected = new Set(profile.preferences.vibes);
  const formRef = useRef<HTMLFormElement>(null);
  useEnterToSubmit(formRef);

  const toggle = (v: string) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    updateProfile({ preferences: { ...profile.preferences, vibes: [...next] } });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.push('/prefs');
  };

  return (
    <form ref={formRef} onSubmit={submit} style={{ padding: '40px 24px', maxWidth: 480, margin: '0 auto' }}>
      <BackLink to="/budget" />
      <Stepper step={3} total={5} />
      <h2 className="display" style={{ fontSize: 42, margin: '24px 0 8px' }}>
        what&apos;s the
        <br />
        mood?
      </h2>
      <p style={{ opacity: 0.7, marginBottom: 28 }}>Tap as many as feel right.</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {VIBES.map((v, i) => (
          <Chip key={v} active={selected.has(v)} onToggle={() => toggle(v)} color={COLORS[i % COLORS.length]}>
            {v}
          </Chip>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <WizardButton type="submit" primary big>
          almost there →
        </WizardButton>
      </div>
    </form>
  );
}
