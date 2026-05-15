// Issue 001 (proto) + 049 (behavior) — Dashboard.
// Em ambiente sem Supabase configurado, cai em mocks para não quebrar o build.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentCard } from "@/components/sermon/ContentCard";
import { VerseOfTheDay } from "@/components/bible/VerseOfTheDay";
import { MOCK_SERMONS, MOCK_SERIES, recentSermons, type MockSermon } from "@/lib/mocks/sermons";
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

  const recents = recentSermons(4);
  const lastSermon = recents[0];
  return {
    total: MOCK_SERMONS.length,
    drafts: MOCK_SERMONS.filter((s) => s.status === "rascunho").length,
    lastTitle: lastSermon?.title ?? "—",
    lastDate: lastSermon?.preached_at ?? null,
    recents,
  };
}

export default async function DashboardPage() {
  const data = await loadData();
  const activeSeries = MOCK_SERIES[0];

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {data.recents.map((sermon) => (
            <ContentCard key={sermon.id} sermon={sermon} />
          ))}
        </div>
      </section>

      <section className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <Card>
          <CardHeader>
            <p className="vox-eyebrow">Série ativa</p>
            <CardTitle className="mt-2 text-xl">{activeSeries?.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="vox-body text-sm">{activeSeries?.description}</p>
            <div className="mt-5 flex items-center gap-4 text-sm">
              <span className="vox-mono text-vox-muted">
                {activeSeries?.sermon_count} sermões
              </span>
              <Link
                href={`/sermons?series=${activeSeries?.id}`}
                className="text-vox-forest hover:underline underline-offset-4"
              >
                Continuar série →
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="vox-eyebrow">Estudo em andamento</p>
            <CardTitle className="mt-2 text-xl">
              Fundamentos da Pregação Expositiva
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ background: "var(--vox-whisper)" }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: "40%", background: "var(--vox-forest)" }}
              />
            </div>
            <p className="vox-mono text-xs text-vox-muted mt-2">
              Sessão 3 de 6 · 40% concluído
            </p>
            <Link
              href="/study"
              className="mt-4 inline-block text-sm text-vox-forest hover:underline underline-offset-4"
            >
              Retomar estudo →
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
