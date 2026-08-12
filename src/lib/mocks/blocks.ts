// Tipos de bloco do editor, referência canônica até issue 044 puxar do Supabase.
// Paridade com design-system/vox/data.js → VOX_DATA.BLOCK_TYPES.

export type BlockTypeId =
  | "texto_biblico"
  | "introducao"
  | "contexto"
  | "ponto_principal"
  | "subponto"
  | "desenvolvimento"
  | "ilustracao"
  | "aplicacao"
  | "citacao"
  | "pergunta_retorica"
  | "conclusao"
  | "oracao"
  | "notas_pessoais"
  | "proposicao"
  | "transicao";

export interface BlockType {
  id: BlockTypeId;
  label: string;
  hint: string;
  /** CSS color token (default, sobreposto por block_color_preferences) */
  color: string;
  /** Indica se aparece no Modo Apresentação. notas_pessoais = false */
  visibleInPresentation: boolean;
}

export const VOX_BLOCK_TYPES: readonly BlockType[] = [
  {
    id: "texto_biblico",
    label: "Texto Bíblico",
    hint: "Cole ou digite a passagem",
    color: "var(--vox-gold)",
    visibleInPresentation: true,
  },
  {
    id: "introducao",
    label: "Introdução",
    hint: "Como o sermão começa",
    color: "var(--vox-forest)",
    visibleInPresentation: true,
  },
  {
    id: "contexto",
    label: "Contexto",
    hint: "Histórico, autor, audiência original",
    color: "#64748B",
    visibleInPresentation: true,
  },
  {
    id: "proposicao",
    label: "Proposição",
    hint: "A tese central do sermão",
    color: "var(--vox-forest)",
    visibleInPresentation: true,
  },
  {
    id: "ponto_principal",
    label: "Ponto Principal",
    hint: "A ideia central desta seção",
    color: "var(--vox-forest)",
    visibleInPresentation: true,
  },
  {
    id: "subponto",
    label: "Subponto",
    hint: "Desdobramento do ponto principal",
    color: "var(--vox-forest-mid)",
    visibleInPresentation: true,
  },
  {
    id: "desenvolvimento",
    label: "Desenvolvimento",
    hint: "Exposição e elaboração do tópico, corpo do argumento",
    color: "#475569",
    visibleInPresentation: true,
  },
  {
    id: "ilustracao",
    label: "Ilustração",
    hint: "História ou analogia que ilumina a verdade",
    color: "#7C3AED",
    visibleInPresentation: true,
  },
  {
    id: "aplicacao",
    label: "Aplicação",
    hint: "O que esta verdade pede da congregação",
    color: "#0D7C7C",
    visibleInPresentation: true,
  },
  {
    id: "citacao",
    label: "Citação",
    hint: "Quote externo com atribuição",
    color: "#D97706",
    visibleInPresentation: true,
  },
  {
    id: "pergunta_retorica",
    label: "Pergunta retórica",
    hint: "Suspende o ouvinte, sem resposta imediata",
    color: "#9333EA",
    visibleInPresentation: true,
  },
  {
    id: "transicao",
    label: "Transição",
    hint: "Conectivo entre pontos",
    color: "#E2E8F0",
    visibleInPresentation: true,
  },
  {
    id: "conclusao",
    label: "Conclusão",
    hint: "Recapitulação e chamado",
    color: "var(--vox-ink)",
    visibleInPresentation: true,
  },
  {
    id: "oracao",
    label: "Oração",
    hint: "Encerramento ou comissionamento",
    color: "rgba(22,101,52,0.6)",
    visibleInPresentation: true,
  },
  {
    id: "notas_pessoais",
    label: "Notas pessoais",
    hint: "Apenas para o pregador, invisível em apresentação",
    color: "var(--vox-muted)",
    visibleInPresentation: false,
  },
];

export function getBlockType(id: BlockTypeId): BlockType | undefined {
  return VOX_BLOCK_TYPES.find((b) => b.id === id);
}

/**
 * Versão de palco das cores dos blocos.
 *
 * As cores acima são calibradas para o Parchment (#F9F7F4). Sobre o fundo do
 * palco a maioria despenca: `conclusao` usa --vox-ink e chega a 1.01:1, ou seja,
 * some. Aqui cada bloco mantém sua família cromática, com a luminosidade
 * ajustada para a superfície escura — todos acima de 4.5:1.
 */
const STAGE_COLORS: Record<BlockTypeId, string> = {
  texto_biblico: "var(--vox-gold)", // já clareado no bloco .stage do globals.css
  introducao: "#5FBF7F",
  contexto: "#9FB0C4",
  proposicao: "#5FBF7F",
  ponto_principal: "#5FBF7F",
  subponto: "#7FD199",
  desenvolvimento: "#A3B2C4",
  ilustracao: "#B18CF5",
  aplicacao: "#4FC0C0",
  citacao: "#F0A93C",
  pergunta_retorica: "#C79BF7",
  transicao: "#D6DEE6",
  conclusao: "#E4E2DD",
  oracao: "#8FD1A6",
  notas_pessoais: "#9BB0AA",
};

/** Cor do bloco para a superfície em uso. */
export function blockColor(id: BlockTypeId, onStage: boolean): string {
  if (onStage) return STAGE_COLORS[id];
  return getBlockType(id)?.color ?? "var(--vox-muted)";
}
