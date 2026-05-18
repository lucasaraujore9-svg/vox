// Parser leve de HTML do TipTap em parágrafos com runs formatados.
// Server-side: sem DOMParser. Cobre apenas as tags emitidas pelo editor:
//   <p>, <br>, <strong>/<b>, <em>/<i>, <u>, <s>, <h2>, <blockquote>,
//   <ul>/<ol>/<li>, <a href>.
//
// Não é HTML completo, é o subconjunto que o editor produz. Para uso só
// nos builders de PDF/DOCX (rota /api/sermons/export).

export interface Run {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  /** Link href, se vier num <a>. Renderizado como texto sublinhado azul. */
  href?: string;
}

export type ParaKind = "p" | "h2" | "quote" | "li-bullet" | "li-num";

export interface Para {
  kind: ParaKind;
  runs: Run[];
  /** Profundidade de nesting de lista (0 = nível 1). */
  depth?: number;
}

interface ParseState {
  bold: number;
  italic: number;
  underline: number;
  strike: number;
  href: string | null;
}

const VOID_TAGS = new Set(["br", "hr", "img"]);

/** Decodifica entidades HTML básicas. */
function decode(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

/** Une espaços múltiplos sem cortar finais (whitespace handling do navegador). */
function squashSpaces(text: string): string {
  return text.replace(/\s+/g, " ");
}

export function htmlToParas(html: string): Para[] {
  if (!html || !html.trim()) return [];
  const tokens = tokenize(html);
  const out: Para[] = [];
  // Pilha de paragrafos abertos (block-level)
  const stack: Array<{ kind: ParaKind; depth: number; closed: boolean }> = [];
  // Lista atual (ul/ol), afeta o "kind" dos <li>
  const listStack: Array<"bullet" | "num"> = [];
  const state: ParseState = {
    bold: 0,
    italic: 0,
    underline: 0,
    strike: 0,
    href: null,
  };

  let currentRuns: Run[] = [];
  let currentKind: ParaKind | null = null;
  let currentDepth = 0;

  function flushPara() {
    if (currentKind === null) return;
    // Remove runs vazios.
    const cleaned = currentRuns
      .map((r) => ({ ...r, text: r.text }))
      .filter((r) => r.text.length > 0);
    if (cleaned.length > 0) {
      out.push({ kind: currentKind, runs: cleaned, depth: currentDepth });
    }
    currentRuns = [];
    currentKind = null;
    currentDepth = 0;
  }

  function startPara(kind: ParaKind, depth = 0) {
    flushPara();
    currentKind = kind;
    currentDepth = depth;
  }

  function pushText(raw: string) {
    if (!raw) return;
    const text = squashSpaces(decode(raw));
    if (!text.trim() && currentRuns.length === 0) return;
    if (currentKind === null) {
      currentKind = "p"; // fallback
    }
    currentRuns.push({
      text,
      bold: state.bold > 0 || undefined,
      italic: state.italic > 0 || undefined,
      underline: state.underline > 0 || undefined,
      strike: state.strike > 0 || undefined,
      ...(state.href ? { href: state.href } : {}),
    });
  }

  for (const tok of tokens) {
    if (tok.kind === "text") {
      pushText(tok.value);
      continue;
    }
    const name = tok.name;
    if (tok.kind === "open") {
      switch (name) {
        case "p":
          startPara("p");
          break;
        case "h1":
        case "h2":
        case "h3":
          startPara("h2");
          break;
        case "blockquote":
          startPara("quote");
          break;
        case "ul":
          listStack.push("bullet");
          break;
        case "ol":
          listStack.push("num");
          break;
        case "li": {
          const kind: ParaKind =
            listStack[listStack.length - 1] === "num" ? "li-num" : "li-bullet";
          startPara(kind, Math.max(0, listStack.length - 1));
          break;
        }
        case "strong":
        case "b":
          state.bold++;
          break;
        case "em":
        case "i":
          state.italic++;
          break;
        case "u":
          state.underline++;
          break;
        case "s":
        case "strike":
        case "del":
          state.strike++;
          break;
        case "a":
          state.href = tok.attrs.href ?? null;
          break;
        case "span":
          // Span sem semântica, não muda formatação.
          break;
        default:
          // Outras tags abertas: ignora silenciosamente.
          break;
      }
      stack.push({ kind: currentKind ?? "p", depth: currentDepth, closed: false });
    } else if (tok.kind === "close") {
      switch (name) {
        case "p":
        case "h1":
        case "h2":
        case "h3":
        case "blockquote":
        case "li":
          flushPara();
          break;
        case "ul":
        case "ol":
          listStack.pop();
          break;
        case "strong":
        case "b":
          state.bold = Math.max(0, state.bold - 1);
          break;
        case "em":
        case "i":
          state.italic = Math.max(0, state.italic - 1);
          break;
        case "u":
          state.underline = Math.max(0, state.underline - 1);
          break;
        case "s":
        case "strike":
        case "del":
          state.strike = Math.max(0, state.strike - 1);
          break;
        case "a":
          state.href = null;
          break;
        default:
          break;
      }
      stack.pop();
    } else if (tok.kind === "void") {
      if (name === "br") {
        // Quebra dentro do parágrafo atual, adiciona run de \n.
        if (currentKind === null) currentKind = "p";
        currentRuns.push({ text: "\n" });
      }
    }
  }
  flushPara();
  return out;
}

// --- Tokenizer minimalista ---
type Token =
  | { kind: "text"; value: string }
  | { kind: "open"; name: string; attrs: Record<string, string> }
  | { kind: "close"; name: string }
  | { kind: "void"; name: string; attrs: Record<string, string> };

function tokenize(html: string): Token[] {
  const out: Token[] = [];
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*?)\/?\s*>/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const before = html.slice(lastIndex, m.index);
    if (before) out.push({ kind: "text", value: before });
    const full = m[0];
    const name = (m[1] ?? "").toLowerCase();
    const isClose = full.startsWith("</");
    const isSelfClosing = full.endsWith("/>");
    const attrsRaw = m[2] ?? "";
    const attrs = parseAttrs(attrsRaw);
    if (isClose) {
      out.push({ kind: "close", name });
    } else if (VOID_TAGS.has(name) || isSelfClosing) {
      out.push({ kind: "void", name, attrs });
    } else {
      out.push({ kind: "open", name, attrs });
    }
    lastIndex = re.lastIndex;
  }
  const tail = html.slice(lastIndex);
  if (tail) out.push({ kind: "text", value: tail });
  return out;
}

function parseAttrs(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const key = (m[1] ?? "").toLowerCase();
    const val = m[2] ?? m[3] ?? m[4] ?? "";
    if (key) out[key] = val;
  }
  return out;
}
