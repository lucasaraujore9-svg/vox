// VOX, icons + small primitives. No emoji. Stroke-based, 1.6 width.
const VoxIcon = ({ name, className = "", size }) => {
  const cls = "icon " + className;
  const style = size ? { width: size, height: size } : undefined;
  const props = { className: cls, style, viewBox: "0 0 24 24", "aria-hidden": "true" };
  switch (name) {
    case "search":
      return (
        <svg {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      );
    case "plus":
      return (<svg {...props}><path d="M12 5v14M5 12h14" /></svg>);
    case "book":
      return (<svg {...props}><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5Z" /><path d="M4 5v14" /><path d="M9 8h6" /></svg>);
    case "draft":
      return (<svg {...props}><path d="M5 4h9l5 5v11H5z" /><path d="M14 4v5h5" /><path d="M9 14h7M9 17h5" /></svg>);
    case "present":
      return (<svg {...props}><rect x="3" y="4" width="18" height="12" rx="1.5" /><path d="M8 20h8M12 16v4" /></svg>);
    case "collection":
      return (<svg {...props}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>);
    case "calendar":
      return (<svg {...props}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>);
    case "settings":
      return (<svg {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>);
    case "filter":
      return (<svg {...props}><path d="M3 5h18M6 12h12M10 19h4" /></svg>);
    case "sort":
      return (<svg {...props}><path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" /></svg>);
    case "more":
      return (<svg {...props}><circle cx="12" cy="5.5" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="12" cy="18.5" r="1.4" /></svg>);
    case "edit":
      return (<svg {...props}><path d="M4 20h4l10-10-4-4L4 16v4Z" /><path d="m13 7 4 4" /></svg>);
    case "play":
      return (<svg {...props}><path d="M7 4v16l13-8z" /></svg>);
    case "check":
      return (<svg {...props}><path d="m5 12 5 5 9-11" /></svg>);
    case "arrow-right":
      return (<svg {...props}><path d="M5 12h14M13 5l7 7-7 7" /></svg>);
    case "arrow-left":
      return (<svg {...props}><path d="M19 12H5M11 5l-7 7 7 7" /></svg>);
    case "chevron-down":
      return (<svg {...props}><path d="m6 9 6 6 6-6" /></svg>);
    case "chevron-right":
      return (<svg {...props}><path d="m9 6 6 6-6 6" /></svg>);
    case "x":
      return (<svg {...props}><path d="M6 6l12 12M18 6 6 18" /></svg>);
    case "sidebar":
      return (<svg {...props}><rect x="3.5" y="4" width="17" height="16" rx="2" /><path d="M9 4v16" /></svg>);
    case "feather":
      return (<svg {...props}><path d="M20 4 9 15a4 4 0 0 0 0 5.7L20 9.5V4Z" /><path d="M16 8 4 20" /><path d="M9 15h6" /></svg>);
    case "circle":
      return (<svg {...props}><circle cx="12" cy="12" r="9" /></svg>);
    case "circle-fill":
      return (<svg {...props} fill="currentColor" stroke="none"><circle cx="12" cy="12" r="9" /></svg>);
    case "spark":
      return (<svg {...props}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.8 2.8M15.7 15.7l2.8 2.8M5.5 18.5l2.8-2.8M15.7 8.3l2.8-2.8" /></svg>);
    case "bookmark":
      return (<svg {...props}><path d="M6 4h12v17l-6-4-6 4z" /></svg>);
    case "type":
      return (<svg {...props}><path d="M5 6V4h14v2M9 20h6M12 4v16" /></svg>);
    case "history":
      return (<svg {...props}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 8v5l3 2" /></svg>);
    default:
      return null;
  }
};

// Wordmark, VOX in Fraunces with a small dot
const VoxMark = ({ size = 22, color = "var(--ink)", subtle = false }) => (
  <span
    className="display"
    style={{
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: size,
      letterSpacing: "0.02em",
      color,
      lineHeight: 1,
      display: "inline-flex",
      alignItems: "baseline",
      gap: 2,
    }}
  >
    VOX
    <span
      style={{
        display: "inline-block",
        width: 4, height: 4,
        borderRadius: "50%",
        background: subtle ? "var(--muted)" : "var(--forest)",
        transform: "translateY(-2px)",
      }}
    />
  </span>
);

// Framework badge
const FrameworkBadge = ({ framework, size = "md" }) => {
  const fw = window.VOX_DATA.FRAMEWORKS[framework];
  if (!fw) return null;
  const s = size === "sm"
    ? { height: 20, fontSize: 10.5, padding: "0 7px", gap: 5 }
    : { height: 24, fontSize: 11.5, padding: "0 9px", gap: 6 };
  return (
    <span
      style={{
        ...s,
        display: "inline-flex", alignItems: "center",
        borderRadius: 4,
        background: "color-mix(in oklab, " + fw.color + " 10%, transparent)",
        color: fw.color,
        fontFamily: "var(--font-ui)",
        fontWeight: 500,
        letterSpacing: 0.2,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: fw.color,
        boxShadow: "0 0 0 2px color-mix(in oklab, " + fw.color + " 18%, transparent)",
      }} />
      {fw.name}
    </span>
  );
};

const Status = ({ status }) => {
  const map = {
    published: { label: "Pregado", color: "var(--prose)", bg: "rgba(75,85,99,0.08)" },
    drafting: { label: "Em rascunho", color: "var(--forest)", bg: "var(--forest-soft)" },
    draft: { label: "Esboço", color: "var(--gold)", bg: "var(--gold-soft)" },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      height: 22, padding: "0 8px",
      borderRadius: 4,
      background: s.bg,
      color: s.color,
      fontSize: 11, fontWeight: 500, letterSpacing: 0.1,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
      {s.label}
    </span>
  );
};

// Shared kbd hint
const Kbd = ({ children }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    minWidth: 18, height: 18, padding: "0 5px",
    borderRadius: 4,
    background: "rgba(75,85,99,0.10)",
    color: "var(--prose)",
    fontFamily: "var(--font-mono)",
    fontSize: 11, lineHeight: 1,
  }}>{children}</span>
);

Object.assign(window, { VoxIcon, VoxMark, FrameworkBadge, Status, Kbd });
