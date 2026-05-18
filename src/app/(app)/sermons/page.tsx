// Issue 003 (proto) + 032 (behavior), Banco de Conteúdo com busca + filtros via URL state.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/sermon/ContentCard";
import { SermonFiltersAside } from "@/components/sermon/SermonFiltersAside";
import { SeriesTreeView } from "@/components/sermon/SeriesTreeView";
import { listSermons } from "@/lib/sermons/queries";
import type { MockSermon } from "@/lib/mocks/sermons";
import type { FrameworkId } from "@/lib/mocks/frameworks";
import { createClient } from "@/lib/supabase/server";
import type { SeriesFlat } from "@/lib/series/tree";
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
    view?: "flat" | "grouped" | "arquivo";
  }>;
}

async function loadSermons(
  filters: Awaited<PageProps["searchParams"]>,
  seriesIndex: Map<string, { id: string; title: string }>
): Promise<MockSermon[]> {
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
        archived: filters.view === "arquivo" ? "archived" : "active",
        limit: 60,
      });
      return rows.map((s) => {
        const sid = (s as { series_id?: string | null }).series_id ?? null;
        const series = sid ? seriesIndex.get(sid) : undefined;
        return {
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
          series,
        };
      });
    } catch {
      // Supabase indisponível — retorna vazio
    }
  }
  return [];
}

async function loadSeries(): Promise<SeriesFlat[]> {
  const useSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!useSupabase) return [];
  try {
    const supabase = await createClient();
    // Embed agregado: PostgREST devolve sermons como array — contamos no app.
    const { data } = await supabase
      .from("series")
      .select("id, title, parent_id, sermons:sermons(id)")
      .order("title", { ascending: true });
    return (data ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      parent_id: s.parent_id ?? null,
      sermon_count: Array.isArray(s.sermons) ? s.sermons.length : 0,
    }));
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
  const seriesList = await loadSeries();
  const seriesIndex = new Map(
    seriesList.map((s) => [s.id, { id: s.id, title: s.title }] as const)
  );
  const sermons = await loadSermons(filters, seriesIndex);

  const isArchive = filters.view === "arquivo";

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <p className="vox-eyebrow">{isArchive ? "Arquivados" : "Arquivo"}</p>
          <h1 className="vox-h1 mt-3">
            {isArchive ? "Manuscritos arquivados" : "Esboços"}
          </h1>
          <p className="vox-body mt-3 max-w-xl">
            {isArchive
              ? "Manuscritos fora do banco principal. Você pode tirar do arquivo ou apagar permanentemente."
              : "Todo o seu ministério em um lugar, sermões, palestras e aulas."}
          </p>
        </div>
        {!isArchive ? (
          <Button asChild size="lg">
            <Link href="/sermons/new">Novo manuscrito</Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/sermons">← Voltar ao banco</Link>
          </Button>
        )}
      </header>

      <section className="flex flex-col lg:flex-row gap-8">
        {!isArchive ? (
          <SermonFiltersAside filters={filters} series={seriesList} />
        ) : null}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
            <p className="vox-mono text-xs text-vox-muted">
              {sermons.length} manuscritos {filters.q ? `· busca "${filters.q}"` : ""}
            </p>
            {!isArchive ? (
              <div className="flex items-center gap-3 flex-wrap">
                <div
                  className="inline-flex rounded-md border p-0.5"
                  style={{ borderColor: "var(--vox-whisper)" }}
                >
                  <Link
                    href={buildUrl(filters, "view", undefined)}
                    className="vox-mono text-xs px-3 py-1 rounded-sm transition-colors"
                    style={{
                      background:
                        filters.view !== "grouped"
                          ? "var(--vox-forest)"
                          : "transparent",
                      color:
                        filters.view !== "grouped" ? "#fff" : "var(--vox-prose)",
                    }}
                  >
                    Recentes
                  </Link>
                  <Link
                    href={buildUrl(filters, "view", "grouped")}
                    className="vox-mono text-xs px-3 py-1 rounded-sm transition-colors"
                    style={{
                      background:
                        filters.view === "grouped"
                          ? "var(--vox-forest)"
                          : "transparent",
                      color:
                        filters.view === "grouped" ? "#fff" : "var(--vox-prose)",
                    }}
                  >
                    Por série
                  </Link>
                </div>
                <Link
                  href="/sermons?view=arquivo"
                  className="vox-mono text-xs text-vox-muted hover:text-vox-ink"
                >
                  Arquivados →
                </Link>
              </div>
            ) : null}
          </div>

          {filters.view === "grouped" && !isArchive ? (
            <SeriesTreeView series={seriesList} sermons={sermons} />
          ) : sermons.length === 0 ? (
            <p className="vox-body text-center py-12 text-vox-muted">
              {isArchive
                ? "Nenhum manuscrito arquivado."
                : "Nenhum manuscrito encontrado com esses filtros."}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {sermons.map((sermon) => (
                <ContentCard
                  key={sermon.id}
                  sermon={sermon}
                  archived={isArchive}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

