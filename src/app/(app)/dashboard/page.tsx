// Issue 001 (proto) + 049 (behavior) — Dashboard.
// Em ambiente sem Supabase configurado, cai em mocks para não quebrar o build.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ContentCard } from "@/components/sermon/ContentCard";
import { VerseOfTheDay } from "@/components/bible/VerseOfTheDay";
import type { MockSermon } from "@/lib/mocks/sermons";
import { dashboardStats, listSermons } from "@/lib/sermons/queries";
import type { FrameworkId, ContentType, SermonType, SermonStatus } from "@/types/database";

export const metadata = { title: "Início" };

interface DashboardData {
  total: number;
  drafts: number;
  lastTitle: string;
  lastDate: string | null;
  recents: ReadonlyArray<MockSermon>;
}

async function loadData(): Promise<DashboardData> {
  const useSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (useSupabase) {
    try {
      const [stats, recentsRaw] = await Promise.all([
        dashboardStats(),
        listSermons({ sort: "recent", limit: 4 }),
      ]);
      const recents: MockSermon[] = recentsRaw.map((s) => ({
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
      return {
        total: stats?.total ?? 0,
        drafts: stats?.drafts ?? 0,
        lastTitle: stats?.lastPreached?.title ?? "—",
        lastDate: stats?.lastPreached?.preached_at ?? null,
        recents,
      };
    } catch {
      // cai pro mock
    }
  }

  return {
    total: 0,
    drafts: 0,
    lastTitle: "—",
    lastDate: null,
    recents: [],
  };
}

export default async function DashboardPage() {
  const data = await loadData();

  return (
    <div className="space-y-10 max-w-6xl">
      <section className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <p className="vox-eyebrow">Início · Hoje</p>
          <h1 className="vox-h1 mt-3">Bom dia, Pastor</h1>
          <p className="vox-body mt-3 max-w-lg">
            Você tem {data.drafts} manuscritos em rascunho. Continue o trabalho
            onde parou ou comece um novo.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/sermons">Esboços</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/sermons/new">Novo manuscrito</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card>
          <CardHeader className="pb-2">
            <p className="vox-eyebrow">Total no banco</p>
          </CardHeader>
          <CardContent>
            <p
              className="vox-mono"
              style={{ fontSize: "var(--vox-text-5xl)", fontWeight: 600, color: "var(--vox-ink)" }}
            >
              {data.total}
            </p>
            <p className="text-xs text-vox-muted mt-2">
              sermões, palestras e aulas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="vox-eyebrow">Em rascunho</p>
          </CardHeader>
          <CardContent>
            <p
              className="vox-mono"
              style={{ fontSize: "var(--vox-text-5xl)", fontWeight: 600, color: "var(--vox-gold)" }}
            >
              {data.drafts}
            </p>
            <p className="text-xs text-vox-muted mt-2">aguardando finalização</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="vox-eyebrow">Última pregação</p>
          </CardHeader>
          <CardContent>
            <p className="vox-h3 text-base leading-tight" style={{ color: "var(--vox-ink)" }}>
              {data.lastTitle}
            </p>
            <p className="vox-mono text-xs text-vox-muted mt-2">
              {data.lastDate
                ? new Date(data.lastDate).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "ainda sem registro"}
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <VerseOfTheDay />
      </section>

      <section>
        <div className="flex items-end justify-between gap-3 mb-5">
          <div>
            <p className="vox-eyebrow">Continuar</p>
            <h2 className="vox-h2 mt-2">Recentes</h2>
          </div>
          <Link
            href="/sermons"
            className="text-sm text-vox-forest hover:underline underline-offset-4"
          >
            Ver todos
          </Link>
        </div>
        {data.recents.length === 0 ? (
          <div
            className="rounded-xl border-2 border-dashed p-10 text-center"
            style={{ borderColor: "var(--vox-whisper-strong)" }}
          >
            <p className="vox-body text-sm">
              Você ainda não tem manuscritos. Comece pelo seu primeiro.
            </p>
            <Button asChild className="mt-5">
              <Link href="/sermons/new">Novo manuscrito</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {data.recents.map((sermon) => (
              <ContentCard key={sermon.id} sermon={sermon} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
