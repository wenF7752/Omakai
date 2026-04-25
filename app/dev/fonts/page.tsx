import { notFound } from 'next/navigation';

export default function FontsSmokePage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main style={{ padding: 24 }}>
      <h1 className="display" data-testid="font-display" style={{ fontSize: 48 }}>
        omakai picks dinner
      </h1>
      <p data-testid="font-body" style={{ fontSize: 16, marginTop: 16 }}>
        the chef is choosing for you. relax.
      </p>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        order id: <span className="mono" data-testid="font-mono">ord_2026_04_24_001</span>
      </p>
    </main>
  );
}
