// Mocks de sermões e séries para protos de UI.
// Substituídos pela leitura real em behavior issues 030/032/045/049.

import type { ContentType, SermonStatus, SermonType } from "@/types/database";
import type { FrameworkId } from "./frameworks";
import type { SermonContent } from "@/lib/sermons/sessions";
import { emptyContentFor } from "@/lib/sermons/sessions";

export interface MockSermon {
  id: string;
  title: string;
  framework: FrameworkId;
  type: SermonType;
  content_type: ContentType;
  bible_ref: string;
  bible_book: string;
  status: SermonStatus;
  tags: string[];
  word_count: number;
  preview: string;
  series?: { id: string; title: string };
  preached_at: string | null;
  updated_at: string;
  created_at: string;
  /** Estrutura de sessões pronta pro editor (carregada sob demanda) */
  content?: SermonContent;
}

/** Retorna o `content` (sessões) de um sermão mock; cria do esqueleto se ausente. */
export function mockSermonContent(sermon: MockSermon): SermonContent {
  return sermon.content ?? emptyContentFor(sermon.framework);
}

export interface MockSeries {
  id: string;
  title: string;
  description: string;
  sermon_count: number;
  created_at: string;
}

export const MOCK_SERIES: readonly MockSeries[] = [
  {
    id: "ser-001",
    title: "Romanos — A Justificação pela Fé",
    description: "Cinco sermões caminhando pelos capítulos 3 a 8 de Romanos.",
    sermon_count: 4,
    created_at: "2026-01-04T12:00:00Z",
  },
  {
    id: "ser-002",
    title: "Provérbios para a vida cotidiana",
    description: "Série de aulas sobre sabedoria prática em Provérbios.",
    sermon_count: 6,
    created_at: "2025-11-12T12:00:00Z",
  },
  {
    id: "ser-003",
    title: "Advento 2026",
    description: "Três sermões preparatórios para o Natal.",
    sermon_count: 2,
    created_at: "2026-04-20T12:00:00Z",
  },
];

export const MOCK_SERMONS: readonly MockSermon[] = [
  {
    id: "s-001",
    title: "Paz com Deus por meio de Cristo",
    framework: "expositivo",
    type: "esboço",
    content_type: "sermão",
    bible_ref: "Romanos 5:1—11",
    bible_book: "Romanos",
    status: "pronto",
    tags: ["justificação", "fé", "graça"],
    word_count: 1842,
    preview:
      "Justificados, pois, pela fé, temos paz com Deus por meio do nosso Senhor Jesus Cristo…",
    series: { id: "ser-001", title: "Romanos — A Justificação pela Fé" },
    preached_at: "2026-05-04",
    updated_at: "2026-05-03T22:14:00Z",
    created_at: "2026-04-28T09:00:00Z",
  },
  {
    id: "s-002",
    title: "A esperança que não envergonha",
    framework: "expositivo",
    type: "esboço",
    content_type: "sermão",
    bible_ref: "Romanos 5:3—5",
    bible_book: "Romanos",
    status: "rascunho",
    tags: ["esperança", "perseverança"],
    word_count: 612,
    preview:
      "Não apenas isto, mas também nos gloriamos nas tribulações, sabendo que a tribulação produz perseverança…",
    series: { id: "ser-001", title: "Romanos — A Justificação pela Fé" },
    preached_at: null,
    updated_at: "2026-05-12T18:32:00Z",
    created_at: "2026-05-10T10:00:00Z",
  },
  {
    id: "s-003",
    title: "Adão e Cristo — dois caminhos, um Senhor",
    framework: "textual",
    type: "esboço",
    content_type: "sermão",
    bible_ref: "Romanos 5:12—21",
    bible_book: "Romanos",
    status: "rascunho",
    tags: ["antropologia", "redenção"],
    word_count: 423,
    preview: "Como por um homem entrou o pecado no mundo, e pelo pecado a morte…",
    series: { id: "ser-001", title: "Romanos — A Justificação pela Fé" },
    preached_at: null,
    updated_at: "2026-05-13T11:00:00Z",
    created_at: "2026-05-11T14:00:00Z",
  },
  {
    id: "s-004",
    title: "Sabedoria para a língua",
    framework: "tematico",
    type: "esboço",
    content_type: "aula",
    bible_ref: "Provérbios 18:21",
    bible_book: "Provérbios",
    status: "pronto",
    tags: ["sabedoria", "fala", "relacionamentos"],
    word_count: 1320,
    preview: "A morte e a vida estão no poder da língua…",
    series: { id: "ser-002", title: "Provérbios para a vida cotidiana" },
    preached_at: "2026-02-09",
    updated_at: "2026-02-08T20:00:00Z",
    created_at: "2026-02-05T09:00:00Z",
  },
  {
    id: "s-005",
    title: "Liderança em tempos de pressão",
    framework: "topico",
    type: "apresentação",
    content_type: "palestra",
    bible_ref: "Êxodo 18",
    bible_book: "Êxodo",
    status: "pronto",
    tags: ["liderança", "ministério"],
    word_count: 980,
    preview:
      "Não convém o que fazes; sem dúvida desfalecerás, assim tu como este povo que está contigo…",
    preached_at: "2026-03-15",
    updated_at: "2026-03-14T16:00:00Z",
    created_at: "2026-03-01T09:00:00Z",
  },
  {
    id: "s-006",
    title: "Maria magnífica — uma teologia que canta",
    framework: "narrativo",
    type: "esboço",
    content_type: "sermão",
    bible_ref: "Lucas 1:46—55",
    bible_book: "Lucas",
    status: "rascunho",
    tags: ["advento", "encarnação"],
    word_count: 287,
    preview: "Minha alma engrandece ao Senhor, e o meu espírito se alegrou em Deus, meu Salvador…",
    series: { id: "ser-003", title: "Advento 2026" },
    preached_at: null,
    updated_at: "2026-04-25T19:00:00Z",
    created_at: "2026-04-20T12:00:00Z",
  },
  {
    id: "s-007",
    title: "Como ler Provérbios em três passos",
    framework: "topico",
    type: "apresentação",
    content_type: "aula",
    bible_ref: "Provérbios 15:1 · 26:4—5",
    bible_book: "Provérbios",
    status: "pronto",
    tags: ["hermenêutica", "sabedoria", "aula"],
    word_count: 760,
    preview:
      "Três passos práticos para ler Provérbios sem cair em pragmatismo nem em moralismo.",
    series: { id: "ser-002", title: "Provérbios para a vida cotidiana" },
    preached_at: "2026-04-08",
    updated_at: "2026-04-07T18:00:00Z",
    created_at: "2026-04-01T10:00:00Z",
  },
];

export function recentSermons(limit = 5): readonly MockSermon[] {
  return [...MOCK_SERMONS]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, limit);
}
