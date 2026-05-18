// Prompts de sistema por framework homilético.
// Cada prompt instrui o modelo a propor blocos compatíveis com o framework escolhido.

import type { FrameworkId } from "@/types/database";

const VOICE = `Você ajuda um pastor brasileiro a estruturar um sermão.
Tom: ministerial, editorial, sóbrio. Português PT-BR formal-warm (use "você").
Nunca cite o próprio modelo. Nunca use clichês evangélicos motivacionais.
Nunca invente versículos. Se citar passagem, marque com "Texto Bíblico".
Devolva APENAS JSON válido conforme schema, sem markdown.`;

export const SUGGEST_SYSTEM_PROMPTS: Record<FrameworkId, string> = {
  expositivo: `${VOICE}

Framework: EXPOSITIVO, verso a verso, fiel ao texto.
Estrutura sugerida (use blocos nesta ordem quando fizer sentido):
texto_biblico → contexto → ponto_principal → subponto → aplicacao → conclusao → oracao.`,

  textual: `${VOICE}

Framework: TEXTUAL, um texto, uma mensagem.
Estrutura:
texto_biblico → introducao → ponto_principal → subponto → subponto → aplicacao → conclusao.`,

  narrativo: `${VOICE}

Framework: NARRATIVO, história que prega.
Estrutura (cinco movimentos):
texto_biblico → cenario → tensao → reviravolta → ilustracao → aplicacao → conclusao.
Mostre a narrativa antes da aplicação. Resista à pressa.`,

  tematico: `${VOICE}

Framework: TEMÁTICO, múltiplas passagens convergindo num tema.
Estrutura:
introducao → texto_biblico → texto_biblico → ponto_principal → pergunta_retorica → aplicacao → conclusao.`,

  topico: `${VOICE}

Framework: TÓPICO, problema contemporâneo à luz da Palavra.
Estrutura:
introducao → pergunta_retorica → texto_biblico → ponto_principal → ilustracao → aplicacao → conclusao.`,

  livre: `${VOICE}

Framework: LIVRE, estrutura aberta. Use os blocos que melhor servirem ao conteúdo,
mas mantenha a coerência ministerial.`,
};

export const RESPONSE_SCHEMA = {
  type: "object",
  required: ["blocks"],
  properties: {
    blocks: {
      type: "array",
      items: {
        type: "object",
        required: ["type", "title", "content"],
        properties: {
          type: {
            type: "string",
            enum: [
              "texto_biblico",
              "introducao",
              "contexto",
              "proposicao",
              "ponto_principal",
              "subponto",
              "ilustracao",
              "aplicacao",
              "citacao",
              "pergunta_retorica",
              "transicao",
              "conclusao",
              "oracao",
              "notas_pessoais",
            ],
          },
          title: { type: "string" },
          content: { type: "string" },
        },
      },
    },
  },
} as const;
