// Renderizador minimal de Markdown para exegeses.
// Suporta: ## headings, parágrafos, listas com bullets (- ou *),
// *itálico* e **negrito**. Não interpreta HTML — strings são tratadas como texto.
// Suficiente pro output controlado do prompt de exegese (5 seções fixas).

import { Fragment } from "react";

interface Props {
  content: string;
}

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  // Tokeniza em segmentos com **negrito**, *itálico* e texto puro
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let i = 0;
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(remaining.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      tokens.push(<strong key={`${keyBase}-b-${i++}`}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      tokens.push(<em key={`${keyBase}-i-${i++}`}>{match[2]}</em>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < remaining.length) {
    tokens.push(remaining.slice(lastIndex));
  }
  return tokens;
}

export function ExegesisMarkdown({ content }: Props) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let paraBuffer: string[] = [];

  function flushList(idx: number) {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul
        key={`ul-${idx}`}
        className="my-3 space-y-2 list-disc pl-5 marker:text-vox-muted"
      >
        {listBuffer.map((item, i) => (
          <li key={i} className="text-[14px] leading-relaxed text-vox-prose">
            {renderInline(item, `li-${idx}-${i}`)}
          </li>
        ))}
      </ul>
    );
    listBuffer = [];
  }

  function flushPara(idx: number) {
    if (paraBuffer.length === 0) return;
    const text = paraBuffer.join(" ");
    blocks.push(
      <p
        key={`p-${idx}`}
        className="my-3 text-[14px] leading-relaxed text-vox-prose"
      >
        {renderInline(text, `p-${idx}`)}
      </p>
    );
    paraBuffer = [];
  }

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trimEnd();
    if (line.length === 0) {
      flushPara(idx);
      flushList(idx);
      return;
    }
    if (line.startsWith("## ")) {
      flushPara(idx);
      flushList(idx);
      const heading = line.slice(3).trim();
      blocks.push(
        <h3
          key={`h-${idx}`}
          className="vox-h3 mt-6 mb-2 text-[15px]"
          style={{ color: "var(--vox-forest)" }}
        >
          {heading}
        </h3>
      );
      return;
    }
    if (line.startsWith("# ")) {
      flushPara(idx);
      flushList(idx);
      blocks.push(
        <h2
          key={`h2-${idx}`}
          className="vox-h2 mt-6 mb-2 text-[18px] text-vox-ink"
        >
          {line.slice(2).trim()}
        </h2>
      );
      return;
    }
    if (/^[-*]\s+/.test(line)) {
      flushPara(idx);
      listBuffer.push(line.replace(/^[-*]\s+/, ""));
      return;
    }
    // parágrafo
    flushList(idx);
    paraBuffer.push(line);
  });

  flushPara(lines.length);
  flushList(lines.length);

  return <Fragment>{blocks}</Fragment>;
}
