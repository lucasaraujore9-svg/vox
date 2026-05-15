// Library — main dashboard listing sermons with soft stats
const Library = ({ setScreen }) => {
  const [filter, setFilter] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState("grid");

  const sermons = window.VOX_DATA.SERMONS;

  const filtered = sermons.filter(s => {
    if (filter === "drafting" && s.status !== "drafting" && s.status !== "draft") return false;
    if (filter === "published" && s.status !== "published") return false;
    if (filter !== "all" && filter !== "drafting" && filter !== "published" && s.framework !== filter) return false;
    if (query && !(s.title + " " + s.ref).toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: "32px 48px 80px", maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <header style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 24,
        marginBottom: 28,
      }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--muted)", marginBottom: 8 }}>
            Quarta-feira · 13 de maio de 2026
          </div>
          <h1 className="display" style={{
            margin: 0,
            font: "600 32px/1.1 var(--font-display)",
            letterSpacing: "-0.015em",
            color: "var(--ink)",
          }}>
            Bom dia, Pr. Edmundo.
          </h1>
          <p style={{
            margin: "10px 0 0",
            color: "var(--prose)",
            fontSize: 15,
            lineHeight: 1.55,
            maxWidth: 540,
          }}>
            Você tem <span style={{ color: "var(--forest)", fontWeight: 500 }}>2 manuscritos
            em andamento</span> e prega <em style={{ fontFamily: "var(--font-display)" }}>“A graça
            que sustenta”</em> neste domingo.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn btn-secondary btn-sm">
            <VoxIcon name="history" className="icon-sm" />
            Histórico
          </button>
          <button className="btn btn-primary" onClick={() => setScreen("new")}>
            <VoxIcon name="plus" className="icon-sm" />
            Novo sermão
          </button>
        </div>
      </header>

      {/* Stats row — soft */}
      <SoftStats />

      {/* Up next — pinned card */}
      <UpNext setScreen={setScreen} />

      {/* Filter bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        margin: "32px 0 16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <FilterChip label="Todos"        active={filter==="all"} onClick={()=>setFilter("all")} count={sermons.length} />
          <FilterChip label="Em rascunho"  active={filter==="drafting"} onClick={()=>setFilter("drafting")} count={sermons.filter(s=>s.status!=="published").length} />
          <FilterChip label="Pregados"     active={filter==="published"} onClick={()=>setFilter("published")} count={sermons.filter(s=>s.status==="published").length} />
          <span style={{ width: 1, height: 18, background: "var(--whisper-strong)", margin: "0 4px" }} />
          {Object.values(window.VOX_DATA.FRAMEWORKS).map(fw => (
            <FilterChip
              key={fw.id}
              label={fw.name}
              dot={fw.color}
              active={filter===fw.id}
              onClick={()=>setFilter(filter===fw.id ? "all" : fw.id)}
            />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <VoxIcon name="search" className="icon-sm" style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              color: "var(--muted)",
            }} />
            <input
              className="input"
              placeholder="Buscar título ou referência"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ height: 36, paddingLeft: 32, width: 240, fontSize: 13 }}
            />
          </div>
          <button className="btn btn-ghost btn-sm" style={{ color: "var(--prose)" }}>
            <VoxIcon name="sort" className="icon-sm" />
            Atualizados
          </button>
        </div>
      </div>

      {/* Sermon grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 16,
      }}>
        {filtered.map(s => (
          <SermonCard key={s.id} sermon={s} onOpen={() => setScreen("editor")} />
        ))}
        {filtered.length === 0 && (
          <div style={{
            gridColumn: "1 / -1",
            padding: 48,
            textAlign: "center",
            color: "var(--muted)",
            border: "1.5px dashed var(--whisper-strong)",
            borderRadius: 12,
          }}>
            Nenhum sermão encontrado com este filtro.
          </div>
        )}
      </div>
    </div>
  );
};

// --- Soft stats ---
const SoftStats = () => (
  <section style={{
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
    gap: 14,
    marginTop: 28,
  }}>
    <StreakCard />
    <StatCard label="Manuscritos em andamento" value="2" foot="Tiago 1 · Lucas 18" />
    <StatCard label="Pregados em 2026" value="14" foot="Em 6 frameworks" />
    <StatCard label="Tempo médio de escrita" value="3,4d" foot="por manuscrito" mono />
  </section>
);

const StreakCard = () => {
  const days = [1,1,1,1,0,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1]; // last 22 days, semi-realistic
  return (
    <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--prose)" }}>Sequência de estudo</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
            <span className="display" style={{
              font: "600 36px/1 var(--font-display)",
              color: "var(--forest)",
              letterSpacing: "-0.01em",
            }}>9</span>
            <span style={{ color: "var(--prose)", fontSize: 13 }}>dias seguidos</span>
          </div>
        </div>
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)", textAlign: "right" }}>
          últimas 3 semanas
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end" }}>
        {days.map((d, i) => (
          <span key={i} style={{
            flex: 1,
            height: d ? 22 : 8,
            borderRadius: 2,
            background: d
              ? (i >= days.length - 9 ? "var(--forest)" : "var(--forest-tint)")
              : "var(--whisper-strong)",
            transition: "height 200ms ease",
          }} />
        ))}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, foot, mono }) => (
  <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 6 }}>
    <div className="eyebrow" style={{ color: "var(--prose)" }}>{label}</div>
    <div style={{
      font: mono
        ? "500 30px/1 var(--font-mono)"
        : "700 36px/1 var(--font-display)",
      color: "var(--forest)",
      letterSpacing: "-0.01em",
      marginTop: 6,
    }}>{value}</div>
    <div style={{ color: "var(--muted)", fontSize: 12.5, marginTop: "auto", paddingTop: 8 }}>{foot}</div>
  </div>
);

// --- Up next ---
const UpNext = ({ setScreen }) => (
  <div className="card" style={{
    marginTop: 18,
    padding: "22px 26px",
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: 24,
    borderColor: "rgba(22,101,52,0.18)",
    background: "linear-gradient(180deg, var(--surface-elev) 0%, var(--surface) 100%)",
  }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <div className="mono" style={{ color: "var(--muted)", fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase" }}>Domingo</div>
      <div className="display" style={{ font: "600 28px/1 var(--font-display)", color: "var(--forest)" }}>17</div>
      <div className="mono" style={{ color: "var(--muted)", fontSize: 10.5 }}>maio</div>
    </div>
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <FrameworkBadge framework="expositivo" />
        <span className="mono" style={{ color: "var(--muted)", fontSize: 11 }}>Série Romanos · #07</span>
      </div>
      <h2 className="display" style={{
        margin: 0,
        font: "600 22px/1.2 var(--font-display)",
        letterSpacing: "-0.01em",
      }}>A graça que sustenta</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
        <span className="mono" style={{ color: "var(--gold)", fontSize: 12 }}>Romanos 5:1—11</span>
        <span style={{ color: "var(--whisper-strong)" }}>·</span>
        <span style={{ color: "var(--prose)", fontSize: 13 }}>2.840 palavras · ~38 min</span>
        <span style={{ color: "var(--whisper-strong)" }}>·</span>
        <Status status="published" />
      </div>
    </div>
    <div style={{ display: "flex", gap: 10 }}>
      <button className="btn btn-secondary btn-sm" onClick={() => setScreen("editor")}>
        <VoxIcon name="edit" className="icon-sm" />
        Editar
      </button>
      <button className="btn btn-primary btn-sm" onClick={() => setScreen("present")}>
        <VoxIcon name="play" className="icon-sm" />
        Apresentar
      </button>
    </div>
  </div>
);

// --- Filter chip ---
const FilterChip = ({ label, active, onClick, count, dot }) => (
  <button
    onClick={onClick}
    style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      height: 30, padding: "0 12px",
      background: active ? "var(--forest)" : "transparent",
      border: "1px solid " + (active ? "var(--forest)" : "var(--whisper-strong)"),
      color: active ? "#fff" : "var(--prose)",
      borderRadius: 999,
      fontSize: 12.5, fontWeight: 500,
      cursor: "default",
      transition: "all 120ms ease",
    }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = "var(--forest)"; e.currentTarget.style.color = "var(--forest)"; } }}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = "var(--whisper-strong)"; e.currentTarget.style.color = "var(--prose)"; } }}
  >
    {dot && !active && <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot }} />}
    {label}
    {count != null && (
      <span className="mono" style={{
        marginLeft: 4,
        fontSize: 10.5,
        opacity: active ? 0.8 : 0.6,
      }}>{count}</span>
    )}
  </button>
);

// --- Sermon card ---
const SermonCard = ({ sermon, onOpen }) => {
  const [hover, setHover] = React.useState(false);
  const fw = window.VOX_DATA.FRAMEWORKS[sermon.framework];
  return (
    <article
      className="card card-hover"
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 22,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        position: "relative",
        cursor: "default",
        minHeight: 200,
      }}
    >
      {/* top stripe in framework color, very subtle */}
      <span style={{
        position: "absolute", top: 0, left: 22, right: 22, height: 2,
        background: fw.color, opacity: 0.7, borderRadius: 999,
      }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <FrameworkBadge framework={sermon.framework} size="sm" />
        <span className="mono" style={{ color: "var(--gold)", fontSize: 11.5, letterSpacing: 0.2 }}>
          {sermon.ref}
        </span>
      </div>

      <h3 className="display" style={{
        margin: 0,
        font: "600 19px/1.25 var(--font-display)",
        letterSpacing: "-0.01em",
        textWrap: "balance",
      }}>{sermon.title}</h3>

      {sermon.progress != null && (
        <div style={{
          height: 4,
          background: "var(--whisper-strong)",
          borderRadius: 999,
          overflow: "hidden",
        }}>
          <div style={{
            width: (sermon.progress * 100) + "%",
            height: "100%",
            background: "var(--forest)",
          }} />
        </div>
      )}

      <div style={{ flex: 1 }} />

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 10, paddingTop: 4,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Status status={sermon.status} />
          {sermon.words > 0 && (
            <span className="mono" style={{ color: "var(--muted)", fontSize: 11 }}>
              {sermon.words.toLocaleString("pt-BR")} pal · {sermon.durationMin}min
            </span>
          )}
        </div>
        <span className="mono" style={{ color: "var(--muted)", fontSize: 11 }}>
          {sermon.updatedAt}
        </span>
      </div>

      {/* hover actions overlay */}
      <div style={{
        position: "absolute",
        top: 14, right: 14,
        opacity: hover ? 1 : 0,
        transform: hover ? "translateY(0)" : "translateY(-4px)",
        transition: "opacity 120ms ease, transform 120ms ease",
        pointerEvents: hover ? "auto" : "none",
        display: "flex",
        gap: 4,
        padding: 4,
        background: "rgba(255,255,255,0.94)",
        borderRadius: 8,
        border: "1px solid var(--whisper)",
        backdropFilter: "blur(6px)",
        boxShadow: "0 4px 12px rgba(22,40,30,0.06)",
      }}>
        <button className="btn btn-ghost" style={{ width: 28, height: 28, padding: 0 }} title="Editar">
          <VoxIcon name="edit" className="icon-sm" />
        </button>
        <button className="btn btn-ghost" style={{ width: 28, height: 28, padding: 0 }} title="Apresentar">
          <VoxIcon name="play" className="icon-sm" />
        </button>
        <button className="btn btn-ghost" style={{ width: 28, height: 28, padding: 0 }} title="Mais">
          <VoxIcon name="more" className="icon-sm" />
        </button>
      </div>
    </article>
  );
};

Object.assign(window, { Library });
