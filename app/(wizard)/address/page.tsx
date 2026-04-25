'use client';

import { useRouter } from 'next/navigation';
import { useRef, type FormEvent } from 'react';
import { BackLink } from '@/components/wizard/BackLink';
import { Stepper } from '@/components/wizard/Stepper';
import { WizardButton } from '@/components/wizard/WizardButton';
import { useProfile } from '@/hooks/useProfile';
import { updateProfile } from '@/lib/profile/store';

export default function AddressPage() {
  const router = useRouter();
  const profile = useProfile();
  const formRef = useRef<HTMLFormElement>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const raw = String(data.get('addr') ?? '').trim();
    if (!raw) return;
    updateProfile({ address: { raw } });
    router.push('/budget');
  };

  return (
    <form ref={formRef} onSubmit={submit} style={{ padding: '40px 24px', maxWidth: 480, margin: '0 auto' }}>
      <BackLink to="/" label="start over" />
      <Stepper step={1} total={5} />
      <h2 className="display" style={{ fontSize: 42, margin: '24px 0 8px' }}>
        where are
        <br />
        you tonight?
      </h2>
      <p style={{ opacity: 0.7, marginBottom: 28 }}>
        So we only suggest places that&apos;ll actually deliver.
      </p>

      <label htmlFor="addr" className="mono" style={{ fontSize: 10, letterSpacing: 2, opacity: 0.6 }}>
        ADDRESS
      </label>
      <input
        id="addr"
        name="addr"
        type="text"
        defaultValue={profile.address?.raw ?? ''}
        autoFocus
        placeholder="447 Valencia St, San Francisco, CA"
        style={{
          width: '100%',
          marginTop: 8,
          marginBottom: 20,
          padding: 16,
          fontSize: 16,
          border: '2.5px solid var(--a-ink)',
          borderRadius: 16,
          background: '#fff8e8',
          fontFamily: 'inherit',
          color: 'var(--a-ink)',
          boxShadow: '4px 4px 0 var(--a-ink)',
        }}
      />

      <div style={{ marginTop: 32 }}>
        <WizardButton type="submit" primary big>
          continue →
        </WizardButton>
      </div>
    </form>
  );
}
