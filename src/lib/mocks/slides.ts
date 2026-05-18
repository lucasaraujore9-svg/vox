// Tipos compartilhados de slide. Os dados reais vêm do Supabase
// (tabelas slides + sermon_slides + storage bucket sermon-slides).
// Antes do MVP existir, este arquivo trazia exemplos pra UI rodar sem backend,
// já foi removido. Mantemos só o tipo e a função getter (que retorna []).

import type { SermonContent } from "@/lib/sermons/sessions";

export interface MockSlide {
  id: string;
  order: number;
  image_url?: string;
  comment_items: SermonContent;
}

export const MOCK_SLIDES_BY_SERMON: Record<string, MockSlide[]> = {};

export function getMockSlides(_sermonId: string): MockSlide[] {
  return [];
}
