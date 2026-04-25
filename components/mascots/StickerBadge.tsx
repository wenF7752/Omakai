import type { CSSProperties } from 'react';
import { useId } from 'react';

type StickerBadgeProps = {
  text: string;
  size?: number;
  color?: string;
  textColor?: string;
  style?: CSSProperties;
};

export function StickerBadge({
  text,
  size = 100,
  color = 'var(--a-peach-deep)',
  textColor = '#fff',
  style,
}: StickerBadgeProps) {
  const arcId = `sticker-arc-${useId().replace(/:/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <defs>
        <path id={arcId} d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" />
      </defs>
      <circle cx="50" cy="50" r="44" fill={color} />
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="none"
        stroke={textColor}
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.6"
      />
      <text fill={textColor} fontSize="9" fontWeight="700" letterSpacing="2" className="mono">
        <textPath href={`#${arcId}`} startOffset="0%">
          {text} · {text} ·
        </textPath>
      </text>
      <text x="50" y="56" fontSize="14" fontWeight="900" fill={textColor} textAnchor="middle" className="display">
        ★
      </text>
    </svg>
  );
}
