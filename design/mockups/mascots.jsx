// mascots.jsx — playful mascot characters for omakai
// Each direction gets its own mascot personality

// Direction A: "Maki" — a happy little rice ball with chopstick eyes
const MaskotMaki = ({ size = 80, mood = 'happy', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    {/* nori band */}
    <ellipse cx="50" cy="58" rx="38" ry="32" fill="#fff8e8" stroke="#2a1f17" strokeWidth="2.5"/>
    <path d="M14 55 Q14 45 22 42 L78 42 Q86 45 86 55 L86 62 Q50 70 14 62 Z" fill="#2a1f17"/>
    {/* sesame seeds */}
    <ellipse cx="32" cy="72" rx="1.5" ry="1" fill="#2a1f17"/>
    <ellipse cx="50" cy="78" rx="1.5" ry="1" fill="#2a1f17"/>
    <ellipse cx="68" cy="72" rx="1.5" ry="1" fill="#2a1f17"/>
    {/* eyes */}
    {mood === 'happy' && (
      <>
        <path d="M36 52 Q40 48 44 52" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M56 52 Q60 48 64 52" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      </>
    )}
    {mood === 'thinking' && (
      <>
        <circle cx="40" cy="52" r="2" fill="#fff"/>
        <circle cx="60" cy="52" r="2" fill="#fff"/>
      </>
    )}
    {/* cheeks */}
    <ellipse cx="28" cy="58" rx="3.5" ry="2.5" fill="#ff8a5c" opacity="0.7"/>
    <ellipse cx="72" cy="58" rx="3.5" ry="2.5" fill="#ff8a5c" opacity="0.7"/>
    {/* mouth */}
    <path d="M46 60 Q50 64 54 60" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>
);

// Direction B: "Daruma" — minimal mincho mascot, a tiny daruma doll
const MaskotDaruma = ({ size = 80, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    {/* body */}
    <path d="M50 18 C28 18 20 38 22 60 C24 80 36 88 50 88 C64 88 76 80 78 60 C80 38 72 18 50 18 Z" fill="#c47b3a"/>
    {/* face plate */}
    <ellipse cx="50" cy="42" rx="22" ry="20" fill="#faf7ee"/>
    {/* brows */}
    <path d="M34 36 Q40 32 44 38" stroke="#1a1410" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M56 38 Q60 32 66 36" stroke="#1a1410" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* eyes */}
    <circle cx="40" cy="44" r="2.5" fill="#1a1410"/>
    <circle cx="60" cy="44" r="2.5" fill="#1a1410"/>
    {/* mouth */}
    <path d="M44 52 Q50 56 56 52" stroke="#1a1410" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    {/* belly kanji 食 — placeholder strokes */}
    <text x="50" y="78" fontSize="14" fontFamily="Shippori Mincho, serif" fontWeight="700" fill="#faf7ee" textAnchor="middle">食</text>
  </svg>
);

// Direction C: "Bowl" — a bold flat-color bowl with steam
const MaskotBowl = ({ size = 80, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    {/* steam */}
    <path d="M30 20 Q26 12 32 6" stroke="#15110d" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5"/>
    <path d="M50 18 Q46 8 52 2" stroke="#15110d" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5"/>
    <path d="M70 20 Q66 12 72 6" stroke="#15110d" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5"/>
    {/* contents (egg + greens) */}
    <ellipse cx="50" cy="42" rx="32" ry="6" fill="#ffd23f"/>
    <circle cx="42" cy="38" r="6" fill="#fff"/>
    <circle cx="42" cy="38" r="3" fill="#ff7a4d"/>
    <path d="M58 36 L62 32 M64 38 L68 34" stroke="#5b8c5a" strokeWidth="2" strokeLinecap="round"/>
    {/* bowl */}
    <path d="M14 44 Q14 78 50 80 Q86 78 86 44 Z" fill="#ff7a4d" stroke="#15110d" strokeWidth="3"/>
    {/* face */}
    <circle cx="40" cy="62" r="2" fill="#15110d"/>
    <circle cx="60" cy="62" r="2" fill="#15110d"/>
    <path d="M44 70 Q50 74 56 70" stroke="#15110d" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>
);

// Sticker — a circular stamp-like badge with rotated text around it
const StickerBadge = ({ text = 'ORDER NOW', size = 100, color = '#ff8a5c', textColor = '#fff', style = {} }) => {
  const chars = text.split('');
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <defs>
        <path id={`sticker-arc-${text}`} d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" />
      </defs>
      <circle cx="50" cy="50" r="44" fill={color}/>
      <circle cx="50" cy="50" r="38" fill="none" stroke={textColor} strokeWidth="1" strokeDasharray="2 2" opacity="0.6"/>
      <text fill={textColor} fontSize="9" fontWeight="700" letterSpacing="2" fontFamily="DM Mono, monospace">
        <textPath href={`#sticker-arc-${text}`} startOffset="0%">
          {text} · {text} ·
        </textPath>
      </text>
      <text x="50" y="56" fontSize="14" fontWeight="900" fontFamily="Fraunces, serif" fill={textColor} textAnchor="middle">★</text>
    </svg>
  );
};

// Chopsticks decorative element
const Chopsticks = ({ size = 60, color = '#2a1f17', style = {} }) => (
  <svg width={size} height={size * 0.3} viewBox="0 0 100 30" style={style}>
    <rect x="2" y="6" width="96" height="3" rx="1.5" fill={color} transform="rotate(-2 50 8)"/>
    <rect x="2" y="20" width="96" height="3" rx="1.5" fill={color} transform="rotate(-2 50 22)"/>
  </svg>
);

// Bowl placeholder for dish image (used widely)
const DishPlaceholder = ({ width = 200, height = 200, label = 'DISH PHOTO', tone = 'a', style = {} }) => {
  const palettes = {
    a: { bg: '#ffe8d2', stripe: '#ffb89a', text: '#2a1f17' },
    b: { bg: '#ede4d0', stripe: '#c47b3a', text: '#3a2418' },
    c: { bg: '#ffd23f', stripe: '#ff7a4d', text: '#15110d' },
  };
  const p = palettes[tone];
  return (
    <div style={{
      width, height, position: 'relative', overflow: 'hidden',
      background: `repeating-linear-gradient(45deg, ${p.bg} 0 12px, ${p.stripe}20 12px 24px)`,
      ...style,
    }}>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: 2, color: p.text, opacity: 0.55,
      }}>{label}</div>
    </div>
  );
};

Object.assign(window, { MaskotMaki, MaskotDaruma, MaskotBowl, StickerBadge, Chopsticks, DishPlaceholder });
