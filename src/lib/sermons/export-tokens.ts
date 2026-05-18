// Tokens visuais resolvidos para hex, usados nos builders de PDF/DOCX,
// que não entendem var(--vox-...) do CSS. Mantém a paridade com o editor.

import type { BlockTypeId } from "@/lib/mocks/blocks";

/** Cores principais do design-system, em hex (sem var). */
export const VOX_HEX = {
  ink: "#18181B",
  prose: "#3F3F46",
  muted: "#71717A",
  whisper: "#E5E1DA",
  bg: "#F9F7F4",
  surface: "#FFFFFF",
  forest: "#166534",
  forestMid: "#15803D",
  gold: "#B45309",
  goldSoft: "#FCEEDD",
  destructive: "#B91C1C",
} as const;

/** Cor hex por tipo de bloco, espelha VOX_BLOCK_TYPES, sem var(). */
export const BLOCK_COLOR_HEX: Record<BlockTypeId, string> = {
  texto_biblico: VOX_HEX.gold,
  introducao: VOX_HEX.forest,
  contexto: "#64748B",
  proposicao: VOX_HEX.forest,
  ponto_principal: VOX_HEX.forest,
  subponto: VOX_HEX.forestMid,
  desenvolvimento: "#475569",
  ilustracao: "#7C3AED",
  aplicacao: "#0D7C7C",
  citacao: "#D97706",
  pergunta_retorica: "#9333EA",
  transicao: "#94A3B8",
  conclusao: VOX_HEX.ink,
  oracao: "#3F8B5A",
  notas_pessoais: VOX_HEX.muted,
};

/** Cor da barra vertical da sessão por papel. */
export const SESSION_ROLE_HEX = {
  introducao: VOX_HEX.forest,
  topico: VOX_HEX.gold,
  conclusao: VOX_HEX.ink,
  livre: VOX_HEX.muted,
} as const;

/** Hex → componentes RGB 0–255 (jsPDF setTextColor). */
export function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const full = m.length === 3
    ? m.split("").map((c) => c + c).join("")
    : m;
  const n = parseInt(full, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}
