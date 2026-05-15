// Block editor — central writing surface
const Editor = ({ setScreen }) => {
  const doc = window.VOX_DATA.EDITOR_DOC;
  const [blocks, setBlocks] = React.useState(doc.blocks);
  const [activeId, setActiveId] = React.useState("b8"); // start on Conclusão (empty) — most natural place to write
  const [showAdd, setShowAdd] = React.useState(false);

  // Responsive: track container width to collapse rails on narrow viewports
  const containerRef = React.useRef(null);
  const [width, setWidth] = React.useState(1400);
  React.useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const outlineW = width < 900 ? 220 : 260;
  const refsW    = width < 1100 ? 0 : 300;
  const [refsOpen, setRefsOpen] = React.useState(true);
  const refsVisible = refsOpen && width >= 1100;

  const active = blocks.find(b => b.id === activeId) || blocks[0];
  const totalWords = blocks.reduce((sum, b) => sum + (b.content?.trim().split(/\s+/).filter(Boolean).length || 0), 0);

  const updateBlock = (id, content) => {
    setBlocks(bs => bs.map(b => b.id === id ? { ...b, content } : b));
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: "grid",
        gridTemplateColumns: outlineW + "px 1fr" + (refsVisible ? " " + refsW + "px" : ""),
        gridTemplateRows: "auto 1fr",
        gridTemplateAreas: refsVisible
          ? '"topbar topbar topbar" "outline canvas refs"'
          : '"topbar topbar" "outline canvas"',
        height: "100%",
        minHeight: 0,
        transition: "grid-template-columns 200ms cubic-bezier(.2,.7,.2,1)",
      }}
    >
      {/* Top bar */}
      <EditorTopBar
        doc={doc}
        totalWords={totalWords}
        setScreen={setScreen}
        compact={width < 1100}
        refsOpen={refsOpen}
        canShowRefs={width >= 1100}
        onToggleRefs={() => setRefsOpen(r => !r)}
      />

      {/* Outline */}
      <EditorOutline
        blocks={blocks}
        activeId={activeId}
        onSelect={setActiveId}
        onAdd={() => setShowAdd(true)}
        showAdd={showAdd}
        onCloseAdd={() => setShowAdd(false)}
        onAddBlock={(type) => {
          const newBlock = { id: "n" + Date.now(), type, content: "" };
          const idx = blocks.findIndex(b => b.id === activeId);
          const next = [...blocks];
          next.splice(idx + 1, 0, newBlock);
          setBlocks(next);
          setActiveId(newBlock.id);
          setShowAdd(false);
        }}
      />

      {/* Canvas */}
      <EditorCanvas
        block={active}
        onChange={(content) => updateBlock(active.id, content)}
        framework={doc.framework}
        compact={width < 1100}
      />

      {/* References */}
      {refsVisible && <EditorRefs />}
    </div>
  );
};

// --- Top bar ---
const EditorTopBar = ({ doc, totalWords, setScreen, compact, refsOpen, canShowRefs, onToggleRefs }) => (
  <header style={{
    gridArea: "topbar",
    display: "flex",
    alignItems: "center",
    gap: compact ? 10 : 16,
    padding: compact ? "12px 18px" : "14px 24px",
    background: "var(--bg)",
    borderBottom: "1px solid var(--whisper)",
    minHeight: 60,
  }}>
    <button
      className="btn btn-ghost btn-sm"
      onClick={() => setScreen("library")}
      style={{ color: "var(--muted)", paddingLeft: 0, flexShrink: 0 }}
      title="Voltar para a biblioteca"
    >
      <VoxIcon name="arrow-left" className="icon-sm" />
      {!compact && "Biblioteca"}
    </button>

    <span style={{ width: 1, height: 22, background: "var(--whisper-strong)", flexShrink: 0 }} />

    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <FrameworkBadge framework={doc.framework} size="sm" />
        <span className="mono" style={{ color: "var(--gold)", fontSize: 12, whiteSpace: "nowrap" }}>{doc.ref}</span>
        {!compact && (
          <>
            <span style={{ color: "var(--whisper-strong)" }}>·</span>
            <span className="mono" style={{ color: "var(--muted)", fontSize: 11.5, whiteSpace: "nowrap" }}>Domingo · 24 de maio</span>
          </>
        )}
      </div>
      <h1 className="display" style={{
        margin: "2px 0 0",
        font: "600 19px/1.2 var(--font-display)",
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>{doc.title}</h1>
    </div>

    {!compact && (
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <span className="mono" style={{ color: "var(--muted)", fontSize: 11.5, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }} />
          {doc.lastSavedAgo}
        </span>
        <span className="mono" style={{ color: "var(--muted)", fontSize: 11.5 }}>
          {totalWords.toLocaleString("pt-BR")} pal · ~{Math.max(1, Math.round(totalWords / 150))}min
        </span>
      </div>
    )}

    {compact && (
      <span
        className="mono"
        title={doc.lastSavedAgo}
        style={{ color: "var(--muted)", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }} />
        salvo
      </span>
    )}

    <span style={{ width: 1, height: 22, background: "var(--whisper-strong)", flexShrink: 0 }} />

    {!compact && (
      <button className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
        <VoxIcon name="bookmark" className="icon-sm" />
        Marcar versão
      </button>
    )}

    {canShowRefs && (
      <button
        className="btn btn-ghost btn-sm"
        onClick={onToggleRefs}
        title={refsOpen ? "Recolher referências" : "Mostrar referências"}
        style={{
          flexShrink: 0,
          color: refsOpen ? "var(--forest)" : "var(--muted)",
          background: refsOpen ? "var(--forest-soft)" : "transparent",
        }}
      >
        <VoxIcon name="book" className="icon-sm" />
        {!compact && "Referências"}
      </button>
    )}

    <button className="btn btn-primary btn-sm" onClick={() => setScreen("present")} style={{ flexShrink: 0 }}>
      <VoxIcon name="play" className="icon-sm" />
      Apresentar
    </button>
  </header>
);

// --- Outline (left rail) ---
const EditorOutline = ({ blocks, activeId, onSelect, onAdd, showAdd, onCloseAdd, onAddBlock }) => {
  const allTypes = Object.keys(window.VOX_DATA.BLOCK_TYPES);
  return (
    <aside style={{
      gridArea: "outline",
      background: "var(--surface-elev)",
      borderRight: "1px solid var(--whisper)",
      overflow: "auto",
      padding: "18px 14px 18px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 4px 10px",
      }}>
        <span className="eyebrow eyebrow-tight" style={{ color: "var(--muted)" }}>Estrutura</span>
        <span className="mono" style={{ color: "var(--muted)", fontSize: 11 }}>{blocks.length} blocos</span>
      </div>

      {blocks.map((b, i) => {
        const bt = window.VOX_DATA.BLOCK_TYPES[b.type];
        const isActive = b.id === activeId;
        const wordCount = b.content?.trim().split(/\s+/).filter(Boolean).length || 0;
        return (
          <button
            key={b.id}
            onClick={() => onSelect(b.id)}
            style={{
              position: "relative",
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "10px 12px",
              borderRadius: 8,
              background: isActive ? "var(--surface)" : "transparent",
              border: "1px solid " + (isActive ? "var(--whisper)" : "transparent"),
              boxShadow: isActive ? "0 1px 0 rgba(22,40,30,0.04)" : "none",
              cursor: "default",
              textAlign: "left",
              color: "var(--ink)",
              transition: "all 100ms ease",
              borderLeft: "3px solid " + (isActive ? (bt?.color || "var(--forest)") : "transparent"),
              marginLeft: 0,
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(0,0,0,0.025)"; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
          >
            <span className="mono" style={{
              fontSize: 10.5,
              color: "var(--muted)",
              minWidth: 18,
              marginTop: 2,
            }}>{String(i + 1).padStart(2, "0")}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: bt?.color || "var(--prose)",
                marginBottom: 3,
              }}>{b.type}</span>
              <span style={{
                display: "block",
                fontSize: 12.5,
                color: b.content ? "var(--prose)" : "var(--muted)",
                fontStyle: b.content ? "normal" : "italic",
                lineHeight: 1.4,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}>
                {b.content
                  ? b.content.slice(0, 80) + (b.content.length > 80 ? "…" : "")
                  : (b.placeholder || "Vazio")}
              </span>
            </span>
            {wordCount > 0 && (
              <span className="mono" style={{
                fontSize: 10,
                color: "var(--muted)",
                marginTop: 2,
              }}>{wordCount}</span>
            )}
          </button>
        );
      })}

      {/* Add block */}
      <div style={{ position: "relative", marginTop: 4 }}>
        <button
          onClick={onAdd}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px",
            width: "100%",
            background: "transparent",
            border: "1px dashed var(--whisper-strong)",
            borderRadius: 8,
            color: "var(--muted)",
            fontSize: 12.5,
            cursor: "default",
            transition: "all 120ms ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--forest)"; e.currentTarget.style.color = "var(--forest)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--whisper-strong)"; e.currentTarget.style.color = "var(--muted)"; }}
        >
          <VoxIcon name="plus" className="icon-sm" />
          Adicionar bloco
        </button>

        {showAdd && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 6px)", left: 0, right: 0,
            background: "var(--surface)",
            border: "1px solid var(--whisper-strong)",
            borderRadius: 10,
            boxShadow: "var(--shadow-overlay)",
            padding: 6,
            zIndex: 10,
            maxHeight: 320,
            overflow: "auto",
          }}>
            <div className="eyebrow eyebrow-tight" style={{
              padding: "8px 10px 6px",
              color: "var(--muted)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>Inserir bloco</span>
              <button
                onClick={onCloseAdd}
                style={{ background: "none", border: "none", color: "var(--muted)", cursor: "default" }}
              ><VoxIcon name="x" className="icon-sm" /></button>
            </div>
            {allTypes.map(type => {
              const bt = window.VOX_DATA.BLOCK_TYPES[type];
              return (
                <button
                  key={type}
                  onClick={() => onAddBlock(type)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "8px 10px",
                    background: "transparent",
                    border: "none",
                    borderRadius: 6,
                    cursor: "default",
                    textAlign: "left",
                    color: "var(--ink)",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = bt.accent}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ width: 6, height: 6, borderRadius: 2, background: bt.color }} />
                  <span style={{ fontSize: 13 }}>{type}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};

// --- Canvas (main writing area) ---
const EditorCanvas = ({ block, onChange, framework, compact }) => {
  const bt = window.VOX_DATA.BLOCK_TYPES[block.type];
  const textareaRef = React.useRef(null);

  const wordCount = block.content?.trim().split(/\s+/).filter(Boolean).length || 0;
  const charCount = block.content?.length || 0;

  // Auto-resize textarea
  React.useEffect(() => {
    const t = textareaRef.current;
    if (t) {
      t.style.height = "auto";
      t.style.height = Math.max(120, t.scrollHeight) + "px";
    }
  }, [block.content, block.id]);

  // Special: Texto Bíblico renders as styled block
  const isScripture = block.type === "Texto Bíblico";

  return (
    <main style={{
      gridArea: "canvas",
      overflow: "auto",
      minWidth: 0,
      background: "var(--bg)",
      padding: compact ? "32px 32px 120px" : "40px 64px 120px",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Block header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 18,
        }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 11px 5px 9px",
            borderRadius: 4,
            background: bt.accent,
            color: bt.color,
            fontFamily: "var(--font-ui)",
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: bt.color }} />
            {block.type}
          </span>
          <span style={{ flex: 1 }} />
          <button className="btn btn-ghost btn-sm" style={{ color: "var(--muted)" }} title="Tipo do bloco">
            <VoxIcon name="type" className="icon-sm" />
            Alterar tipo
          </button>
          <button className="btn btn-ghost btn-sm" style={{ color: "var(--muted)" }} title="Mais ações">
            <VoxIcon name="more" className="icon-sm" />
          </button>
        </div>

        {/* Hint */}
        <p style={{
          margin: "0 0 18px",
          color: "var(--muted)",
          fontSize: 13,
          fontStyle: "italic",
          lineHeight: 1.5,
        }}>{bt.hint}</p>

        {/* Editor body */}
        {isScripture ? (
          <ScriptureBlock block={block} onChange={onChange} />
        ) : (
          <textarea
            ref={textareaRef}
            value={block.content || ""}
            onChange={e => onChange(e.target.value)}
            placeholder={block.placeholder || "Escreva aqui…"}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              resize: "none",
              background: "transparent",
              color: "var(--ink)",
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: 19,
              lineHeight: 1.65,
              letterSpacing: "-0.002em",
              minHeight: 160,
              padding: 0,
            }}
          />
        )}

        {/* Block footer — meta */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          marginTop: 28,
          paddingTop: 16,
          borderTop: "1px dashed var(--whisper-strong)",
          color: "var(--muted)",
          fontSize: 11.5,
        }}>
          <span className="mono">{wordCount} pal</span>
          <span className="mono">{charCount} car</span>
          <span className="mono">~{Math.max(1, Math.round(wordCount / 150 * 60))}s falado</span>
          <span style={{ flex: 1 }} />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Kbd>⌘</Kbd><Kbd>↵</Kbd> próximo bloco
          </span>
        </div>

        {/* Slash command tip */}
        <div style={{
          marginTop: 56,
          padding: "16px 20px",
          background: "var(--surface-elev)",
          border: "1px solid var(--whisper)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "var(--forest-soft)", color: "var(--forest)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-mono)", fontWeight: 600,
          }}>/</div>
          <div style={{ flex: 1, fontSize: 13, color: "var(--prose)" }}>
            Digite <span className="mono" style={{ color: "var(--forest)" }}>/</span> para inserir
            bloco, citação ou referência cruzada — sem soltar do teclado.
          </div>
          <Kbd>⌘</Kbd><Kbd>K</Kbd>
        </div>
      </div>
    </main>
  );
};

// --- Scripture block special render ---
const ScriptureBlock = ({ block, onChange }) => (
  <div style={{
    position: "relative",
    padding: "26px 32px",
    background: "var(--surface)",
    border: "1px solid var(--whisper)",
    borderLeft: "3px solid var(--gold)",
    borderRadius: 12,
  }}>
    <div style={{
      position: "absolute", top: 14, right: 18,
      fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--muted)",
    }}>{block.meta}</div>
    <textarea
      value={block.content || ""}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%",
        border: "none", outline: "none", resize: "none", background: "transparent",
        color: "var(--ink)",
        fontFamily: "var(--font-display)",
        fontWeight: 400,
        fontSize: 17,
        lineHeight: 1.75,
        fontStyle: "italic",
        minHeight: 120,
        padding: 0,
      }}
      rows={Math.max(4, (block.content || "").split("\n").length + (block.content || "").length / 70)}
    />
  </div>
);

// --- Refs / notes (right rail) ---
const EditorRefs = () => {
  const [tab, setTab] = React.useState("refs");
  return (
    <aside style={{
      gridArea: "refs",
      background: "var(--surface-elev)",
      borderLeft: "1px solid var(--whisper)",
      overflow: "auto",
      padding: 0,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* tabs */}
      <div style={{
        display: "flex",
        padding: "12px 16px 0",
        borderBottom: "1px solid var(--whisper)",
        gap: 4,
      }}>
        {[
          { id: "refs", label: "Referências" },
          { id: "notes", label: "Anotações" },
          { id: "history", label: "Versões" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 12px",
              background: "transparent",
              border: "none",
              borderBottom: "2px solid " + (tab === t.id ? "var(--forest)" : "transparent"),
              color: tab === t.id ? "var(--forest)" : "var(--muted)",
              fontSize: 12.5,
              fontWeight: 500,
              cursor: "default",
              marginBottom: -1,
            }}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        {tab === "refs" && <RefsList />}
        {tab === "notes" && <NotesList />}
        {tab === "history" && <HistoryList />}
      </div>
    </aside>
  );
};

const RefsList = () => (
  <>
    <div className="eyebrow eyebrow-tight" style={{ color: "var(--muted)" }}>Texto base</div>
    <div className="card" style={{ padding: 16, background: "var(--surface)" }}>
      <div className="mono" style={{ color: "var(--gold)", fontSize: 11.5, marginBottom: 6 }}>
        Tiago 1:22—25 · ACF
      </div>
      <p style={{
        margin: 0,
        fontFamily: "var(--font-display)",
        fontSize: 13.5,
        lineHeight: 1.65,
        color: "var(--ink)",
      }}>
        “Sede cumpridores da palavra e não somente ouvintes, enganando-vos a vós mesmos. Porque,
        se alguém é ouvinte da palavra e não cumpridor…”
      </p>
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, paddingLeft: 0, color: "var(--forest)" }}>
        Ver passagem completa
        <VoxIcon name="chevron-right" className="icon-sm" />
      </button>
    </div>

    <div className="eyebrow eyebrow-tight" style={{ color: "var(--muted)", marginTop: 4 }}>Referências cruzadas</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <RefItem ref_="Mateus 7:24—27" note="A casa sobre a rocha — ouvir e fazer." />
      <RefItem ref_="Romanos 2:13" note="Não os ouvintes da lei, mas os cumpridores." />
      <RefItem ref_="Lucas 6:46—49" note="Por que me chamais Senhor e não fazeis?" />
      <RefItem ref_="João 13:17" note="Bem-aventurados se as fizerdes." />
    </div>

    <div className="eyebrow eyebrow-tight" style={{ color: "var(--muted)", marginTop: 4 }}>Original</div>
    <div style={{
      padding: 14,
      background: "var(--surface)",
      border: "1px solid var(--whisper)",
      borderRadius: 8,
      fontFamily: "var(--font-display)",
      fontSize: 14,
      color: "var(--ink)",
      lineHeight: 1.5,
    }}>
      <span style={{ color: "var(--gold)", fontFamily: "var(--font-mono)", fontSize: 11 }}>v. 22 · grego</span>
      <div style={{ marginTop: 6 }}>γίνεσθε δὲ ποιηταὶ λόγου</div>
      <div style={{ fontSize: 12, color: "var(--prose)", marginTop: 4, fontStyle: "italic" }}>
        ginesthe de poiētai logou — “tornai-vos fazedores da palavra”
      </div>
    </div>
  </>
);

const RefItem = ({ ref_, note }) => (
  <div style={{
    padding: "10px 12px",
    background: "var(--surface)",
    border: "1px solid var(--whisper)",
    borderRadius: 8,
    cursor: "default",
  }}>
    <div className="mono" style={{ color: "var(--gold)", fontSize: 11.5, marginBottom: 2 }}>{ref_}</div>
    <div style={{ color: "var(--prose)", fontSize: 12.5, lineHeight: 1.45 }}>{note}</div>
  </div>
);

const NotesList = () => (
  <>
    <div className="eyebrow eyebrow-tight" style={{ color: "var(--muted)" }}>Suas anotações</div>
    <NoteItem
      date="13 mai · 14:22"
      text="Comparar com Calvino, Comentário Tiago, sobre 'lei perfeita da liberdade' — boa quebra para subponto 2."
    />
    <NoteItem
      date="11 mai · 21:08"
      text="A imagem do espelho funciona melhor se eu não usar metáfora moderna ('selfie'). Manter clássico."
    />
    <NoteItem
      date="9 mai · 07:34"
      text="Lembrar de Maria, irmã da congregação que pediu oração — talvez ela esteja na ilustração de Aplicação."
    />
  </>
);

const NoteItem = ({ date, text }) => (
  <div style={{
    padding: 14,
    background: "var(--surface)",
    border: "1px solid var(--whisper)",
    borderRadius: 8,
  }}>
    <div className="mono" style={{ color: "var(--muted)", fontSize: 10.5, marginBottom: 6 }}>{date}</div>
    <p style={{ margin: 0, color: "var(--ink)", fontSize: 13, lineHeight: 1.55 }}>{text}</p>
  </div>
);

const HistoryList = () => (
  <>
    <div className="eyebrow eyebrow-tight" style={{ color: "var(--muted)" }}>Versões marcadas</div>
    {[
      { tag: "v3", label: "Antes do feedback do Conselho", at: "12 mai · 09:18", words: 1480 },
      { tag: "v2", label: "Após estudo do original", at: "10 mai · 22:04", words: 980 },
      { tag: "v1", label: "Primeiro esboço", at: "8 mai · 19:50", words: 410 },
    ].map(v => (
      <div key={v.tag} style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: 12,
        background: "var(--surface)",
        border: "1px solid var(--whisper)",
        borderRadius: 8,
      }}>
        <span className="mono" style={{
          width: 30, height: 22,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--forest-soft)", color: "var(--forest)",
          borderRadius: 4,
          fontSize: 11, fontWeight: 600,
        }}>{v.tag}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 500 }}>{v.label}</div>
          <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>
            {v.at} · {v.words} pal
          </div>
        </div>
        <button className="btn btn-ghost" style={{ width: 28, height: 28, padding: 0, color: "var(--muted)" }}>
          <VoxIcon name="more" className="icon-sm" />
        </button>
      </div>
    ))}
  </>
);

Object.assign(window, { Editor });
