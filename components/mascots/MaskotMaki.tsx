import type { CSSProperties } from 'react';

type Mood = 'happy' | 'thinking';

type MaskotMakiProps = {
  size?: number;
  mood?: Mood;
  style?: CSSProperties;
};

export function MaskotMaki({ size = 80, mood = 'happy', style }: MaskotMakiProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <ellipse cx="50" cy="58" rx="38" ry="32" fill="#fff8e8" stroke="var(--a-ink)" strokeWidth="2.5" />
      <path d="M14 55 Q14 45 22 42 L78 42 Q86 45 86 55 L86 62 Q50 70 14 62 Z" fill="var(--a-ink)" />
      <ellipse cx="32" cy="72" rx="1.5" ry="1" fill="var(--a-ink)" />
      <ellipse cx="50" cy="78" rx="1.5" ry="1" fill="var(--a-ink)" />
      <ellipse cx="68" cy="72" rx="1.5" ry="1" fill="var(--a-ink)" />
      {mood === 'happy' && (
        <>
          <path d="M36 52 Q40 48 44 52" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M56 52 Q60 48 64 52" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === 'thinking' && (
        <>
          <circle cx="40" cy="52" r="2" fill="#fff" />
          <circle cx="60" cy="52" r="2" fill="#fff" />
        </>
      )}
      <ellipse cx="28" cy="58" rx="3.5" ry="2.5" fill="var(--a-peach-deep)" opacity="0.7" />
      <ellipse cx="72" cy="58" rx="3.5" ry="2.5" fill="var(--a-peach-deep)" opacity="0.7" />
      <path d="M46 60 Q50 64 54 60" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
