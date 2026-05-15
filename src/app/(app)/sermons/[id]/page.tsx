// Editor de sermão por sessões (modelo de duas camadas).
// Layout: coluna única; ações secundárias no menu "..." (SermonActionsMenu).

import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SermonEditor } from "@/components/editor/SermonEditor";
import { SlidesPanel } from "@/components/slides/SlidesPanel";
import { VersionsDialog } from "@/components/editor/VersionsDialog";
import { EngagementsSection } from "@/components/sermon/EngagementsSection";
import { SermonActionsMenu } from "@/components/sermon/SermonActionsMenu";
import { getSermon } from "@/lib/sermons/queries";
import { parseSermonContent } from "@/lib/sermons/sessions";
import { getMockSlides } from "@/lib/mocks/slides";
import { getMockVersions } from "@/lib/mocks/versions";
import { getMockEngagements } from "@/lib/mocks/engagements";
import { VOX_FRAMEWORKS, type FrameworkId } from "@/lib/mocks/frameworks";
import type { ContentType, SermonStatus, SermonType } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABEL = {
  rascunho: "Em rascunho",
  pronto: "Pregado",
} as const;

export default async function SermonEditorPage({ params }: PageProps) {
  const { id } = await params;

  const useSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!useSupabase) notFound();

  const row = await getSermon(id).catch(() => null);
  if (!row) notFound();

  const sermon = {
    id: row.id as string,
    title: row.title as string,
    framework: row.framework as FrameworkId,
    type: row.type as SermonType,
    content_type: row.content_type as ContentType,
    bible_ref: (row.bible_ref as string | null) ?? "",
    bible_book: (row.bible_book as string | null) ?? "",
    status: row.status as SermonStatus,
    tags: (row.tags as string[] | null) ?? [],
    word_count: (row.word_count as number | null) ?? 0,
    preview: "",
    series: row.series_id
      ? { id: row.series_id as string, title: "" }
      : undefined,
    preached_at: row.preached_at as string | null,
    updated_at: row.updated_at as string,
    created_at: row.created_at as string,
  };

  const framework = VOX_FRAMEWORKS.find((f) => f.id === sermon.framework);
  const content = parseSermonContent(row.content, sermon.framework);
  const versions = getMockVersions(sermon.id);
  const engagements = getMockEngagements(sermon.id);

  return (
    <div className="max-w-5xl mx-auto space-y-6 min-w-0">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Link
              href="/sermons"
              className="text-sm text-vox-prose hover:text-vox-ink"
            >
              ← Esboços
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <span
              className="inline-block size-2 rounded-full"
              style={{ background: `var(--vox-fw-${sermon.framework})` }}
            />
            <span
              className="vox-eyebrow"
              style={{ color: `var(--vox-fw-${sermon.framework})` }}
            >
              {framework?.name}
            </span>
            <Badge variant="secondary" className="text-xs font-normal ml-1">
              {STATUS_LABEL[sermon.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="vox-mono text-xs text-vox-muted hidden sm:inline">
              {content.sessions.length} sessões
            </span>
            <VersionsDialog
              sermonId={sermon.id}
              fallbackVersions={versions}
              trigger={
                <Button variant="outline" size="sm">
                  Versões ({versions.length})
                </Button>
              }
            />
            <Button asChild variant="outline" size="sm">
              <Link href={`/sermons/${sermon.id}/present`}>Apresentar</Link>
            </Button>
            <SermonActionsMenu sermon={sermon} />
          </div>
        </div>

        <Input
          defaultValue={sermon.title}
          className="border-0 px-0 focus-visible:ring-0 bg-transparent h-auto py-1"
          style={{
            fontFamily: "var(--vox-font-display)",
            fontWeight: 600,
            fontSize: "var(--vox-text-4xl)",
            letterSpacing: "-0.015em",
            color: "var(--vox-ink)",
          }}
        />

        <div className="flex items-center gap-4 flex-wrap">
          <p className="vox-ref">{sermon.bible_ref}</p>
          <Separator orientation="vertical" className="h-4" />
          <p className="vox-mono text-xs text-vox-muted">
            {sermon.word_count.toLocaleString("pt-BR")} palavras
          </p>
          {sermon.series ? (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Link
                href={`/sermons?series=${sermon.series.id}`}
                className="text-xs text-vox-prose hover:text-vox-ink"
              >
                Série: {sermon.series.title}
              </Link>
            </>
          ) : null}
        </div>
      </header>

      {sermon.type === "apresentação" ? (
        <SlidesPanel
          slides={getMockSlides(sermon.id).map((s) => ({
            id: s.id,
            order: s.order,
            image_url: s.image_url,
            comment_items: s.comment_items,
          }))}
          framework={sermon.framework}
          empty={getMockSlides(sermon.id).length === 0}
        />
      ) : (
        <SermonEditor framework={sermon.framework} initialContent={content} />
      )}

      <EngagementsSection
        sermonId={sermon.id}
        initialEngagements={engagements}
      />
    </div>
  );
}
