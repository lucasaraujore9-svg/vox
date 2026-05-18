// Issue 010, Estudo Guiado UI proto (lista de trilhas). Behavior em 042.

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Estudo guiado" };

const MOCK_MODULES = [
  {
    id: "m-001",
    title: "Fundamentos da Pregação Expositiva",
    description:
      "Como ler um texto bíblico e construir um sermão fiel à sua intenção original.",
    category: "homilética",
    hours: 8.0,
    sessions: 6,
    progress: 40,
  },
  {
    id: "m-002",
    title: "Hermenêutica para Pregadores",
    description: "Princípios de interpretação aplicados ao púlpito moderno.",
    category: "hermenêutica",
    hours: 10.0,
    sessions: 8,
    progress: 0,
  },
  {
    id: "m-003",
    title: "Voz e Presença no Púlpito",
    description: "Comunicação não-verbal, ritmo, pausas e gestão de energia.",
    category: "comunicação",
    hours: 6.0,
    sessions: 5,
    progress: 100,
  },
  {
    id: "m-004",
    title: "Liderança Pastoral em Crises",
    description: "Como conduzir a congregação em momentos de luto, conflito e mudança.",
    category: "liderança",
    hours: 7.5,
    sessions: 6,
    progress: 12,
  },
];

const CATEGORY_COLOR: Record<string, string> = {
  "homilética": "var(--vox-forest)",
  "hermenêutica": "var(--vox-fw-textual)",
  "teologia": "var(--vox-fw-narrativo)",
  "comunicação": "var(--vox-gold)",
  "liderança": "var(--vox-fw-topico)",
  "discipulado": "var(--vox-fw-livre)",
};

export default function StudyIndexPage() {
  return (
    <div className="space-y-8 max-w-6xl">
      <header>
        <p className="vox-eyebrow">Formação</p>
        <h1 className="vox-h1 mt-3">Estudo guiado</h1>
        <p className="vox-body mt-3 max-w-xl">
          Trilhas curtas para afiar a homilética, a hermenêutica e a presença pastoral. Cada
          sessão termina com notas em blocos e a opção de gerar um sermão a partir delas.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MOCK_MODULES.map((module) => {
          const accent = CATEGORY_COLOR[module.category] ?? "var(--vox-forest)";
          const done = module.progress >= 100;
          return (
            <Card key={module.id} className="relative">
              <span
                className="absolute left-0 top-6 bottom-6 w-1 rounded-r"
                style={{ background: accent }}
                aria-hidden
              />
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: accent }}
                    />
                    <p className="vox-eyebrow capitalize" style={{ color: accent }}>
                      {module.category}
                    </p>
                  </div>
                  {done ? (
                    <Badge variant="secondary" className="text-xs font-normal">
                      Concluído
                    </Badge>
                  ) : module.progress > 0 ? (
                    <Badge variant="secondary" className="text-xs font-normal">
                      {module.progress}%
                    </Badge>
                  ) : null}
                </div>
                <CardTitle className="mt-3 text-lg">
                  <Link href={`/study/${module.id}`} className="hover:text-vox-forest">
                    {module.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="vox-body text-sm">{module.description}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="vox-mono text-xs text-vox-muted">
                    {module.sessions} sessões · {module.hours.toLocaleString("pt-BR")}h
                  </span>
                  <Link
                    href={`/study/${module.id}`}
                    className="text-sm font-medium hover:underline underline-offset-4"
                    style={{ color: accent }}
                  >
                    {done ? "Revisar" : module.progress > 0 ? "Continuar" : "Começar"} →
                  </Link>
                </div>
                {module.progress > 0 && module.progress < 100 ? (
                  <div
                    className="mt-4 h-1 rounded-full overflow-hidden"
                    style={{ background: "var(--vox-whisper)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${module.progress}%`, background: accent }}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
