// dir-a-yuzu.jsx — Direction A: Yuzu Sticker
// Pastel peach/butter/sage, mascot-forward, sticker energy, oversized type

const { useState, useEffect, useRef } = React;

// ─── Reusable A bits ───
const ABtn = ({ children, primary, onClick, big, style = {} }) => (
  <button
    onClick={onClick}
    style={{
      border: '2.5px solid #2a1f17',
      background: primary ? '#ff8a5c' : '#fff8e8',
      color: '#2a1f17',
      padding: big ? '18px 28px' : '12px 20px',
      borderRadius: 999,
      fontWeight: 700,
      fontFamily: 'Zen Kaku Gothic New, sans-serif',
      fontSize: big ? 18 : 15,
      cursor: 'pointer',
      boxShadow: '4px 4px 0 #2a1f17',
      transform: 'translate(-1px,-1px)',
      transition: 'transform .12s, box-shadow .12s',
      ...style,
    }}
    onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = '1px 1px 0 #2a1f17'; }}
    onMouseUp={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '4px 4px 0 #2a1f17'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '4px 4px 0 #2a1f17'; }}
  >{children}</button>
);

const AChip = ({ active, children, onClick, color = '#ffb89a' }) => (
  <button onClick={onClick} style={{
    border: '2px solid #2a1f17',
    background: active ? color : '#fff8e8',
    color: '#2a1f17',
    padding: '8px 14px',
    borderRadius: 999,
    fontWeight: 600,
    fontFamily: 'inherit',
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: active ? '2px 2px 0 #2a1f17' : '0 0 0 #2a1f17',
    transform: active ? 'rotate(-1.5deg)' : 'rotate(0)',
    transition: 'all .15s',
  }}>{children}</button>
);

// ─── A1: Landing ───
const ALanding = () => (
  <div className="dir-a phone-screen no-scrollbar" style={{ background: '#fdf6e8', position: 'relative', paddingTop: 60 }}>
    {/* floating sticker accents */}
    <div style={{ position: 'absolute', top: 70, right: 18, transform: 'rotate(12deg)' }} className="sticker float-y">
      <StickerBadge text="OMAKAI" size={68} color="#f7d65a" textColor="#2a1f17"/>
    </div>
    <div style={{ position: 'absolute', top: 240, left: -10, transform: 'rotate(-18deg)' }} className="sticker">
      <Chopsticks size={70} color="#7ea36a"/>
    </div>

    <div style={{ padding: '20px 24px 0' }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: 2, opacity: 0.6 }}>OMAKAI.FOOD</div>
      <h1 className="display" style={{ fontSize: 64, margin: '12px 0 8px' }}>
        <span style={{ display: 'block' }}>just</span>
        <span style={{ display: 'block', color: '#ff8a5c' }}>tell me</span>
        <span style={{ display: 'block' }}>what to</span>
        <span style={{ display: 'block', fontStyle: 'italic', fontWeight: 400 }}>eat tonight.</span>
      </h1>
      <p style={{ fontSize: 16, lineHeight: 1.5, marginTop: 20, opacity: 0.8, maxWidth: 300 }}>
        Stop scrolling 1,200 menu items. Answer five quick questions and we’ll pick the one dish you should order.
      </p>
    </div>

    {/* mascot */}
    <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0 12px', position: 'relative' }}>
      <div className="float-y">
        <MaskotMaki size={140}/>
      </div>
      <div style={{ position: 'absolute', right: 40, top: 20, transform: 'rotate(8deg)' }} className="mono" >
        <div style={{ background: '#fff8e8', border: '2px solid #2a1f17', padding: '6px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
          ohayō! 🍚
        </div>
      </div>
    </div>

    <div style={{ padding: '0 24px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ABtn primary big>tell me what I’m craving →</ABtn>
      <div style={{ textAlign: 'center', fontSize: 13, opacity: 0.6 }} className="mono">delivered by ubereats · ~25 sec</div>
    </div>

    {/* marquee strip */}
    <div style={{ background: '#2a1f17', color: '#fdf6e8', padding: '14px 0', overflow: 'hidden', borderTop: '2.5px solid #2a1f17', borderBottom: '2.5px solid #2a1f17' }}>
      <div className="display" style={{ display: 'flex', gap: 28, whiteSpace: 'nowrap', animation: 'marquee 22s linear infinite', fontSize: 22 }}>
        {Array(2).fill().flatMap((_, j) => ['ramen', '★', 'tacos', '★', 'pho', '★', 'pizza', '★', 'curry', '★', 'sushi', '★', 'wings', '★'].map((w, i) => (
          <span key={`${j}-${i}`} style={{ fontStyle: i % 2 ? 'normal' : 'italic' }}>{w}</span>
        )))}
      </div>
    </div>
  </div>
);

// ─── A2: Address ───
const AAddress = () => (
  <div className="dir-a phone-screen no-scrollbar" style={{ padding: '80px 24px 40px' }}>
    <Stepper step={1} total={5} tone="a"/>
    <h2 className="display" style={{ fontSize: 42, margin: '24px 0 8px' }}>where are<br/>you tonight?</h2>
    <p style={{ opacity: 0.7, marginBottom: 28 }}>So we only suggest places that’ll actually deliver.</p>

    <div style={{
      border: '2.5px solid #2a1f17', borderRadius: 20, padding: 18,
      background: '#fff8e8', boxShadow: '4px 4px 0 #2a1f17', marginBottom: 16,
    }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: 2, opacity: 0.6, marginBottom: 6 }}>ADDRESS</div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>447 Valencia St</div>
      <div style={{ fontSize: 14, opacity: 0.7 }}>San Francisco, CA 94103</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#7ea36a' }}/>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#7ea36a' }}/>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#7ea36a' }}/>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#e0d6c0' }}/>
      </div>
      <div className="mono" style={{ fontSize: 10, marginTop: 6, opacity: 0.6 }}>STRONG SIGNAL · 47 PLACES NEARBY</div>
    </div>

    <button style={{
      width: '100%', textAlign: 'left', padding: 14, background: 'transparent',
      border: '2px dashed #2a1f17', borderRadius: 16, fontFamily: 'inherit', fontSize: 14, cursor: 'pointer'
    }}>📍 use my current location instead</button>

    <div style={{ position: 'absolute', bottom: 30, left: 24, right: 24 }}>
      <ABtn primary big style={{ width: '100%' }}>continue →</ABtn>
    </div>

    <div style={{ position: 'absolute', top: 100, right: -20, transform: 'rotate(15deg)' }} className="sticker">
      <StickerBadge text="STEP 1 OF 5" size={80} color="#b6cfa3" textColor="#2a1f17"/>
    </div>
  </div>
);

// Stepper
const Stepper = ({ step, total, tone = 'a' }) => {
  const inkMap = { a: '#2a1f17', b: '#3a2418', c: '#15110d' };
  const fillMap = { a: '#ff8a5c', b: '#c47b3a', c: '#ff7a4d' };
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 8, borderRadius: 4,
          border: `1.5px solid ${inkMap[tone]}`,
          background: i < step ? fillMap[tone] : 'transparent',
        }}/>
      ))}
      <span className="mono" style={{ fontSize: 11, marginLeft: 8, opacity: 0.6 }}>{step}/{total}</span>
    </div>
  );
};

// ─── A3: Budget ───
const ABudget = () => {
  const [sel, setSel] = useState(1);
  const opts = [
    { sym: '$', label: 'cheap eats', sub: 'under $15', mascot: '🌶' },
    { sym: '$$', label: 'comfort zone', sub: '$15–30', mascot: '🍣' },
    { sym: '$$$', label: 'treat night', sub: '$30+', mascot: '✨' },
  ];
  return (
    <div className="dir-a phone-screen no-scrollbar" style={{ padding: '80px 24px 40px' }}>
      <Stepper step={2} total={5} tone="a"/>
      <h2 className="display" style={{ fontSize: 42, margin: '24px 0 8px' }}>what’s the<br/>budget vibe?</h2>
      <p style={{ opacity: 0.7, marginBottom: 28 }}>Pick one. We’ll keep the recommendation in your range.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {opts.map((o, i) => (
          <button key={i} onClick={() => setSel(i)} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: 18, border: '2.5px solid #2a1f17', borderRadius: 20,
            background: sel === i ? '#f7d65a' : '#fff8e8',
            boxShadow: sel === i ? '4px 4px 0 #2a1f17' : '2px 2px 0 #2a1f17',
            transform: sel === i ? 'rotate(-1deg)' : 'rotate(0)',
            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            transition: 'all .15s',
          }}>
            <div className="display" style={{ fontSize: 36, color: '#ff8a5c', minWidth: 60 }}>{o.sym}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{o.label}</div>
              <div className="mono" style={{ fontSize: 12, opacity: 0.7 }}>{o.sub}</div>
            </div>
            <div style={{ fontSize: 28 }}>{o.mascot}</div>
          </button>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 30, left: 24, right: 24 }}>
        <ABtn primary big style={{ width: '100%' }}>next: vibe check →</ABtn>
      </div>
    </div>
  );
};

// ─── A4: Vibe ───
const AVibe = () => {
  const vibes = ['comfort', 'light', 'spicy', 'fresh', 'indulgent', 'healthy', 'fast', 'cozy', 'crispy', 'saucy', 'umami', 'bright'];
  const colors = ['#ffb89a', '#f7d65a', '#b6cfa3', '#ff8a5c'];
  const [sel, setSel] = useState(new Set(['comfort', 'spicy', 'saucy']));
  const toggle = v => { const n = new Set(sel); n.has(v) ? n.delete(v) : n.add(v); setSel(n); };
  return (
    <div className="dir-a phone-screen no-scrollbar" style={{ padding: '80px 24px 40px' }}>
      <Stepper step={3} total={5} tone="a"/>
      <h2 className="display" style={{ fontSize: 42, margin: '24px 0 8px' }}>what’s the<br/>mood?</h2>
      <p style={{ opacity: 0.7, marginBottom: 28 }}>Tap as many as feel right.</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {vibes.map((v, i) => (
          <AChip key={v} active={sel.has(v)} onClick={() => toggle(v)} color={colors[i % colors.length]}>
            {v}
          </AChip>
        ))}
      </div>

      <div style={{
        marginTop: 32, padding: 16, border: '2px dashed #2a1f17', borderRadius: 16,
        background: '#fff8e8',
      }}>
        <div className="mono" style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>WE’RE THINKING…</div>
        <div style={{ fontSize: 15, fontStyle: 'italic' }}>“something saucy and spicy you can eat with one hand.”</div>
      </div>

      <div style={{ position: 'absolute', bottom: 30, left: 24, right: 24 }}>
        <ABtn primary big style={{ width: '100%' }}>almost there →</ABtn>
      </div>
    </div>
  );
};

// ─── A5: Preferences ───
const APrefs = () => {
  const cuisines = ['japanese', 'korean', 'thai', 'mexican', 'italian', 'indian', 'vietnamese', 'chinese', 'med', 'american'];
  const [sel, setSel] = useState(new Set(['korean', 'thai']));
  const toggle = v => { const n = new Set(sel); n.has(v) ? n.delete(v) : n.add(v); setSel(n); };
  return (
    <div className="dir-a phone-screen no-scrollbar" style={{ padding: '80px 24px 40px' }}>
      <Stepper step={4} total={5} tone="a"/>
      <h2 className="display" style={{ fontSize: 42, margin: '24px 0 8px' }}>any<br/>cravings?</h2>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>Optional — leave blank for full chaos mode.</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
        {cuisines.map((c, i) => (
          <AChip key={c} active={sel.has(c)} onClick={() => toggle(c)} color={['#ffb89a', '#b6cfa3', '#f7d65a'][i % 3]}>
            {c}
          </AChip>
        ))}
      </div>

      <div style={{ border: '2.5px solid #2a1f17', borderRadius: 20, background: '#fff8e8', padding: 14 }}>
        <div className="mono" style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>FREE-TEXT (OPTIONAL)</div>
        <div style={{ fontSize: 15, lineHeight: 1.5 }}>
          something with <span style={{ background: '#f7d65a', padding: '0 4px' }}>noodles</span>, not too heavy<span style={{ animation: 'blink 1s step-end infinite' }}>|</span>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 30, left: 24, right: 24 }}>
        <ABtn primary big style={{ width: '100%' }}>last step →</ABtn>
      </div>
    </div>
  );
};

// ─── A6: Allergies ───
const AAllergies = () => {
  const items = ['peanut', 'tree nut', 'shellfish', 'dairy', 'gluten', 'egg', 'soy', 'sesame'];
  const [sel, setSel] = useState(new Set(['peanut']));
  const [none, setNone] = useState(false);
  const toggle = v => { setNone(false); const n = new Set(sel); n.has(v) ? n.delete(v) : n.add(v); setSel(n); };
  return (
    <div className="dir-a phone-screen no-scrollbar" style={{ padding: '80px 24px 40px' }}>
      <Stepper step={5} total={5} tone="a"/>
      <h2 className="display" style={{ fontSize: 42, margin: '24px 0 8px' }}>anything<br/>off-limits?</h2>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>We’ll skip dishes flagged with these.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        {items.map(i => (
          <button key={i} onClick={() => toggle(i)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px', border: '2px solid #2a1f17', borderRadius: 14,
            background: sel.has(i) ? '#ff8a5c' : '#fff8e8',
            color: '#2a1f17', fontWeight: 600, fontFamily: 'inherit', fontSize: 14,
            cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: 4, border: '2px solid #2a1f17',
              background: sel.has(i) ? '#2a1f17' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{sel.has(i) && <span style={{ color: '#ff8a5c', fontSize: 12 }}>✓</span>}</div>
            {i}
          </button>
        ))}
      </div>

      <button onClick={() => { setNone(!none); setSel(new Set()); }} style={{
        width: '100%', padding: 14, border: '2px solid #2a1f17', borderRadius: 14,
        background: none ? '#b6cfa3' : 'transparent', fontFamily: 'inherit',
        fontWeight: 700, fontSize: 14, cursor: 'pointer',
      }}>
        ✦ no allergies — bring it on
      </button>

      <div style={{ marginTop: 16, padding: 12, fontSize: 12, opacity: 0.7, fontStyle: 'italic' }}>
        ⚠ severe allergy? always confirm ingredients with the restaurant.
      </div>

      <div style={{ position: 'absolute', bottom: 30, left: 24, right: 24 }}>
        <ABtn primary big style={{ width: '100%' }}>ask the chef ✦</ABtn>
      </div>
    </div>
  );
};

// ─── A7: Loading ───
const ALoading = () => {
  const [phase, setPhase] = useState(0);
  const phrases = [
    'scanning 47 restaurants near you…',
    'sniffing the broth…',
    'asking the chef for their pick…',
    'checking nothing has peanuts…',
    'one sec, plating up…',
  ];
  useEffect(() => {
    const t = setInterval(() => setPhase(p => (p + 1) % phrases.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="dir-a phone-screen no-scrollbar" style={{ padding: '80px 24px 40px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
        <div style={{ position: 'relative', width: 200, height: 200 }}>
          <div style={{ position: 'absolute', inset: 30, border: '3px dashed #ff8a5c', borderRadius: '50%', animation: 'spin-slow 8s linear infinite' }}/>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="float-y"><MaskotMaki size={140} mood="thinking"/></div>
          </div>
          {/* steam */}
          <div style={{ position: 'absolute', top: 20, left: 60, width: 6, height: 30, background: '#fff', borderRadius: 3, opacity: 0.6, animation: 'steam 2s ease-in-out infinite' }}/>
          <div style={{ position: 'absolute', top: 30, left: 100, width: 6, height: 30, background: '#fff', borderRadius: 3, opacity: 0.6, animation: 'steam 2s ease-in-out infinite .4s' }}/>
          <div style={{ position: 'absolute', top: 25, left: 140, width: 6, height: 30, background: '#fff', borderRadius: 3, opacity: 0.6, animation: 'steam 2s ease-in-out infinite .8s' }}/>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div className="display" style={{ fontSize: 32, marginBottom: 8 }}>asking<br/>the chef…</div>
          <div className="mono" style={{ fontSize: 13, opacity: 0.7, height: 20 }} key={phase}>{phrases[phase]}</div>
        </div>

        {/* status checklist */}
        <div style={{ width: '100%', background: '#fff8e8', border: '2px solid #2a1f17', borderRadius: 16, padding: 14 }}>
          {[
            { label: 'address received', done: true },
            { label: 'menus loaded', done: true },
            { label: 'chef is choosing', done: phase >= 2 },
            { label: 'double-checking allergens', done: false },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 14 }}>
              <div style={{
                width: 18, height: 18, borderRadius: 9, border: '2px solid #2a1f17',
                background: s.done ? '#7ea36a' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{s.done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>}</div>
              <span style={{ opacity: s.done ? 1 : 0.6 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── A8: Recommendation card (magazine) ───
const ARec = () => (
  <div className="dir-a phone-screen no-scrollbar" style={{ paddingBottom: 100 }}>
    {/* hero */}
    <div style={{ position: 'relative', height: 280, background: '#ff8a5c', overflow: 'hidden' }}>
      <DishPlaceholder width="100%" height={280} label="HERO DISH PHOTO" tone="a" style={{ width: '100%', height: '100%' }}/>
      <div style={{ position: 'absolute', top: 56, left: 16 }} className="mono">
        <div style={{ background: '#2a1f17', color: '#fdf6e8', padding: '4px 10px', borderRadius: 12, fontSize: 10, letterSpacing: 2, display: 'inline-block' }}>TONIGHT’S PICK</div>
      </div>
      <div style={{ position: 'absolute', top: 50, right: 14, transform: 'rotate(12deg)' }} className="sticker wobble">
        <StickerBadge text="OMAKAI APPROVED" size={86} color="#f7d65a" textColor="#2a1f17"/>
      </div>
    </div>

    <div style={{ padding: '24px 22px 0' }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: 2, opacity: 0.6 }}>FROM · KOJA KITCHEN · 0.4 MI</div>
      <h1 className="display" style={{ fontSize: 44, margin: '6px 0 4px' }}>Spicy Tonkotsu Tantanmen</h1>
      <div style={{ fontSize: 15, opacity: 0.7 }}>house ramen with chili miso, scallions, soft egg</div>

      {/* price callouts */}
      <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
        {[
          { k: 'PRICE', v: '$18.50', c: '#f7d65a' },
          { k: 'KCAL', v: '~640', c: '#b6cfa3' },
          { k: 'ETA', v: '28 min', c: '#ffb89a' },
          { k: 'HEAT', v: '🌶🌶', c: '#fff8e8' },
        ].map(p => (
          <div key={p.k} style={{
            border: '2px solid #2a1f17', background: p.c, padding: '8px 12px', borderRadius: 14,
            boxShadow: '2px 2px 0 #2a1f17',
          }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: 1.5, opacity: 0.7 }}>{p.k}</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{p.v}</div>
          </div>
        ))}
      </div>

      {/* reasoning */}
      <div style={{ marginTop: 24, padding: 18, background: '#fff8e8', border: '2.5px solid #2a1f17', borderRadius: 20, position: 'relative' }}>
        <div style={{ position: 'absolute', top: -16, left: 14, background: '#fdf6e8', padding: '0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <MaskotMaki size={28}/>
          <span className="mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }}>WHY THIS</span>
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.5, margin: 0 }}>
          You said <b>saucy + spicy + noodles</b>, no peanuts, comfort-tier budget. Koja’s tantanmen hits all three — bone broth that drinks like comfort, miso-chili paste for the heat, and the soft egg keeps it from being a one-note experience. Skipped their pad thai because of cross-contamination risk on peanuts.
        </p>
      </div>

      {/* ingredients */}
      <div style={{ marginTop: 18 }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: 2, opacity: 0.6, marginBottom: 8 }}>WHAT’S IN IT</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 13 }}>
          {['tonkotsu broth', 'wheat noodles', 'chili miso', 'ground pork', 'scallion', 'soft egg', 'bok choy'].map(x => (
            <span key={x} style={{ padding: '4px 10px', border: '1.5px solid #2a1f17', borderRadius: 999 }}>{x}</span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24, padding: 12, background: '#b6cfa3', border: '2px solid #2a1f17', borderRadius: 14, fontSize: 12, fontStyle: 'italic' }}>
        ⚠ severe allergy? confirm with restaurant. our model only sees what UberEats publishes.
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 22, marginBottom: 16 }}>
        <button style={{ flex: 1, border: '2px solid #2a1f17', background: 'transparent', borderRadius: 14, padding: 14, fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer' }}>↻ try another</button>
        <ABtn primary style={{ flex: 2, padding: '14px 16px' }}>order on UberEats →</ABtn>
      </div>
    </div>
  </div>
);

// ─── A9: Did it land? ───
const AFeedback = () => (
  <div className="dir-a phone-screen no-scrollbar" style={{ padding: '80px 24px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center', marginBottom: 32 }}>
      <div className="float-y" style={{ display: 'inline-block' }}><MaskotMaki size={120}/></div>
      <h2 className="display" style={{ fontSize: 44, margin: '16px 0 8px' }}>did it<br/>land?</h2>
      <p style={{ opacity: 0.7 }}>the tantanmen from Koja Kitchen.</p>
    </div>

    <div style={{ display: 'flex', gap: 12 }}>
      <button style={{
        flex: 1, padding: '24px 16px', border: '2.5px solid #2a1f17', borderRadius: 24,
        background: '#b6cfa3', boxShadow: '4px 4px 0 #2a1f17', cursor: 'pointer',
        fontFamily: 'inherit', transform: 'rotate(-2deg)',
      }}>
        <div style={{ fontSize: 40 }}>✦</div>
        <div className="display" style={{ fontSize: 20, marginTop: 4 }}>nailed it</div>
      </button>
      <button style={{
        flex: 1, padding: '24px 16px', border: '2.5px solid #2a1f17', borderRadius: 24,
        background: '#ffb89a', boxShadow: '4px 4px 0 #2a1f17', cursor: 'pointer',
        fontFamily: 'inherit', transform: 'rotate(2deg)',
      }}>
        <div style={{ fontSize: 40 }}>↺</div>
        <div className="display" style={{ fontSize: 20, marginTop: 4 }}>not quite</div>
      </button>
    </div>

    <div style={{ textAlign: 'center', marginTop: 32, fontSize: 13, opacity: 0.6 }} className="mono">
      we learn from every answer.
    </div>
  </div>
);

// ─── A10: Signup wall ───
const ASignup = () => (
  <div className="dir-a phone-screen no-scrollbar" style={{ padding: '80px 24px 40px', position: 'relative' }}>
    <div style={{ position: 'absolute', top: 60, right: 0, transform: 'rotate(20deg)' }} className="sticker wobble">
      <StickerBadge text="3 NAILED · NICE" size={90} color="#7ea36a" textColor="#fff"/>
    </div>

    <div style={{ marginTop: 80 }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: 2, opacity: 0.6 }}>YOU’VE EARNED THIS</div>
      <h2 className="display" style={{ fontSize: 48, margin: '12px 0 16px' }}>save your<br/>taste, omakai<br/>gets sharper.</h2>
      <p style={{ fontSize: 15, lineHeight: 1.55, opacity: 0.8, marginBottom: 28 }}>
        Three picks landed. Make an account and we’ll remember your allergies, vibe, and what worked — across devices.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ABtn primary big>continue with apple</ABtn>
        <ABtn big>continue with email</ABtn>
        <button style={{ background: 'none', border: 'none', fontFamily: 'inherit', textDecoration: 'underline', opacity: 0.6, cursor: 'pointer', padding: 12 }}>
          maybe later
        </button>
      </div>

      <div style={{ marginTop: 32, padding: 14, background: '#fff8e8', border: '2px solid #2a1f17', borderRadius: 16 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 2, opacity: 0.6, marginBottom: 6 }}>YOUR TASTE SO FAR</div>
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>saucy · spicy · korean-leaning · no peanuts · 28-min sweet spot · loves a soft egg</div>
      </div>
    </div>
  </div>
);

Object.assign(window, {
  ALanding, AAddress, ABudget, AVibe, APrefs, AAllergies, ALoading, ARec, AFeedback, ASignup, Stepper, ABtn, AChip,
});
