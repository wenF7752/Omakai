'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MaskotMaki } from '@/components/mascots/MaskotMaki';
import { recordFeedback } from '@/lib/profile/store';
import { useProfile } from '@/hooks/useProfile';
import type { RecentPick } from '@/lib/profile/types';
import type { DishId, FeedbackKind, RestaurantId } from '@/lib/types';

export default function FeedbackPage() {
  const router = useRouter();
  const profile = useProfile();
  const [done, setDone] = useState(false);

  const submit = (feedback: FeedbackKind) => {
    if (done) return;
    setDone(true);
    const pick: RecentPick = {
      timestamp: Date.now(),
      restaurant_id: ('last' as unknown) as RestaurantId,
      dish_id: ('last' as unknown) as DishId,
      dish_name: 'last pick',
      feedback,
    };
    const result = recordFeedback(pick);
    if (result.triggers_signup_wall) {
      router.push('/signup');
    } else {
      router.push('/');
    }
  };

  return (
    <div
      style={{
        padding: '60px 24px',
        maxWidth: 480,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div className="float-y" style={{ display: 'inline-block' }}>
          <MaskotMaki size={120} />
        </div>
        <h2 className="display" style={{ fontSize: 44, margin: '16px 0 8px' }}>
          did it
          <br />
          land?
        </h2>
        <p style={{ opacity: 0.7 }}>your last pick.</p>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <FeedbackButton
          icon="✦"
          label="nailed it"
          color="var(--a-sage)"
          rotate="-2deg"
          onClick={() => submit('nailed_it')}
          disabled={done}
        />
        <FeedbackButton
          icon="↺"
          label="not quite"
          color="var(--a-peach)"
          rotate="2deg"
          onClick={() => submit('not_quite')}
          disabled={done}
        />
      </div>

      <div
        className="mono"
        style={{ textAlign: 'center', marginTop: 32, fontSize: 13, opacity: 0.6 }}
      >
        we learn from every answer · {profile.recent_picks.length} picks logged
      </div>
    </div>
  );
}

function FeedbackButton({
  icon,
  label,
  color,
  rotate,
  onClick,
  disabled,
}: {
  icon: string;
  label: string;
  color: string;
  rotate: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: '24px 16px',
        border: '2.5px solid var(--a-ink)',
        borderRadius: 24,
        background: color,
        boxShadow: '4px 4px 0 var(--a-ink)',
        cursor: disabled ? 'wait' : 'pointer',
        fontFamily: 'inherit',
        transform: `rotate(${rotate})`,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div style={{ fontSize: 40 }}>{icon}</div>
      <div className="display" style={{ fontSize: 20, marginTop: 4 }}>
        {label}
      </div>
    </button>
  );
}
