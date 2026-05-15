// Mocks de versões pra demo (sem Supabase). Cada sermão tem 3 snapshots fictícios.

export interface MockVersion {
  id: string;
  title: string;
  word_count: number;
  note: string | null;
  created_at: string;
}

const VERSIONS_BY_SERMON: Record<string, MockVersion[]> = {
  "s-001": [
    {
      id: "v-001-3",
      title: "Paz com Deus por meio de Cristo",
      word_count: 1842,
      note: "Adicionei ilustração do devedor e revisei a aplicação final",
      created_at: "2026-05-03T22:14:00Z",
    },
    {
      id: "v-001-2",
      title: "Paz com Deus por meio de Cristo",
      word_count: 1620,
      note: "Primeira passada completa, ainda sem ilustração",
      created_at: "2026-05-01T09:30:00Z",
    },
    {
      id: "v-001-1",
      title: "Romanos 5:1 — rascunho inicial",
      word_count: 480,
      note: "Versão inicial com pontos principais só",
      created_at: "2026-04-28T09:00:00Z",
    },
  ],
  "s-002": [
    {
      id: "v-002-2",
      title: "A esperança que não envergonha",
      word_count: 612,
      note: null,
      created_at: "2026-05-12T18:32:00Z",
    },
    {
      id: "v-002-1",
      title: "Romanos 5:3 — esboço inicial",
      word_count: 210,
      note: "Rascunho inicial — só os blocos do framework",
      created_at: "2026-05-10T10:00:00Z",
    },
  ],
};

export function getMockVersions(sermonId: string): MockVersion[] {
  return VERSIONS_BY_SERMON[sermonId] ?? [];
}
