// Vocabulário por tipo de conteúdo (sermão · palestra · aula).
// A UI é a mesma, mas a linguagem muda: quem prepara uma aula não "prega",
// quem prepara uma palestra não "ministra". Toda tela que fala com o usuário
// sobre o conteúdo deve puxar as palavras daqui, nunca escrever "pregação" fixo.

import type { ContentType } from "@/types/database";

export interface ContentTerms {
  id: ContentType;
  /** "Sermão" · "Palestra" · "Aula" */
  label: string;
  /** "sermão" · "palestra" · "aula" */
  labelLower: string;
  /** "este" · "esta" — concorda com labelLower */
  demonstrative: string;
  /** Verbo da entrega, infinitivo: "pregar" · "palestrar" · "dar a aula" */
  verb: string;
  /** Frase "Ao pregar" / "Ao palestrar" / "Ao dar esta aula" */
  onDeliver: string;
  /** Substantivo do evento em title case: "Pregação" · "Palestra" · "Aula" */
  event: string;
  /** Plural do evento, título da seção de histórico */
  eventPlural: string;
  /** Botão: "Registrar pregação" · "Registrar palestra" · "Registrar aula" */
  registerAction: string;
  /** Título do dialog em modo edição */
  editAction: string;
  /** Status quando `pronto`: "Pregado" · "Apresentada" · "Ministrada" */
  doneStatus: string;
  /** Item de menu: "Marcar como pregado" · "Marcar como apresentada" · … */
  markDoneAction: string;
  /** Toast de confirmação do status */
  markedDoneToast: string;
  /** Label de metadados: "Pregado em" · "Apresentada em" · "Ministrada em" */
  doneAtLabel: string;
  /** Linha de apoio da seção de histórico */
  historyIntro: string;
  /** Texto do estado vazio da seção de histórico */
  historyEmpty: string;
}

const TERMS: Record<ContentType, ContentTerms> = {
  "sermão": {
    id: "sermão",
    label: "Sermão",
    labelLower: "sermão",
    demonstrative: "este",
    verb: "pregar",
    onDeliver: "Ao pregar este sermão",
    event: "Pregação",
    eventPlural: "Pregações",
    registerAction: "Registrar pregação",
    editAction: "Editar pregação",
    doneStatus: "Pregado",
    markDoneAction: "Marcar como pregado",
    markedDoneToast: "Marcado como pregado",
    doneAtLabel: "Pregado em",
    historyIntro:
      "Toda vez que pregar, registre como foi. Cria memória ministerial, e melhora a próxima vez.",
    historyEmpty:
      "Nenhum registro ainda. Ao pregar este sermão, anote aqui o que foi forte, o que ficou fraco, e o lugar onde aconteceu.",
  },
  palestra: {
    id: "palestra",
    label: "Palestra",
    labelLower: "palestra",
    demonstrative: "esta",
    verb: "palestrar",
    onDeliver: "Ao apresentar esta palestra",
    event: "Palestra",
    eventPlural: "Palestras",
    registerAction: "Registrar palestra",
    editAction: "Editar palestra",
    doneStatus: "Apresentada",
    markDoneAction: "Marcar como apresentada",
    markedDoneToast: "Marcada como apresentada",
    doneAtLabel: "Apresentada em",
    historyIntro:
      "Toda vez que palestrar, registre como foi. Cria memória do seu repertório, e melhora a próxima vez.",
    historyEmpty:
      "Nenhum registro ainda. Ao apresentar esta palestra, anote aqui o que foi forte, o que ficou fraco, e o lugar onde aconteceu.",
  },
  aula: {
    id: "aula",
    label: "Aula",
    labelLower: "aula",
    demonstrative: "esta",
    verb: "dar a aula",
    onDeliver: "Ao dar esta aula",
    event: "Aula",
    eventPlural: "Aulas",
    registerAction: "Registrar aula",
    editAction: "Editar aula",
    doneStatus: "Ministrada",
    markDoneAction: "Marcar como ministrada",
    markedDoneToast: "Marcada como ministrada",
    doneAtLabel: "Ministrada em",
    historyIntro:
      "Toda vez que der a aula, registre como foi. Cria memória do seu ensino, e melhora a próxima turma.",
    historyEmpty:
      "Nenhum registro ainda. Ao dar esta aula, anote aqui o que foi forte, o que ficou fraco, e o lugar onde aconteceu.",
  },
};

/** Vocabulário do tipo de conteúdo. Cai em "sermão" quando o valor é desconhecido. */
export function termsFor(contentType: ContentType | string | null | undefined): ContentTerms {
  if (contentType && contentType in TERMS) {
    return TERMS[contentType as ContentType];
  }
  return TERMS["sermão"];
}

/** Só o rótulo de status, usado em cards e listas onde não cabe o objeto inteiro. */
export function statusLabelFor(
  contentType: ContentType | string | null | undefined,
  status: "rascunho" | "pronto"
): string {
  return status === "rascunho" ? "Em rascunho" : termsFor(contentType).doneStatus;
}
