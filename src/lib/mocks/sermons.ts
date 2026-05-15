// Tipos compartilhados de sermão/série usados pelas Views.
// Os dados reais vêm do Supabase via src/lib/sermons/queries.ts.
// Antes do MVP existir, este arquivo trazia exemplos pra UI rodar sem backend —
// já foi removido. Mantemos só os tipos e helpers de conteúdo.

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

/** Retorna o `content` (sessões) de um sermão; cria do esqueleto se ausente. */
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

export const MOCK_SERIES: readonly MockSeries[] = [];

export const MOCK_SERMONS: readonly MockSermon[] = [];

export function recentSermons(limit = 5): readonly MockSermon[] {
  return [...MOCK_SERMONS]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, limit);
}
