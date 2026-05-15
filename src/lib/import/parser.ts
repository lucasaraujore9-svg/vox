// Issue 034 — Conversor de .docx ou texto livre em blocos do editor.
// Heurística simples: títulos viram blocos, parágrafos curtos viram conteúdo do bloco.

import type { BlockTypeId } from "@/lib/mocks/blocks";

export interface ImportedBlock {
  type: BlockTypeId;
  title: string;
  content: string;
  order: number;
}

const HEADING_HINTS: Array<{ pattern: RegExp; type: BlockTypeId }> = [
  { pattern: /^(introdu[çc][aã]o|abertura)/i, type: "introducao" },
  { pattern: /^contexto/i, type: "contexto" },
  { pattern: /^proposi[çc][aã]o/i, type: "proposicao" },
  { pattern: /^(ponto\s*principal|ponto\s*\d|1\.|2\.|3\.)/i, type: "ponto_principal" },
  { pattern: /^subponto/i, type: "subponto" },
  { pattern: /^ilustra[çc][aã]o/i, type: "ilustracao" },
  { pattern: /^aplica[çc][aã]o/i, type: "aplicacao" },
  { pattern: /^cita[çc][aã]o/i, type: "citacao" },
  { pattern: /^conclus[aã]o/i, type: "conclusao" },
  { pattern: /^ora[çc][aã]o/i, type: "oracao" },
  { pattern: /^(texto|leitura|passagem|escritura)/i, type: "texto_biblico" },
];

function guessBlockType(heading: string): BlockTypeId {
  for (const hint of HEADING_HINTS) {
    if (hint.pattern.test(heading.trim())) return hint.type;
  }
  return "ponto_principal";
}

/** Texto puro → blocos (assume parágrafos separados por linha em branco). */
export function parsePlainText(raw: string): ImportedBlock[] {
  const chunks = raw
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (chunks.length === 0) return [];

  // Se o primeiro parágrafo for curto, tratamos como "intro"; senão tudo vira "livre"
  const blocks: ImportedBlock[] = [];
  let order = 1;
  for (const chunk of chunks) {
    const firstLine = chunk.split("\n")[0]?.trim() ?? "";
    // Heurística: linha curta sem ponto final → heading
    if (firstLine.length <= 60 && !firstLine.endsWith(".")) {
      const lines = chunk.split("\n");
      const content = lines.slice(1).join("\n").trim();
      blocks.push({
        type: guessBlockType(firstLine),
        title: firstLine,
        content,
        order: order++,
      });
    } else {
      blocks.push({
        type: "notas_pessoais",
        title: "Parágrafo importado",
        content: chunk,
        order: order++,
      });
    }
  }
  return blocks;
}

/** .docx (ArrayBuffer) → blocos. Usa mammoth para converter em texto. */
export async function parseDocx(arrayBuffer: ArrayBuffer): Promise<ImportedBlock[]> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ arrayBuffer });
  return parsePlainText(result.value);
}
