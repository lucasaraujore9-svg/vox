// Modelo de duas camadas: Sermão → Sessões → Itens.
// O `sermons.content` (jsonb) passa a guardar { sessions: SessionNode[] }.
// Nada é obrigatório — frameworks só sugerem o que cada papel costuma ter.

import type { BlockTypeId } from "@/lib/mocks/blocks";
import type { FrameworkId } from "@/lib/mocks/frameworks";
import { principle } from "@/lib/sermons/preaching-principles";

export type SessionRole = "introducao" | "topico" | "conclusao" | "livre";

export interface SessionItem {
  id: string;
  type: BlockTypeId;
  /** TipTap HTML ou texto simples */
  content: string;
  order: number;
  /** Rótulo específico do framework (ex: "O Gancho", "Argumento", "Clímax").
      Quando presente, substitui o label padrão do BlockType na UI do editor. */
  label?: string;
  /** Placeholder específico do framework, mostrado dentro do editor quando vazio. */
  hint?: string;
  /** Dica pedagógica expandida (mostrada em popover de ajuda). Para iniciantes. */
  tip?: string;
  /** Referências bíblicas (canônico) cujo hint foi dispensado ou inserido pelo
      usuário. Persistido junto com o item — não reaparece após reload. Só
      "renasce" quando a ref some do texto e volta a ser digitada. */
  dismissedRefs?: string[];
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
 * Cada item carrega o tipo de bloco subjacente + rótulo idiomático do
 * framework + hint que aparece como placeholder dentro do editor.
 */
type SkeletonItem = {
  type: BlockTypeId;
  /** Rótulo do framework (ex: "O Gancho"). Substitui o label padrão do tipo. */
  label?: string;
  /** Placeholder dentro do editor pra esse passo específico. */
  hint?: string;
  /** Dica pedagógica expandida (popover de ajuda) — voltada a iniciantes. */
  tip?: string;
};

type SkeletonSession = {
  title: string;
  role: SessionRole;
  items: SkeletonItem[];
};

export const FRAMEWORK_SKELETONS: Record<FrameworkId, SkeletonSession[]> = {
  // -------------------- EXPOSITIVO --------------------
  // Verso a verso, fiel ao texto. Estrutura clássica reformada:
  // introdução com gancho/contexto/big idea, 3 pontos (explicação +
  // aplicação) e conclusão com síntese/Cristo/apelo.
  expositivo: [
    {
      title: "Introdução",
      role: "introducao",
      items: [
        principle("hook", "ilustracao"),
        principle("baseText", "texto_biblico"),
        principle("historicalContext", "contexto"),
        principle("audienceConnection", "introducao"),
        principle("bigIdea", "proposicao"),
      ],
    },
    {
      title: "Ponto 1",
      role: "topico",
      items: [
        principle("mainPoint", "ponto_principal"),
        principle("explanation", "subponto"),
        principle("illustration", "ilustracao"),
        principle("application", "aplicacao"),
        principle("transition", "transicao"),
      ],
    },
    {
      title: "Ponto 2",
      role: "topico",
      items: [
        principle("mainPoint", "ponto_principal"),
        principle("explanation", "subponto"),
        principle("illustration", "ilustracao"),
        principle("application", "aplicacao"),
        principle("transition", "transicao"),
      ],
    },
    {
      title: "Ponto 3",
      role: "topico",
      items: [
        principle("mainPoint", "ponto_principal"),
        principle("explanation", "subponto"),
        principle("illustration", "ilustracao"),
        principle("application", "aplicacao"),
      ],
    },
    {
      title: "Conclusão",
      role: "conclusao",
      items: [
        principle("summary", "conclusao"),
        principle("gospelConnection", "desenvolvimento"),
        principle("altarCall", "aplicacao"),
        principle("prayer", "oracao"),
      ],
    },
  ],

  // -------------------- TEXTUAL --------------------
  // Um texto curto (verso ou parágrafo), destrinchado pela própria
  // gramática. Menos pontos, mais foco numa única afirmação.
  textual: [
    {
      title: "Introdução",
      role: "introducao",
      items: [
        principle("hook", "ilustracao"),
        principle("rhetoricalQuestion", "pergunta_retorica"),
        principle("baseText", "texto_biblico"),
        principle("bigIdea", "proposicao"),
      ],
    },
    {
      title: "Ponto 1",
      role: "topico",
      items: [
        principle("mainPoint", "ponto_principal"),
        principle("explanation", "subponto"),
        principle("application", "aplicacao"),
        principle("transition", "transicao"),
      ],
    },
    {
      title: "Ponto 2",
      role: "topico",
      items: [
        principle("mainPoint", "ponto_principal"),
        principle("explanation", "subponto"),
        principle("application", "aplicacao"),
      ],
    },
    {
      title: "Conclusão",
      role: "conclusao",
      items: [
        principle("summary", "conclusao"),
        principle("gospelConnection", "desenvolvimento"),
        principle("altarCall", "aplicacao"),
        principle("prayer", "oracao"),
      ],
    },
  ],

  // -------------------- NARRATIVO --------------------
  // A história bíblica conduz. Cenário, tensão, reviravolta — depois
  // identificação e apelo. O ouvinte entra na cena antes da aplicação.
  narrativo: [
    {
      title: "Abertura",
      role: "introducao",
      items: [
        principle("hook", "ilustracao"),
        principle("baseText", "texto_biblico"),
      ],
    },
    {
      title: "Cenário",
      role: "topico",
      items: [
        principle("scene", "contexto"),
        principle("audienceConnection", "introducao"),
      ],
    },
    {
      title: "Tensão",
      role: "topico",
      items: [
        principle("tension", "ponto_principal"),
        principle("illustration", "ilustracao"),
        principle("transition", "transicao"),
      ],
    },
    {
      title: "Reviravolta",
      role: "topico",
      items: [
        principle("turn", "ponto_principal"),
        principle("gospelConnection", "desenvolvimento"),
      ],
    },
    {
      title: "Aplicação",
      role: "topico",
      items: [
        principle("application", "aplicacao"),
      ],
    },
    {
      title: "Conclusão",
      role: "conclusao",
      items: [
        principle("summary", "conclusao"),
        principle("altarCall", "aplicacao"),
        principle("prayer", "oracao"),
      ],
    },
  ],

  // -------------------- TEMÁTICO --------------------
  // Um tema bíblico iluminado por várias passagens convergentes.
  // Introdução estabelece o tema; pontos exploram facetas diferentes.
  tematico: [
    {
      title: "Introdução",
      role: "introducao",
      items: [
        principle("hook", "ilustracao"),
        principle("theme", "proposicao"),
        principle("baseText", "texto_biblico"),
        principle("audienceConnection", "introducao"),
        principle("bigIdea", "proposicao"),
      ],
    },
    {
      title: "Tópico 1",
      role: "topico",
      items: [
        principle("mainPoint", "ponto_principal"),
        principle("baseText", "texto_biblico"),
        principle("explanation", "desenvolvimento"),
        principle("illustration", "ilustracao"),
        principle("application", "aplicacao"),
        principle("transition", "transicao"),
      ],
    },
    {
      title: "Tópico 2",
      role: "topico",
      items: [
        principle("mainPoint", "ponto_principal"),
        principle("baseText", "texto_biblico"),
        principle("explanation", "desenvolvimento"),
        principle("illustration", "ilustracao"),
        principle("application", "aplicacao"),
        principle("transition", "transicao"),
      ],
    },
    {
      title: "Tópico 3",
      role: "topico",
      items: [
        principle("mainPoint", "ponto_principal"),
        principle("baseText", "texto_biblico"),
        principle("explanation", "desenvolvimento"),
        principle("illustration", "ilustracao"),
        principle("application", "aplicacao"),
      ],
    },
    {
      title: "Conclusão",
      role: "conclusao",
      items: [
        principle("summary", "conclusao"),
        principle("gospelConnection", "desenvolvimento"),
        principle("altarCall", "aplicacao"),
        principle("prayer", "oracao"),
      ],
    },
  ],

  // -------------------- TÓPICO --------------------
  // Tópico contemporâneo confrontado pela Escritura. Começa pelo
  // problema da congregação, mostra a resposta bíblica em pontos.
  topico: [
    {
      title: "Introdução",
      role: "introducao",
      items: [
        principle("hook", "ilustracao"),
        principle("problem", "introducao"),
        principle("rhetoricalQuestion", "pergunta_retorica"),
        principle("bigIdea", "proposicao"),
      ],
    },
    {
      title: "Ponto 1",
      role: "topico",
      items: [
        principle("baseText", "texto_biblico"),
        principle("mainPoint", "ponto_principal"),
        principle("explanation", "desenvolvimento"),
        principle("illustration", "ilustracao"),
        principle("application", "aplicacao"),
        principle("transition", "transicao"),
      ],
    },
    {
      title: "Ponto 2",
      role: "topico",
      items: [
        principle("baseText", "texto_biblico"),
        principle("mainPoint", "ponto_principal"),
        principle("explanation", "desenvolvimento"),
        principle("illustration", "ilustracao"),
        principle("application", "aplicacao"),
      ],
    },
    {
      title: "Conclusão",
      role: "conclusao",
      items: [
        principle("summary", "conclusao"),
        principle("gospelConnection", "desenvolvimento"),
        principle("altarCall", "aplicacao"),
        principle("prayer", "oracao"),
      ],
    },
  ],

  // -------------------- LIVRE --------------------
  livre: [
    {
      // Folha em branco: sem título inicial, item único de texto livre.
      title: "",
      role: "livre",
      items: [{ type: "notas_pessoais" }],
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
      items: s.items.map((item, iIdx) => ({
        id: cryptoRandomId(),
        type: item.type,
        content: "",
        order: iIdx + 1,
        ...(item.label ? { label: item.label } : {}),
        ...(item.hint ? { hint: item.hint } : {}),
        ...(item.tip ? { tip: item.tip } : {}),
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
  // Conteúdo legado (array plano) → embrulha em uma única sessão "livre".
  // Array vazio (default '[]'::jsonb do banco para sermões recém-criados)
  // não conta como legado: devolve o esqueleto do framework.
  if (Array.isArray(raw)) {
    if (raw.length === 0) return emptyContentFor(framework);
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
