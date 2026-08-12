"use client";

// Painel de controle do apresentador.
// Vive na aba ORIGINAL. Abre janela popup com a audiência e controla via BroadcastChannel.
//
// Layout (3 colunas):
//   - center top: "No ar" (slide/sessão atual)
//   - right top:  "Próximo" (slide/sessão seguinte)
//   - left:       Roteiro (lista clicável)
//   - bottom:     Comentário/itens completos do slide atual + controles

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  openChannel,
  openAudienceWindow,
  postMessage,
  type PresenterMessage,
} from "@/lib/presenter/channel";
import {
  VOX_BLOCK_TYPES,
  getBlockType,
  type BlockTypeId,
  blockColor,
} from "@/lib/mocks/blocks";
import type { SessionNode } from "@/lib/sermons/sessions";
import type { SlideItem } from "@/components/slides/SlidesPanel";
import { ItemContent } from "@/components/present/ItemContent";
import { stripHtml } from "@/lib/editor/html";

const VISIBLE_TYPES = new Set<BlockTypeId>(
  VOX_BLOCK_TYPES.filter((b) => b.visibleInPresentation).map((b) => b.id)
);

interface PresenterControlProps {
  sermonId: string;
  title: string;
  bibleRef?: string;
  slides?: SlideItem[];
  sessions?: SessionNode[];
  backHref: string;
}

export function PresenterControl({
  sermonId,
  title,
  bibleRef,
  slides,
  sessions,
  backHref,
}: PresenterControlProps) {
  const [index, setIndex] = useState(0);
  const [audienceConnected, setAudienceConnected] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const audienceWindowRef = useRef<Window | null>(null);

  const totalSlides = slides?.length ?? 0;
  const totalSessions = sessions?.length ?? 0;
  const total = totalSlides || totalSessions;

  // Channel
  useEffect(() => {
    const ch = openChannel(sermonId);
    channelRef.current = ch;
    if (!ch) return;

    ch.onmessage = (event: MessageEvent) => {
      const msg = event.data as PresenterMessage;
      if (!msg || typeof msg !== "object") return;
      if (msg.type === "audience-ready") {
        setAudienceConnected(true);
        postMessage(ch, { type: "navigate", index });
      } else if (msg.type === "request-state") {
        postMessage(ch, { type: "navigate", index });
      } else if (msg.type === "audience-bye") {
        setAudienceConnected(false);
      }
    };

    return () => {
      postMessage(ch, { type: "exit" });
      ch.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sermonId]);

  // Posta navigate sempre que muda
  useEffect(() => {
    postMessage(channelRef.current, { type: "navigate", index });
  }, [index]);

  const goNext = useCallback(
    () => setIndex((i) => Math.min(i + 1, total - 1)),
    [total]
  );
  const goPrev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);
  const goTo = useCallback(
    (i: number) => setIndex(Math.max(0, Math.min(i, total - 1))),
    [total]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  function openAudience() {
    if (audienceWindowRef.current && !audienceWindowRef.current.closed) {
      audienceWindowRef.current.focus();
      return;
    }
    const win = openAudienceWindow(sermonId);
    audienceWindowRef.current = win;
  }

  function exit() {
    postMessage(channelRef.current, { type: "exit" });
    audienceWindowRef.current?.close();
  }

  const currentSlide = slides?.[index];
  const nextSlide = slides?.[index + 1];
  const currentSession = sessions?.[index];
  const nextSession = sessions?.[index + 1];
  const hasNext = Boolean(nextSlide || nextSession);

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="px-6 py-3 flex items-center justify-between gap-4 border-b"
        style={{ borderColor: "var(--vox-whisper)" }}
      >
        <div className="min-w-0">
          <p className="vox-eyebrow">Apresentador · {title}</p>
          {bibleRef ? <p className="vox-ref mt-0.5">{bibleRef}</p> : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="vox-mono text-xs px-3 py-1.5 rounded-full"
            style={{
              background: audienceConnected
                ? "var(--vox-forest-soft)"
                : "rgba(180,188,200,0.20)",
              color: audienceConnected ? "var(--vox-forest)" : "var(--vox-prose)",
            }}
          >
            {audienceConnected ? "● Audiência conectada" : "○ Audiência desconectada"}
          </span>
          <Button
            onClick={openAudience}
            variant={audienceConnected ? "outline" : "default"}
            size="sm"
          >
            {audienceConnected ? "Focar janela" : "Abrir tela de projeção"}
          </Button>
          <Button asChild variant="ghost" size="sm" onClick={exit}>
            <Link href={backHref}>Sair</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-0 min-h-0">
        {/* Roteiro à esquerda */}
        <aside
          className="border-r p-4 overflow-y-auto max-h-[calc(100vh-72px)]"
          style={{ borderColor: "var(--vox-whisper)" }}
        >
          <p className="vox-eyebrow text-xs mb-3">Roteiro</p>
          <ul className="space-y-1.5">
            {Array.from({ length: total }).map((_, i) => {
              const isCurrent = i === index;
              const label =
                slides?.[i]?.order != null
                  ? `Slide ${String(slides[i]!.order).padStart(2, "0")}`
                  : sessions?.[i]?.title ?? `Item ${i + 1}`;
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors"
                    style={{
                      background: isCurrent ? "var(--vox-forest)" : "transparent",
                      color: isCurrent ? "#fff" : "var(--vox-prose)",
                    }}
                  >
                    <span className="vox-mono text-xs opacity-70 mr-2">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Centro: No ar | Próximo */}
        <div className="p-6 flex flex-col gap-5 min-h-0">
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-0">
            {/* No ar */}
            <article className="flex flex-col gap-3 min-h-0">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block size-2 rounded-full animate-pulse"
                  style={{ background: "var(--vox-destructive)" }}
                />
                <p
                  className="vox-eyebrow text-xs"
                  style={{ color: "var(--vox-destructive)" }}
                >
                  No ar · {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </p>
              </div>
              <SlidePreviewBox slide={currentSlide} session={currentSession} large />
            </article>

            {/* Próximo */}
            <article className="flex flex-col gap-3 min-h-0">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ background: "var(--vox-gold)" }}
                />
                <p
                  className="vox-eyebrow text-xs"
                  style={{ color: "var(--vox-gold)" }}
                >
                  {hasNext
                    ? `Próximo · ${String(index + 2).padStart(2, "0")} / ${String(total).padStart(2, "0")}`
                    : "Fim da apresentação"}
                </p>
              </div>
              {hasNext ? (
                <SlidePreviewBox slide={nextSlide} session={nextSession} />
              ) : (
                <div
                  className="rounded-xl aspect-video flex items-center justify-center"
                  style={{
                    background: "var(--vox-surface-deep)",
                    border: "1px dashed var(--vox-whisper-strong)",
                  }}
                >
                  <p className="vox-body text-sm text-vox-muted italic">
                    Última sessão
                  </p>
                </div>
              )}
            </article>
          </section>

          {/* Comentário/itens completos do slide atual */}
          <section className="flex-1 min-h-0">
            <div
              className="rounded-xl p-5 h-full overflow-y-auto"
              style={{
                background: "var(--vox-surface-elev)",
                border: "1px solid var(--vox-whisper)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="vox-eyebrow text-xs">
                  {currentSlide ? "Comentário do slide" : "Itens da sessão"}
                </p>
                <span className="vox-mono text-xs text-vox-muted">
                  inclui notas pessoais
                </span>
              </div>
              <ContentList
                slide={currentSlide}
                session={currentSession}
                size="lg"
                includeHidden
              />
            </div>
          </section>

          {/* Controles */}
          <footer className="flex items-center justify-between pt-2">
            <span className="vox-mono text-xs text-vox-muted">
              ← / → / espaço pra navegar
            </span>
            <div className="flex items-center gap-3">
              <Button onClick={goPrev} disabled={index === 0} variant="outline">
                ◀ Anterior
              </Button>
              <Button onClick={goNext} disabled={index >= total - 1} size="lg">
                Próximo ▶
              </Button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

function SlidePreviewBox({
  slide,
  session,
  large,
}: {
  slide?: SlideItem;
  session?: SessionNode;
  large?: boolean;
}) {
  return (
    <div
      className="rounded-xl aspect-video flex items-center justify-center overflow-hidden relative"
      style={{
        background: slide?.image_url
          ? `url(${slide.image_url}) center / contain no-repeat var(--vox-surface-deep)`
          : "var(--vox-surface-deep)",
        border: "1px solid var(--vox-whisper)",
      }}
    >
      {!slide?.image_url && slide ? (
        <p
          className="vox-mono opacity-30"
          style={{
            fontSize: large ? "clamp(96px, 12vw, 180px)" : "clamp(64px, 8vw, 120px)",
            fontFamily: "var(--vox-font-display)",
          }}
        >
          {String(slide.order).padStart(2, "0")}
        </p>
      ) : null}
      {session ? (
        <article className="px-6 text-center max-w-full">
          <p
            className="vox-eyebrow opacity-60 mb-3"
            style={{ fontSize: large ? "12px" : "10px" }}
          >
            {session.title}
          </p>
          <SessionFirstItemPreview session={session} large={large} />
        </article>
      ) : null}
    </div>
  );
}

function SessionFirstItemPreview({
  session,
  large,
}: {
  session: SessionNode;
  large?: boolean;
}) {
  const first = session.items.find(
    (i) => VISIBLE_TYPES.has(i.type) && stripHtml(i.content).trim()
  );
  if (!first) {
    return (
      <p className="text-sm italic text-vox-muted">Sessão vazia</p>
    );
  }
  const t = getBlockType(first.type);
  const isScripture = first.type === "texto_biblico";
  return (
    <ItemContent
      html={first.content}
      style={{
        fontFamily: "var(--vox-font-display)",
        fontStyle: isScripture ? "italic" : "normal",
        fontSize: large ? "clamp(20px, 2.2vw, 28px)" : "clamp(14px, 1.4vw, 18px)",
        lineHeight: 1.35,
        color: isScripture ? "var(--vox-gold)" : t?.color ?? "var(--vox-ink)",
      }}
      className="line-clamp-4"
    />
  );
}

function ContentList({
  slide,
  session,
  size,
  includeHidden = false,
}: {
  slide?: SlideItem;
  session?: SessionNode;
  size: "sm" | "lg";
  includeHidden?: boolean;
}) {
  const rawItems =
    slide?.comment_items?.sessions?.flatMap((s) => s.items) ??
    session?.items ??
    [];
  const items = includeHidden
    ? rawItems
    : rawItems.filter((i) => VISIBLE_TYPES.has(i.type));

  if (items.length === 0) {
    return (
      <p className="text-sm italic" style={{ color: "var(--vox-muted)" }}>
        Sem conteúdo
      </p>
    );
  }

  const fontSize = size === "lg" ? "17px" : "13px";

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const t = getBlockType(item.type);
        if (!t || !stripHtml(item.content).trim()) return null;
        const isScripture = item.type === "texto_biblico";
        const isHidden = !VISIBLE_TYPES.has(item.type);
        return (
          <div
            key={item.id}
            className="pl-3"
            style={{ borderLeft: `2px solid ${blockColor(t.id, false)}`, opacity: isHidden ? 0.6 : 1 }}
          >
            <div className="flex items-center gap-2">
              <p
                className="vox-eyebrow"
                style={{ color: blockColor(t.id, false), fontSize: size === "lg" ? "10px" : "9px" }}
              >
                {t.label}
              </p>
              {isHidden ? (
                <span
                  className="vox-mono text-xs italic"
                  style={{ color: "var(--vox-muted)", fontSize: "9px" }}
                >
                  (só você)
                </span>
              ) : null}
            </div>
            <ItemContent
              html={item.content}
              className="mt-1"
              style={{
                fontFamily: "var(--vox-font-display)",
                fontStyle: isScripture ? "italic" : "normal",
                fontSize,
                lineHeight: 1.45,
                color: isScripture ? "var(--vox-gold)" : "var(--vox-ink)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
