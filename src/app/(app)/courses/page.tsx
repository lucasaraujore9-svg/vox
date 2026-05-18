// Issue 009 (parcial), listagem de cursos. Editor entra em /courses/[id].

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Cursos" };

const MOCK_COURSES = [
  {
    id: "c-001",
    title: "Provérbios para a vida cotidiana",
    ementa: "Estudo sistemático de Provérbios em 8 aulas, com aplicação prática para discípulos.",
    hours: 12.0,
    status: "rascunho" as const,
    lesson_count: 4,
  },
  {
    id: "c-002",
    title: "Hermenêutica para pregadores",
    ementa: "Princípios de interpretação aplicados ao púlpito moderno.",
    hours: 16.0,
    status: "publicado" as const,
    lesson_count: 8,
  },
];

const STATUS_LABEL = {
  rascunho: "Rascunho",
  pronto: "Pronto",
  publicado: "Publicado",
} as const;

export default function CoursesPage() {
  return (
    <div className="space-y-8 max-w-6xl">
      <header className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <p className="vox-eyebrow">Educação</p>
          <h1 className="vox-h1 mt-3">Cursos</h1>
          <p className="vox-body mt-3 max-w-xl">
            Organize aulas em trilhas com ementa, objetivos de aprendizagem e carga horária.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/courses/new">Novo curso</Link>
        </Button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MOCK_COURSES.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs font-normal">
                  {STATUS_LABEL[course.status]}
                </Badge>
                <span className="vox-mono text-xs text-vox-muted">
                  {course.hours.toLocaleString("pt-BR")}h
                </span>
              </div>
              <CardTitle className="mt-3 text-lg">
                <Link href={`/courses/${course.id}`} className="hover:text-vox-forest">
                  {course.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="vox-body text-sm">{course.ementa}</p>
              <p className="vox-mono text-xs text-vox-muted mt-5">
                {course.lesson_count} aulas vinculadas
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
