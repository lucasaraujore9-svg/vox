// Issue 009 — Curso: Editor UI proto. Behavior em 041.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PageProps {
  params: Promise<{ id: string }>;
}

const MOCK_LESSONS = [
  { order: 1, title: "Introdução à sabedoria de Provérbios", hours: 1.5 },
  { order: 2, title: "A mulher virtuosa em Provérbios 31", hours: 1.5 },
  { order: 3, title: "Sabedoria para a língua (Pv 18:21)", hours: 1.5 },
  { order: 4, title: "Trabalho e diligência", hours: 1.5 },
];

export default async function CourseEditorPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-10">
      <main className="space-y-10 min-w-0">
        <header>
          <p className="vox-eyebrow">
            <Link href="/courses" className="hover:underline">Cursos</Link> · Editor
          </p>
          <Input
            defaultValue="Provérbios para a vida cotidiana"
            className="mt-3 border-0 px-0 focus-visible:ring-0 bg-transparent h-auto py-1"
            style={{
              fontFamily: "var(--vox-font-display)",
              fontWeight: 600,
              fontSize: "var(--vox-text-4xl)",
              letterSpacing: "-0.015em",
              color: "var(--vox-ink)",
            }}
          />
        </header>

        <section className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="ementa">Ementa</Label>
            <Textarea
              id="ementa"
              rows={4}
              defaultValue="Estudo sistemático de Provérbios em 8 aulas, com aplicação prática para discípulos em pequenos grupos."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="hours">Carga horária total</Label>
              <Input id="hours" defaultValue="12" type="number" step="0.5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                defaultValue="rascunho"
                className="w-full h-10 rounded-md border border-input px-3 text-sm bg-card"
              >
                <option value="rascunho">Rascunho</option>
                <option value="pronto">Pronto</option>
                <option value="publicado">Publicado</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Objetivos de aprendizagem</Label>
            <ul className="space-y-2">
              {[
                "Distinguir sabedoria bíblica de pragmatismo",
                "Aplicar Provérbios em decisões financeiras, relacionais e profissionais",
                "Liderar um pequeno grupo no estudo de Provérbios por 8 semanas",
              ].map((obj, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="vox-mono text-xs text-vox-muted w-6">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <Input defaultValue={obj} className="flex-1" />
                </li>
              ))}
              <li>
                <Button variant="ghost" size="sm" className="text-xs">
                  + Adicionar objetivo
                </Button>
              </li>
            </ul>
          </div>
        </section>

        <Separator />

        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="vox-eyebrow">Currículo</p>
              <h2 className="vox-h2 mt-2 text-2xl">Aulas vinculadas</h2>
            </div>
            <Button variant="outline" size="sm">
              + Vincular aula existente
            </Button>
          </div>
          <ol className="space-y-3">
            {MOCK_LESSONS.map((lesson) => (
              <li
                key={lesson.order}
                className="flex items-center gap-4 rounded-lg p-4 bg-card border"
                style={{ borderColor: "var(--vox-whisper)" }}
              >
                <span className="vox-mono text-sm text-vox-muted w-8">
                  {String(lesson.order).padStart(2, "0")}
                </span>
                <span className="flex-1">{lesson.title}</span>
                <span className="vox-mono text-xs text-vox-muted">
                  {lesson.hours.toLocaleString("pt-BR")}h
                </span>
                <Button variant="ghost" size="sm">
                  Editar
                </Button>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <aside className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm vox-eyebrow">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="vox-mono text-xs text-vox-muted">
              ID: {id}
            </p>
            <p className="vox-mono text-xs text-vox-muted mt-2">
              salvo há 12 segundos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm vox-eyebrow">Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              Exportar ementa
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              Duplicar curso
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-vox-destructive hover:text-vox-destructive"
            >
              Mover para lixeira
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
