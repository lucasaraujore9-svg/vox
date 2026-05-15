// VOX app shell — screen routing + tweaks
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "sidebarCollapsed": false,
  "displayFont": "fraunces",
  "showPresentationDemo": false
}/*EDITMODE-END*/;

const DISPLAY_FONTS = {
  fraunces:    '"Fraunces", "Cormorant Garamond", Georgia, serif',
  newsreader:  '"Newsreader", "Source Serif Pro", Georgia, serif',
  spectral:    '"Spectral", "Source Serif Pro", Georgia, serif',
};

const SCREEN_LABELS = {
  library: "01 Biblioteca",
  new:     "02 Novo sermão",
  editor:  "03 Editor",
  present: "04 Modo Apresentação",
};

const App = () => {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState("library");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(t.sidebarCollapsed);
  const [autoNarrow, setAutoNarrow] = useState(false);

  // Auto-collapse sidebar on narrow viewports
  useEffect(() => {
    const onResize = () => setAutoNarrow(window.innerWidth < 1080);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const effectiveCollapsed = sidebarCollapsed || autoNarrow;

  // Reflect tweak → state
  useEffect(() => { setSidebarCollapsed(t.sidebarCollapsed); }, [t.sidebarCollapsed]);

  // When the Tweaks "show presentation" toggle flips, jump to that screen.
  useEffect(() => {
    if (t.showPresentationDemo) setScreen("present");
    else if (screen === "present") setScreen("editor");
    // eslint-disable-next-line
  }, [t.showPresentationDemo]);

  // Keyboard: Cmd+N → new sermon
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setScreen("new");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Apply display font globally
  useEffect(() => {
    document.documentElement.style.setProperty("--font-display", DISPLAY_FONTS[t.displayFont] || DISPLAY_FONTS.fraunces);
  }, [t.displayFont]);

  const isPresentation = screen === "present";

  return (
    <div
      data-screen-label={SCREEN_LABELS[screen]}
      style={{
        position: "relative",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Main app shell */}
      <div style={{
        display: "grid",
        gridTemplateColumns: (effectiveCollapsed ? "64px" : "240px") + " 1fr",
        gridTemplateAreas: '"sidebar main"',
        height: "100vh",
        transition: "grid-template-columns 220ms cubic-bezier(.2,.7,.2,1)",
      }}>
        <Sidebar
          screen={screen}
          setScreen={setScreen}
          collapsed={effectiveCollapsed}
          onToggleCollapsed={() => {
            const next = !effectiveCollapsed;
            setSidebarCollapsed(next);
            setTweak("sidebarCollapsed", next);
          }}
        />

        <main style={{
          gridArea: "main",
          overflow: screen === "editor" ? "hidden" : "auto",
          background: "var(--bg)",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}>
          {screen === "library" && <Library setScreen={setScreen} />}
          {screen === "new"     && <NewSermon setScreen={setScreen} />}
          {screen === "editor"  && <Editor setScreen={setScreen} />}
        </main>
      </div>

      {/* Presentation mode overlays the whole app */}
      {isPresentation && <Presentation setScreen={(s) => {
        setScreen(s);
        setTweak("showPresentationDemo", false);
      }} />}

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Layout" />
        <TweakToggle
          label="Recolher barra lateral"
          value={t.sidebarCollapsed}
          onChange={(v) => setTweak("sidebarCollapsed", v)}
        />
        <TweakToggle
          label="Mostrar Modo Apresentação"
          value={t.showPresentationDemo}
          onChange={(v) => setTweak("showPresentationDemo", v)}
        />

        <TweakSection label="Tipografia" />
        <TweakRadio
          label="Fonte editorial"
          value={t.displayFont}
          options={["fraunces", "newsreader", "spectral"]}
          onChange={(v) => setTweak("displayFont", v)}
        />

        <TweakSection label="Navegação" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            ["library", "Biblioteca"],
            ["new",     "Novo sermão"],
            ["editor",  "Editor"],
            ["present", "Modo Apresentação"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setScreen(id);
                if (id === "present") setTweak("showPresentationDemo", true);
                else setTweak("showPresentationDemo", false);
              }}
              style={{
                appearance: "none",
                textAlign: "left",
                padding: "7px 10px",
                background: screen === id ? "rgba(22,101,52,0.12)" : "rgba(0,0,0,0.03)",
                border: ".5px solid " + (screen === id ? "rgba(22,101,52,0.4)" : "rgba(0,0,0,0.08)"),
                borderRadius: 7,
                color: screen === id ? "#166534" : "#29261b",
                fontSize: 11.5, fontWeight: 500,
                cursor: "default",
              }}
            >{label}</button>
          ))}
        </div>
      </TweaksPanel>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
