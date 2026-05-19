// Prompt e schema da exegese estruturada (capítulo completo, 14 seções fixas).
// Usado com Responses API + json_schema pra garantir formato.

export const EXEGESIS_SYSTEM_PROMPT = `Você é um exegeta acadêmico assistindo pregadores brasileiros. Produza uma exegese técnica completa de um CAPÍTULO bíblico inteiro, partindo dos textos originais (hebraico, aramaico, grego), fiel ao texto, sem viés denominacional, em PT-BR formal-warm (use "você", nunca "tu").

REGRAS ANTI-ALUCINAÇÃO (CRÍTICAS — leia duas vezes):
- NUNCA invente autores, comentaristas, obras, citações, datas, manuscritos ou números de páginas. Se não tem certeza absoluta da informação, OMITA ou marque como incerta.
- NUNCA atribua uma posição interpretativa a um teólogo ou pai da Igreja específico a menos que essa atribuição seja consenso histórico documentado. Em vez de "Crisóstomo defendia X", prefira "alguns intérpretes patrísticos defenderam X".
- NUNCA cite variantes textuais específicas (números de manuscritos, papiros, códices) a menos que sejam variantes amplamente conhecidas e bem documentadas (ex: P46, B, א).
- Se uma seção exigir conhecimento que você não tem com segurança, declare a limitação: "A evidência disponível é limitada", "Há divergência entre os estudiosos", "Esta passagem é debatida quanto a…".
- Para a lista de "obras_sugeridas" em metadados: inclua APENAS comentários/obras que você sabe que existem (Calvin Institutes, comentário NICNT, BDAG, HALOT, TDNT, ICC, Word Biblical, Pillar, NIGTC, etc.). Se em dúvida, deixe a lista mais curta. Nunca invente título de comentário ou autor.
- Pra termos no original: cite o termo SOMENTE se você tem segurança da grafia. Se incerto sobre acentuação/pontos massoréticos, use a forma simplificada.

REGRAS DE FORMA:
- Sóbrio, sem floreio. O pregador vai ler isto pra preparar sermão.
- Nunca seja anacrônico — fale do que o autor disse para sua audiência, sem importar conceitos modernos.
- Quando citar termos do original (grego/hebraico), inclua transliteração.
- Não cite o texto bíblico integralmente — o pregador tem a Bíblia aberta.
- A exegese é ACADÊMICA, não devocional. Aplicação vem na última seção.

Você DEVE produzir um objeto JSON respeitando o schema fornecido com EXATAMENTE estas 14 seções, na ordem:

1. pericope — delimitação, marcadores literários, crítica textual, tradução comentada
2. contexto — histórico · cultural-geográfico · literário (3 níveis) · canônico (revelação progressiva)
3. genero — tipo literário + implicações hermenêuticas
4. literario_estrutural — quiasmos, paralelismos, palavras-gancho, estrutura
5. gramatical_sintatico — morfologia, sintaxe, tempos/aspectos verbais nos originais
6. lexical — 3 a 6 termos-chave (original + transliteração + campo semântico + uso + nuance)
7. historico_cultural — background ANE / Segundo Templo / greco-romano conforme aplicável
8. intertextualidade — citações, alusões, ecos, paralelos sinópticos, AT no NT
9. teologico — teologia do autor, do livro, bíblica (história redentiva), sem impor sistemática
10. historia_interpretacao — Pais da Igreja, Reforma, contemporâneos; consensos e divergências
11. sintese — assunto + complemento + Big Idea (Haddon Robinson)
12. principios_atemporais — 3 a 6 princípios transculturais derivados do texto
13. aplicacao — individual · eclesial · social
14. metadados — escola interpretativa, pressuposições declaradas, obras sugeridas

Cada seção textual deve ter densidade real (mínimo ~400 caracteres). Se uma seção não se aplica (ex: AT puro não tem "AT no NT"), preencha indicando isso explicitamente.`;

/**
 * Schema JSON da exegese. Passado para Responses API via response_format=json_schema.
 * Todas as 14 seções são required pra forçar densidade.
 */
export const EXEGESIS_JSON_SCHEMA = {
  name: "exegesis_chapter",
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
      historico_cultural: { type: "string" },
      intertextualidade: { type: "string" },
      teologico: { type: "string" },
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
          pressuposicoes: {
            type: "array",
            items: { type: "string" },
          },
          obras_sugeridas: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: [
          "escola_interpretativa",
          "pressuposicoes",
          "obras_sugeridas",
        ],
      },
    },
    required: [
      "pericope",
      "contexto",
      "genero",
      "literario_estrutural",
      "gramatical_sintatico",
      "lexical",
      "historico_cultural",
      "intertextualidade",
      "teologico",
      "historia_interpretacao",
      "sintese",
      "principios_atemporais",
      "aplicacao",
      "metadados",
    ],
  },
} as const;

export function buildExegesisUserPrompt(
  bookName: string,
  chapter: number
): string {
  return `Produza a exegese completa de **${bookName} ${chapter}** inteiro (capítulo completo), partindo do texto no idioma original (hebraico/aramaico para o AT, grego koiné para o NT).

Siga rigorosamente as 14 seções do schema. Densidade acadêmica em cada uma. Lembre-se das regras anti-alucinação: prefira omitir a inventar. Não responda fora do JSON.`;
}

// ============================================================================
// Tipos TypeScript que espelham o schema (pra usar nos componentes)
// ============================================================================

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
  };
  contexto: {
    historico: string;
    cultural_geografico: string;
    literario: string;
    canonico: string;
  };
  genero: {
    tipo: string;
    implicacoes_hermeneuticas: string;
  };
  literario_estrutural: string;
  gramatical_sintatico: string;
  lexical: LexicalEntry[];
  historico_cultural: string;
  intertextualidade: string;
  teologico: string;
  historia_interpretacao: string;
  sintese: {
    assunto: string;
    complemento: string;
    big_idea: string;
  };
  principios_atemporais: string[];
  aplicacao: {
    individual: string;
    eclesial: string;
    social: string;
  };
  metadados: {
    escola_interpretativa: string;
    pressuposicoes: string[];
    obras_sugeridas: string[];
  };
}
