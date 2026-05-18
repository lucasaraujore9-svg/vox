// Tipos de conteúdo: Sermão, Palestra, Aula.
// Paridade com architecture.md, coluna content_type em sermons.

import type { ContentType } from "@/types/database";

export interface ContentTypeMeta {
  id: ContentType;
  label: string;
  description: string;
  defaultFrameworkHint: string;
}

export const CONTENT_TYPES: readonly ContentTypeMeta[] = [
  {
    id: "sermão",
    label: "Sermão",
    description: "Pregação em culto ou celebração.",
    defaultFrameworkHint: "Expositivo, Textual ou Narrativo",
  },
  {
    id: "palestra",
    label: "Palestra",
    description: "Comunicação em evento ou conferência.",
    defaultFrameworkHint: "Temático ou Tópico",
  },
  {
    id: "aula",
    label: "Aula",
    description: "Ensino em célula, escola bíblica ou curso.",
    defaultFrameworkHint: "Textual ou Expositivo",
  },
];
