'use client';

import Link from 'next/link';
import { MaskotMaki } from '@/components/mascots/MaskotMaki';
import { StickerBadge } from '@/components/mascots/StickerBadge';
import { Chopsticks } from '@/components/mascots/Chopsticks';
import { WizardButton } from '@/components/wizard/WizardButton';

export default function LandingPage() {
  return (
    <div style={{ paddingTop: 60, minHeight: '100vh' }}>
      <div style={{ position: 'relative', padding: '20px 24px 0', maxWidth: 480, margin: '0 auto' }}>
        <div
          style={{ position: 'absolute', top: 10, right: 18, transform: 'rotate(12deg)' }}
          className="sticker float-y"
        >
          <StickerBadge text="OMABITE" size={68} color="var(--a-butter)" textColor="var(--a-ink)" />
        </div>
        <div
          style={{ position: 'absolute', top: 180, left: -10, transform: 'rotate(-18deg)' }}
          className="sticker"
        >
          <Chopsticks size={70} color="var(--a-sage-deep)" />
        </div>

        <div className="mono" style={{ fontSize: 11, letterSpacing: 2, opacity: 0.6 }}>
          OMABITE.FOOD
        </div>
        <h1 className="display" style={{ fontSize: 64, margin: '12px 0 8px' }}>
          <span style={{ display: 'block' }}>just</span>
          <span style={{ display: 'block', color: 'var(--a-peach-deep)' }}>tell me</span>
          <span style={{ display: 'block' }}>what to</span>
          <span style={{ display: 'block', fontStyle: 'italic', fontWeight: 400 }}>eat tonight.</span>
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.5, marginTop: 20, opacity: 0.8, maxWidth: 300 }}>
          Stop scrolling 1,200 menu items. Answer five quick questions and we&apos;ll pick the one
          dish you should order.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          margin: '24px 0 12px',
          position: 'relative',
        }}
      >
        <div className="float-y">
          <MaskotMaki size={140} />
        </div>
      </div>

      <div
        style={{
          padding: '0 24px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxWidth: 480,
          margin: '0 auto',
        }}
      >
        <Link href="/address" style={{ textDecoration: 'none' }}>
          <WizardButton primary big>
            tell me what I&apos;m craving →
          </WizardButton>
        </Link>
        <div style={{ textAlign: 'center', fontSize: 13, opacity: 0.6 }} className="mono">
          delivered by ubereats · ~25 sec
        </div>
      </div>
    </div>
  );
}
