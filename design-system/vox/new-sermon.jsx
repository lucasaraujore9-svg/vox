// New sermon, framework picker + outline scaffolding
const NewSermon = ({ setScreen }) => {
  const [step, setStep] = React.useState(1); // 1 = framework, 2 = setup, 3 = outline preview
  const [framework, setFramework] = React.useState("expositivo");
  const [title, setTitle] = React.useState("");
  const [ref, setRef] = React.useState("");
  const [series, setSeries] = React.useState("");
  const [date, setDate] = React.useState("2026-05-24");

  const frameworks = Object.values(window.VOX_DATA.FRAMEWORKS);
  const fw = window.VOX_DATA.FRAMEWORKS[framework];

  return (
    <div style={{ padding: "32px 48px 80px", maxWidth: 1080, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setScreen("library")}
          style={{ paddingLeft: 0, color: "var(--muted)" }}
        >
          <VoxIcon name="arrow-left" className="icon-sm" />
          Biblioteca
        </button>
      </div>

      <header style={{ marginBottom: 28 }}>
        <div className="eyebrow" style={{ color: "var(--muted)", marginBottom: 8 }}>
          Novo manuscrito
        </div>
        <h1 className="display" style={{
          margin: 0,
          font: "600 32px/1.15 var(--font-display)",
          letterSpacing: "-0.015em",
        }}>
          {step === 1 && "Como você vai pregar?"}
          {step === 2 && "Detalhes do manuscrito"}
          {step === 3 && "Pronto para começar"}
        </h1>
        <p style={{
          margin: "8px 0 0",
          color: "var(--prose)",
          fontSize: 15,
          maxWidth: 580,
        }}>
          {step === 1 && "O framework define a estrutura inicial. Você poderá adicionar, reordenar ou remover blocos a qualquer momento."}
          {step === 2 && "Informações que aparecem no Modo Apresentação e na biblioteca."}
          {step === 3 && "Revise a estrutura inicial. O VOX criará os blocos abaixo no editor."}
        </p>
      </header>

      {/* Stepper */}
      <Stepper step={step} />

      {/* Step 1, framework picker */}
      {step === 1 && (
        <FrameworkPicker
          frameworks={frameworks}
          selected={framework}
          onSelect={setFramework}
        />
      )}

      {/* Step 2, sermon details */}
      {step === 2 && (
        <DetailsForm
          fw={fw}
          title={title} setTitle={setTitle}
          ref_={ref} setRef={setRef}
          series={series} setSeries={setSeries}
          date={date} setDate={setDate}
        />
      )}

      {/* Step 3, outline preview */}
      {step === 3 && (
        <OutlinePreview fw={fw} title={title} ref_={ref} />
      )}

      {/* Footer actions */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 32,
        paddingTop: 24,
        borderTop: "1px solid var(--whisper)",
      }}>
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (step === 1) setScreen("library");
            else setStep(step - 1);
          }}
        >
          <VoxIcon name="arrow-left" className="icon-sm" />
          {step === 1 ? "Cancelar" : "Voltar"}
        </button>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="mono" style={{ color: "var(--muted)", fontSize: 11.5 }}>
            <Kbd>↵</Kbd> para continuar
          </span>
          {step < 3 ? (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
              Continuar
              <VoxIcon name="arrow-right" className="icon-sm" />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setScreen("editor")}>
              Abrir no editor
              <VoxIcon name="arrow-right" className="icon-sm" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Stepper ---
const Stepper = ({ step }) => {
  const labels = ["Framework", "Detalhes", "Estrutura"];
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      margin: "0 0 28px",
    }}>
      {labels.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <React.Fragment key={label}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 22, height: 22, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? "var(--forest)" : active ? "var(--surface)" : "transparent",
                border: "1.5px solid " + (done || active ? "var(--forest)" : "var(--whisper-strong)"),
                color: done ? "#fff" : active ? "var(--forest)" : "var(--muted)",
                fontFamily: "var(--font-mono)",
                fontSize: 11, fontWeight: 600,
                transition: "all 160ms ease",
              }}>
                {done ? <VoxIcon name="check" className="icon-sm" style={{ width: 12, height: 12 }} /> : n}
              </span>
              <span style={{
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                color: active ? "var(--ink)" : done ? "var(--forest)" : "var(--muted)",
              }}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <span style={{
                width: 32, height: 1,
                background: done ? "var(--forest)" : "var(--whisper-strong)",
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// --- Step 1: Framework picker ---
const FrameworkPicker = ({ frameworks, selected, onSelect }) => (
  <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 14,
  }}>
    {frameworks.map(fw => {
      const isSel = selected === fw.id;
      return (
        <button
          key={fw.id}
          onClick={() => onSelect(fw.id)}
          className="card"
          style={{
            textAlign: "left",
            padding: 22,
            cursor: "default",
            border: isSel ? "1.5px solid " + fw.color : "1px solid var(--whisper)",
            boxShadow: isSel
              ? "0 0 0 4px color-mix(in oklab, " + fw.color + " 10%, transparent), var(--shadow-card)"
              : "var(--shadow-card)",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minHeight: 200,
            background: "var(--surface)",
            transform: isSel ? "translateY(-1px)" : "none",
            transition: "all 180ms ease",
          }}
          onMouseEnter={e => { if (!isSel) e.currentTarget.style.borderColor = "color-mix(in oklab, " + fw.color + " 35%, var(--whisper))"; }}
          onMouseLeave={e => { if (!isSel) e.currentTarget.style.borderColor = "var(--whisper)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "5px 10px 5px 8px",
              borderRadius: 4,
              background: "color-mix(in oklab, " + fw.color + " 8%, transparent)",
              color: fw.color,
              fontSize: 11.5, fontWeight: 500, letterSpacing: 0.2,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: fw.color }} />
              {fw.name}
            </div>
            {isSel && (
              <span style={{
                width: 22, height: 22, borderRadius: "50%",
                background: fw.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff",
              }}>
                <VoxIcon name="check" style={{ width: 12, height: 12 }} />
              </span>
            )}
          </div>

          <h3 className="display" style={{
            margin: 0,
            font: "600 18px/1.25 var(--font-display)",
            letterSpacing: "-0.01em",
          }}>{fw.tagline}</h3>

          <p style={{
            margin: 0,
            color: "var(--prose)",
            fontSize: 13.5,
            lineHeight: 1.55,
          }}>{fw.description}</p>

          <div style={{ flex: 1 }} />

          <div className="mono" style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            fontSize: 10.5,
            color: "var(--muted)",
            paddingTop: 8,
            borderTop: "1px dashed var(--whisper-strong)",
          }}>
            {fw.outline.slice(0, 5).map((b, i) => (
              <React.Fragment key={i}>
                <span>{b}</span>
                {i < Math.min(4, fw.outline.length - 1) && <span style={{ opacity: 0.4 }}>·</span>}
              </React.Fragment>
            ))}
            {fw.outline.length > 5 && <span style={{ opacity: 0.4 }}>· +{fw.outline.length - 5}</span>}
          </div>
        </button>
      );
    })}
  </div>
);

// --- Step 2: details form ---
const DetailsForm = ({ fw, title, setTitle, ref_, setRef, series, setSeries, date, setDate }) => (
  <div className="card" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 22 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 18, borderBottom: "1px solid var(--whisper)" }}>
      <FrameworkBadge framework={fw.id} />
      <span style={{ color: "var(--prose)", fontSize: 13.5 }}>{fw.tagline}</span>
    </div>

    <Field label="Título do sermão" hint="Aparece em destaque na biblioteca e na capa do Modo Apresentação.">
      <input
        className="input"
        autoFocus
        placeholder='ex: "Quando a oração demora"'
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={{ height: 48, fontSize: 17, fontFamily: "var(--font-display)", letterSpacing: "-0.005em" }}
      />
    </Field>

    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
      <Field label="Referência bíblica" hint="Use travessão para faixa de versículos.">
        <input
          className="input"
          placeholder="ex: Lucas 18:1,8"
          value={ref_}
          onChange={e => setRef(e.target.value)}
          style={{ fontFamily: "var(--font-mono)" }}
        />
      </Field>
      <Field label="Versão preferida">
        <select className="input" defaultValue="acf">
          <option value="acf">Almeida Corrigida Fiel</option>
          <option value="ara">Almeida Revista e Atualizada</option>
          <option value="nvi">Nova Versão Internacional</option>
          <option value="naa">Nova Almeida Atualizada</option>
        </select>
      </Field>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <Field label="Série (opcional)" hint="Sermões da mesma série aparecem juntos.">
        <input
          className="input"
          placeholder="ex: Série Romanos"
          value={series}
          onChange={e => setSeries(e.target.value)}
        />
      </Field>
      <Field label="Data prevista">
        <input
          className="input"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </Field>
    </div>

    <Field label="Ocasião">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["Domingo de manhã", "Domingo de noite", "Reunião de oração", "Vigília", "Casamento", "Funeral", "Devocional"].map(o => (
          <button
            key={o}
            style={{
              height: 32, padding: "0 14px",
              border: "1px solid var(--whisper-strong)",
              borderRadius: 999,
              background: "var(--surface)",
              color: "var(--prose)",
              fontSize: 12.5,
              cursor: "default",
            }}
          >{o}</button>
        ))}
      </div>
    </Field>
  </div>
);

const Field = ({ label, hint, children }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <span className="eyebrow eyebrow-tight" style={{ color: "var(--prose)" }}>{label}</span>
    {children}
    {hint && <span style={{ color: "var(--muted)", fontSize: 12 }}>{hint}</span>}
  </label>
);

// --- Step 3: outline preview ---
const OutlinePreview = ({ fw, title, ref_ }) => {
  const blocks = fw.outline;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 18, alignItems: "stretch" }}>
      {/* Sermon summary */}
      <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
        <FrameworkBadge framework={fw.id} />
        <h2 className="display" style={{
          margin: 0,
          font: "600 26px/1.2 var(--font-display)",
          letterSpacing: "-0.015em",
        }}>
          {title || <span style={{ color: "var(--muted)" }}>Manuscrito sem título</span>}
        </h2>
        <span className="mono" style={{ color: "var(--gold)", fontSize: 13, letterSpacing: 0.2 }}>
          {ref_ || ","}
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ paddingTop: 14, borderTop: "1px dashed var(--whisper-strong)" }}>
          <div className="eyebrow eyebrow-tight" style={{ color: "var(--muted)" }}>Framework</div>
          <p style={{ margin: "8px 0 0", color: "var(--prose)", fontSize: 13.5, lineHeight: 1.55 }}>
            {fw.description}
          </p>
        </div>
      </div>

      {/* Outline blocks */}
      <div className="card" style={{ padding: "22px 24px 24px" }}>
        <div className="eyebrow" style={{ color: "var(--muted)", marginBottom: 14 }}>
          Blocos iniciais ({blocks.length})
        </div>
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
          {blocks.map((b, i) => {
            const bt = window.VOX_DATA.BLOCK_TYPES[b];
            return (
              <li key={i} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 14px",
                background: bt?.accent || "transparent",
                border: "1px solid var(--whisper)",
                borderRadius: 8,
                borderLeft: "3px solid " + (bt?.color || "var(--muted)"),
              }}>
                <span className="mono" style={{
                  width: 22,
                  fontSize: 11.5,
                  color: "var(--muted)",
                }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{
                  fontWeight: 500,
                  fontSize: 13.5,
                  color: "var(--ink)",
                  flex: 1,
                }}>{b}</span>
                <span style={{
                  fontSize: 11.5,
                  color: bt?.color || "var(--muted)",
                  opacity: 0.85,
                }}>vazio</span>
              </li>
            );
          })}
        </ol>
        <div style={{
          marginTop: 12,
          padding: "10px 14px",
          background: "var(--forest-soft)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "var(--forest)",
          fontSize: 12.5,
        }}>
          <VoxIcon name="spark" className="icon-sm" />
          O VOX pode pré-preencher Contexto e Texto Bíblico a partir da referência informada.
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { NewSermon });
