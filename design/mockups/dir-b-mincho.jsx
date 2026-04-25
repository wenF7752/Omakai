// dir-b-mincho.jsx — Direction B: Mincho Editorial
// Soft ivory + miso accent, mincho serif display, magazine layout

const { useState: useStateB, useEffect: useEffectB } = React;

const BBtn = ({ children, primary, style = {}, big, ...rest }) => (
  <button {...rest} style={{
    border: 'none',
    background: primary ? '#c47b3a' : 'transparent',
    color: primary ? '#faf7ee' : '#1a1410',
    padding: big ? '18px 28px' : '12px 20px',
    borderRadius: 0,
    fontWeight: 500,
    fontFamily: 'Inter, sans-serif',
    fontSize: big ? 15 : 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    cursor: 'pointer',
    borderBottom: primary ? '1px solid #1a1410' : '1px solid #1a1410',
    transition: 'all .2s',
    ...style,
  }}>{children}</button>
);

const BStepper = ({ step, total }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: 2 }}>
    <span style={{ opacity: 0.6 }}>{String(step).padStart(2, '0')}</span>
    <div style={{ flex: 1, height: 1, background: '#1a1410', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, top: -1, height: 3, background: '#c47b3a', width: `${(step/total)*100}%` }}/>
    </div>
    <span style={{ opacity: 0.6 }}>{String(total).padStart(2, '0')}</span>
  </div>
);

// ─── B1: Landing ───
const BLanding = () => (
  <div className="dir-b phone-screen no-scrollbar" style={{ background: '#f5efe1', position: 'relative' }}>
    <div style={{ padding: '60px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="display" style={{ fontSize: 22, fontStyle: 'italic' }}>omakai<span style={{ color: '#c47b3a' }}>.</span></div>
      <div className="mono" style={{ fontSize: 10, letterSpacing: 2, opacity: 0.6 }}>NO. 001 · TONIGHT</div>
    </div>

    <div style={{ padding: '40px 24px 0' }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: 3, color: '#c47b3a', marginBottom: 20 }}>お任せ — I LEAVE IT TO YOU</div>
      <h1 className="display" style={{ fontSize: 56, margin: 0, lineHeight: 1.0 }}>
        One dish.<br/>
        <span style={{ fontStyle: 'italic', color: '#c47b3a' }}>Tonight.</span><br/>
        Chosen<br/>for you.
      </h1>

      {/* japanese decoration */}
      <div className="display" style={{ fontSize: 100, color: 'rgba(196,123,58,0.15)', position: 'absolute', right: -20, top: 200, fontWeight: 800, lineHeight: 1 }}>食</div>

      <div style={{ marginTop: 32, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <MaskotDaruma size={64}/>
        <p style={{ fontSize: 15, lineHeight: 1.6, opacity: 0.85, margin: 0, flex: 1 }}>
          A short questionnaire. A grounded recommendation. A direct line to UberEats. No browsing.
        </p>
      </div>

      <div style={{ marginTop: 40, paddingBottom: 30 }}>
        <BBtn primary big style={{ width: '100%' }}>Begin →</BBtn>
      </div>

      {/* footer trio */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, paddingTop: 24, borderTop: '1px solid #1a1410' }}>
        {[
          { n: '5', l: 'questions' },
          { n: '~25s', l: 'to your pick' },
          { n: '1', l: 'confident answer' },
        ].map(x => (
          <div key={x.l}>
            <div className="display" style={{ fontSize: 28, color: '#c47b3a' }}>{x.n}</div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: 2, opacity: 0.7, marginTop: 4 }}>{x.l.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 40 }}/>
    </div>
  </div>
);

// ─── B2: Address ───
const BAddress = () => (
  <div className="dir-b phone-screen no-scrollbar" style={{ padding: '60px 24px 100px' }}>
    <BStepper step={1} total={5}/>
    <div className="mono" style={{ fontSize: 10, letterSpacing: 3, color: '#c47b3a', marginTop: 32 }}>CHAPTER ONE</div>
    <h2 className="display" style={{ fontSize: 40, margin: '8px 0 24px', lineHeight: 1.05 }}>
      Where shall<br/>
      <span style={{ fontStyle: 'italic' }}>we deliver?</span>
    </h2>

    <div style={{ borderTop: '1px solid #1a1410', borderBottom: '1px solid #1a1410', padding: '20px 0', marginTop: 24 }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: 2, opacity: 0.6, marginBottom: 6 }}>住所 · ADDRESS</div>
      <div className="display" style={{ fontSize: 22 }}>447 Valencia Street</div>
      <div style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>San Francisco, CA 94103</div>
    </div>

    <div style={{ marginTop: 14, padding: 12, background: '#ede4d0', fontSize: 12, lineHeight: 1.5 }}>
      <span style={{ color: '#7a8a4a', fontWeight: 700 }}>● Strong signal.</span> 47 restaurants within 2 miles can deliver to this address tonight.
    </div>

    <button style={{ marginTop: 14, background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 14, textDecoration: 'underline', cursor: 'pointer', padding: 0, color: '#1a1410' }}>
      use current location instead →
    </button>

    <div style={{ position: 'absolute', bottom: 30, left: 24, right: 24, display: 'flex', justifyContent: 'space-between' }}>
      <BBtn>← Back</BBtn>
      <BBtn primary>Continue →</BBtn>
    </div>
  </div>
);

// ─── B3: Budget ───
const BBudget = () => {
  const [sel, setSel] = useStateB(1);
  const opts = [
    { sym: '$', label: 'Modest', sub: 'under $15', kanji: '一' },
    { sym: '$$', label: 'Considered', sub: '$15–30', kanji: '二' },
    { sym: '$$$', label: 'Indulgent', sub: '$30+', kanji: '三' },
  ];
  return (
    <div className="dir-b phone-screen no-scrollbar" style={{ padding: '60px 24px 100px' }}>
      <BStepper step={2} total={5}/>
      <div className="mono" style={{ fontSize: 10, letterSpacing: 3, color: '#c47b3a', marginTop: 32 }}>CHAPTER TWO</div>
      <h2 className="display" style={{ fontSize: 40, margin: '8px 0 28px', lineHeight: 1.05 }}>
        How much,<br/>
        <span style={{ fontStyle: 'italic' }}>tonight?</span>
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {opts.map((o, i) => (
          <button key={i} onClick={() => setSel(i)} style={{
            display: 'flex', alignItems: 'center', gap: 20, padding: '20px 0',
            border: 'none', borderTop: '1px solid #1a1410',
            borderBottom: i === opts.length - 1 ? '1px solid #1a1410' : 'none',
            background: sel === i ? '#ede4d0' : 'transparent',
            fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
            paddingLeft: sel === i ? 16 : 0,
            transition: 'all .2s',
          }}>
            <div className="display" style={{ fontSize: 36, color: sel === i ? '#c47b3a' : '#1a1410', minWidth: 50 }}>{o.kanji}</div>
            <div style={{ flex: 1 }}>
              <div className="display" style={{ fontSize: 24 }}>{o.label}</div>
              <div className="mono" style={{ fontSize: 11, letterSpacing: 1.5, opacity: 0.7, marginTop: 2 }}>{o.sub.toUpperCase()}</div>
            </div>
            <div className="display" style={{ fontSize: 20, opacity: 0.5 }}>{o.sym}</div>
          </button>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 30, left: 24, right: 24, display: 'flex', justifyContent: 'space-between' }}>
        <BBtn>← Back</BBtn>
        <BBtn primary>Continue →</BBtn>
      </div>
    </div>
  );
};

// ─── B4: Vibe ───
const BVibe = () => {
  const vibes = [
    { en: 'comfort', jp: '安心' },
    { en: 'light', jp: '軽い' },
    { en: 'spicy', jp: '辛い' },
    { en: 'fresh', jp: '新鮮' },
    { en: 'indulgent', jp: '贅沢' },
    { en: 'healthy', jp: '健康' },
    { en: 'fast', jp: '速い' },
    { en: 'cozy', jp: '居心地' },
    { en: 'umami', jp: '旨味' },
  ];
  const [sel, setSel] = useStateB(new Set(['comfort', 'spicy', 'umami']));
  const toggle = v => { const n = new Set(sel); n.has(v) ? n.delete(v) : n.add(v); setSel(n); };
  return (
    <div className="dir-b phone-screen no-scrollbar" style={{ padding: '60px 24px 100px' }}>
      <BStepper step={3} total={5}/>
      <div className="mono" style={{ fontSize: 10, letterSpacing: 3, color: '#c47b3a', marginTop: 32 }}>CHAPTER THREE</div>
      <h2 className="display" style={{ fontSize: 40, margin: '8px 0 24px', lineHeight: 1.05 }}>
        The mood,<br/>
        <span style={{ fontStyle: 'italic' }}>described.</span>
      </h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {vibes.map(v => (
          <button key={v.en} onClick={() => toggle(v.en)} style={{
            border: '1px solid #1a1410',
            background: sel.has(v.en) ? '#1a1410' : 'transparent',
            color: sel.has(v.en) ? '#faf7ee' : '#1a1410',
            padding: '10px 14px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 14,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
            transition: 'all .15s',
          }}>
            <span style={{ fontWeight: 500 }}>{v.en}</span>
            <span className="display" style={{ fontSize: 11, opacity: 0.7 }}>{v.jp}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 32, padding: '16px 0', borderTop: '1px solid #1a1410', borderBottom: '1px solid #1a1410' }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 2, color: '#c47b3a', marginBottom: 6 }}>WE’RE READING</div>
        <div className="display" style={{ fontSize: 18, fontStyle: 'italic', lineHeight: 1.4 }}>
          “Something deep, slow-built — broth-forward, with a little burn.”
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 30, left: 24, right: 24, display: 'flex', justifyContent: 'space-between' }}>
        <BBtn>← Back</BBtn>
        <BBtn primary>Continue →</BBtn>
      </div>
    </div>
  );
};

// ─── B5: Prefs ───
const BPrefs = () => {
  const cuisines = ['Japanese', 'Korean', 'Thai', 'Mexican', 'Italian', 'Indian', 'Vietnamese', 'Chinese', 'Mediterranean'];
  const [sel, setSel] = useStateB(new Set(['Korean', 'Thai']));
  const toggle = v => { const n = new Set(sel); n.has(v) ? n.delete(v) : n.add(v); setSel(n); };
  return (
    <div className="dir-b phone-screen no-scrollbar" style={{ padding: '60px 24px 100px' }}>
      <BStepper step={4} total={5}/>
      <div className="mono" style={{ fontSize: 10, letterSpacing: 3, color: '#c47b3a', marginTop: 32 }}>CHAPTER FOUR</div>
      <h2 className="display" style={{ fontSize: 40, margin: '8px 0 24px', lineHeight: 1.05 }}>
        Any<br/>
        <span style={{ fontStyle: 'italic' }}>cravings?</span>
      </h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
        {cuisines.map(c => (
          <button key={c} onClick={() => toggle(c)} style={{
            border: '1px solid #1a1410',
            background: sel.has(c) ? '#c47b3a' : 'transparent',
            color: sel.has(c) ? '#faf7ee' : '#1a1410',
            padding: '8px 14px',
            cursor: 'pointer',
            fontFamily: 'Shippori Mincho, serif',
            fontSize: 16,
            fontStyle: sel.has(c) ? 'italic' : 'normal',
            transition: 'all .15s',
          }}>
            {c}
          </button>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #1a1410', paddingTop: 16 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 2, opacity: 0.6, marginBottom: 8 }}>FREE FORM · OPTIONAL</div>
        <div className="display" style={{ fontSize: 22, fontStyle: 'italic', lineHeight: 1.3, minHeight: 60 }}>
          something with noodles, not too heavy<span style={{ animation: 'blink 1s step-end infinite', color: '#c47b3a' }}>|</span>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 30, left: 24, right: 24, display: 'flex', justifyContent: 'space-between' }}>
        <BBtn>← Back</BBtn>
        <BBtn primary>Continue →</BBtn>
      </div>
    </div>
  );
};

// ─── B6: Allergies ───
const BAllergies = () => {
  const items = ['Peanut', 'Tree nut', 'Shellfish', 'Dairy', 'Gluten', 'Egg', 'Soy', 'Sesame'];
  const [sel, setSel] = useStateB(new Set(['Peanut']));
  const toggle = v => { const n = new Set(sel); n.has(v) ? n.delete(v) : n.add(v); setSel(n); };
  return (
    <div className="dir-b phone-screen no-scrollbar" style={{ padding: '60px 24px 100px' }}>
      <BStepper step={5} total={5}/>
      <div className="mono" style={{ fontSize: 10, letterSpacing: 3, color: '#c47b3a', marginTop: 32 }}>FINAL CHAPTER</div>
      <h2 className="display" style={{ fontSize: 40, margin: '8px 0 28px', lineHeight: 1.05 }}>
        Anything<br/>
        <span style={{ fontStyle: 'italic' }}>off-limits?</span>
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map(i => (
          <button key={i} onClick={() => toggle(i)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 0', border: 'none', borderTop: '1px solid #1a1410',
            background: 'transparent', fontFamily: 'inherit',
            fontSize: 17, cursor: 'pointer', textAlign: 'left',
            color: sel.has(i) ? '#c47b3a' : '#1a1410',
          }}>
            <span className="display" style={{ fontStyle: sel.has(i) ? 'italic' : 'normal' }}>{i}</span>
            <span style={{ fontSize: 14 }}>{sel.has(i) ? '✓ avoid' : '○'}</span>
          </button>
        ))}
        <div style={{ borderTop: '1px solid #1a1410' }}/>
      </div>

      <div style={{ marginTop: 18, fontSize: 12, opacity: 0.65, fontStyle: 'italic', lineHeight: 1.5 }}>
        For severe allergies, always confirm ingredients with the restaurant. We work from what UberEats publishes.
      </div>

      <div style={{ position: 'absolute', bottom: 30, left: 24, right: 24, display: 'flex', justifyContent: 'space-between' }}>
        <BBtn>← Back</BBtn>
        <BBtn primary>Choose for me →</BBtn>
      </div>
    </div>
  );
};

// ─── B7: Loading ───
const BLoading = () => {
  const [phase, setPhase] = useStateB(0);
  const phrases = [
    'reading 47 menus near 94103',
    'considering broths, sauces, heat',
    'cross-checking against allergens',
    'consulting the daruma',
  ];
  useEffectB(() => {
    const t = setInterval(() => setPhase(p => Math.min(phrases.length - 1, p + 1)), 1600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="dir-b phone-screen no-scrollbar" style={{ padding: '60px 24px 40px', display: 'flex', flexDirection: 'column' }}>
      <BStepper step={5} total={5}/>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="display" style={{ fontSize: 110, color: '#c47b3a', position: 'relative' }}>
          <span style={{ animation: 'spin-slow 6s linear infinite', display: 'inline-block' }}>食</span>
        </div>

        <h2 className="display" style={{ fontSize: 36, margin: '20px 0 8px', textAlign: 'center', lineHeight: 1 }}>
          asking the<br/><span style={{ fontStyle: 'italic' }}>chef.</span>
        </h2>
        <div className="mono" style={{ fontSize: 11, letterSpacing: 2, opacity: 0.6, marginTop: 8 }}>
          ESTIMATED · 18 SECONDS REMAINING
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1a1410', paddingTop: 14 }}>
        {phrases.map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0',
            opacity: i <= phase ? 1 : 0.3,
            fontSize: 14,
          }}>
            <span className="mono" style={{ fontSize: 10, color: '#c47b3a', minWidth: 24 }}>0{i+1}</span>
            <span style={{ flex: 1, fontStyle: i === phase ? 'italic' : 'normal' }}>{p}</span>
            {i < phase && <span style={{ color: '#7a8a4a' }}>✓</span>}
            {i === phase && <span style={{ color: '#c47b3a', animation: 'blink 1s step-end infinite' }}>●</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── B8: Recommendation ───
const BRec = () => (
  <div className="dir-b phone-screen no-scrollbar" style={{ paddingBottom: 40 }}>
    {/* masthead */}
    <div style={{ padding: '60px 24px 16px', borderBottom: '1px solid #1a1410', display: 'flex', justifyContent: 'space-between' }}>
      <div className="display" style={{ fontSize: 22, fontStyle: 'italic' }}>omakai<span style={{ color: '#c47b3a' }}>.</span></div>
      <div className="mono" style={{ fontSize: 10, letterSpacing: 2, opacity: 0.6 }}>NO.001 · 19:42</div>
    </div>

    {/* article header */}
    <div style={{ padding: '24px 24px 0' }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: 3, color: '#c47b3a' }}>TONIGHT’S RECOMMENDATION</div>
      <h1 className="display" style={{ fontSize: 38, margin: '12px 0 4px', lineHeight: 1.05 }}>
        Spicy Tonkotsu<br/>
        <span style={{ fontStyle: 'italic' }}>Tantanmen.</span>
      </h1>
      <div style={{ fontSize: 14, opacity: 0.7, fontStyle: 'italic' }}>at Koja Kitchen · 0.4 miles · 28 min</div>
    </div>

    {/* hero image */}
    <div style={{ margin: '20px 0', position: 'relative' }}>
      <DishPlaceholder width="100%" height={260} label="HERO · DISH" tone="b" style={{ width: '100%' }}/>
      <div style={{ padding: '6px 24px 0', fontSize: 12, fontStyle: 'italic', opacity: 0.65 }}>
        Fig. 1 — bone broth, chili miso, soft egg.
      </div>
    </div>

    {/* drop-cap reasoning */}
    <div style={{ padding: '0 24px' }}>
      <p style={{ fontSize: 16, lineHeight: 1.6, fontFamily: 'Shippori Mincho, serif' }}>
        <span className="display" style={{ float: 'left', fontSize: 64, lineHeight: 0.85, marginRight: 8, marginTop: 4, color: '#c47b3a', fontStyle: 'italic' }}>Y</span>
        ou said saucy, spicy, with noodles — and asked us to skip peanuts. Koja’s tantanmen is the answer almost too obvious to miss: a slow-built tonkotsu base spiked with miso and chili, ground pork rendered until silky, a wobbly soft egg to slow you down. Their pad thai would have been the easy second choice; we removed it because of cross-contamination risk on peanuts.
      </p>
    </div>

    {/* callouts */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', borderTop: '1px solid #1a1410', borderBottom: '1px solid #1a1410', marginTop: 20 }}>
      {[
        { k: 'PRICE', v: '$18.50' },
        { k: 'KCAL', v: '~640' },
        { k: 'ETA', v: '28 m' },
        { k: 'HEAT', v: '★★☆' },
      ].map((p, i) => (
        <div key={p.k} style={{
          padding: '14px 8px', textAlign: 'center',
          borderRight: i < 3 ? '1px solid #1a1410' : 'none',
        }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: 2, opacity: 0.6 }}>{p.k}</div>
          <div className="display" style={{ fontSize: 22, marginTop: 2 }}>{p.v}</div>
        </div>
      ))}
    </div>

    {/* ingredients */}
    <div style={{ padding: '24px' }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: 3, color: '#c47b3a', marginBottom: 10 }}>INGREDIENTS · 食材</div>
      <div style={{ fontSize: 14, lineHeight: 1.6, fontStyle: 'italic' }}>
        tonkotsu broth, wheat noodles, chili miso, ground pork, scallion, soft egg, bok choy.
      </div>
    </div>

    <div style={{ margin: '0 24px', padding: 14, background: '#ede4d0', borderLeft: '3px solid #c47b3a', fontSize: 12, fontStyle: 'italic', lineHeight: 1.5 }}>
      Severe allergies: confirm ingredients with the restaurant. Our model only sees what UberEats publishes.
    </div>

    <div style={{ padding: '20px 24px 16px', display: 'flex', gap: 12 }}>
      <BBtn>↻ Try another</BBtn>
      <BBtn primary big style={{ flex: 1, textAlign: 'center' }}>Order on UberEats →</BBtn>
    </div>
  </div>
);

// ─── B9: Feedback ───
const BFeedback = () => (
  <div className="dir-b phone-screen no-scrollbar" style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <div className="mono" style={{ fontSize: 10, letterSpacing: 3, color: '#c47b3a', textAlign: 'center' }}>POSTSCRIPT</div>
    <h2 className="display" style={{ fontSize: 50, margin: '12px 0 32px', textAlign: 'center', lineHeight: 1 }}>
      Did it<br/><span style={{ fontStyle: 'italic' }}>land?</span>
    </h2>

    <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #1a1410', borderBottom: '1px solid #1a1410' }}>
      <button style={{
        flex: 1, padding: '32px 16px', border: 'none', background: 'transparent',
        cursor: 'pointer', fontFamily: 'inherit', borderRight: '1px solid #1a1410',
        textAlign: 'center',
      }}>
        <div className="display" style={{ fontSize: 50, color: '#7a8a4a' }}>○</div>
        <div className="display" style={{ fontSize: 18, fontStyle: 'italic', marginTop: 8 }}>Yes.</div>
      </button>
      <button style={{
        flex: 1, padding: '32px 16px', border: 'none', background: 'transparent',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
      }}>
        <div className="display" style={{ fontSize: 50, color: '#c47b3a' }}>×</div>
        <div className="display" style={{ fontSize: 18, fontStyle: 'italic', marginTop: 8 }}>No.</div>
      </button>
    </div>

    <p style={{ textAlign: 'center', fontSize: 13, opacity: 0.7, marginTop: 24, fontStyle: 'italic' }}>
      Each answer refines tomorrow’s pick.
    </p>
  </div>
);

// ─── B10: Signup wall ───
const BSignup = () => (
  <div className="dir-b phone-screen no-scrollbar" style={{ padding: '60px 24px' }}>
    <div className="mono" style={{ fontSize: 10, letterSpacing: 3, color: '#c47b3a' }}>VOLUME ONE · COMPLETE</div>
    <h2 className="display" style={{ fontSize: 44, margin: '12px 0 16px', lineHeight: 1.05 }}>
      Three<br/>landings.<br/>
      <span style={{ fontStyle: 'italic' }}>Save the<br/>collection?</span>
    </h2>

    <p style={{ fontSize: 15, lineHeight: 1.6, opacity: 0.85 }}>
      We can remember your taste — allergies, vibes, what worked — across devices.
    </p>

    {/* taste card */}
    <div style={{ marginTop: 24, padding: 18, border: '1px solid #1a1410', background: '#faf7ee' }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: 2, opacity: 0.6, marginBottom: 8 }}>YOUR PROFILE · 味</div>
      <div className="display" style={{ fontSize: 18, lineHeight: 1.4, fontStyle: 'italic' }}>
        “Saucy, broth-forward, spicy. Korean-leaning. No peanuts. Loves a soft egg.”
      </div>
    </div>

    <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <BBtn primary big style={{ width: '100%' }}>Continue with Apple</BBtn>
      <BBtn big style={{ width: '100%' }}>Continue with Email</BBtn>
      <button style={{ background: 'none', border: 'none', fontFamily: 'inherit', textDecoration: 'underline', opacity: 0.6, cursor: 'pointer', padding: 12, fontSize: 14 }}>
        not now
      </button>
    </div>
  </div>
);

Object.assign(window, {
  BLanding, BAddress, BBudget, BVibe, BPrefs, BAllergies, BLoading, BRec, BFeedback, BSignup, BBtn, BStepper,
});
