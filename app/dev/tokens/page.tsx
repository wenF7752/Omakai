import { notFound } from 'next/navigation';

const TOKENS = [
  { name: 'cream', className: 'bg-cream' },
  { name: 'mist', className: 'bg-mist' },
  { name: 'peach', className: 'bg-peach' },
  { name: 'peach-deep', className: 'bg-peach-deep' },
  { name: 'butter', className: 'bg-butter' },
  { name: 'sage', className: 'bg-sage' },
  { name: 'sage-deep', className: 'bg-sage-deep' },
  { name: 'ink', className: 'bg-ink' },
] as const;

const ANIMATIONS = ['wobble', 'float-y', 'spin-slow', 'pop-in'] as const;

export default function TokensSmokePage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Yuzu token smoke test</h1>

      <section>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Palette</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TOKENS.map((t) => (
            <div
              key={t.name}
              data-testid={`token-${t.name}`}
              className={t.className}
              style={{
                width: 96,
                height: 96,
                border: '2px solid var(--a-ink)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                padding: 6,
                fontSize: 11,
                color: t.name === 'ink' ? 'var(--a-cream)' : 'var(--a-ink)',
              }}
            >
              {t.name}
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Animations</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          {ANIMATIONS.map((a) => (
            <div
              key={a}
              data-testid={`anim-${a}`}
              className={a}
              style={{
                width: 64,
                height: 64,
                background: 'var(--a-peach-deep)',
                border: '2px solid var(--a-ink)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: 'var(--a-cream)',
              }}
            >
              {a}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
