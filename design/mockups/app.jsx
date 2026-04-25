// app.jsx — main canvas wiring all directions

const { useState: useStateApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showDesktop": true,
  "showPhones": true,
  "screenIndex": 0,
  "highlight": "all"
}/*EDITMODE-END*/;

const SCREENS = [
  { id: 'landing', label: '01 Landing' },
  { id: 'address', label: '02 Address' },
  { id: 'budget', label: '03 Budget' },
  { id: 'vibe', label: '04 Vibe' },
  { id: 'prefs', label: '05 Preferences' },
  { id: 'allergies', label: '06 Allergies' },
  { id: 'loading', label: '07 Loading' },
  { id: 'rec', label: '08 Recommendation' },
  { id: 'feedback', label: '09 Feedback' },
  { id: 'signup', label: '10 Signup wall' },
];

const SCREEN_MAP = {
  a: { landing: ALanding, address: AAddress, budget: ABudget, vibe: AVibe, prefs: APrefs, allergies: AAllergies, loading: ALoading, rec: ARec, feedback: AFeedback, signup: ASignup },
  b: { landing: BLanding, address: BAddress, budget: BBudget, vibe: BVibe, prefs: BPrefs, allergies: BAllergies, loading: BLoading, rec: BRec, feedback: BFeedback, signup: BSignup },
  c: { landing: CLanding, address: CAddress, budget: CBudget, vibe: CVibe, prefs: CPrefs, allergies: CAllergies, loading: CLoading, rec: CRec, feedback: CFeedback, signup: CSignup },
};

const PhoneFrame = ({ Comp, dark = false }) => (
  <IOSDevice width={300} height={620} dark={dark}>
    <div style={{ height: '100%', overflow: 'hidden' }}>
      <Comp/>
    </div>
  </IOSDevice>
);

const DirectionRow = ({ tone, name, subtitle, screenIndex }) => {
  const screens = SCREENS.map(s => ({ ...s, Comp: SCREEN_MAP[tone][s.id] }));
  return (
    <DCSection id={`dir-${tone}`} title={name} subtitle={subtitle}>
      {screens.map(s => (
        <DCArtboard key={s.id} id={`${tone}-${s.id}`} label={s.label} width={300} height={620} style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}>
          <PhoneFrame Comp={s.Comp}/>
        </DCArtboard>
      ))}
    </DCSection>
  );
};

const DesktopRow = () => (
  <DCSection id="desktops" title="Desktop landing — three directions" subtitle="Browser-frame view of the homepage for each direction.">
    <DCArtboard id="d-a" label="A · Yuzu Sticker" width={1200} height={760} style={{ background: 'transparent', boxShadow: 'none' }}>
      <ChromeWindow url="omakai.food" tabs={[{title:'omakai — eat this'}]} width={1200} height={760}>
        <DesktopA/>
      </ChromeWindow>
    </DCArtboard>
    <DCArtboard id="d-b" label="B · Mincho Editorial" width={1200} height={760} style={{ background: 'transparent', boxShadow: 'none' }}>
      <ChromeWindow url="omakai.food" tabs={[{title:'omakai'}]} width={1200} height={760}>
        <DesktopB/>
      </ChromeWindow>
    </DCArtboard>
    <DCArtboard id="d-c" label="C · Block Party" width={1200} height={760} style={{ background: 'transparent', boxShadow: 'none' }}>
      <ChromeWindow url="omakai.food" tabs={[{title:'omakai — eat this.'}]} width={1200} height={760}>
        <DesktopC/>
      </ChromeWindow>
    </DCArtboard>
  </DCSection>
);

const App = () => {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  return (
    <>
      <DesignCanvas>
        {/* Intro section */}
        <DCSection id="intro" title="omakai.food — three directions" subtitle="Pastel + playful · Mincho editorial · Bold blocks. Each row shows all 10 screens in iOS frame.">
          <DCArtboard id="brief" label="Brief" width={500} height={620} style={{ background: '#fdf6e8', boxShadow: '0 1px 3px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.06)' }}>
            <div style={{ padding: 32, fontFamily: 'Zen Kaku Gothic New, sans-serif', color: '#2a1f17', height: '100%', overflow: 'auto' }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: 2, opacity: 0.6 }}>OMAKAI.FOOD · MVP</div>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 36, lineHeight: 1, margin: '12px 0 16px', fontWeight: 700, letterSpacing: -1 }}>
                three directions<br/>for tonight’s pick.
              </h2>
              <p style={{ fontSize: 14, lineHeight: 1.55, opacity: 0.85 }}>
                Same product, three personalities. All pastel-friendly, mincho-influenced, mascot-led — each pulling a different lever:
              </p>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 12, border: '2px solid #2a1f17', borderRadius: 12, background: '#ffb89a' }}>
                  <div style={{ fontWeight: 700 }}>A · Yuzu Sticker</div>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>Peach/butter/sage pastel. Maki-ball mascot. Chunky drop-shadowed buttons, sticker stamps, oversized Fraunces. Most playful.</div>
                </div>
                <div style={{ padding: 12, border: '2px solid #2a1f17', borderRadius: 12, background: '#ede4d0' }}>
                  <div style={{ fontWeight: 700 }}>B · Mincho Editorial</div>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>Ivory + miso. Shippori Mincho serif, hairline rules, kanji accents, drop-caps. Quiet authority — feels like a food magazine.</div>
                </div>
                <div style={{ padding: 12, border: '2px solid #2a1f17', borderRadius: 12, background: '#ffd23f' }}>
                  <div style={{ fontWeight: 700 }}>C · Block Party</div>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>Flat color slabs (peach/butter/sage/grape). Hard 2px borders, oversized soft-Fraunces, sticker chips with rotation. Most magazine-meets-zine.</div>
                </div>
              </div>
              <div style={{ marginTop: 18, fontSize: 12, opacity: 0.6, lineHeight: 1.5 }}>
                ← drag canvas · scroll right for screens · click any artboard to focus
              </div>
            </div>
          </DCArtboard>
        </DCSection>

        {t.showPhones && <DirectionRow tone="a" name="A · Yuzu Sticker" subtitle="Pastel sticker energy · Maki the rice-ball · oversized Fraunces"/>}
        {t.showPhones && <DirectionRow tone="b" name="B · Mincho Editorial" subtitle="Ivory + miso · Shippori Mincho · drop-caps and kanji accents"/>}
        {t.showPhones && <DirectionRow tone="c" name="C · Block Party" subtitle="Flat color blocks · hard borders · soft-Fraunces display"/>}

        {t.showDesktop && <DesktopRow/>}

        <DCPostIt top={140} left={580} rotate={-3}>
          three directions, all 10 screens each. drag the canvas, click to focus any artboard.
        </DCPostIt>
      </DesignCanvas>

      <TweaksPanel>
        <TweakSection label="View"/>
        <TweakToggle label="Show phone screens" value={t.showPhones} onChange={v => setTweak('showPhones', v)}/>
        <TweakToggle label="Show desktop landings" value={t.showDesktop} onChange={v => setTweak('showDesktop', v)}/>
        <TweakSection label="Tip"/>
        <div style={{ fontSize: 11, lineHeight: 1.5, opacity: 0.7 }}>
          Click any artboard to open in focus mode. Use ← → to step through screens, ↑ ↓ to switch direction.
        </div>
      </TweaksPanel>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
