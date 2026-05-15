// Bifurcação por query params:
//   sem ?mode                       → chooser (Apresentador vs Só slide)
//   ?mode=simple (apresentação)     → SlideProjection (só o slide fullscreen)
//   ?mode=simple (esboço)           → PresentSessions (teleprompter)
//   ?mode=presenter&role=control    → PresentSlides ou PresenterControl (painel do apresentador)
//   ?mode=presenter&role=audience   → AudienceView (popup, escuta BroadcastChannel)

import { notFound } from "next/navigation";
import { PresentSessions } from "@/components/present/PresentSessions";
import { PresentSlides } from "@/components/present/PresentSlides";
import { SlideProjection } from "@/components/present/SlideProjection";
import { PresentationChooser } from "@/components/present/PresentationChooser";
import { PresenterControl } from "@/components/present/PresenterControl";
import { AudienceView } from "@/components/present/AudienceView";
import { getSermon } from "@/lib/sermons/queries";
import { parseSermonContent } from "@/lib/sermons/sessions";
import { getMockSlides } from "@/lib/mocks/slides";
import { VOX_FRAMEWORKS, type FrameworkId } from "@/lib/mocks/frameworks";
import type { SermonType } from "@/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    mode?: "simple" | "presenter";
    role?: "control" | "audience";
  }>;
}

export default async function PresentPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { mode, role } = await searchParams;

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
    bible_ref: (row.bible_ref as string | null) ?? "",
  };

  const isSlides = sermon.type === "apresentação";
  const slides = isSlides
    ? getMockSlides(sermon.id).map((s) => ({
        id: s.id,
        order: s.order,
        image_url: s.image_url,
        comment_items: s.comment_items,
      }))
    : undefined;
  const sessions = !isSlides
    ? parseSermonContent(row.content, sermon.framework).sessions
    : undefined;
  const framework = VOX_FRAMEWORKS.find((f) => f.id === sermon.framework);
  const backHref = `/sermons/${sermon.id}`;

  // 1. Sem mode → chooser
  if (!mode) {
    return (
      <PresentationChooser
        sermonId={sermon.id}
        title={sermon.title}
        isSlides={isSlides}
      />
    );
  }

  // 2. Janela popup da projeção (audiência)
  if (mode === "presenter" && role === "audience") {
    return (
      <AudienceView
        sermonId={sermon.id}
        slides={slides}
        sessions={sessions}
        title={sermon.title}
      />
    );
  }

  // 3. Painel de controle do apresentador
  if (mode === "presenter") {
    if (isSlides && slides) {
      return (
        <PresentSlides
          sermonId={sermon.id}
          title={sermon.title}
          slides={slides}
          backHref={backHref}
        />
      );
    }
    return (
      <PresenterControl
        sermonId={sermon.id}
        title={sermon.title}
        bibleRef={sermon.bible_ref || undefined}
        sessions={sessions}
        backHref={backHref}
      />
    );
  }

  // 4. Simples — só a projeção (slides) ou o teleprompter (esboço)
  if (isSlides && slides) {
    return (
      <SlideProjection
        title={sermon.title}
        slides={slides}
        backHref={backHref}
      />
    );
  }

  return (
    <PresentSessions
      title={sermon.title}
      bibleRef={sermon.bible_ref}
      frameworkName={framework?.name ?? sermon.framework}
      sessions={sessions ?? []}
      backHref={backHref}
    />
  );
}
