// Tipos compartilhados de "engagement" (registro de pregação/uso de sermão).
// Os dados reais vêm do Supabase (tabela sermon_engagements).
// Antes do MVP existir, este arquivo trazia exemplos, já foi removido.

export interface MockEngagement {
  id: string;
  preached_at: string;
  location: string | null;
  audience_size: number | null;
  rating: number | null;
  feedback: string | null;
}

export function getMockEngagements(_sermonId: string): MockEngagement[] {
  return [];
}
