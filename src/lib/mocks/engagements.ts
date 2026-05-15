// Mocks de pregações pra demo (sem Supabase).

export interface MockEngagement {
  id: string;
  preached_at: string;
  location: string | null;
  audience_size: number | null;
  rating: number | null;
  feedback: string | null;
}

const BY_SERMON: Record<string, MockEngagement[]> = {
  "s-001": [
    {
      id: "e-001-1",
      preached_at: "2026-05-04",
      location: "Igreja Central · Culto matinal",
      audience_size: 180,
      rating: 4,
      feedback:
        "Ficou bom. A ilustração do devedor foi mais forte do que eu esperava — a sala respirou. Aplicação final ainda saiu apressada; pra próxima, separar 2 minutos a mais antes da oração.",
    },
  ],
  "s-004": [
    {
      id: "e-004-1",
      preached_at: "2026-02-09",
      location: "Pequeno grupo · Casa do Pedro",
      audience_size: 14,
      rating: 5,
      feedback:
        "Discussão muito viva. As pessoas chegaram com perguntas próprias sobre a fala da semana. Vou pregar de novo no domingo de manhã com aplicação corporativa.",
    },
    {
      id: "e-004-2",
      preached_at: "2026-02-16",
      location: "Igreja Central · Culto matinal",
      audience_size: 220,
      rating: 4,
      feedback:
        "Adaptei pra culto, mas senti que perdeu intimidade. O texto pede grupo pequeno. Não pregar de novo em culto sem revisar a estrutura.",
    },
  ],
  "s-005": [
    {
      id: "e-005-1",
      preached_at: "2026-03-15",
      location: "Conferência de liderança · São Paulo",
      audience_size: 340,
      rating: 5,
      feedback:
        "Conversas de corredor depois foram as mais valiosas. Três líderes pediram pra continuar o assunto em mentoria. A palestra abriu mais portas do que o sermão.",
    },
  ],
};

export function getMockEngagements(sermonId: string): MockEngagement[] {
  return BY_SERMON[sermonId] ?? [];
}
