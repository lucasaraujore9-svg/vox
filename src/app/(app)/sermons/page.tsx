// Issue 003 (proto) + 032 (behavior) — Banco de Conteúdo com busca + filtros via URL state.

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContentCard } from "@/components/sermon/ContentCard";
import { listSermons } from "@/lib/sermons/queries";
import type { MockSermon } from "@/lib/mocks/sermons";
import { VOX_FRAMEWORKS, type FrameworkId } from "@/lib/mocks/frameworks";
import { CONTENT_TYPES } from "@/lib/mocks/content-types";
import { createClient } from "@/lib/supabase/server";
import type { ContentType, SermonStatus, SermonType } from "@/types/database";

export const metadata = { title: "Banco" };

interface PageProps {
  searchParams: Promise<{
    q?: string;
    framework?: FrameworkId;
    content?: ContentType;
    type?: SermonType;
    series?: string;
    sort?: "recent" | "oldest" | "title" | "preached";
    view?: "flat" | "grouped";
  }>;
}

async function loadSermons(filters: Awaited<PageProps["searchParams"]>): Promise<MockSermon[]> {
  const useSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (useSupabase) {
    try {
      const rows = await listSermons({
        search: filters.q,
        framework: filters.framework,
        contentType: filters.content,
        type: filters.type,
        seriesId: filters.series,
        sort: filters.sort ?? "recent",
        limit: 60,
      });
      return rows.map((s) => ({
        id: s.id,
        title: s.title,
        framework: s.framework as FrameworkId,
        type: s.type as SermonType,
        content_type: s.content_type as ContentType,
        bible_ref: s.bible_ref ?? "",
        bible_book: s.bible_book ?? "",
        status: s.status as SermonStatus,
        tags: s.tags ?? [],
        word_count: s.word_count ?? 0,
        preview: "",
        preached_at: s.preached_at,
        updated_at: s.updated_at,
        created_at: s.created_at,
      }));
    } catch {
      // Supabase indisponível — retorna vazio
    }
  }
  return [];
}

interface SeriesRow {
  id: string;
  title: string;
  sermon_count: number;
}

async function loadSeries(): Promise<SeriesRow[]> {
  const useSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!useSupabase) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("series")
      .select("id, title, sermon_count")
      .order("created_at", { ascending: false });
    return (data as SeriesRow[] | null) ?? [];
  } catch {
    return [];
  }
}

function buildUrl(base: Record<string, string | undefined>, key: string, value: string | undefined): string {
  const next = { ...base, [key]: value };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/sermons?${qs}` : "/sermons";
}

export default async function SermonsBankPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const [sermons, seriesList] = await Promise.all([
    loadSermons(filters),
    loadSeries(),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <p className="vox-eyebrow">Arquivo</p>
          <h1 className="vox-h1 mt-3">Esboços</h1>
          <p className="vox-body mt-3 max-w-xl">
            Todo o seu ministério em um lugar — sermões, palestras e aulas.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/sermons/new">Novo manuscrito</Link>
        </Button>
      </header>

      <section className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-8">
        <aside className="space-y-7">
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
              k !== "q" && v ? <input key={k} type="hidden" name={k} value={v} /> : null
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

          {seriesList.length > 0 ? (
            <div>
              <p className="vox-eyebrow mb-3">Série</p>
              <div className="space-y-2 text-sm flex flex-col">
                {seriesList.map((s) => {
                  const active = filters.series === s.id;
                  return (
                    <Link
                      key={s.id}
                      href={buildUrl(filters, "series", active ? undefined : s.id)}
                      className={active ? "text-vox-forest font-medium" : "text-vox-prose hover:text-vox-ink"}
                    >
                      {s.title}{" "}
                      <span className="vox-mono text-xs text-vox-muted">({s.sermon_count})</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}

          {Object.keys(filters).length > 0 ? (
            <Link href="/sermons" className="text-xs text-vox-muted underline-offset-4 hover:underline">
              Limpar filtros
            </Link>
          ) : null}
        </aside>

        <div>
          <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
            <p className="vox-mono text-xs text-vox-muted">
              {sermons.length} manuscritos {filters.q ? `· busca "${filters.q}"` : ""}
            </p>
            <div
              className="inline-flex rounded-md border p-0.5"
              style={{ borderColor: "var(--vox-whisper)" }}
            >
              <Link
                href={buildUrl(filters, "view", undefined)}
                className="vox-mono text-xs px-3 py-1 rounded-sm transition-colors"
                style={{
                  background:
                    filters.view !== "grouped" ? "var(--vox-forest)" : "transparent",
                  color: filters.view !== "grouped" ? "#fff" : "var(--vox-prose)",
                }}
              >
                Recentes
              </Link>
              <Link
                href={buildUrl(filters, "view", "grouped")}
                className="vox-mono text-xs px-3 py-1 rounded-sm transition-colors"
                style={{
                  background:
                    filters.view === "grouped" ? "var(--vox-forest)" : "transparent",
                  color: filters.view === "grouped" ? "#fff" : "var(--vox-prose)",
                }}
              >
                Por série
              </Link>
            </div>
          </div>

          {sermons.length === 0 ? (
            <p className="vox-body text-center py-12 text-vox-muted">
              Nenhum manuscrito encontrado com esses filtros.
            </p>
          ) : filters.view === "grouped" ? (
            <GroupedView sermons={sermons} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {sermons.map((sermon) => (
                <ContentCard key={sermon.id} sermon={sermon} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/** Agrupa sermons por série, com seção "Sem série" no fim. */
function GroupedView({ sermons }: { sermons: MockSermon[] }) {
  const groups = new Map<string, { title: string; description?: string; items: MockSermon[] }>();
  const orphans: MockSermon[] = [];

  for (const sermon of sermons) {
    if (!sermon.series) {
      orphans.push(sermon);
      continue;
    }
    const existing = groups.get(sermon.series.id);
    if (existing) {
      existing.items.push(sermon);
    } else {
      groups.set(sermon.series.id, {
        title: sermon.series.title,
        items: [sermon],
      });
    }
  }

  return (
    <div className="space-y-10">
      {Array.from(groups.entries()).map(([id, group]) => (
        <section key={id}>
          <header className="flex items-end justify-between mb-4">
            <div>
              <p className="vox-eyebrow text-xs">Série</p>
              <h3 className="vox-h3 mt-1.5 text-lg">{group.title}</h3>
            </div>
            <span className="vox-mono text-xs text-vox-muted">
              {group.items.length} manuscritos
            </span>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {group.items.map((sermon) => (
              <ContentCard key={sermon.id} sermon={sermon} />
            ))}
          </div>
        </section>
      ))}
      {orphans.length > 0 ? (
        <section>
          <header className="flex items-end justify-between mb-4">
            <div>
              <p className="vox-eyebrow text-xs text-vox-muted">Avulsos</p>
              <h3 className="vox-h3 mt-1.5 text-lg">Sem série</h3>
            </div>
            <span className="vox-mono text-xs text-vox-muted">
              {orphans.length} manuscritos
            </span>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {orphans.map((sermon) => (
              <ContentCard key={sermon.id} sermon={sermon} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
