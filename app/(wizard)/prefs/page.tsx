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

const CUISINES = ['japanese', 'korean', 'thai', 'chinese', 'mexican', 'italian', 'indian', 'mediterranean', 'american', 'vietnamese'];
const COLORS = ['var(--a-peach)', 'var(--a-sage)', 'var(--a-butter)'];

export default function PrefsPage() {
  const router = useRouter();
  const profile = useProfile();
  const selected = new Set(profile.preferences.cuisines);
  const formRef = useRef<HTMLFormElement>(null);
  useEnterToSubmit(formRef);

  const toggle = (c: string) => {
    const next = new Set(selected);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    updateProfile({ preferences: { ...profile.preferences, cuisines: [...next] } });
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const freeText = String(data.get('free_text') ?? '').trim();
    updateProfile({ preferences: { ...profile.preferences, free_text: freeText } });
    router.push('/allergies');
  };

  return (
    <form ref={formRef} onSubmit={submit} style={{ padding: '40px 24px', maxWidth: 480, margin: '0 auto' }}>
      <BackLink to="/vibe" />
      <Stepper step={4} total={5} />
      <h2 className="display" style={{ fontSize: 42, margin: '24px 0 8px' }}>
        any cuisines
        <br />
        you love?
      </h2>
      <p style={{ opacity: 0.7, marginBottom: 28 }}>Optional, but it sharpens the pick.</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
        {CUISINES.map((c, i) => (
          <Chip key={c} active={selected.has(c)} onToggle={() => toggle(c)} color={COLORS[i % COLORS.length]}>
            {c}
          </Chip>
        ))}
      </div>

      <label htmlFor="free_text" className="mono" style={{ fontSize: 10, letterSpacing: 2, opacity: 0.6 }}>
        ANYTHING ELSE? (OPTIONAL)
      </label>
      <input
        id="free_text"
        name="free_text"
        type="text"
        defaultValue={profile.preferences.free_text}
        placeholder="noodles, something warming, etc."
        style={{
          width: '100%',
          marginTop: 8,
          padding: 14,
          fontSize: 15,
          border: '2px solid var(--a-ink)',
          borderRadius: 14,
          background: '#fff8e8',
          fontFamily: 'inherit',
          color: 'var(--a-ink)',
        }}
      />

      <div style={{ marginTop: 32 }}>
        <WizardButton type="submit" primary big>
          last step →
        </WizardButton>
      </div>
    </form>
  );
}
