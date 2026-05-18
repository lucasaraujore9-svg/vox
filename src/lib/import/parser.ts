// Issue 034, Conversor de .docx ou texto livre em estrutura SermonContent.
// Suporta dois formatos:
//   1) ESTRUTURADO via tags VOX (preferido — mais fiel):
//        ## Introdução
//        @texto_biblico
//        Romanos 5:1-11
//        @introducao
//        Conteúdo...
//      Detectado quando o texto contém qualquer "## sessão" ou "@bloco".
//   2) LIVRE: heurística que detecta cabeçalhos comuns (introdução, ponto,
//      aplicação…) e agrupa em sessões. Fallback para arquivos antigos.

import { VOX_BLOCK_TYPES, type BlockTypeId } from "@/lib/mocks/blocks";
import type {
  SermonContent,
  SessionNode,
  SessionRole,
  SessionItem,
} from "@/lib/sermons/sessions";
import type { FrameworkId } from "@/lib/mocks/frameworks";

/** Conjunto fechado de tipos válidos pra validação de tags `@tipo`. */
const VALID_BLOCK_TYPES = new Set<BlockTypeId>(
  VOX_BLOCK_TYPES.map((b) => b.id)
);

const SESSION_TAG_RE = /^##\s+(.+?)\s*$/;
const BLOCK_TAG_RE = /^@([a-z_]+)\b\s*(.*)$/i;
// Comentário: `// algo` ou linha começando com um único `#` (mas não `##`).
const COMMENT_RE = /^\s*(?:\/\/.*|#(?!#).*)$/;

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

/** Retorna true se o texto tem ao menos uma tag VOX (`## sessão` ou `@bloco`). */
export function hasStructuredTags(raw: string): boolean {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  for (const line of lines) {
    if (COMMENT_RE.test(line)) continue;
    if (SESSION_TAG_RE.test(line)) return true;
    if (BLOCK_TAG_RE.test(line)) return true;
  }
  return false;
}

/** Limpa prefixos redundantes do título da sessão ("Introdução: …", "Tópico: …"). */
function cleanSessionTitle(raw: string): string {
  const stripped = raw
    .replace(/^(t[oó]pico|introdu[çc][aã]o|conclus[aã]o)\s*[:\-—]\s*/i, "")
    .trim();
  return stripped || raw.trim();
}

/**
 * Converte texto com tags VOX em SermonContent. Linhas reconhecidas:
 *   - `## Título`           → abre nova sessão (role inferido pelo título)
 *   - `@tipo_de_bloco`      → abre novo bloco até a próxima tag
 *   - `@tipo conteúdo`      → bloco em uma linha (conteúdo logo após a tag)
 *   - `// …` ou `# …`       → comentário (ignorado)
 *   - qualquer outra coisa  → conteúdo do bloco corrente
 *
 * Tags `@xxx` com tipo desconhecido viram `notas_pessoais`.
 */
export function parseTaggedTextToContent(raw: string): SermonContent {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");

  const sessions: SessionNode[] = [];
  let currentSession: SessionNode | null = null;
  let currentBlockType: BlockTypeId | null = null;
  let currentBlockLines: string[] = [];

  const flushBlock = () => {
    if (!currentBlockType || !currentSession) {
      currentBlockType = null;
      currentBlockLines = [];
      return;
    }
    const content = currentBlockLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (content) {
      const item: SessionItem = {
        id: newId(),
        type: currentBlockType,
        content,
        order: currentSession.items.length + 1,
      };
      currentSession.items.push(item);
    }
    currentBlockType = null;
    currentBlockLines = [];
  };

  const openSession = (title: string): SessionNode => {
    flushBlock();
    const role = classifyRole(title);
    const cleanTitle = cleanSessionTitle(title) || `Sessão ${sessions.length + 1}`;
    const node: SessionNode = {
      id: newId(),
      title: cleanTitle,
      role,
      order: sessions.length + 1,
      items: [],
    };
    sessions.push(node);
    currentSession = node;
    return node;
  };

  for (const line of lines) {
    if (COMMENT_RE.test(line)) continue;

    const sessionMatch = SESSION_TAG_RE.exec(line);
    if (sessionMatch) {
      openSession(sessionMatch[1] ?? "");
      continue;
    }

    const blockMatch = BLOCK_TAG_RE.exec(line);
    if (blockMatch) {
      flushBlock();
      const tag = (blockMatch[1] ?? "").toLowerCase() as BlockTypeId;
      const type: BlockTypeId = VALID_BLOCK_TYPES.has(tag) ? tag : "notas_pessoais";
      if (!currentSession) openSession("Introdução");
      currentBlockType = type;
      const inline = (blockMatch[2] ?? "").trim();
      if (inline) currentBlockLines.push(inline);
      continue;
    }

    // Conteúdo solto antes do primeiro `@` — só vira item se houver sessão e
    // bloco corrente; do contrário ignora pra não criar lixo.
    if (currentBlockType) {
      currentBlockLines.push(line);
    }
  }
  flushBlock();

  return { sessions };
}

/**
 * Converte texto puro em SermonContent (estrutura usada pelo editor).
 * Se detectar tags VOX, usa o parser estruturado; caso contrário, cai na
 * heurística antiga (cabeçalhos comuns + agrupamento por tópicos).
 */
export function parseTextToContent(
  raw: string,
  _framework: FrameworkId
): SermonContent {
  if (hasStructuredTags(raw)) {
    return parseTaggedTextToContent(raw);
  }
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
