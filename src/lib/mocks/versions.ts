// Tipos compartilhados de versão (histórico de manuscritos).
// Os dados reais vêm do Supabase (tabela sermon_versions).
// Antes do MVP existir, este arquivo trazia exemplos, já foi removido.

export interface MockVersion {
  id: string;
  title: string;
  word_count: number;
  note: string | null;
  created_at: string;
}

export function getMockVersions(_sermonId: string): MockVersion[] {
  return [];
}
