// dir-c-block.jsx — Direction C: Block Party
// Bold flat color blocks (peach/butter/sage), oversized type, sticker chips

const { useState: useStateC, useEffect: useEffectC } = React;

const CBtn = ({ children, primary, style = {}, big, ...rest }) => (
  <button {...rest} style={{
    border: '2px solid #15110d',
    background: primary ? '#15110d' : '#fff',
    color: primary ? '#ffd23f' : '#15110d',
    padding: big ? '20px 28px' : '12px 20px',
    borderRadius: 0,
    fontWeight: 700,
    fontFamily: 'Space Grotesk, sans-serif',
    fontSize: big ? 18 : 14,
    cursor: 'pointer',
    letterSpacing: -0.3,
    transition: 'all .15s',
    ...style,
  }}>{children}</button>
);

// ─── C1: Landing ───
const CLanding = () => (
  <div className="dir-c phone-screen no-scrollbar" style={{ padding: 0, background: '#f1ebd9' }}>
    {/* big peach block */}
    <div style={{ background: '#ff7a4d', padding: '70px 24px 40px', position: 'relative', borderBottom: '2px solid #15110d' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: 2, fontWeight: 600 }}>OMAKAI / 2026</div>
        <div className="mono" style={{ fontSize: 11, letterSpacing: 2, fontWeight: 600 }}>SF · 19:42</div>
      </div>
      <h1 className="display" style={{ fontSize: 80, margin: 0, color: '#15110d' }}>
        eat<br/>
        <span style={{ fontStyle: 'italic', display: 'inline-flex', alignItems: 'baseline' }}>
          this<span style={{ color: '#ffd23f' }}>.</span>
        </span>
      </h1>
      <div style={{ position: 'absolute', bottom: -28, right: 24, transform: 'rotate(-12deg)' }} className="sticker wobble">
        <StickerBadge text="ONE PICK ONLY" size={88} color="#ffd23f" textColor="#15110d"/>
      </div>
    </div>

    {/* butter block */}
    <div style={{ background: '#ffd23f', padding: '40px 24px 32px', borderBottom: '2px solid #15110d', position: 'relative' }}>
      <p style={{ fontSize: 17, lineHeight: 1.4, fontWeight: 500, margin: 0, maxWidth: 280 }}>
        Five questions. One dish. Zero browsing. We pick what to eat tonight, you tap to order.
      </p>
    </div>

    {/* sage block with mascot */}
    <div style={{ background: '#5b8c5a', color: '#f1ebd9', padding: '40px 24px', borderBottom: '2px solid #15110d', display: 'flex', alignItems: 'center', gap: 20 }}>
      <div className="float-y"><MaskotBowl size={100}/></div>
      <div>
        <div className="mono" style={{ fontSize: 11, letterSpacing: 2, opacity: 0.8 }}>TONIGHT</div>
        <div className="display" style={{ fontSize: 28, lineHeight: 1, marginTop: 4 }}>47<br/>spots<br/><span style={{ fontStyle: 'italic' }}>nearby.</span></div>
      </div>
    </div>

    {/* CTA */}
    <div style={{ padding: '32px 24px' }}>
      <CBtn primary big style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>tell me what to eat</span>
        <span style={{ fontSize: 22 }}>→</span>
      </CBtn>
      <div style={{ marginTop: 14, fontSize: 12, opacity: 0.7, textAlign: 'center' }} className="mono">
        UBEREATS · ~25S · NO LOGIN
      </div>
    </div>
  </div>
);

const CStepper = ({ step, total }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{
        flex: 1, height: 4, background: i < step ? '#ff7a4d' : '#15110d20',
      }}/>
    ))}
  </div>
);

// ─── C2: Address ───
const CAddress = () => (
  <div className="dir-c phone-screen no-scrollbar" style={{ padding: 0 }}>
    <div style={{ padding: '60px 24px 16px' }}>
      <CStepper step={1} total={5}/>
      <div className="mono" style={{ fontSize: 11, letterSpacing: 2, marginTop: 12, opacity: 0.6 }}>01 / 05 · WHERE</div>
    </div>

    <div style={{ background: '#ff7a4d', padding: '24px 24px 32px', borderTop: '2px solid #15110d', borderBottom: '2px solid #15110d' }}>
      <h2 className="display" style={{ fontSize: 56, margin: 0 }}>where<br/>are you<span style={{ fontStyle: 'italic' }}>?</span></h2>
    </div>

    <div style={{ padding: '24px' }}>
      <div style={{ border: '2px solid #15110d', background: '#fff', padding: 16 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 2, opacity: 0.6 }}>DELIVERING TO</div>
        <div className="display" style={{ fontSize: 24, marginTop: 4 }}>447 Valencia St</div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>San Francisco, CA 94103</div>
        <div style={{ marginTop: 14, padding: '8px 10px', background: '#5b8c5a', color: '#f1ebd9', display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: 1 }} className="mono">
          ● 47 SPOTS NEARBY
        </div>
      </div>

      <button style={{
        marginTop: 14, width: '100%', padding: 14, border: '2px dashed #15110d',
        background: 'transparent', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer', textAlign: 'left',
      }}>
        ⌖ use my current location instead
      </button>
    </div>

    <div style={{ position: 'absolute', bottom: 30, left: 24, right: 24 }}>
      <CBtn primary big style={{ width: '100%' }}>continue →</CBtn>
    </div>
  </div>
);

// ─── C3: Budget ───
const CBudget = () => {
  const [sel, setSel] = useStateC(1);
  const opts = [
    { sym: '$', label: 'cheap', sub: 'under $15', bg: '#5b8c5a', fg: '#f1ebd9' },
    { sym: '$$', label: 'middle', sub: '$15–30', bg: '#ffd23f', fg: '#15110d' },
    { sym: '$$$', label: 'fancy', sub: '$30+', bg: '#6f4ea0', fg: '#f1ebd9' },
  ];
  return (
    <div className="dir-c phone-screen no-scrollbar" style={{ padding: 0 }}>
      <div style={{ padding: '60px 24px 16px' }}>
        <CStepper step={2} total={5}/>
        <div className="mono" style={{ fontSize: 11, letterSpacing: 2, marginTop: 12, opacity: 0.6 }}>02 / 05 · BUDGET</div>
      </div>

      <div style={{ background: '#ffd23f', padding: '24px', borderTop: '2px solid #15110d', borderBottom: '2px solid #15110d' }}>
        <h2 className="display" style={{ fontSize: 56, margin: 0 }}>how<br/>much<span style={{ fontStyle: 'italic' }}>?</span></h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {opts.map((o, i) => (
          <button key={i} onClick={() => setSel(i)} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '20px 24px',
            border: 'none', borderBottom: '2px solid #15110d',
            background: sel === i ? o.bg : '#f1ebd9',
            color: sel === i ? o.fg : '#15110d',
            fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
            transition: 'all .15s',
          }}>
            <div className="display" style={{ fontSize: 44, minWidth: 70 }}>{o.sym}</div>
            <div style={{ flex: 1 }}>
              <div className="display" style={{ fontSize: 26, fontStyle: sel === i ? 'italic' : 'normal' }}>{o.label}</div>
              <div className="mono" style={{ fontSize: 11, letterSpacing: 1.5, opacity: 0.7 }}>{o.sub.toUpperCase()}</div>
            </div>
            {sel === i && <span style={{ fontSize: 26 }}>●</span>}
          </button>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 30, left: 24, right: 24 }}>
        <CBtn primary big style={{ width: '100%' }}>next →</CBtn>
      </div>
    </div>
  );
};

// ─── C4: Vibe ───
const CVibe = () => {
  const vibes = ['comfort', 'light', 'spicy', 'fresh', 'indulgent', 'healthy', 'fast', 'cozy', 'umami', 'crispy', 'saucy'];
  const colors = ['#ff7a4d', '#ffd23f', '#5b8c5a', '#6f4ea0'];
  const [sel, setSel] = useStateC(new Set(['saucy', 'spicy', 'umami']));
  const toggle = v => { const n = new Set(sel); n.has(v) ? n.delete(v) : n.add(v); setSel(n); };
  return (
    <div className="dir-c phone-screen no-scrollbar" style={{ padding: 0 }}>
      <div style={{ padding: '60px 24px 16px' }}>
        <CStepper step={3} total={5}/>
        <div className="mono" style={{ fontSize: 11, letterSpacing: 2, marginTop: 12, opacity: 0.6 }}>03 / 05 · MOOD</div>
      </div>

      <div style={{ background: '#5b8c5a', color: '#f1ebd9', padding: '24px', borderTop: '2px solid #15110d', borderBottom: '2px solid #15110d' }}>
        <h2 className="display" style={{ fontSize: 56, margin: 0 }}>the<br/>mood<span style={{ fontStyle: 'italic' }}>?</span></h2>
      </div>

      <div style={{ padding: 24, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {vibes.map((v, i) => {
          const active = sel.has(v);
          const c = colors[i % colors.length];
          return (
            <button key={v} onClick={() => toggle(v)} style={{
              border: '2px solid #15110d',
              background: active ? c : 'transparent',
              color: active && c === '#5b8c5a' ? '#f1ebd9' : '#15110d',
              padding: '10px 16px', borderRadius: 0,
              fontFamily: 'inherit', fontSize: 15, fontWeight: 600,
              cursor: 'pointer',
              transform: active ? `rotate(${(i % 2 ? 1.5 : -1.5)}deg)` : 'rotate(0)',
              boxShadow: active ? '3px 3px 0 #15110d' : 'none',
              transition: 'all .15s',
            }}>
              {v}
            </button>
          );
        })}
      </div>

      <div style={{ margin: '0 24px', padding: 16, background: '#15110d', color: '#ffd23f' }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 2, opacity: 0.7 }}>WE’RE READING</div>
        <div className="display" style={{ fontSize: 22, marginTop: 6, fontStyle: 'italic' }}>
          “saucy, spicy, deep — comfort with a kick.”
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 30, left: 24, right: 24 }}>
        <CBtn primary big style={{ width: '100%' }}>next →</CBtn>
      </div>
    </div>
  );
};

// ─── C5: Prefs ───
const CPrefs = () => {
  const cuisines = ['japanese', 'korean', 'thai', 'mexican', 'italian', 'indian', 'viet', 'chinese', 'med'];
  const [sel, setSel] = useStateC(new Set(['korean', 'thai']));
  const toggle = v => { const n = new Set(sel); n.has(v) ? n.delete(v) : n.add(v); setSel(n); };
  return (
    <div className="dir-c phone-screen no-scrollbar" style={{ padding: 0 }}>
      <div style={{ padding: '60px 24px 16px' }}>
        <CStepper step={4} total={5}/>
        <div className="mono" style={{ fontSize: 11, letterSpacing: 2, marginTop: 12, opacity: 0.6 }}>04 / 05 · CRAVINGS</div>
      </div>

      <div style={{ background: '#6f4ea0', color: '#f1ebd9', padding: '24px', borderTop: '2px solid #15110d', borderBottom: '2px solid #15110d' }}>
        <h2 className="display" style={{ fontSize: 56, margin: 0 }}>any<br/><span style={{ fontStyle: 'italic' }}>cravings?</span></h2>
      </div>

      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {cuisines.map((c, i) => (
            <button key={c} onClick={() => toggle(c)} style={{
              border: '2px solid #15110d',
              background: sel.has(c) ? '#15110d' : 'transparent',
              color: sel.has(c) ? '#ffd23f' : '#15110d',
              padding: '8px 14px',
              fontFamily: 'inherit', fontWeight: 600, fontSize: 14,
              cursor: 'pointer',
            }}>
              {c}
            </button>
          ))}
        </div>

        <div style={{ border: '2px solid #15110d', background: '#fff', padding: 16 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: 2, opacity: 0.6, marginBottom: 6 }}>FREE TEXT (OPT)</div>
          <div className="display" style={{ fontSize: 22, lineHeight: 1.3 }}>
            something with noodles, not too heavy<span style={{ animation: 'blink 1s step-end infinite', color: '#ff7a4d' }}>|</span>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 30, left: 24, right: 24 }}>
        <CBtn primary big style={{ width: '100%' }}>last step →</CBtn>
      </div>
    </div>
  );
};

// ─── C6: Allergies ───
const CAllergies = () => {
  const items = ['peanut', 'tree nut', 'shellfish', 'dairy', 'gluten', 'egg', 'soy', 'sesame'];
  const [sel, setSel] = useStateC(new Set(['peanut']));
  const toggle = v => { const n = new Set(sel); n.has(v) ? n.delete(v) : n.add(v); setSel(n); };
  return (
    <div className="dir-c phone-screen no-scrollbar" style={{ padding: 0 }}>
      <div style={{ padding: '60px 24px 16px' }}>
        <CStepper step={5} total={5}/>
        <div className="mono" style={{ fontSize: 11, letterSpacing: 2, marginTop: 12, opacity: 0.6 }}>05 / 05 · LIMITS</div>
      </div>

      <div style={{ background: '#ff7a4d', padding: '24px', borderTop: '2px solid #15110d', borderBottom: '2px solid #15110d' }}>
        <h2 className="display" style={{ fontSize: 50, margin: 0 }}>off<br/><span style={{ fontStyle: 'italic' }}>limits?</span></h2>
      </div>

      <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {items.map(i => (
          <button key={i} onClick={() => toggle(i)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 14px',
            border: '2px solid #15110d',
            background: sel.has(i) ? '#ff7a4d' : '#fff',
            fontFamily: 'inherit', fontWeight: 700, fontSize: 14,
            cursor: 'pointer',
          }}>
            <span>{i}</span>
            <span style={{ fontSize: 14 }}>{sel.has(i) ? '✕' : '○'}</span>
          </button>
        ))}
      </div>

      <div style={{ margin: '4px 20px', padding: 12, fontSize: 12, fontStyle: 'italic', opacity: 0.7 }}>
        ⚠ severe allergy? confirm with restaurant.
      </div>

      <div style={{ position: 'absolute', bottom: 30, left: 24, right: 24 }}>
        <CBtn primary big style={{ width: '100%' }}>ask the chef →</CBtn>
      </div>
    </div>
  );
};

// ─── C7: Loading ───
const CLoading = () => {
  const [phase, setPhase] = useStateC(0);
  const phrases = [
    'scanning 47 menus',
    'thinking about saucy + spicy',
    'skipping the peanut stuff',
    'plating it up',
  ];
  useEffectC(() => {
    const t = setInterval(() => setPhase(p => Math.min(phrases.length - 1, p + 1)), 1500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="dir-c phone-screen no-scrollbar" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
      {/* peach top */}
      <div style={{ background: '#ff7a4d', padding: '60px 24px 40px', borderBottom: '2px solid #15110d', position: 'relative', overflow: 'hidden' }}>
        <h1 className="display" style={{ fontSize: 60, margin: 0 }}>the<br/>chef is<br/><span style={{ fontStyle: 'italic' }}>thinking.</span></h1>
        <div style={{ position: 'absolute', top: 80, right: -20, animation: 'spin-slow 4s linear infinite' }}>
          <StickerBadge text="STAND BY" size={120} color="#15110d" textColor="#ffd23f"/>
        </div>
      </div>

      {/* butter block with mascot */}
      <div style={{ background: '#ffd23f', padding: '32px 24px', borderBottom: '2px solid #15110d', display: 'flex', justifyContent: 'center' }}>
        <div className="float-y"><MaskotBowl size={130}/></div>
      </div>

      {/* status list */}
      <div style={{ background: '#15110d', color: '#f1ebd9', padding: 24, flex: 1 }}>
        {phrases.map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0',
            fontSize: 16, fontWeight: 500,
            opacity: i <= phase ? 1 : 0.3,
          }}>
            <span className="mono" style={{ fontSize: 11, color: '#ffd23f', minWidth: 28 }}>0{i+1}</span>
            <span style={{ flex: 1 }}>{p}</span>
            {i < phase && <span style={{ color: '#5b8c5a', fontSize: 18 }}>✓</span>}
            {i === phase && <span style={{ color: '#ff7a4d', animation: 'blink 1s step-end infinite' }}>●</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── C8: Recommendation (magazine, color-blocked) ───
const CRec = () => (
  <div className="dir-c phone-screen no-scrollbar" style={{ paddingBottom: 0 }}>
    {/* peach masthead */}
    <div style={{ background: '#ff7a4d', padding: '60px 24px 24px', borderBottom: '2px solid #15110d', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: 2, fontWeight: 700 }}>TONIGHT’S PICK</div>
        <div className="mono" style={{ fontSize: 11, letterSpacing: 2, opacity: 0.7 }}>#001</div>
      </div>
      <h1 className="display" style={{ fontSize: 52, margin: 0, lineHeight: 0.92 }}>
        Spicy<br/>Tonkotsu<br/><span style={{ fontStyle: 'italic' }}>Tantanmen.</span>
      </h1>
      <div style={{ marginTop: 14, fontSize: 13, fontWeight: 600 }}>
        KOJA KITCHEN · 0.4 MI · 28 MIN
      </div>
      <div style={{ position: 'absolute', bottom: -28, right: 18, transform: 'rotate(15deg)' }} className="sticker wobble">
        <StickerBadge text="OMAKAI APPROVED" size={80} color="#ffd23f" textColor="#15110d"/>
      </div>
    </div>

    {/* dish photo block */}
    <div style={{ borderBottom: '2px solid #15110d' }}>
      <DishPlaceholder width="100%" height={240} label="HERO · DISH PHOTO" tone="c" style={{ width: '100%' }}/>
    </div>

    {/* callouts strip */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', borderBottom: '2px solid #15110d' }}>
      {[
        { k: 'PRICE', v: '$18.50', bg: '#ffd23f' },
        { k: 'KCAL', v: '640', bg: '#5b8c5a', fg: '#f1ebd9' },
        { k: 'ETA', v: '28m', bg: '#6f4ea0', fg: '#f1ebd9' },
        { k: 'HEAT', v: '★★', bg: '#ff7a4d' },
      ].map((p, i) => (
        <div key={p.k} style={{
          padding: '14px 8px', textAlign: 'center',
          background: p.bg, color: p.fg || '#15110d',
          borderRight: i < 3 ? '2px solid #15110d' : 'none',
        }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: 2, opacity: 0.75, fontWeight: 600 }}>{p.k}</div>
          <div className="display" style={{ fontSize: 22, marginTop: 2 }}>{p.v}</div>
        </div>
      ))}
    </div>

    {/* reasoning block */}
    <div style={{ background: '#15110d', color: '#f1ebd9', padding: 24, borderBottom: '2px solid #15110d' }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: 2, color: '#ffd23f', marginBottom: 10 }}>WHY THIS, NOT THAT</div>
      <p style={{ fontSize: 16, lineHeight: 1.5, margin: 0 }}>
        You asked for <b style={{ color: '#ffd23f' }}>saucy + spicy + noodles</b>, no peanuts, comfort budget. Koja’s tantanmen does all three at once: deep tonkotsu base, miso-chili paste, soft egg to slow it down. Their pad thai was the easy second choice — we cut it for cross-contamination risk on peanuts.
      </p>
    </div>

    {/* ingredients */}
    <div style={{ background: '#f1ebd9', padding: 24, borderBottom: '2px solid #15110d' }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: 2, marginBottom: 10, opacity: 0.7 }}>WHAT’S IN IT</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {['tonkotsu broth', 'wheat noodles', 'chili miso', 'ground pork', 'scallion', 'soft egg', 'bok choy'].map(x => (
          <span key={x} style={{
            border: '1.5px solid #15110d', padding: '4px 10px', fontSize: 12, fontWeight: 600,
          }}>{x}</span>
        ))}
      </div>
    </div>

    {/* warning */}
    <div style={{ background: '#5b8c5a', color: '#f1ebd9', padding: '14px 24px', fontSize: 12, fontStyle: 'italic', borderBottom: '2px solid #15110d' }}>
      ⚠ severe allergy? confirm with restaurant. omakai sees only what UberEats publishes.
    </div>

    {/* CTA */}
    <div style={{ display: 'flex' }}>
      <button style={{
        flex: 1, padding: '22px 16px', border: 'none', borderRight: '2px solid #15110d',
        background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 14,
      }}>↻ another pick</button>
      <button style={{
        flex: 2, padding: '22px 16px', border: 'none',
        background: '#15110d', color: '#ffd23f', cursor: 'pointer',
        fontFamily: 'inherit', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>order on UberEats →</button>
    </div>
  </div>
);

// ─── C9: Feedback ───
const CFeedback = () => (
  <div className="dir-c phone-screen no-scrollbar" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
    <div style={{ background: '#ffd23f', padding: '60px 24px 40px', borderBottom: '2px solid #15110d', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="display" style={{ fontSize: 72, lineHeight: 0.9, margin: 0 }}>
        did<br/>it<br/><span style={{ fontStyle: 'italic' }}>land?</span>
      </div>
      <div style={{ marginTop: 24, fontSize: 14, fontWeight: 600 }}>
        the tantanmen from KOJA KITCHEN.
      </div>
    </div>

    <div style={{ display: 'flex' }}>
      <button style={{
        flex: 1, padding: '40px 16px', border: 'none', borderRight: '2px solid #15110d',
        background: '#5b8c5a', color: '#f1ebd9', cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <div className="display" style={{ fontSize: 56 }}>✓</div>
        <div className="display" style={{ fontSize: 20, fontStyle: 'italic', marginTop: 4 }}>nailed it</div>
      </button>
      <button style={{
        flex: 1, padding: '40px 16px', border: 'none',
        background: '#ff7a4d', cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <div className="display" style={{ fontSize: 56 }}>✕</div>
        <div className="display" style={{ fontSize: 20, fontStyle: 'italic', marginTop: 4 }}>not quite</div>
      </button>
    </div>
  </div>
);

// ─── C10: Signup wall ───
const CSignup = () => (
  <div className="dir-c phone-screen no-scrollbar" style={{ padding: 0 }}>
    <div style={{ background: '#5b8c5a', color: '#f1ebd9', padding: '60px 24px 32px', borderBottom: '2px solid #15110d', position: 'relative' }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: 2 }}>3 PICKS LANDED</div>
      <h2 className="display" style={{ fontSize: 56, margin: '14px 0 0', lineHeight: 0.95 }}>
        save<br/>your<br/><span style={{ fontStyle: 'italic' }}>taste.</span>
      </h2>
      <div style={{ position: 'absolute', top: 40, right: 14, transform: 'rotate(-15deg)' }} className="sticker wobble">
        <StickerBadge text="HOT STREAK" size={86} color="#ffd23f" textColor="#15110d"/>
      </div>
    </div>

    <div style={{ background: '#ffd23f', padding: 24, borderBottom: '2px solid #15110d' }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: 2, opacity: 0.7 }}>YOUR PROFILE</div>
      <div className="display" style={{ fontSize: 22, fontStyle: 'italic', marginTop: 6, lineHeight: 1.3 }}>
        “saucy · broth-forward · spicy · korean-leaning · no peanuts · loves a soft egg.”
      </div>
    </div>

    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <CBtn primary big style={{ width: '100%' }}>continue with Apple</CBtn>
      <CBtn big style={{ width: '100%' }}>continue with Email</CBtn>
      <button style={{ background: 'none', border: 'none', fontFamily: 'inherit', textDecoration: 'underline', cursor: 'pointer', padding: 12, fontSize: 14, opacity: 0.7 }}>
        not now
      </button>
    </div>
  </div>
);

Object.assign(window, {
  CLanding, CAddress, CBudget, CVibe, CPrefs, CAllergies, CLoading, CRec, CFeedback, CSignup, CBtn, CStepper,
});
