"use client";

// Aside de filtros do /sermons. Desktop (lg+): renderiza inline.
// Mobile/tablet (<lg): renderiza um botão que abre um Sheet com os mesmos filtros.

import { useState } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CONTENT_TYPES } from "@/lib/mocks/content-types";
import { VOX_FRAMEWORKS, type FrameworkId } from "@/lib/mocks/frameworks";
import type { ContentType, SermonType } from "@/types/database";

export interface FiltersState {
  q?: string;
  framework?: FrameworkId;
  content?: ContentType;
  type?: SermonType;
  series?: string;
  sort?: "recent" | "oldest" | "title" | "preached";
  view?: "flat" | "grouped";
}

export interface SeriesOption {
  id: string;
  title: string;
  sermon_count: number;
}

interface Props {
  filters: FiltersState;
  series: SeriesOption[];
}

function buildUrl(
  base: FiltersState,
  key: keyof FiltersState,
  value: string | undefined
): string {
  const next = { ...base, [key]: value };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (v) params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `/sermons?${qs}` : "/sermons";
}

function FiltersContent({ filters, series }: Props) {
  const activeCount = Object.entries(filters).filter(
    ([k, v]) => v && k !== "view"
  ).length;

  return (
    <div className="space-y-7">
      <form className="space-y-2">
        <label htmlFor="q" className="vox-eyebrow">
          Buscar
        </label>
        <Input
          id="q"
          name="q"
          type="search"
          defaultValue={filters.q ?? ""}
          placeholder="Título, referência, tema…"
          autoComplete="off"
        />
        {Object.entries(filters).map(([k, v]) =>
          k !== "q" && v ? <input key={k} type="hidden" name={k} value={String(v)} /> : null
        )}
      </form>

      <div>
        <p className="vox-eyebrow mb-3">Tipo</p>
        <div className="flex flex-wrap gap-2">
          {CONTENT_TYPES.map((t) => {
            const active = filters.content === t.id;
            return (
              <Link
                key={t.id}
                href={buildUrl(filters, "content", active ? undefined : t.id)}
              >
                <Badge
                  variant={active ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1.5 text-xs font-normal"
                >
                  {t.label}
                </Badge>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <p className="vox-eyebrow mb-3">Framework</p>
        <div className="flex flex-wrap gap-2">
          {VOX_FRAMEWORKS.map((fw) => {
            const active = filters.framework === fw.id;
            return (
              <Link
                key={fw.id}
                href={buildUrl(filters, "framework", active ? undefined : fw.id)}
              >
                <Badge
                  variant={active ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1.5 text-xs font-normal"
                  style={{
                    borderColor: `var(--vox-fw-${fw.id})`,
                    color: active ? undefined : `var(--vox-fw-${fw.id})`,
                    background: active ? `var(--vox-fw-${fw.id})` : undefined,
                  }}
                >
                  {fw.name}
                </Badge>
              </Link>
            );
          })}
        </div>
      </div>

      {series.length > 0 ? (
        <div>
          <p className="vox-eyebrow mb-3">Série</p>
          <div className="flex flex-col gap-2 text-sm">
            {series.map((s) => {
              const active = filters.series === s.id;
              return (
                <Link
                  key={s.id}
                  href={buildUrl(filters, "series", active ? undefined : s.id)}
                  className={
                    active
                      ? "text-vox-forest font-medium"
                      : "text-vox-prose hover:text-vox-ink"
                  }
                >
                  {s.title}{" "}
                  <span className="vox-mono text-xs text-vox-muted">
                    ({s.sermon_count})
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      {activeCount > 0 ? (
        <Link
          href="/sermons"
          className="text-xs text-vox-muted underline-offset-4 hover:underline"
        >
          Limpar filtros
        </Link>
      ) : null}
    </div>
  );
}

export function SermonFiltersAside(props: Props) {
  const [open, setOpen] = useState(false);
  const activeCount = Object.entries(props.filters).filter(
    ([k, v]) => v && k !== "view"
  ).length;

  return (
    <aside className="lg:w-[220px] lg:shrink-0">
      <div className="lg:hidden mb-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="size-4" />
              Filtros
              {activeCount > 0 ? (
                <span
                  className="vox-mono text-[10px] rounded-full px-1.5 py-0.5 ml-1"
                  style={{ background: "var(--vox-forest)", color: "#fff" }}
                >
                  {activeCount}
                </span>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[320px] sm:w-[380px] flex flex-col"
            style={{ background: "var(--vox-bg)" }}
          >
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto pr-1 mt-2 flex-1">
              <FiltersContent {...props} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden lg:block">
        <FiltersContent {...props} />
      </div>
    </aside>
  );
}
