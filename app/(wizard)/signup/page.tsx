'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StickerBadge } from '@/components/mascots/StickerBadge';
import { MaskotMaki } from '@/components/mascots/MaskotMaki';
import { useProfile } from '@/hooks/useProfile';

export default function SignupPage() {
  const router = useRouter();
  const profile = useProfile();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!profile.signup_prompted) {
      router.replace('/');
    }
  }, [profile.signup_prompted, router]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  if (!profile.signup_prompted) return null;

  return (
    <div
      style={{
        padding: '60px 24px',
        maxWidth: 480,
        margin: '0 auto',
        position: 'relative',
        minHeight: '100vh',
      }}
    >
      <div
        style={{ position: 'absolute', top: 60, right: 0, transform: 'rotate(20deg)' }}
        className="sticker wobble"
      >
        <StickerBadge text="GOOD STREAK" size={90} color="var(--a-butter)" textColor="var(--a-ink)" />
      </div>

      <div style={{ textAlign: 'center', marginTop: 60, marginBottom: 32 }}>
        <div className="float-y" style={{ display: 'inline-block' }}>
          <MaskotMaki size={120} mood="happy" />
        </div>
        <h2 className="display" style={{ fontSize: 40, margin: '16px 0 8px' }}>
          three for three.
          <br />
          want to remember
          <br />
          your taste?
        </h2>
        <p style={{ opacity: 0.7, maxWidth: 280, margin: '0 auto' }}>
          Save your picks so omakai gets sharper every order.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          type="button"
          onClick={() => showToast('apple sign-in coming soon')}
          style={authBtn('var(--a-ink)', 'var(--a-cream)')}
        >
           continue with apple
        </button>
        <button
          type="button"
          onClick={() => showToast('email sign-in coming soon')}
          style={authBtn('#fff8e8', 'var(--a-ink)')}
        >
          ✉ continue with email
        </button>
        <button
          type="button"
          onClick={() => router.push('/')}
          style={{
            marginTop: 8,
            padding: 14,
            background: 'transparent',
            border: 'none',
            fontFamily: 'inherit',
            fontSize: 14,
            opacity: 0.6,
            cursor: 'pointer',
            color: 'var(--a-ink)',
          }}
        >
          maybe later
        </button>
      </div>

      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 30,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 16px',
            border: '2px solid var(--a-ink)',
            background: 'var(--a-butter)',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '4px 4px 0 var(--a-ink)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function authBtn(bg: string, color: string): React.CSSProperties {
  return {
    padding: 16,
    border: '2.5px solid var(--a-ink)',
    background: bg,
    color,
    borderRadius: 16,
    fontFamily: 'inherit',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '4px 4px 0 var(--a-ink)',
  };
}
