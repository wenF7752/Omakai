'use client';

import { useRouter } from 'next/navigation';
import { useRef, type FormEvent } from 'react';
import { BackLink } from '@/components/wizard/BackLink';
import { Stepper } from '@/components/wizard/Stepper';
import { AllergyCheckbox } from '@/components/wizard/AllergyCheckbox';
import { WizardButton } from '@/components/wizard/WizardButton';
import { useProfile } from '@/hooks/useProfile';
import { useEnterToSubmit } from '@/hooks/useEnterToSubmit';
import { updateProfile } from '@/lib/profile/store';
import type { Allergen } from '@/lib/types';

const ALLERGENS: Allergen[] = [
  'peanut',
  'tree_nut',
  'shellfish',
  'dairy',
  'gluten',
  'egg',
  'soy',
  'sesame',
];

export default function AllergiesPage() {
  const router = useRouter();
  const profile = useProfile();
  const selected = new Set(profile.preferences.allergies);
  const formRef = useRef<HTMLFormElement>(null);
  useEnterToSubmit(formRef);

  const toggle = (a: Allergen) => {
    const next = new Set(selected);
    if (next.has(a)) next.delete(a);
    else next.add(a);
    updateProfile({ preferences: { ...profile.preferences, allergies: [...next] } });
  };

  const clearAll = () => {
    updateProfile({ preferences: { ...profile.preferences, allergies: [] } });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.push('/thinking');
  };

  return (
    <form ref={formRef} onSubmit={submit} style={{ padding: '40px 24px', maxWidth: 480, margin: '0 auto' }}>
      <BackLink to="/prefs" />
      <Stepper step={5} total={5} />
      <h2 className="display" style={{ fontSize: 42, margin: '24px 0 8px' }}>
        anything
        <br />
        off-limits?
      </h2>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>We&apos;ll skip dishes flagged with these.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        {ALLERGENS.map((a) => (
          <AllergyCheckbox
            key={a}
            allergen={a}
            checked={selected.has(a)}
            onToggle={() => toggle(a)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={clearAll}
        style={{
          width: '100%',
          padding: 14,
          border: '2px solid var(--a-ink)',
          borderRadius: 14,
          background: selected.size === 0 ? 'var(--a-sage)' : 'transparent',
          fontFamily: 'inherit',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
          color: 'var(--a-ink)',
        }}
      >
        ✦ no allergies — bring it on
      </button>

      <div style={{ marginTop: 16, padding: 12, fontSize: 12, opacity: 0.7, fontStyle: 'italic' }}>
        ⚠ severe allergy? always confirm ingredients with the restaurant.
      </div>

      <div style={{ marginTop: 24 }}>
        <WizardButton type="submit" primary big>
          ask the chef ✦
        </WizardButton>
      </div>
    </form>
  );
}
