// desktop.jsx — desktop landing variants for each direction (browser frame)

const DesktopA = () => (
  <div className="dir-a" style={{ width: '100%', height: '100%', background: '#fdf6e8', position: 'relative', overflow: 'hidden' }}>
    {/* nav */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '2px solid #2a1f17' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <MaskotMaki size={32}/>
        <span className="display" style={{ fontSize: 22 }}>omakai<span style={{ color: '#ff8a5c' }}>.</span>food</span>
      </div>
      <div style={{ display: 'flex', gap: 24, fontSize: 14, fontWeight: 600 }}>
        <span>how it works</span><span>about</span><span>blog</span>
        <ABtn primary style={{ padding: '8px 16px', fontSize: 13 }}>start →</ABtn>
      </div>
    </div>

    {/* hero */}
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, padding: '60px 40px', alignItems: 'center' }}>
      <div>
        <div className="mono" style={{ fontSize: 12, letterSpacing: 2, opacity: 0.6, marginBottom: 16 }}>NO MORE BROWSING · POWERED BY CLAUDE</div>
        <h1 className="display" style={{ fontSize: 110, margin: 0, lineHeight: 0.9 }}>
          just<br/><span style={{ color: '#ff8a5c' }}>tell me</span><br/>what to<br/>
          <span style={{ fontStyle: 'italic', fontWeight: 400 }}>eat tonight.</span>
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.5, maxWidth: 480, marginTop: 24, opacity: 0.85 }}>
          Five questions. One confident answer. One tap to UberEats.
          We pick the dish that fits your budget, mood, and allergies — so you can stop scrolling and start eating.
        </p>
        <div style={{ marginTop: 32, display: 'flex', gap: 12, alignItems: 'center' }}>
          <ABtn primary big>tell me what I’m craving →</ABtn>
          <span className="mono" style={{ fontSize: 12, opacity: 0.6 }}>~25S · NO LOGIN</span>
        </div>
      </div>

      {/* phone preview hovering */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <div style={{ transform: 'rotate(4deg)', filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.18))' }}>
          <div style={{
            width: 220, height: 440, borderRadius: 36, background: '#fdf6e8',
            border: '4px solid #2a1f17', overflow: 'hidden', position: 'relative',
          }}>
            <div style={{ padding: 16 }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: 2, opacity: 0.6 }}>TONIGHT’S PICK</div>
              <div className="display" style={{ fontSize: 22, lineHeight: 1.05, marginTop: 6 }}>
                Spicy<br/>Tantanmen
              </div>
              <DishPlaceholder width="100%" height={120} label="DISH" tone="a" style={{ marginTop: 12 }}/>
              <div style={{ marginTop: 10, fontSize: 11, lineHeight: 1.5, opacity: 0.85 }}>
                broth-forward, chili miso, soft egg — exactly the saucy + spicy you asked for.
              </div>
              <div style={{ marginTop: 10, padding: '10px 12px', background: '#ff8a5c', border: '2px solid #2a1f17', borderRadius: 12, color: '#2a1f17', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>
                order on UberEats →
              </div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', top: -10, right: 10, transform: 'rotate(-12deg)' }} className="sticker wobble">
          <StickerBadge text="ONE PICK" size={90} color="#f7d65a" textColor="#2a1f17"/>
        </div>
      </div>
    </div>

    {/* feature row */}
    <div style={{ background: '#2a1f17', color: '#fdf6e8', padding: '14px 0', overflow: 'hidden' }}>
      <div className="display" style={{ display: 'flex', gap: 28, whiteSpace: 'nowrap', animation: 'marquee 22s linear infinite', fontSize: 22 }}>
        {Array(2).fill().flatMap((_, j) => ['ramen', '★', 'tacos', '★', 'pho', '★', 'pizza', '★', 'curry', '★', 'sushi', '★', 'wings', '★'].map((w, i) => (
          <span key={`${j}-${i}`} style={{ fontStyle: i % 2 ? 'normal' : 'italic' }}>{w}</span>
        )))}
      </div>
    </div>

    <div style={{ padding: '50px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
      {[
        { n: '01', t: 'tell us about tonight', d: 'address, budget, vibe, prefs, allergies. takes ~30 seconds.' },
        { n: '02', t: 'we ask the chef', d: 'we ground a Claude pick in real UberEats menus near you. no hallucinations.' },
        { n: '03', t: 'tap, eat, repeat', d: 'one dish. one tap. confirm in app, eat. tell us if it landed.' },
      ].map(s => (
        <div key={s.n} style={{ border: '2.5px solid #2a1f17', borderRadius: 20, padding: 24, background: '#fff8e8', boxShadow: '4px 4px 0 #2a1f17' }}>
          <div className="display" style={{ fontSize: 56, color: '#ff8a5c', lineHeight: 1 }}>{s.n}</div>
          <div className="display" style={{ fontSize: 24, marginTop: 8 }}>{s.t}</div>
          <div style={{ fontSize: 14, opacity: 0.8, marginTop: 8, lineHeight: 1.5 }}>{s.d}</div>
        </div>
      ))}
    </div>
  </div>
);

const DesktopB = () => (
  <div className="dir-b" style={{ width: '100%', height: '100%', background: '#f5efe1', overflow: 'hidden' }}>
    <div style={{ padding: '24px 40px', borderBottom: '1px solid #1a1410', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="display" style={{ fontSize: 22, fontStyle: 'italic' }}>omakai<span style={{ color: '#c47b3a' }}>.</span></div>
      <div style={{ display: 'flex', gap: 24, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }} className="mono">
        <span>method</span><span>about</span><span>journal</span>
      </div>
      <BBtn primary>Begin →</BBtn>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', padding: '60px 40px', gap: 60, alignItems: 'center' }}>
      <div>
        <div className="mono" style={{ fontSize: 11, letterSpacing: 3, color: '#c47b3a' }}>お任せ — I LEAVE IT TO YOU · NO. 001</div>
        <h1 className="display" style={{ fontSize: 96, margin: '20px 0 0', lineHeight: 0.95 }}>
          One dish.<br/>
          <span style={{ fontStyle: 'italic', color: '#c47b3a' }}>Tonight.</span><br/>
          Chosen<br/>for you.
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.6, marginTop: 28, maxWidth: 480 }}>
          A short questionnaire. A grounded recommendation. A direct line to UberEats.
          We treat dinner as a single editorial decision — not a catalog.
        </p>
        <div style={{ marginTop: 36, display: 'flex', gap: 24, alignItems: 'center' }}>
          <BBtn primary big>Begin →</BBtn>
          <BBtn>How it works</BBtn>
        </div>
      </div>

      <div>
        {/* editorial spec card */}
        <div style={{ border: '1px solid #1a1410', background: '#faf7ee', padding: 28 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: 3, color: '#c47b3a' }}>FROM THE PRESS · TONIGHT</div>
          <h3 className="display" style={{ fontSize: 36, margin: '12px 0 4px', lineHeight: 1.05 }}>
            Spicy Tonkotsu <span style={{ fontStyle: 'italic' }}>Tantanmen.</span>
          </h3>
          <div className="mono" style={{ fontSize: 11, opacity: 0.7, letterSpacing: 1.5 }}>KOJA KITCHEN · 0.4 MI · 28 MIN</div>
          <DishPlaceholder width="100%" height={180} label="DISH · FIG. 1" tone="b" style={{ marginTop: 16 }}/>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 14, fontFamily: 'Shippori Mincho, serif' }}>
            <span className="display" style={{ float: 'left', fontSize: 44, lineHeight: 0.85, marginRight: 6, color: '#c47b3a', fontStyle: 'italic' }}>Y</span>
            ou said saucy, spicy, with noodles. Koja’s tantanmen is the answer almost too obvious to miss.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', borderTop: '1px solid #1a1410', borderBottom: '1px solid #1a1410', marginTop: 12 }}>
            {[['$18.50', 'PRICE'], ['~640', 'KCAL'], ['28m', 'ETA'], ['★★', 'HEAT']].map(([v, k], i) => (
              <div key={k} style={{ padding: '10px 4px', textAlign: 'center', borderRight: i < 3 ? '1px solid #1a1410' : 'none' }}>
                <div className="display" style={{ fontSize: 18 }}>{v}</div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: 1.5, opacity: 0.6 }}>{k}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '0 40px 40px', borderTop: '1px solid #1a1410' }}>
      {[
        { n: '01', t: 'Five short questions', jp: '質問', d: 'Address, budget, vibe, cravings, allergies. About thirty seconds.' },
        { n: '02', t: 'A grounded answer', jp: '推薦', d: 'Claude reads real menus near you. Validated against the catalog so the dish actually exists.' },
        { n: '03', t: 'A direct line out', jp: '配達', d: 'One tap, one deep-link to UberEats. No reading. No deciding.' },
      ].map((s, i) => (
        <div key={s.n} style={{ padding: '32px 24px 0', borderRight: i < 2 ? '1px solid #1a1410' : 'none' }}>
          <div className="display" style={{ fontSize: 60, color: '#c47b3a', fontStyle: 'italic' }}>{s.n}</div>
          <div className="display" style={{ fontSize: 22, marginTop: 4 }}>{s.t}</div>
          <div className="mono" style={{ fontSize: 11, color: '#c47b3a', letterSpacing: 2, marginTop: 4 }}>{s.jp}</div>
          <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.85, marginTop: 12 }}>{s.d}</p>
        </div>
      ))}
    </div>
  </div>
);

const DesktopC = () => (
  <div className="dir-c" style={{ width: '100%', height: '100%', background: '#f1ebd9', overflow: 'hidden' }}>
    {/* nav */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 32px', borderBottom: '2px solid #15110d', background: '#f1ebd9' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <MaskotBowl size={36}/>
        <span className="display" style={{ fontSize: 22 }}>omakai</span>
      </div>
      <div style={{ display: 'flex', gap: 22, fontSize: 13, fontWeight: 600 }}>
        <span>how</span><span>about</span><span>journal</span>
      </div>
      <CBtn primary>tell me what to eat →</CBtn>
    </div>

    {/* peach hero */}
    <div style={{ background: '#ff7a4d', borderBottom: '2px solid #15110d', padding: '50px 32px', position: 'relative' }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: 2, fontWeight: 700, marginBottom: 16 }}>OMAKAI · NO MORE BROWSING · 2026</div>
      <h1 className="display" style={{ fontSize: 140, margin: 0, lineHeight: 0.85 }}>
        eat <span style={{ fontStyle: 'italic' }}>this<span style={{ color: '#ffd23f' }}>.</span></span>
      </h1>
      <div style={{ position: 'absolute', top: 60, right: 60 }} className="float-y">
        <StickerBadge text="ONE PICK ONLY" size={120} color="#15110d" textColor="#ffd23f"/>
      </div>
    </div>

    {/* color block trio */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
      <div style={{ background: '#ffd23f', padding: '32px 24px', borderRight: '2px solid #15110d', borderBottom: '2px solid #15110d' }}>
        <div className="display" style={{ fontSize: 48, lineHeight: 0.9 }}>5 questions.</div>
        <p style={{ fontSize: 14, marginTop: 12, lineHeight: 1.5 }}>address, budget, vibe, cravings, allergies. ~30 seconds.</p>
      </div>
      <div style={{ background: '#5b8c5a', color: '#f1ebd9', padding: '32px 24px', borderRight: '2px solid #15110d', borderBottom: '2px solid #15110d' }}>
        <div className="display" style={{ fontSize: 48, lineHeight: 0.9 }}>1 dish.</div>
        <p style={{ fontSize: 14, marginTop: 12, lineHeight: 1.5 }}>not 80 restaurants. not a feed. one confident pick from a real menu.</p>
      </div>
      <div style={{ background: '#6f4ea0', color: '#f1ebd9', padding: '32px 24px', borderBottom: '2px solid #15110d' }}>
        <div className="display" style={{ fontSize: 48, lineHeight: 0.9 }}>1 tap.</div>
        <p style={{ fontSize: 14, marginTop: 12, lineHeight: 1.5 }}>direct deep-link to UberEats. confirm and eat.</p>
      </div>
    </div>

    <div style={{ padding: '40px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
      <div>
        <div className="mono" style={{ fontSize: 11, letterSpacing: 2, opacity: 0.6 }}>SAMPLE OUTPUT</div>
        <div className="display" style={{ fontSize: 64, lineHeight: 0.9, marginTop: 8 }}>
          tonkotsu<br/><span style={{ fontStyle: 'italic' }}>tantanmen.</span>
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.5, marginTop: 16, maxWidth: 380 }}>
          you said saucy + spicy + noodles, no peanuts. Koja Kitchen has it. 28 minutes. $18.50. tap to order.
        </p>
        <CBtn primary big style={{ marginTop: 20 }}>get my pick →</CBtn>
      </div>
      <DishPlaceholder width="100%" height={300} label="DISH · HERO" tone="c" style={{ border: '2px solid #15110d' }}/>
    </div>
  </div>
);

Object.assign(window, { DesktopA, DesktopB, DesktopC });
