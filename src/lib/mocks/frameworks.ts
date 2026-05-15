// Dados dos frameworks homiléticos — fonte da verdade até issue 048 trazer real do banco.
// Mantém paridade com design-system/vox/data.js → VOX_DATA.FRAMEWORKS.

export type FrameworkId =
  | "expositivo"
  | "textual"
  | "narrativo"
  | "tematico"
  | "topico"
  | "livre";

export interface Framework {
  id: FrameworkId;
  name: string;
  tagline: string;
  description: string;
  outline: string[];
}

export const VOX_FRAMEWORKS: readonly Framework[] = [
  {
    id: "expositivo",
    name: "Expositivo",
    tagline: "Verso a verso, fiel ao texto",
    description:
      "Pregação que segue o fluxo do texto bíblico. Cada bloco emerge do que está escrito; nada é forçado.",
    outline: [
      "Texto Bíblico",
      "Contexto",
      "Ponto Principal",
      "Subponto",
      "Aplicação",
      "Conclusão",
      "Oração",
    ],
  },
  {
    id: "textual",
    name: "Textual",
    tagline: "Um texto, uma mensagem",
    description:
      "Um único trecho bíblico — geralmente uma sentença ou parágrafo — destrinchado e aplicado.",
    outline: [
      "Texto Bíblico",
      "Introdução",
      "Ponto Principal",
      "Subponto",
      "Subponto",
      "Aplicação",
      "Conclusão",
    ],
  },
  {
    id: "narrativo",
    name: "Narrativo",
    tagline: "História que prega",
    description:
      "A narrativa bíblica conduz a mensagem. Cenário, tensão e reviravolta carregam o ouvinte.",
    outline: [
      "Texto Bíblico",
      "Cenário",
      "Tensão",
      "Reviravolta",
      "Ilustração",
      "Aplicação",
      "Conclusão",
    ],
  },
  {
    id: "tematico",
    name: "Temático",
    tagline: "Tema bíblico, múltiplas vozes",
    description:
      "Um tema bíblico (graça, fé, perseverança) iluminado por várias passagens convergentes.",
    outline: [
      "Introdução",
      "Texto Bíblico",
      "Texto Bíblico",
      "Ponto Principal",
      "Pergunta retórica",
      "Aplicação",
      "Conclusão",
    ],
  },
  {
    id: "topico",
    name: "Tópico",
    tagline: "Vida real à luz da Palavra",
    description:
      "Um tópico contemporâneo (ansiedade, trabalho, perdão) confrontado pela Escritura.",
    outline: [
      "Introdução",
      "Pergunta retórica",
      "Texto Bíblico",
      "Ponto Principal",
      "Ilustração",
      "Aplicação",
      "Conclusão",
    ],
  },
  {
    id: "livre",
    name: "Livre",
    tagline: "Estrutura aberta",
    description:
      "Sem estrutura pré-definida. Para sermões improvisados, devocionais curtos ou notas pessoais.",
    outline: ["Notas pessoais"],
  },
] as const;

export function getFramework(id: FrameworkId): Framework | undefined {
  return VOX_FRAMEWORKS.find((fw) => fw.id === id);
}
