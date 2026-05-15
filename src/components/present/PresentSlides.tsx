"use client";

// Tela do APRESENTADOR de slides.
// Slide à esquerda + comentário estruturado à direita + thumbnail do próximo slide.
// Header com botão "Abrir tela de projeção" + status de conexão.
// Sincroniza navegação com a janela popup via BroadcastChannel.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  VOX_BLOCK_TYPES,
  type BlockTypeId,
  getBlockType,
} from "@/lib/mocks/blocks";
import type { SermonContent } from "@/lib/sermons/sessions";
import {
  openChannel,
  openAudienceWindow,
  postMessage,
  type PresenterMessage,
} from "@/lib/presenter/channel";

const VISIBLE_TYPES = new Set<BlockTypeId>(
  VOX_BLOCK_TYPES.filter((b) => b.visibleInPresentation).map((b) => b.id)
);

export interface PresentSlide {
  id: string;
  order: number;
  image_url?: string;
  comment_items?: SermonContent;
  comment?: string;
}

interface PresentSlidesProps {
  sermonId: string;
  title: string;
  slides: PresentSlide[];
  googleSlidesUrl?: string | null;
  backHref: string;
}

export function PresentSlides({
  sermonId,
  title,
  slides,
  googleSlidesUrl,
  backHref,
}: PresentSlidesProps) {
  const [index, setIndex] = useState(0);
  const [showComment, setShowComment] = useState(true);
  const [audienceConnected, setAudienceConnected] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const audienceWindowRef = useRef<Window | null>(null);

  const total = slides.length;
  const current = slides[index];
  const next = slides[index + 1];

  const goNext = useCallback(() => setIndex((i) => Math.min(i + 1, total - 1)), [total]);
  const goPrev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  // BroadcastChannel — sincroniza com janela popup quando ela está aberta
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

  useEffect(() => {
    postMessage(channelRef.current, { type: "navigate", index });
  }, [index]);

  // Atalhos teclado
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
      } else if (e.key === "Escape") {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  // Wake lock
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    void (async () => {
      try {
        if ("wakeLock" in navigator) lock = await navigator.wakeLock.request("screen");
      } catch {
        // sem suporte
      }
    })();
    return () => void lock?.release().catch(() => {});
  }, []);

  function openProjection() {
    if (audienceWindowRef.current && !audienceWindowRef.current.closed) {
      audienceWindowRef.current.focus();
      return;
    }
    audienceWindowRef.current = openAudienceWindow(sermonId);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col stage"
      style={{ background: "var(--vox-stage-bg)", color: "#F1EDE7" }}
    >
      <header className="px-8 py-3 flex items-center justify-between gap-4 border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <p className="vox-mono text-xs opacity-70 truncate">{title}</p>
          <span className="vox-mono text-xs opacity-50">
            Slide {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="vox-mono text-xs px-3 py-1.5 rounded-full"
            style={{
              background: audienceConnected
                ? "rgba(22,101,52,0.30)"
                : "rgba(255,255,255,0.06)",
              color: audienceConnected ? "#86efac" : "rgba(241,237,231,0.7)",
            }}
          >
            {audienceConnected ? "● Projeção conectada" : "○ Sem projeção"}
          </span>
          <Button
            onClick={openProjection}
            size="sm"
            variant={audienceConnected ? "outline" : "default"}
            className={
              audienceConnected
                ? "text-current border-white/20 hover:bg-white/10"
                : ""
            }
          >
            {audienceConnected ? "Focar janela" : "Abrir tela de projeção"}
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-current opacity-80">
            <Link href={backHref}>Sair</Link>
          </Button>
        </div>
      </header>

      <main
        className={
          showComment
            ? "flex-1 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 p-6 min-h-0"
            : "flex-1 p-6 min-h-0"
        }
      >
        {/* Slide grande à esquerda */}
        <section
          className="rounded-xl border border-white/10 flex items-center justify-center overflow-hidden"
          style={{
            background: current?.image_url
              ? `url(${current.image_url}) center / contain no-repeat`
              : "#11171B",
          }}
        >
          {googleSlidesUrl && !current?.image_url ? (
            <iframe
              src={`${googleSlidesUrl.replace(/\/edit.*$/, "")}/embed?start=false&loop=false&delayms=60000&slide=${index + 1}`}
              className="w-full h-full"
              allow="autoplay"
              title="Google Slides"
            />
          ) : !current?.image_url ? (
            <p
              className="text-7xl opacity-30"
              style={{ fontFamily: "var(--vox-font-display)" }}
            >
              {String(current?.order ?? 1).padStart(2, "0")}
            </p>
          ) : null}
        </section>

        {/* Painel direito: comentário + thumbnail do próximo */}
        {showComment ? (
          <aside
            className="rounded-xl p-6 overflow-y-auto min-h-0"
            style={{
              background: "#11171B",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p className="vox-eyebrow opacity-60 mb-4">Comentário do slide</p>
            <SlideCommentRender slide={current} />

            {next ? (
              <NextSlideBlock slide={next} />
            ) : (
              <div
                className="mt-7 pt-5"
                style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
              >
                <p className="vox-eyebrow opacity-50 text-xs">Fim da apresentação</p>
              </div>
            )}
          </aside>
        ) : null}
      </main>

      <footer className="px-8 py-3 flex items-center justify-between border-t border-white/5">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goPrev}
            disabled={index === 0}
            className="text-current"
          >
            ◀ Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goNext}
            disabled={index === total - 1}
            className="text-current"
          >
            Próximo ▶
          </Button>
          <span className="vox-mono text-xs opacity-50 ml-3 hidden sm:inline">
            ← / → / espaço
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComment((s) => !s)}
            className="text-current opacity-80"
          >
            {showComment ? "Só slide" : "Slide + comentário"}
          </Button>
        </div>
      </footer>
    </div>
  );
}

function SlideCommentRender({ slide }: { slide: PresentSlide | undefined }) {
  if (!slide) return null;

  if (slide.comment_items?.sessions?.length) {
    return (
      <div className="space-y-5">
        {slide.comment_items.sessions.map((session) => {
          const visibleItems = session.items.filter((i) => VISIBLE_TYPES.has(i.type));
          if (visibleItems.length === 0) return null;
          return (
            <div key={session.id} className="space-y-4">
              {session.title ? (
                <p className="vox-eyebrow opacity-60 text-xs">{session.title}</p>
              ) : null}
              {visibleItems.map((item) => {
                const t = getBlockType(item.type);
                if (!t || !item.content.trim()) return null;
                const isScripture = item.type === "texto_biblico";
                const isQuote = item.type === "citacao";
                return (
                  <div
                    key={item.id}
                    className="pl-4"
                    style={{ borderLeft: `2px solid ${t.color}` }}
                  >
                    <p
                      className="vox-eyebrow opacity-60 mb-1.5 text-xs"
                      style={{ color: t.color }}
                    >
                      {t.label}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--vox-font-display)",
                        fontStyle: isScripture || isQuote ? "italic" : "normal",
                        fontSize: "22px",
                        lineHeight: 1.5,
                        color: isScripture ? "var(--vox-gold)" : "#F1EDE7",
                      }}
                    >
                      {item.content}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  if (slide.comment) {
    return (
      <p
        style={{
          fontFamily: "var(--vox-font-display)",
          fontSize: "24px",
          lineHeight: 1.5,
        }}
      >
        {slide.comment}
      </p>
    );
  }

  return <p className="opacity-50 italic">Sem comentário pra este slide.</p>;
}

function NextSlideBlock({ slide }: { slide: PresentSlide }) {
  // Primeiro item visível do próximo slide pra exibir como pré-aviso textual
  const firstItem = slide.comment_items?.sessions
    ?.flatMap((s) => s.items)
    .find((i) => VISIBLE_TYPES.has(i.type));
  const blockType = firstItem ? getBlockType(firstItem.type) : null;

  return (
    <div
      className="mt-7 pt-5"
      style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
    >
      <p className="vox-eyebrow opacity-50 text-xs mb-3">Próximo slide</p>

      {/* Thumbnail visual com aspect-video — mesma estética do slide grande */}
      <div
        className="rounded-lg aspect-video overflow-hidden relative"
        style={{
          background: slide.image_url
            ? `url(${slide.image_url}) center / cover`
            : "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {!slide.image_url ? (
          <div className="absolute inset-0 flex items-center gap-4 px-5">
            <span
              className="vox-mono opacity-30 shrink-0"
              style={{
                fontSize: "44px",
                fontFamily: "var(--vox-font-display)",
                lineHeight: 1,
              }}
            >
              {String(slide.order).padStart(2, "0")}
            </span>
            {blockType && firstItem ? (
              <div className="flex-1 min-w-0 text-left">
                <p
                  className="vox-eyebrow opacity-70 text-xs mb-1"
                  style={{ color: blockType.color }}
                >
                  {blockType.label}
                </p>
                <p
                  className="line-clamp-2 opacity-80"
                  style={{
                    fontFamily: "var(--vox-font-display)",
                    fontStyle: firstItem.type === "texto_biblico" ? "italic" : "normal",
                    fontSize: "13px",
                    lineHeight: 1.4,
                  }}
                >
                  {firstItem.content}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
        <span
          className="absolute top-2 right-2 vox-mono text-xs opacity-70 px-2 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.6)" }}
        >
          Slide {String(slide.order).padStart(2, "0")}
        </span>
      </div>

      {/* Sumário textual quando o slide tem imagem (pra não duplicar info no thumb) */}
      {slide.image_url && firstItem && blockType ? (
        <p className="vox-mono text-xs opacity-60 mt-3">
          <span style={{ color: blockType.color }}>{blockType.label}</span>
          {firstItem.content
            ? ` · ${firstItem.content.slice(0, 80)}${firstItem.content.length > 80 ? "…" : ""}`
            : ""}
        </p>
      ) : null}
    </div>
  );
}
