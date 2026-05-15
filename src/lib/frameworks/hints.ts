// Dicas por framework — mostradas ao criar e re-acessíveis pelo botão "Dica" no editor.
// Persistência de "não mostrar mais" via localStorage (`vox.framework-hint-dismissed`)
// até issue de sincronização cross-device (60+).

import type { FrameworkId } from "@/lib/mocks/frameworks";

export interface FrameworkHint {
  title: string;
  body: string;
  /** Princípios que o pregador deve manter em mente */
  principles: string[];
  /** Armadilhas comuns */
  pitfalls: string[];
}

export const FRAMEWORK_HINTS: Record<FrameworkId, FrameworkHint> = {
  expositivo: {
    title: "Expositivo — fiel ao texto, verso a verso",
    body:
      "O sermão expositivo deixa o texto falar primeiro. A estrutura emerge do trecho bíblico, não do tema que você quer pregar. Antes de pensar nos pontos, pergunte: o que o autor inspirado quis comunicar à audiência original?",
    principles: [
      "Cada ponto principal deve ter raiz visível no texto",
      "Contexto histórico vem antes de aplicação contemporânea",
      "Resista à pressa de aplicar — ofereça o texto inteiro primeiro",
      "O mesmo texto pode ter um único Big Idea — não três",
    ],
    pitfalls: [
      "Fragmentar versículos para encaixar a aplicação que você queria",
      "Pular o contexto e tratar versículos como aforismos",
      "Acumular pontos paralelos sem hierarquia",
    ],
  },
  textual: {
    title: "Textual — uma passagem curta, uma mensagem central",
    body:
      "O textual nasce de uma sentença, parágrafo ou unidade curta. A estrutura é dirigida pela própria gramática do trecho — não por divisões artificiais. O resultado: profundidade no que o autor disse, sem ser exaustivo como o expositivo.",
    principles: [
      "Identifique o verbo principal — geralmente carrega a tese",
      "Divisões saem da estrutura sintática (causa/efeito, contraste, lista)",
      "Aplicação sai do verbo, não de inferências secundárias",
    ],
    pitfalls: [
      "Esticar uma passagem curta para encher tempo",
      "Confundir textual com tópico (textual parte do texto, tópico parte do tema)",
    ],
  },
  narrativo: {
    title: "Narrativo — história que prega",
    body:
      "O texto bíblico já é uma narrativa. Pregue-a como história: cenário, tensão, reviravolta, aplicação. Confie no enredo bíblico — ele já é mais poderoso que qualquer ilustração contemporânea que você acrescentar.",
    principles: [
      "Conte a história antes de explicá-la",
      "A reviravolta carrega o sermão — ela é o evangelho dentro da história",
      "Aplicação vem da identificação com os personagens, não de moralismo",
    ],
    pitfalls: [
      "Resumir a história em vez de narrá-la (perde o impacto)",
      "Moralizar personagens (\"seja como Davi\") em vez de apontar para Cristo",
      "Spoiler precoce da reviravolta",
    ],
  },
  tematico: {
    title: "Temático — um tema bíblico, múltiplas vozes",
    body:
      "Você parte de uma doutrina ou tema (graça, perseverança, ira) e convoca várias passagens convergentes. O risco é a colcha de retalhos — escolha textos que se iluminem mutuamente, não que apenas repitam.",
    principles: [
      "Limite-se a 2–3 passagens centrais — convergência, não acumulação",
      "Mostre como os textos se interpretam entre si",
      "Termine com uma síntese clara, não com paráfrase",
    ],
    pitfalls: [
      "Versículos isolados de contexto para forçar o tema",
      "Tema tão amplo que perde foco",
      "Mais que 3 passagens — vira aula bíblica em vez de sermão",
    ],
  },
  topico: {
    title: "Tópico — vida real à luz da Palavra",
    body:
      "O ponto de partida é um problema contemporâneo da congregação: ansiedade, trabalho, perdão, relacionamentos. Você traz a Escritura para iluminar e confrontar — não para apenas \"abençoar\" a discussão.",
    principles: [
      "O tópico delimita; a Escritura define",
      "Diagnóstico antes de prescrição — entenda o problema com seriedade",
      "Aplicação concreta, não genérica (\"o que isto pede de você esta semana?\")",
    ],
    pitfalls: [
      "Sermão motivacional disfarçado de bíblico",
      "Versículos como decoração para o conselho prático",
      "Tópico tão pessoal que vira terapia coletiva",
    ],
  },
  livre: {
    title: "Livre — estrutura aberta",
    body:
      "Sem esqueleto pré-definido. Use para devocionais curtos, sermões improvisados ou estudos em formato aberto. Mesmo livre, mantenha clareza ministerial.",
    principles: [
      "Pelo menos um texto bíblico âncora",
      "Uma ideia central — não três",
      "Aplicação concreta",
    ],
    pitfalls: [
      "Falta de fio condutor — vira fluxo de consciência",
      "Improviso confundido com falta de preparo",
    ],
  },
};

const STORAGE_KEY = "vox.framework-hint-dismissed";

/** Lê o conjunto de frameworks cujas dicas foram silenciadas pelo usuário. */
export function loadDismissed(): Set<FrameworkId> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr.filter(isFrameworkId));
  } catch {
    return new Set();
  }
}

export function persistDismissed(set: Set<FrameworkId>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignorar quota / private mode
  }
}

function isFrameworkId(v: string): v is FrameworkId {
  return ["expositivo", "textual", "narrativo", "tematico", "topico", "livre"].includes(v);
}
