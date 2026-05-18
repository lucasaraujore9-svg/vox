// Issue 034, Conversor de .docx ou texto livre em estrutura SermonContent.
// Heurística: títulos viram cabeçalhos de blocos; quebra natural em sessões
// (Introdução / Tópicos / Conclusão) baseada em pistas do cabeçalho.

import type { BlockTypeId } from "@/lib/mocks/blocks";
import type {
  SermonContent,
  SessionNode,
  SessionRole,
  SessionItem,
} from "@/lib/sermons/sessions";
import type { FrameworkId } from "@/lib/mocks/frameworks";

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
  { pattern: /^(ponto\s*principal|ponto\s*\d|\d+[.)]|[ivx]+[.)])/i, type: "ponto_principal" },
  { pattern: /^subponto/i, type: "subponto" },
  { pattern: /^ilustra[çc][aã]o/i, type: "ilustracao" },
  { pattern: /^aplica[çc][aã]o/i, type: "aplicacao" },
  { pattern: /^cita[çc][aã]o/i, type: "citacao" },
  { pattern: /^conclus[aã]o/i, type: "conclusao" },
  { pattern: /^(ora[çc][aã]o|prece)/i, type: "oracao" },
  { pattern: /^(texto|leitura|passagem|escritura|versícul)/i, type: "texto_biblico" },
];

function guessBlockType(heading: string): BlockTypeId {
  for (const hint of HEADING_HINTS) {
    if (hint.pattern.test(heading.trim())) return hint.type;
  }
  return "ponto_principal";
}

/** Classifica o cabeçalho de uma sessão em um dos papéis estruturais. */
function classifyRole(heading: string): SessionRole {
  const h = heading.trim().toLowerCase();
  if (/(introdu[çc][aã]o|abertura)/.test(h)) return "introducao";
  if (/(conclus[aã]o|encerramento|fechamento|ora[çc][aã]o final)/.test(h)) return "conclusao";
  return "topico";
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 12);
}

/** Texto puro → blocos planos (compatibilidade com formato legado). */
export function parsePlainText(raw: string): ImportedBlock[] {
  const chunks = raw
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (chunks.length === 0) return [];

  const blocks: ImportedBlock[] = [];
  let order = 1;
  for (const chunk of chunks) {
    const firstLine = chunk.split("\n")[0]?.trim() ?? "";
    // Heurística: linha curta sem ponto final → cabeçalho de bloco
    if (firstLine.length <= 80 && !firstLine.endsWith(".")) {
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

/**
 * Converte texto puro em SermonContent (estrutura usada pelo editor).
 * Agrupa blocos em sessões: tudo antes do primeiro tópico vira "Introdução";
 * tópicos sequenciais (ponto_principal etc.) iniciam novas sessões; o último
 * bloco com cara de fechamento vira "Conclusão".
 */
export function parseTextToContent(
  raw: string,
  _framework: FrameworkId
): SermonContent {
  const blocks = parsePlainText(raw);
  if (blocks.length === 0) {
    return { sessions: [] };
  }

  const sessions: SessionNode[] = [];
  let current: SessionNode | null = null;

  const startSession = (role: SessionRole, title: string): SessionNode => {
    const node: SessionNode = {
      id: newId(),
      title,
      role,
      order: sessions.length + 1,
      items: [],
    };
    sessions.push(node);
    return node;
  };

  const pushItem = (session: SessionNode, type: BlockTypeId, content: string) => {
    const item: SessionItem = {
      id: newId(),
      type,
      content,
      order: session.items.length + 1,
    };
    session.items.push(item);
  };

  for (const block of blocks) {
    const role = classifyRole(block.title);
    const isTopicHeader = block.type === "ponto_principal";

    // Decisão de quando abrir nova sessão:
    // - Cabeçalho de Introdução / Conclusão sempre cria sessão própria
    // - Ponto principal (1., 2., ponto 1…) inicia novo tópico
    // - Demais blocos entram na sessão corrente (ou abre "Introdução" se ainda não há nenhuma)
    if (role === "introducao" || role === "conclusao") {
      current = startSession(role, block.title);
      if (block.content) pushItem(current, block.type, block.content);
      continue;
    }

    if (isTopicHeader) {
      current = startSession("topico", block.title);
      if (block.content) pushItem(current, block.type, block.content);
      continue;
    }

    if (!current) {
      current = startSession("introducao", "Introdução");
    }

    // Bloco com título e conteúdo, guarda só o conteúdo como item
    // (o título já foi usado pra classificar; preservamos no content quando vazio)
    const itemContent = block.content || block.title;
    pushItem(current, block.type, itemContent);
  }

  return { sessions };
}

/** .docx (ArrayBuffer) → SermonContent. Usa mammoth para converter em texto. */
export async function parseDocxToContent(
  arrayBuffer: ArrayBuffer,
  framework: FrameworkId
): Promise<SermonContent> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ arrayBuffer });
  return parseTextToContent(result.value, framework);
}

/** Conta palavras em todo o conteúdo (sessions + items). */
export function countWords(content: SermonContent): number {
  let total = 0;
  for (const session of content.sessions) {
    total += session.title.split(/\s+/).filter(Boolean).length;
    for (const item of session.items) {
      total += item.content.split(/\s+/).filter(Boolean).length;
    }
  }
  return total;
}

// --- Mantidos por compatibilidade (versão antiga ainda usada em testes/migração) ---

/** @deprecated use parseDocxToContent */
export async function parseDocx(arrayBuffer: ArrayBuffer): Promise<ImportedBlock[]> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ arrayBuffer });
  return parsePlainText(result.value);
}
