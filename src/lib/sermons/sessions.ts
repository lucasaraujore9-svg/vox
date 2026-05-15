// Modelo de duas camadas: Sermão → Sessões → Itens.
// O `sermons.content` (jsonb) passa a guardar { sessions: SessionNode[] }.
// Nada é obrigatório — frameworks só sugerem o que cada papel costuma ter.

import type { BlockTypeId } from "@/lib/mocks/blocks";
import type { FrameworkId } from "@/lib/mocks/frameworks";

export type SessionRole = "introducao" | "topico" | "conclusao" | "livre";

export interface SessionItem {
  id: string;
  type: BlockTypeId;
  /** TipTap HTML ou texto simples */
  content: string;
  order: number;
}

export interface SessionNode {
  id: string;
  title: string;
  role: SessionRole;
  order: number;
  items: SessionItem[];
}

export interface SermonContent {
  sessions: SessionNode[];
}

/**
 * Esqueleto inicial — o que cada framework cria quando o sermão nasce.
 * Cada entrada vira uma sessão com itens já presentes (em branco).
 */
type SkeletonSession = {
  title: string;
  role: SessionRole;
  items: BlockTypeId[];
};

export const FRAMEWORK_SKELETONS: Record<FrameworkId, SkeletonSession[]> = {
  expositivo: [
    {
      title: "Introdução",
      role: "introducao",
      items: ["texto_biblico", "contexto", "introducao"],
    },
    {
      title: "Ponto 1",
      role: "topico",
      items: ["ponto_principal", "subponto", "aplicacao"],
    },
    {
      title: "Ponto 2",
      role: "topico",
      items: ["ponto_principal", "subponto", "aplicacao"],
    },
    {
      title: "Ponto 3",
      role: "topico",
      items: ["ponto_principal", "subponto", "aplicacao"],
    },
    {
      title: "Conclusão",
      role: "conclusao",
      items: ["conclusao", "oracao"],
    },
  ],
  textual: [
    {
      title: "Introdução",
      role: "introducao",
      items: ["texto_biblico", "introducao"],
    },
    {
      title: "Ponto 1",
      role: "topico",
      items: ["ponto_principal", "subponto"],
    },
    {
      title: "Ponto 2",
      role: "topico",
      items: ["ponto_principal", "subponto"],
    },
    {
      title: "Aplicação",
      role: "topico",
      items: ["aplicacao"],
    },
    {
      title: "Conclusão",
      role: "conclusao",
      items: ["conclusao"],
    },
  ],
  narrativo: [
    {
      title: "Cenário",
      role: "introducao",
      items: ["texto_biblico", "contexto"],
    },
    {
      title: "Tensão",
      role: "topico",
      items: ["ponto_principal", "ilustracao"],
    },
    {
      title: "Reviravolta",
      role: "topico",
      items: ["ponto_principal", "ilustracao"],
    },
    {
      title: "Aplicação",
      role: "topico",
      items: ["aplicacao"],
    },
    {
      title: "Conclusão",
      role: "conclusao",
      items: ["conclusao"],
    },
  ],
  tematico: [
    {
      title: "Introdução",
      role: "introducao",
      items: ["introducao", "pergunta_retorica"],
    },
    {
      title: "Voz 1",
      role: "topico",
      items: ["texto_biblico", "ponto_principal"],
    },
    {
      title: "Voz 2",
      role: "topico",
      items: ["texto_biblico", "ponto_principal"],
    },
    {
      title: "Aplicação",
      role: "topico",
      items: ["aplicacao", "pergunta_retorica"],
    },
    {
      title: "Conclusão",
      role: "conclusao",
      items: ["conclusao"],
    },
  ],
  topico: [
    {
      title: "Introdução",
      role: "introducao",
      items: ["introducao", "pergunta_retorica"],
    },
    {
      title: "Ponto 1",
      role: "topico",
      items: ["texto_biblico", "ponto_principal", "ilustracao"],
    },
    {
      title: "Ponto 2",
      role: "topico",
      items: ["texto_biblico", "ponto_principal", "ilustracao"],
    },
    {
      title: "Aplicação",
      role: "topico",
      items: ["aplicacao"],
    },
    {
      title: "Conclusão",
      role: "conclusao",
      items: ["conclusao"],
    },
  ],
  livre: [
    {
      title: "Notas",
      role: "livre",
      items: ["notas_pessoais"],
    },
  ],
};

/**
 * Sugestões por papel de sessão. Informativo — nada é obrigatório.
 * Editor mostra ✓ presente, • ausente. Itens fora desta lista são exibidos
 * como "extra", sem marcar como erro.
 */
export const SESSION_SUGGESTIONS: Record<FrameworkId, Record<SessionRole, BlockTypeId[]>> = {
  expositivo: {
    introducao: ["texto_biblico", "contexto", "introducao"],
    topico: ["ponto_principal", "subponto", "ilustracao", "aplicacao"],
    conclusao: ["conclusao", "oracao"],
    livre: [],
  },
  textual: {
    introducao: ["texto_biblico", "introducao"],
    topico: ["ponto_principal", "subponto", "aplicacao"],
    conclusao: ["conclusao"],
    livre: [],
  },
  narrativo: {
    introducao: ["texto_biblico", "contexto"],
    topico: ["ponto_principal", "ilustracao", "aplicacao"],
    conclusao: ["conclusao"],
    livre: [],
  },
  tematico: {
    introducao: ["introducao", "pergunta_retorica"],
    topico: ["texto_biblico", "ponto_principal", "aplicacao"],
    conclusao: ["conclusao"],
    livre: [],
  },
  topico: {
    introducao: ["introducao", "pergunta_retorica"],
    topico: ["texto_biblico", "ponto_principal", "ilustracao", "aplicacao"],
    conclusao: ["conclusao"],
    livre: [],
  },
  livre: {
    introducao: [],
    topico: [],
    conclusao: [],
    livre: [],
  },
};

/** Cria o conteúdo inicial de um sermão a partir do framework escolhido. */
export function emptyContentFor(framework: FrameworkId): SermonContent {
  const skeleton = FRAMEWORK_SKELETONS[framework];
  return {
    sessions: skeleton.map((s, sIdx) => ({
      id: cryptoRandomId(),
      title: s.title,
      role: s.role,
      order: sIdx + 1,
      items: s.items.map((type, iIdx) => ({
        id: cryptoRandomId(),
        type,
        content: "",
        order: iIdx + 1,
      })),
    })),
  };
}

/** Type-guard tolerante: aceita conteúdo legado (array plano de itens). */
export function parseSermonContent(
  raw: unknown,
  framework: FrameworkId
): SermonContent {
  if (raw && typeof raw === "object" && "sessions" in raw) {
    const sessions = (raw as { sessions: unknown }).sessions;
    if (Array.isArray(sessions)) {
      return { sessions: sessions as SessionNode[] };
    }
  }
  // Conteúdo legado (array plano) → embrulha em uma única sessão "livre"
  if (Array.isArray(raw)) {
    return {
      sessions: [
        {
          id: cryptoRandomId(),
          title: "Notas importadas",
          role: "livre",
          order: 1,
          items: raw.map((item, idx) => ({
            id: cryptoRandomId(),
            type:
              typeof (item as { type?: unknown }).type === "string"
                ? ((item as { type: BlockTypeId }).type)
                : "notas_pessoais",
            content:
              typeof (item as { content?: unknown }).content === "string"
                ? (item as { content: string }).content
                : "",
            order: idx + 1,
          })),
        },
      ],
    };
  }
  return emptyContentFor(framework);
}

/**
 * Avalia uma sessão contra as sugestões do framework.
 * Retorna o que está presente, o que falta (sugerido mas ausente) e o que
 * é "extra" (presente mas não previsto pelo framework).
 */
export interface SessionAdvice {
  present: BlockTypeId[];
  missing: BlockTypeId[];
  extra: BlockTypeId[];
}

export function adviseSession(
  session: SessionNode,
  framework: FrameworkId
): SessionAdvice {
  const suggested = SESSION_SUGGESTIONS[framework][session.role] ?? [];
  const presentSet = new Set(session.items.map((i) => i.type));
  const present = suggested.filter((id) => presentSet.has(id));
  const missing = suggested.filter((id) => !presentSet.has(id));
  const extra = Array.from(presentSet).filter(
    (id) => !suggested.includes(id) && id !== "notas_pessoais"
  );
  return { present, missing, extra };
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 12);
}

/** Para o modo apresentação: descobre o primeiro item do próximo tópico. */
export function nextSessionPeek(
  sessions: SessionNode[],
  currentIndex: number
): { title: string; firstItemType: BlockTypeId | null; firstItemContent: string } | null {
  const next = sessions[currentIndex + 1];
  if (!next) return null;
  const firstItem = next.items[0] ?? null;
  return {
    title: next.title,
    firstItemType: firstItem?.type ?? null,
    firstItemContent: firstItem?.content ?? "",
  };
}
