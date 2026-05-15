"use client";

// Step "Vincular" do wizard /sermons/new.
// Permite escolher uma série/curso existente, criar nova, ou pular.
// content_type='aula' mostra ambos (série + curso); demais só série.

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ContentType } from "@/types/database";
import { cn } from "@/lib/utils";

interface SeriesOption {
  id: string;
  title: string;
  sermon_count: number;
}

interface CourseOption {
  id: string;
  title: string;
  lessons: number;
}

export interface LinkSelection {
  /** id da série escolhida (null = sem vínculo) */
  seriesId: string | null;
  /** id do curso (só se content_type=aula) */
  courseId: string | null;
  /** nome de série nova a criar (se pastor escolheu "Nova série") */
  newSeriesTitle?: string;
}

interface LinkPickerProps {
  contentType: ContentType;
  value: LinkSelection;
  onChange: (selection: LinkSelection) => void;
}

type Mode = "none" | "existing" | "new";

export function LinkPicker({ contentType, value, onChange }: LinkPickerProps) {
  const [mode, setMode] = useState<Mode>(
    value.seriesId || value.courseId ? "existing" : value.newSeriesTitle ? "new" : "none"
  );
  const [series, setSeries] = useState<SeriesOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/series-and-courses", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { series: [], courses: [] }))
      .then((data: { series?: SeriesOption[]; courses?: CourseOption[] }) => {
        if (cancelled) return;
        setSeries(data.series ?? []);
        setCourses(data.courses ?? []);
      })
      .catch(() => {
        // silencioso — usuário ainda pode criar nova série
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function set(s: Partial<LinkSelection>) {
    onChange({ ...value, ...s });
  }

  return (
    <div className="space-y-7 max-w-2xl">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={mode === "none" ? "default" : "outline"}
          onClick={() => {
            setMode("none");
            onChange({ seriesId: null, courseId: null });
          }}
        >
          Sem vínculo
        </Button>
        <Button
          type="button"
          variant={mode === "existing" ? "default" : "outline"}
          onClick={() => setMode("existing")}
        >
          Vincular a {contentType === "aula" ? "série ou curso" : "série"} existente
        </Button>
        <Button
          type="button"
          variant={mode === "new" ? "default" : "outline"}
          onClick={() => {
            setMode("new");
            onChange({ seriesId: null, courseId: null, newSeriesTitle: "" });
          }}
        >
          Criar série nova
        </Button>
      </div>

      {mode === "none" ? (
        <p className="vox-body text-sm">
          Manuscrito independente. Você pode vincular depois pelo editor.
        </p>
      ) : null}

      {mode === "existing" ? (
        <div className="space-y-6">
          {series.length === 0 && courses.length === 0 ? (
            <p className="vox-body text-sm text-vox-muted">
              Você ainda não tem séries ou cursos. Use{" "}
              <em>Criar série nova</em> ao lado pra começar.
            </p>
          ) : null}
          {series.length > 0 ? (
          <section>
            <p className="vox-eyebrow mb-3">Séries</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {series.map((s) => {
                const selected = value.seriesId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      set({
                        seriesId: selected ? null : s.id,
                        courseId: null,
                      })
                    }
                    className={cn(
                      "text-left rounded-xl p-4 transition-all",
                      "bg-card border"
                    )}
                    style={{
                      borderColor: selected ? "var(--vox-forest)" : "var(--vox-whisper)",
                      borderWidth: selected ? "1.5px" : "1px",
                      boxShadow: selected
                        ? "var(--vox-shadow-card-hover)"
                        : "var(--vox-shadow-card)",
                    }}
                  >
                    <p className="font-medium text-sm">{s.title}</p>
                    <p className="vox-mono text-xs text-vox-muted mt-1">
                      {s.sermon_count} conteúdos
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
          ) : null}

          {contentType === "aula" && courses.length > 0 ? (
            <section>
              <p className="vox-eyebrow mb-3">Cursos</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {courses.map((c) => {
                  const selected = value.courseId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        set({
                          courseId: selected ? null : c.id,
                          seriesId: null,
                        })
                      }
                      className={cn(
                        "text-left rounded-xl p-4 transition-all",
                        "bg-card border"
                      )}
                      style={{
                        borderColor: selected ? "var(--vox-forest)" : "var(--vox-whisper)",
                        borderWidth: selected ? "1.5px" : "1px",
                        boxShadow: selected
                          ? "var(--vox-shadow-card-hover)"
                          : "var(--vox-shadow-card)",
                      }}
                    >
                      <p className="font-medium text-sm">{c.title}</p>
                      <p className="vox-mono text-xs text-vox-muted mt-1">
                        {c.lessons} aulas
                      </p>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-vox-muted mt-3">
                Vincular a um curso adiciona esta aula ao currículo (entra como próxima aula da lista).
              </p>
            </section>
          ) : null}
        </div>
      ) : null}

      {mode === "new" ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-series">Nome da nova série</Label>
              <Input
                id="new-series"
                value={value.newSeriesTitle ?? ""}
                onChange={(e) => set({ newSeriesTitle: e.target.value })}
                placeholder="Ex: Romanos — A Justificação pela Fé"
                autoFocus
              />
            </div>
            <p className="text-xs text-vox-muted">
              A série será criada ao salvar o manuscrito. Você poderá vincular outros sermões a
              ela depois.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
