// Prompts e schemas da exegese estruturada em PIPELINE DE 5 GRUPOS PARALELOS.
//
// Por que 5 chamadas em vez de 1 grande?
//   - menor pressão de contexto por chamada → menos alucinação
//   - falhas isoladas (retry granular)
//   - salvamento parcial (UI mostra progresso real)
//   - tempo paralelizado ~15-20s vs ~30s
//
// Por que não 14 chamadas (uma por seção)?
//   - 14× overhead de input prompt → ~3× custo
//   - risco maior de inconsistências
//   - tempo serial seria 5min
//
// O agrupamento por afinidade temática mantém coerência dentro de cada
// chamada e permite que o prompt seja focado.

// ===========================================================================
// REGRAS COMUNS (compartilhadas por todos os 5 prompts)
// ===========================================================================

const SHARED_RULES = `Você é um exegeta acadêmico assistindo pregadores brasileiros. Produza análise técnica fiel ao texto, sem viés denominacional, em PT-BR formal-warm (use "você", nunca "tu").

REGRAS ANTI-ALUCINAÇÃO (CRÍTICAS):
- NUNCA invente autores, comentaristas, obras, citações, datas, manuscritos ou números de páginas.
- NUNCA atribua uma posição interpretativa a um teólogo específico a menos que essa atribuição seja consenso histórico documentado. Prefira "alguns intérpretes patrísticos defenderam X" a "Crisóstomo defendia X".
- NUNCA cite variantes textuais específicas (papiros, códices) a menos que sejam variantes amplamente conhecidas (P46, Sinaiticus, Vaticanus, Alexandrinus).
- Se uma informação não está sob seu domínio com segurança, OMITA ou diga "a evidência disponível é limitada" / "há divergência entre os estudiosos".
- Pra termos no original: cite SOMENTE com segurança de grafia. Sem certeza dos pontos massoréticos, use forma simplificada.
- Pra obras sugeridas: APENAS comentários canônicos que você sabe que existem (NICNT, NIGTC, ICC, Word Biblical, Pillar, Hermeneia, BDAG, HALOT, TDNT, TDOT). Lista curta é melhor que lista inventada.

VOZ:
- Sóbrio, sem floreio. Vai virar preparação de sermão.
- Nunca seja anacrônico (fala do que o autor disse pra audiência ORIGINAL).
- Termos do original sempre com transliteração.
- Não cite o texto bíblico integralmente — o pregador tem a Bíblia aberta.
- Aplicação só na seção dedicada; o resto é acadêmico.`;

// ===========================================================================
// GRUPO A — TEXTO (perícope, crítica textual, tradução)
// ===========================================================================

export const GROUP_A_SYSTEM = `${SHARED_RULES}

Esta chamada cobre 3 seções do estudo (sub-objeto "texto"):
1. perícope (delimitação + marcadores literários)
2. crítica textual (variantes manuscritas relevantes; se não houver, declare "sem variantes significativas")
3. tradução comentada (notas sobre escolhas tradutórias quando trechos importantes)

Use o TEXTO DO CAPÍTULO fornecido como ancoragem. Não vá além do que o texto fornece.`;

export const GROUP_A_SCHEMA = {
  name: "exegesis_group_texto",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      pericope: {
        type: "object",
        additionalProperties: false,
        properties: {
          delimitacao: { type: "string" },
          marcadores_literarios: { type: "string" },
          critica_textual: { type: "string" },
          traducao_propria: { type: "string" },
        },
        required: [
          "delimitacao",
          "marcadores_literarios",
          "critica_textual",
          "traducao_propria",
        ],
      },
    },
    required: ["pericope"],
  },
} as const;

// ===========================================================================
// GRUPO B — CONTEXTO (histórico, cultural, literário, canônico, gênero)
// ===========================================================================

export const GROUP_B_SYSTEM = `${SHARED_RULES}

Esta chamada cobre 5 itens do estudo:
1. contexto histórico (autor, data, destinatários, situação)
2. contexto cultural-geográfico (costumes, instituições, geografia)
3. contexto literário (posição no livro, parágrafos adjacentes, função argumentativa)
4. contexto canônico (lugar na história da revelação progressiva)
5. gênero literário (tipo + implicações hermenêuticas)

Estes são panos de fundo. Foque em fatos consensuais. Quando houver debate (autoria de Hebreus, data do Pentateuco), declare o debate em vez de tomar partido.`;

export const GROUP_B_SCHEMA = {
  name: "exegesis_group_contexto",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      contexto: {
        type: "object",
        additionalProperties: false,
        properties: {
          historico: { type: "string" },
          cultural_geografico: { type: "string" },
          literario: { type: "string" },
          canonico: { type: "string" },
        },
        required: [
          "historico",
          "cultural_geografico",
          "literario",
          "canonico",
        ],
      },
      genero: {
        type: "object",
        additionalProperties: false,
        properties: {
          tipo: { type: "string" },
          implicacoes_hermeneuticas: { type: "string" },
        },
        required: ["tipo", "implicacoes_hermeneuticas"],
      },
    },
    required: ["contexto", "genero"],
  },
} as const;

// ===========================================================================
// GRUPO C — FORMA (estrutura literária, sintaxe, léxico)
// ===========================================================================

export const GROUP_C_SYSTEM = `${SHARED_RULES}

Esta chamada cobre 3 itens (análise interna do texto):
1. estrutura literária (quiasmos, paralelismos, palavras-gancho, diagramação)
2. análise gramatical e sintática (morfologia, tempos verbais, partículas)
3. lexical (3 a 6 termos-chave: original, transliteração, campo semântico, uso, nuance)

Use o TEXTO DO CAPÍTULO como base. Pra termos do original, só cite os que você tem segurança de grafia e significado nesse contexto. Lexical tem schema próprio com array de termos.`;

export const GROUP_C_SCHEMA = {
  name: "exegesis_group_forma",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      literario_estrutural: { type: "string" },
      gramatical_sintatico: { type: "string" },
      lexical: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            termo_original: { type: "string" },
            transliteracao: { type: "string" },
            campo_semantico: { type: "string" },
            uso_no_autor: { type: "string" },
            nuance: { type: "string" },
          },
          required: [
            "termo_original",
            "transliteracao",
            "campo_semantico",
            "uso_no_autor",
            "nuance",
          ],
        },
        minItems: 3,
      },
    },
    required: ["literario_estrutural", "gramatical_sintatico", "lexical"],
  },
} as const;

// ===========================================================================
// GRUPO D — BACKGROUND EXPANDIDO (histórico-cultural, intertextualidade, teologia)
// ===========================================================================

export const GROUP_D_SYSTEM = `${SHARED_RULES}

Esta chamada cobre 3 itens (horizonte mais amplo):
1. histórico-cultural expandido (background ANE para AT, helenístico-romano e Segundo Templo para NT, quando aplicável)
2. intertextualidade (citações, alusões, ecos, paralelos sinópticos, AT no NT)
3. teologia (do autor, do livro, bíblica/história redentiva, sem impor sistemática)

Quando citar paralelo bíblico, dê a referência exata (ex: Romanos 5:1 ecoa Isaías 53:5). Pra background extra-bíblico, só cite obras que você tem certeza de existência (Enuma Elish, Hamurabi, Filo, Josefo, Mishná, Talmude).`;

export const GROUP_D_SCHEMA = {
  name: "exegesis_group_background",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      historico_cultural: { type: "string" },
      intertextualidade: { type: "string" },
      teologico: { type: "string" },
    },
    required: ["historico_cultural", "intertextualidade", "teologico"],
  },
} as const;

// ===========================================================================
// GRUPO E — SÍNTESE (história da interpretação, big idea, princípios, aplicação, metadados)
// ===========================================================================

export const GROUP_E_SYSTEM = `${SHARED_RULES}

Esta chamada cobre 5 itens (síntese e ponte hermenêutica):
1. história da interpretação (consensos e divergências patrísticas, reformatórias, contemporâneas)
2. síntese (assunto + complemento + Big Idea de Haddon Robinson em frase única)
3. princípios atemporais (3 a 6 princípios transculturais; distinguir descritivo de prescritivo)
4. aplicação (individual + eclesial + social)
5. metadados (escola interpretativa, pressuposições declaradas, obras sugeridas REAIS)

Aplicação NÃO é devocional rasa; é ponte hermenêutica do "então" ao "agora" preservando o sentido original.`;

export const GROUP_E_SCHEMA = {
  name: "exegesis_group_sintese",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      historia_interpretacao: { type: "string" },
      sintese: {
        type: "object",
        additionalProperties: false,
        properties: {
          assunto: { type: "string" },
          complemento: { type: "string" },
          big_idea: { type: "string" },
        },
        required: ["assunto", "complemento", "big_idea"],
      },
      principios_atemporais: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
      },
      aplicacao: {
        type: "object",
        additionalProperties: false,
        properties: {
          individual: { type: "string" },
          eclesial: { type: "string" },
          social: { type: "string" },
        },
        required: ["individual", "eclesial", "social"],
      },
      metadados: {
        type: "object",
        additionalProperties: false,
        properties: {
          escola_interpretativa: { type: "string" },
          pressuposicoes: { type: "array", items: { type: "string" } },
          obras_sugeridas: { type: "array", items: { type: "string" } },
        },
        required: [
          "escola_interpretativa",
          "pressuposicoes",
          "obras_sugeridas",
        ],
      },
    },
    required: [
      "historia_interpretacao",
      "sintese",
      "principios_atemporais",
      "aplicacao",
      "metadados",
    ],
  },
} as const;

// ===========================================================================
// Builders dos prompts de entrada
// ===========================================================================

export interface GroupInput {
  bookName: string;
  chapter: number;
  /** Texto do capítulo (verso-numerado) pré-buscado da API. Pode ser null. */
  chapterText: string | null;
}

function baseInput({ bookName, chapter, chapterText }: GroupInput): string {
  const header = `Capítulo a analisar: **${bookName} ${chapter}**.`;
  if (!chapterText) {
    return `${header}\n\n(Texto do capítulo não disponível na API neste momento. Use o que você tem com segurança e marque incertezas explicitamente.)`;
  }
  return `${header}\n\nTexto verso-a-verso (NVI/ACF) — ANCORAGEM, use como referência REAL:\n\n${chapterText}\n\nNão inclua o texto bíblico na resposta; foque na análise das seções pedidas.`;
}

export function buildGroupAInput(input: GroupInput): string {
  return (
    baseInput(input) +
    `\n\nProduza as seções "perícope" (delimitação, marcadores literários, crítica textual, tradução comentada).`
  );
}

export function buildGroupBInput(input: GroupInput): string {
  return (
    baseInput(input) +
    `\n\nProduza as seções "contexto" (histórico, cultural-geográfico, literário, canônico) e "genero" (tipo + implicações hermenêuticas).`
  );
}

export function buildGroupCInput(input: GroupInput): string {
  return (
    baseInput(input) +
    `\n\nProduza "literario_estrutural", "gramatical_sintatico" e "lexical" (array com 3 a 6 termos-chave do original).`
  );
}

export function buildGroupDInput(input: GroupInput): string {
  return (
    baseInput(input) +
    `\n\nProduza "historico_cultural" (background ANE / helenístico-romano / Segundo Templo conforme aplicável), "intertextualidade" (citações, alusões, paralelos) e "teologico" (teologia do autor / do livro / bíblica).`
  );
}

export function buildGroupEInput(input: GroupInput): string {
  return (
    baseInput(input) +
    `\n\nProduza "historia_interpretacao" (consensos e divergências históricas), "sintese" (assunto + complemento + big_idea), "principios_atemporais" (3-6 princípios), "aplicacao" (individual + eclesial + social) e "metadados" (escola + pressuposições + obras sugeridas REAIS).`
  );
}

// ===========================================================================
// Tipos do conteúdo final (composto dos 5 grupos)
// Mantidos compatíveis com a versão anterior pra UI continuar funcionando.
// ===========================================================================

export interface LexicalEntry {
  termo_original: string;
  transliteracao: string;
  campo_semantico: string;
  uso_no_autor: string;
  nuance: string;
}

export interface ExegesisContent {
  pericope: {
    delimitacao: string;
    marcadores_literarios: string;
    critica_textual: string;
    traducao_propria: string;
  } | null;
  contexto: {
    historico: string;
    cultural_geografico: string;
    literario: string;
    canonico: string;
  } | null;
  genero: {
    tipo: string;
    implicacoes_hermeneuticas: string;
  } | null;
  literario_estrutural: string | null;
  gramatical_sintatico: string | null;
  lexical: LexicalEntry[] | null;
  historico_cultural: string | null;
  intertextualidade: string | null;
  teologico: string | null;
  historia_interpretacao: string | null;
  sintese: {
    assunto: string;
    complemento: string;
    big_idea: string;
  } | null;
  principios_atemporais: string[] | null;
  aplicacao: {
    individual: string;
    eclesial: string;
    social: string;
  } | null;
  metadados: {
    escola_interpretativa: string;
    pressuposicoes: string[];
    obras_sugeridas: string[];
  } | null;
}

// ===========================================================================
// Tipos dos grupos (saídas individuais das 5 chamadas)
// ===========================================================================

export type GroupAOutput = Pick<ExegesisContent, "pericope">;
export type GroupBOutput = Pick<ExegesisContent, "contexto" | "genero">;
export type GroupCOutput = Pick<
  ExegesisContent,
  "literario_estrutural" | "gramatical_sintatico" | "lexical"
>;
export type GroupDOutput = Pick<
  ExegesisContent,
  "historico_cultural" | "intertextualidade" | "teologico"
>;
export type GroupEOutput = Pick<
  ExegesisContent,
  | "historia_interpretacao"
  | "sintese"
  | "principios_atemporais"
  | "aplicacao"
  | "metadados"
>;

export type GroupKey = "texto" | "contexto" | "forma" | "background" | "sintese";

/** Esqueleto vazio pra preencher conforme os grupos chegam. */
export function emptyExegesisContent(): ExegesisContent {
  return {
    pericope: null,
    contexto: null,
    genero: null,
    literario_estrutural: null,
    gramatical_sintatico: null,
    lexical: null,
    historico_cultural: null,
    intertextualidade: null,
    teologico: null,
    historia_interpretacao: null,
    sintese: null,
    principios_atemporais: null,
    aplicacao: null,
    metadados: null,
  };
}
