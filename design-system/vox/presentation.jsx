// Presentation mode, dark stage view for live preaching
const Presentation = ({ setScreen }) => {
  const doc = window.VOX_DATA.EDITOR_DOC;
  // Only show visible-on-stage blocks (skip Notas pessoais)
  const stageBlocks = doc.blocks.filter(b => b.type !== "Notas pessoais");
  const [idx, setIdx] = React.useState(3); // start mid-sermon for realism
  const block = stageBlocks[idx];
  const next = stageBlocks[idx + 1];

  const [elapsed, setElapsed] = React.useState(18 * 60 + 42); // 18:42
  React.useEffect(() => {
    const i = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(i);
  }, []);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const fw = window.VOX_DATA.FRAMEWORKS[doc.framework];
  const isScripture = block?.type === "Texto Bíblico";

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setScreen("editor");
      if (e.key === "ArrowRight" || e.key === " ") setIdx(i => Math.min(stageBlocks.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIdx(i => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stageBlocks.length, setScreen]);

  return (
    <div style={{
      position: "absolute",
      inset: 0,
      background: "#0B0F0D",
      color: "#E7E5E4",
      display: "flex",
      flexDirection: "column",
      zIndex: 50,
      fontFamily: "var(--font-ui)",
      backgroundImage:
        "radial-gradient(ellipse at 30% 0%, rgba(22,101,52,0.15), transparent 60%)," +
        "radial-gradient(ellipse at 100% 100%, rgba(180,83,9,0.08), transparent 55%)",
    }}>
      {/* Top bar */}
      <header style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "16px 28px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="display" style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "0.02em",
            color: "#F9F7F4",
            display: "inline-flex", alignItems: "baseline", gap: 2,
          }}>
            VOX
            <span style={{ display: "inline-block", width: 4, height: 4, borderRadius: "50%", background: fw.color, transform: "translateY(-2px)" }} />
          </span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>Modo Apresentação</span>
        </div>

        <span style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "4px 10px 4px 8px",
            borderRadius: 4,
            background: "rgba(22,101,52,0.18)",
            color: "#86EFAC",
            fontSize: 11, fontWeight: 500, letterSpacing: 0.2,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#86EFAC" }} />
            {fw.name}
          </span>
          <span className="mono" style={{ color: "#D6A05F", fontSize: 12 }}>{doc.ref}</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Timer */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "8px 16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", animation: "voxPulse 1.4s ease-in-out infinite" }} />
          <span className="mono" style={{ fontSize: 17, color: "#F9F7F4", fontVariantNumeric: "tabular-nums", letterSpacing: 0.5 }}>
            {mm}:{ss}
          </span>
        </div>

        <button
          onClick={() => setScreen("editor")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 14px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            color: "rgba(255,255,255,0.7)",
            fontSize: 13,
            cursor: "default",
          }}
        >
          <VoxIcon name="x" className="icon-sm" />
          Sair
          <Kbd>Esc</Kbd>
        </button>
      </header>

      {/* Stage */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        minHeight: 0,
      }}>
        {/* Center, current block */}
        <main style={{
          padding: "56px 80px 32px",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{
              fontFamily: "var(--font-ui)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "color-mix(in oklab, " + fw.color + " 70%, #fff 30%)",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "color-mix(in oklab, " + fw.color + " 60%, #fff 40%)" }} />
              {block?.type}
            </span>
            <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              {String(idx + 1).padStart(2, "0")} / {String(stageBlocks.length).padStart(2, "0")}
            </span>
          </div>

          {isScripture ? (
            <div style={{
              borderLeft: "3px solid #D6A05F",
              paddingLeft: 28,
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 32,
              lineHeight: 1.5,
              color: "#F5F1EA",
              letterSpacing: "-0.005em",
              textWrap: "balance",
            }}>
              {block?.content}
            </div>
          ) : (
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: 36,
              lineHeight: 1.45,
              color: "#F9F7F4",
              letterSpacing: "-0.012em",
              fontWeight: 400,
              textWrap: "pretty",
              maxWidth: 800,
            }}>
              {block?.content || (
                <span style={{ color: "rgba(255,255,255,0.3)" }}>{block?.placeholder}</span>
              )}
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* On-stage notes (compact, dim) */}
          {block?.type === "Aplicação" && (
            <aside style={{
              padding: "16px 20px",
              background: "rgba(180,83,9,0.08)",
              border: "1px solid rgba(180,83,9,0.18)",
              borderRadius: 10,
              color: "#D6A05F",
              fontSize: 14,
              lineHeight: 1.5,
              maxWidth: 720,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}>
              <VoxIcon name="bookmark" className="icon-sm" style={{ marginTop: 3, flexShrink: 0 }} />
              <span>
                Lembrar de Maria (oração da semana passada), convidar congregação a anotar uma frase do sermão antes de sair.
              </span>
            </aside>
          )}

          {/* Bottom controls */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            <button
              onClick={() => setIdx(Math.max(0, idx - 1))}
              disabled={idx === 0}
              style={{
                width: 44, height: 44,
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: idx === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.8)",
                cursor: "default",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <VoxIcon name="arrow-left" className="icon-sm" />
            </button>

            {/* Progress dots */}
            <div style={{ display: "flex", gap: 4, alignItems: "center", flex: 1 }}>
              {stageBlocks.map((b, i) => (
                <span
                  key={b.id}
                  onClick={() => setIdx(i)}
                  style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 2,
                    background: i < idx
                      ? "color-mix(in oklab, " + fw.color + " 55%, #fff 5%)"
                      : i === idx
                        ? "color-mix(in oklab, " + fw.color + " 80%, #fff 30%)"
                        : "rgba(255,255,255,0.08)",
                    cursor: "default",
                    transition: "background 200ms ease",
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => setIdx(Math.min(stageBlocks.length - 1, idx + 1))}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                height: 44, padding: "0 18px",
                borderRadius: 8,
                background: fw.color,
                border: "none",
                color: "#fff",
                fontSize: 14, fontWeight: 500,
                cursor: "default",
              }}
            >
              Próximo
              <VoxIcon name="arrow-right" className="icon-sm" />
            </button>
          </div>
        </main>

        {/* Right rail, up next + meta */}
        <aside style={{
          padding: "56px 28px 28px",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          overflow: "auto",
        }}>
          <div>
            <div className="eyebrow eyebrow-tight" style={{ color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
              Manuscrito
            </div>
            <div className="display" style={{
              fontFamily: "var(--font-display)",
              fontSize: 22, fontWeight: 600,
              color: "#F9F7F4",
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
            }}>{doc.title}</div>
            <div className="mono" style={{ color: "#D6A05F", fontSize: 12, marginTop: 6 }}>
              {doc.ref}
            </div>
          </div>

          <div style={{
            padding: 16,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
          }}>
            <div className="eyebrow eyebrow-tight" style={{ color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>
              A seguir
            </div>
            {next ? (
              <>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "3px 8px 3px 7px",
                  borderRadius: 3,
                  background: "color-mix(in oklab, " + window.VOX_DATA.BLOCK_TYPES[next.type].color + " 25%, #000 75%)",
                  color: "#fff",
                  fontSize: 10, fontWeight: 500, letterSpacing: 0.5, textTransform: "uppercase",
                  marginBottom: 8,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "color-mix(in oklab, " + window.VOX_DATA.BLOCK_TYPES[next.type].color + " 60%, #fff 40%)" }} />
                  {next.type}
                </div>
                <p style={{
                  margin: 0,
                  fontFamily: "var(--font-display)",
                  fontSize: 14.5,
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.6)",
                }}>
                  {(next.content || next.placeholder || "").slice(0, 140)}
                  {(next.content || next.placeholder || "").length > 140 ? "…" : ""}
                </p>
              </>
            ) : (
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Último bloco.</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Meta label="Tempo previsto" value="38 min" />
            <Meta label="Em ritmo" value={mm + ":" + ss} highlight />
            <Meta label="Próximo verso" value="v. 25" mono />
          </div>

          <div style={{ flex: 1 }} />

          <div style={{
            padding: "12px 14px",
            background: "rgba(22,101,52,0.10)",
            border: "1px solid rgba(22,101,52,0.20)",
            borderRadius: 8,
            color: "#86EFAC",
            fontSize: 12,
            lineHeight: 1.5,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}>
            <VoxIcon name="circle-fill" className="icon-sm" style={{ marginTop: 2, flexShrink: 0, width: 8, height: 8 }} />
            <span>O Modo Apresentação não envia toques nem notificações. Tela mantida ativa.</span>
          </div>

          <div style={{
            display: "flex",
            gap: 6,
            fontSize: 11,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "var(--font-mono)",
          }}>
            <Kbd>←</Kbd> <Kbd>→</Kbd> navegar · <Kbd>Esc</Kbd> sair
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes voxPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

const Meta = ({ label, value, highlight, mono }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "baseline",
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  }}>
    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{label}</span>
    <span style={{
      fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)",
      fontSize: 13,
      fontWeight: 500,
      color: highlight ? "#86EFAC" : "#F9F7F4",
    }}>{value}</span>
  </div>
);

Object.assign(window, { Presentation });
