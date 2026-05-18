// Sidebar, VOX navigation
const Sidebar = ({ screen, setScreen, collapsed, onToggleCollapsed }) => {
  const navItems = [
    { id: "library", label: "Biblioteca", icon: "book", screen: "library" },
    { id: "drafts", label: "Em rascunho", icon: "draft", screen: "library", filter: "drafting", count: 4 },
    { id: "present", label: "Apresentar", icon: "present", screen: "present" },
    { id: "collection", label: "Coletânea", icon: "collection", screen: "library", muted: true },
    { id: "calendar", label: "Calendário pastoral", icon: "calendar", screen: "library", muted: true },
  ];

  const recent = window.VOX_DATA.SERMONS.slice(0, 3);

  // Active inference
  const activeId = screen === "editor" ? "drafts"
    : screen === "present" ? "present"
      : screen === "new" ? null
        : "library";

  return (
    <aside
      style={{
        gridArea: "sidebar",
        width: collapsed ? 64 : 240,
        background: "var(--surface-elev)",
        borderRight: "1px solid var(--whisper)",
        display: "flex",
        flexDirection: "column",
        transition: "width 220ms cubic-bezier(.2,.7,.2,1)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Logo + collapse */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: collapsed ? "20px 0 16px" : "22px 18px 18px",
        gap: 8,
      }}>
        {!collapsed ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <VoxMark size={22} />
            <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: 0.5 }}>
              v1.4
            </span>
          </div>
        ) : (
          <div style={{ margin: "0 auto" }}><VoxMark size={20} /></div>
        )}
        {!collapsed && (
          <button
            className="btn btn-ghost"
            style={{ height: 28, width: 28, padding: 0, color: "var(--muted)" }}
            onClick={onToggleCollapsed}
            title="Recolher"
          >
            <VoxIcon name="sidebar" className="icon-sm" />
          </button>
        )}
      </div>

      {/* New sermon CTA */}
      <div style={{ padding: collapsed ? "0 8px 14px" : "0 14px 16px" }}>
        <button
          className="btn btn-primary"
          style={{
            width: "100%",
            height: 40,
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? 0 : "0 14px",
            gap: 10,
          }}
          onClick={() => setScreen("new")}
        >
          <VoxIcon name="feather" className="icon-sm" />
          {!collapsed && <span>Novo sermão</span>}
          {!collapsed && <span style={{ marginLeft: "auto", opacity: 0.7 }}>
            <Kbd>⌘</Kbd> <Kbd>N</Kbd>
          </span>}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: collapsed ? "4px 8px" : "4px 10px", display: "flex", flexDirection: "column", gap: 1 }}>
        {!collapsed && (
          <div className="eyebrow eyebrow-tight" style={{ padding: "10px 8px 6px", color: "var(--muted)" }}>
            Trabalho
          </div>
        )}
        {navItems.map(item => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.screen)}
              style={{
                position: "relative",
                display: "flex", alignItems: "center", gap: 12,
                padding: collapsed ? "10px 0" : "8px 10px",
                justifyContent: collapsed ? "center" : "flex-start",
                border: "none",
                background: active ? "var(--forest-soft)" : "transparent",
                borderRadius: 8,
                color: active ? "var(--forest)" : item.muted ? "var(--muted)" : "var(--prose)",
                font: "500 13.5px var(--font-ui)",
                cursor: "default",
                textAlign: "left",
                width: "100%",
                height: 36,
                transition: "background 100ms ease, color 100ms ease",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(22,101,52,0.04)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              {active && !collapsed && (
                <span style={{
                  position: "absolute", left: -10, top: 6, bottom: 6,
                  width: 3, borderRadius: 999,
                  background: "var(--forest)",
                }} />
              )}
              <VoxIcon name={item.icon} className="icon-sm" />
              {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              {!collapsed && item.count != null && (
                <span className="mono" style={{ color: "var(--muted)", fontSize: 11 }}>{item.count}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Recent, hidden when collapsed */}
      {!collapsed && (
        <div style={{ padding: "16px 14px 4px", overflow: "hidden" }}>
          <div className="eyebrow eyebrow-tight" style={{ padding: "10px 4px 8px", color: "var(--muted)" }}>
            Recentes
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {recent.map(s => {
              const fw = window.VOX_DATA.FRAMEWORKS[s.framework];
              return (
                <button
                  key={s.id}
                  onClick={() => setScreen("editor")}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "8px 6px",
                    background: "transparent",
                    border: "none",
                    borderRadius: 6,
                    cursor: "default",
                    textAlign: "left",
                    color: "var(--ink)",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.025)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{
                    marginTop: 6, width: 6, height: 6, borderRadius: 2,
                    background: fw.color, flexShrink: 0,
                  }} />
                  <span style={{ display: "block", overflow: "hidden", minWidth: 0 }}>
                    <span className="display" style={{
                      display: "block",
                      fontSize: 13, fontWeight: 500,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      lineHeight: 1.3,
                    }}>{s.title}</span>
                    <span className="mono" style={{
                      display: "block",
                      fontSize: 10.5, color: "var(--muted)",
                      marginTop: 2,
                    }}>{s.ref}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Bottom: user + settings */}
      <div style={{
        padding: collapsed ? "12px 8px 14px" : "12px 14px 16px",
        borderTop: "1px solid var(--whisper)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        {collapsed ? (
          <>
            <button
              className="btn btn-ghost"
              style={{ width: 40, height: 40, padding: 0, margin: "0 auto" }}
              onClick={onToggleCollapsed}
              title="Expandir"
            >
              <VoxIcon name="sidebar" className="icon-sm" />
            </button>
          </>
        ) : (
          <>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #2D7A3F, #166534)",
              color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13,
              letterSpacing: 0.2,
            }}>EM</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 500, color: "var(--ink)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>Pr. Edmundo Marques</div>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
                IBP Vila Pauliceia
              </div>
            </div>
            <button
              className="btn btn-ghost"
              style={{ width: 28, height: 28, padding: 0, color: "var(--muted)" }}
              title="Configurações"
            >
              <VoxIcon name="settings" className="icon-sm" />
            </button>
          </>
        )}
      </div>
    </aside>
  );
};

Object.assign(window, { Sidebar });
