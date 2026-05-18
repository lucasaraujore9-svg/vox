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
  /** Rótulo específico do framework (ex: "O Gancho", "Argumento", "Clímax").
      Quando presente, substitui o label padrão do BlockType na UI do editor. */
  label?: string;
  /** Placeholder específico do framework, mostrado dentro do editor quando vazio. */
  hint?: string;
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
};

type SkeletonSession = {
  title: string;
  role: SessionRole;
  items: SkeletonItem[];
};

export const FRAMEWORK_SKELETONS: Record<FrameworkId, SkeletonSession[]> = {
  expositivo: [
    {
      title: "Introdução",
      role: "introducao",
      items: [
        {
          type: "contexto",
          label: "Contexto histórico",
          hint: "Autor, audiência original, ocasião — o cenário em que o texto foi escrito.",
        },
        {
          type: "texto_biblico",
          label: "Texto base",
          hint: "Cole ou digite a passagem completa que vai expor.",
        },
        {
          type: "introducao",
          label: "Big Idea",
          hint: "Uma frase que captura a tese central do trecho.",
        },
      ],
    },
    {
      title: "Ponto 1",
      role: "topico",
      items: [
        { type: "ponto_principal", label: "Argumento do texto", hint: "O que esses versículos afirmam?" },
        { type: "subponto", label: "Explicação", hint: "Verso a verso — gramática, sintaxe, palavras-chave." },
        { type: "aplicacao", label: "Aplicação", hint: "O que isso pede da congregação hoje?" },
      ],
    },
    {
      title: "Ponto 2",
      role: "topico",
      items: [
        { type: "ponto_principal", label: "Argumento do texto", hint: "O que esses versículos afirmam?" },
        { type: "subponto", label: "Explicação", hint: "Verso a verso." },
        { type: "aplicacao", label: "Aplicação", hint: "Aplicação concreta." },
      ],
    },
    {
      title: "Ponto 3",
      role: "topico",
      items: [
        { type: "ponto_principal", label: "Argumento do texto", hint: "O que esses versículos afirmam?" },
        { type: "subponto", label: "Explicação", hint: "Verso a verso." },
        { type: "aplicacao", label: "Aplicação", hint: "Aplicação concreta." },
      ],
    },
    {
      title: "Conclusão",
      role: "conclusao",
      items: [
        { type: "conclusao", label: "Síntese", hint: "Recapitule a Big Idea com os 3 pontos." },
        { type: "aplicacao", label: "Apelo final", hint: "Para onde o texto leva a congregação?" },
        { type: "oracao", label: "Oração", hint: "Encerramento ou comissionamento." },
      ],
    },
  ],
  textual: [
    {
      title: "Introdução",
      role: "introducao",
      items: [
        { type: "pergunta_retorica", label: "Pergunta de partida", hint: "Uma pergunta que prepara o ouvinte para o texto." },
        { type: "texto_biblico", label: "Texto base", hint: "A sentença, parágrafo ou unidade curta que será pregada." },
        { type: "proposicao", label: "Tese", hint: "Em uma frase: o que o autor está afirmando aqui?" },
      ],
    },
    {
      title: "Ponto 1",
      role: "topico",
      items: [
        { type: "ponto_principal", label: "Argumento", hint: "Sai da estrutura sintática do texto (causa, contraste, lista)." },
        { type: "subponto", label: "Suporte do texto", hint: "Que palavra ou verbo do trecho fundamenta este ponto?" },
        { type: "aplicacao", label: "Aplicação", hint: "O verbo do texto pede o quê do ouvinte?" },
      ],
    },
    {
      title: "Ponto 2",
      role: "topico",
      items: [
        { type: "ponto_principal", label: "Argumento", hint: "Continuação da gramática do texto." },
        { type: "subponto", label: "Suporte do texto", hint: "Palavra ou verbo de apoio." },
        { type: "aplicacao", label: "Aplicação", hint: "Aplicação concreta." },
      ],
    },
    {
      title: "Conclusão",
      role: "conclusao",
      items: [
        { type: "conclusao", label: "Recapitulação", hint: "Volte à tese." },
        { type: "aplicacao", label: "Apelo", hint: "Um chamado claro." },
      ],
    },
  ],
  narrativo: [
    {
      title: "Cenário",
      role: "introducao",
      items: [
        { type: "texto_biblico", label: "Texto base", hint: "A narrativa bíblica que será contada." },
        { type: "contexto", label: "Cenário", hint: "Personagens, lugar, época — situe o ouvinte na cena." },
      ],
    },
    {
      title: "Tensão",
      role: "topico",
      items: [
        { type: "ponto_principal", label: "Tensão", hint: "O que está em jogo? Qual é o conflito da narrativa?" },
        { type: "ilustracao", label: "Eco contemporâneo", hint: "Uma ressonância da tensão na vida do ouvinte." },
      ],
    },
    {
      title: "Reviravolta",
      role: "topico",
      items: [
        { type: "ponto_principal", label: "Reviravolta", hint: "O movimento que muda tudo na história — o evangelho dentro do enredo." },
        { type: "ilustracao", label: "Significado", hint: "Como esse movimento aponta para Cristo?" },
      ],
    },
    {
      title: "Aplicação",
      role: "topico",
      items: [
        { type: "aplicacao", label: "Identificação", hint: "Com qual personagem o ouvinte se identifica? O que isso pede dele?" },
      ],
    },
    {
      title: "Conclusão",
      role: "conclusao",
      items: [
        { type: "conclusao", label: "Síntese", hint: "Volte à reviravolta — o coração da história." },
        { type: "aplicacao", label: "Apelo", hint: "Convite à fé / à ação." },
      ],
    },
  ],
  tematico: [
    {
      title: "Introdução",
      role: "introducao",
      items: [
        {
          type: "ilustracao",
          label: "O Gancho",
          hint: "Uma frase, pergunta ou história para captar a atenção da audiência imediatamente.",
        },
        {
          type: "proposicao",
          label: "O Tema",
          hint: "Apresentação clara do assunto que será abordado.",
        },
        {
          type: "texto_biblico",
          label: "O Texto Base",
          hint: "Leitura do versículo principal que fundamenta o tema.",
        },
        {
          type: "introducao",
          label: "O Propósito",
          hint: "Breve explicação de por que este assunto é importante para a vida prática dos ouvintes.",
        },
      ],
    },
    {
      title: "Tópico 1",
      role: "topico",
      items: [
        { type: "ponto_principal", label: "Argumento", hint: "A declaração ou ideia central deste tópico." },
        { type: "texto_biblico", label: "Fundamentação", hint: "Citação de um ou mais textos bíblicos que apoiam a declaração." },
        { type: "ilustracao", label: "Ilustração", hint: "Exemplo, história ou analogia que torne a verdade fácil de visualizar." },
        { type: "aplicacao", label: "Aplicação", hint: "Como este ponto se conecta com a realidade diária do público." },
      ],
    },
    {
      title: "Tópico 2",
      role: "topico",
      items: [
        { type: "ponto_principal", label: "Argumento", hint: "A declaração ou ideia central deste tópico." },
        { type: "texto_biblico", label: "Fundamentação", hint: "Textos bíblicos de apoio." },
        { type: "ilustracao", label: "Ilustração", hint: "Exemplo, história ou analogia." },
        { type: "aplicacao", label: "Aplicação", hint: "Como este ponto se conecta com a vida diária." },
      ],
    },
    {
      title: "Tópico 3",
      role: "topico",
      items: [
        { type: "ponto_principal", label: "Argumento", hint: "A declaração ou ideia central deste tópico." },
        { type: "texto_biblico", label: "Fundamentação", hint: "Textos bíblicos de apoio." },
        { type: "ilustracao", label: "Ilustração", hint: "Exemplo, história ou analogia." },
        { type: "aplicacao", label: "Aplicação", hint: "Como este ponto se conecta com a vida diária." },
      ],
    },
    {
      title: "Conclusão",
      role: "conclusao",
      items: [
        { type: "conclusao", label: "Resumo", hint: "Breve recapitulação dos tópicos abordados." },
        { type: "conclusao", label: "Clímax", hint: "A ideia central amarrada em um pensamento final forte e impactante." },
        { type: "aplicacao", label: "Apelo / Desafio", hint: "Convite claro para que o ouvinte tome uma decisão ou aja de acordo com a mensagem." },
      ],
    },
  ],
  topico: [
    {
      title: "Introdução",
      role: "introducao",
      items: [
        { type: "introducao", label: "O Problema", hint: "Qual é a questão real da congregação que o tópico aborda?" },
        { type: "pergunta_retorica", label: "Diagnóstico", hint: "Uma pergunta que faz o ouvinte sentir o problema." },
        { type: "proposicao", label: "Tese", hint: "O que a Escritura responde a esse problema?" },
      ],
    },
    {
      title: "Ponto 1",
      role: "topico",
      items: [
        { type: "texto_biblico", label: "Resposta bíblica", hint: "Passagem que ilumina o tópico." },
        { type: "ponto_principal", label: "Princípio", hint: "O que a Escritura ensina aqui?" },
        { type: "ilustracao", label: "Ilustração", hint: "Caso, história ou analogia." },
        { type: "aplicacao", label: "Aplicação", hint: "O que isso pede hoje?" },
      ],
    },
    {
      title: "Ponto 2",
      role: "topico",
      items: [
        { type: "texto_biblico", label: "Resposta bíblica", hint: "Passagem complementar." },
        { type: "ponto_principal", label: "Princípio", hint: "O que a Escritura ensina aqui?" },
        { type: "ilustracao", label: "Ilustração", hint: "Caso, história ou analogia." },
        { type: "aplicacao", label: "Aplicação", hint: "O que isso pede hoje?" },
      ],
    },
    {
      title: "Conclusão",
      role: "conclusao",
      items: [
        { type: "conclusao", label: "Síntese", hint: "Volte ao problema e mostre a resposta." },
        { type: "aplicacao", label: "Apelo", hint: "O que a congregação deve fazer esta semana?" },
      ],
    },
  ],
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
