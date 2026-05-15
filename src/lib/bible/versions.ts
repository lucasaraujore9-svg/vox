// Versões bíblicas suportadas pela API abibliadigital.com.br.
// Apenas as PT-BR são expostas na UI; ACF é o default editorial do VOX.

export type BibleVersionId = "acf" | "nvi" | "ra" | "apee";

export interface BibleVersion {
  id: BibleVersionId;
  /** Como aparece no Select (abreviação) */
  abbreviation: string;
  /** Nome completo */
  name: string;
  /** Curiosidade pra o pastor: ano de publicação ou nota */
  note?: string;
}

export const BIBLE_VERSIONS: readonly BibleVersion[] = [
  {
    id: "acf",
    abbreviation: "ACF",
    name: "Almeida Corrigida Fiel",
    note: "Versão tradicional, base Textus Receptus",
  },
  {
    id: "nvi",
    abbreviation: "NVI",
    name: "Nova Versão Internacional",
    note: "Tradução contemporânea, base eclética",
  },
  {
    id: "ra",
    abbreviation: "RA",
    name: "Almeida Revista e Atualizada",
    note: "Atualização da Almeida tradicional",
  },
  {
    id: "apee",
    abbreviation: "APEE",
    name: "Almeida Português Europeu",
    note: "Português europeu",
  },
];

export const DEFAULT_VERSION: BibleVersionId = "acf";

export function getVersion(id: string): BibleVersion | undefined {
  return BIBLE_VERSIONS.find((v) => v.id === id);
}
