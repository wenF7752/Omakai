'use client';

import { useRouter } from 'next/navigation';
import { useRef, type FormEvent } from 'react';
import { BackLink } from '@/components/wizard/BackLink';
import { Stepper } from '@/components/wizard/Stepper';
import { BudgetCard } from '@/components/wizard/BudgetCard';
import { WizardButton } from '@/components/wizard/WizardButton';
import { useProfile } from '@/hooks/useProfile';
import { useEnterToSubmit } from '@/hooks/useEnterToSubmit';
import { updateProfile } from '@/lib/profile/store';
import type { BudgetTier } from '@/lib/types';

const OPTIONS: { tier: BudgetTier; label: string; range: string; emoji: string }[] = [
  { tier: '$', label: 'cheap eats', range: 'under $15', emoji: '🌶' },
  { tier: '$$', label: 'comfort zone', range: '$15-30', emoji: '🍣' },
  { tier: '$$$', label: 'treat night', range: '$30+', emoji: '✨' },
];

export default function BudgetPage() {
  const router = useRouter();
  const profile = useProfile();
  const selected = profile.preferences.budget_tier;
  const formRef = useRef<HTMLFormElement>(null);
  useEnterToSubmit(formRef);

  const choose = (tier: BudgetTier) => {
    updateProfile({ preferences: { ...profile.preferences, budget_tier: tier } });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.push('/vibe');
  };

  return (
    <form ref={formRef} onSubmit={submit} style={{ padding: '40px 24px', maxWidth: 480, margin: '0 auto' }}>
      <BackLink to="/address" />
      <Stepper step={2} total={5} />
      <h2 className="display" style={{ fontSize: 42, margin: '24px 0 8px' }}>
        what&apos;s the
        <br />
        budget vibe?
      </h2>
      <p style={{ opacity: 0.7, marginBottom: 28 }}>
        Pick one. We&apos;ll keep the recommendation in your range.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {OPTIONS.map((o) => (
          <BudgetCard
            key={o.tier}
            tier={o.tier}
            label={o.label}
            range={o.range}
            emoji={o.emoji}
            selected={selected === o.tier}
            onSelect={() => choose(o.tier)}
          />
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <WizardButton type="submit" primary big>
          next: vibe check →
        </WizardButton>
      </div>
    </form>
  );
}
