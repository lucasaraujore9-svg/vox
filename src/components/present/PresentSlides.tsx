"use client";

// Tela do APRESENTADOR de slides.
// Slide à esquerda + comentário estruturado à direita + thumbnail do próximo slide.
// Header com botão "Abrir tela de projeção" + status de conexão.
// Sincroniza navegação com a janela popup via BroadcastChannel.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  getBlockType,
  blockColor,
  sessionRoleColor,
} from "@/lib/mocks/blocks";
import type { SermonContent } from "@/lib/sermons/sessions";
import {
  openChannel,
  openAudienceWindow,
  postMessage,
  type PresenterMessage,
} from "@/lib/presenter/channel";
import { ItemContent } from "@/components/present/ItemContent";
import { stripHtml, previewSnippet } from "@/lib/editor/html";
import { PresentThemeToggle } from "@/components/present/PresentThemeToggle";
import {
  surfaceFor,
  usePresentTheme,
  type PresentSurface,
} from "@/lib/presenter/theme";

/** Escala de leitura do comentário. Quem prega ajusta conforme a distância. */
const NOTE_SIZES = {
  sm: { px: 17, lh: 1.5 },
  md: { px: 20, lh: 1.55 },
  lg: { px: 24, lh: 1.55 },
  xl: { px: 29, lh: 1.5 },
} as const;

type NoteSize = keyof typeof NOTE_SIZES;
const NOTE_ORDER: NoteSize[] = ["sm", "md", "lg", "xl"];

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
  const [noteSize, setNoteSize] = useState<NoteSize>("md");
  const [audienceConnected, setAudienceConnected] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const audienceWindowRef = useRef<Window | null>(null);
  const theme = usePresentTheme();
  const surface = surfaceFor(theme);

  const total = slides.length;
  const current = slides[index];
  const next = slides[index + 1];

  const goNext = useCallback(() => setIndex((i) => Math.min(i + 1, total - 1)), [total]);
  const goPrev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  // BroadcastChannel, sincroniza com janela popup quando ela está aberta
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
        if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
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
    return () => void lock?.release().catch(() => { });
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
      className={`fixed inset-0 z-50 flex flex-col${surface.isDark ? " stage" : ""}`}
      style={{ background: surface.bg, color: surface.ink }}
    >
      <header
        className="px-8 py-3 flex items-center justify-between gap-4"
        style={{ borderBottom: `1px solid ${surface.border}` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <p className="vox-mono text-xs truncate" style={{ color: surface.soft }}>
            {title}
          </p>
          <span className="vox-mono text-xs" style={{ color: surface.muted }}>
            Slide {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="vox-mono text-xs px-3 py-1.5 rounded-full"
            style={
              audienceConnected
                ? {
                  background: surface.isDark
                    ? "rgba(22,101,52,0.30)"
                    : "rgba(22,101,52,0.12)",
                  color: surface.isDark ? "#86efac" : "var(--vox-forest)",
                }
                : {
                  background: surface.isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(24,24,27,0.05)",
                  color: surface.muted,
                }
            }
          >
            {audienceConnected ? "● Projeção conectada" : "○ Sem projeção"}
          </span>
          <PresentThemeToggle theme={theme} surface={surface} />
          <Button
            onClick={openProjection}
            size="sm"
            variant={audienceConnected ? "outline" : "default"}
          >
            {audienceConnected ? "Focar janela" : "Abrir tela de projeção"}
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={backHref} style={{ color: surface.soft }}>
              Sair
            </Link>
          </Button>
        </div>
      </header>

      <main
        className={
          showComment
            ? "flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-6 p-6 min-h-0"
            : "flex-1 p-6 min-h-0"
        }
      >
        {/* Slide grande à esquerda. Fundo neutro atrás da imagem: o slide traz
            o próprio fundo e não deve brigar com o da tela. */}
        <section
          className="rounded-xl flex items-center justify-center overflow-hidden"
          style={{
            border: `1px solid ${surface.border}`,
            background: current?.image_url
              ? `${surface.slideBg} url(${current.image_url}) center / contain no-repeat`
              : surface.slideBg,
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
              className="text-7xl"
              style={{
                fontFamily: "var(--vox-font-display)",
                color: surface.muted,
                opacity: 0.5,
              }}
            >
              {String(current?.order ?? 1).padStart(2, "0")}
            </p>
          ) : null}
        </section>

        {/* Painel direito: cabeçalho fixo, comentário rolando, próximo slide ancorado.
            O "próximo" não pode sumir com o scroll: é o que evita ser pego de surpresa. */}
        {showComment ? (
          <aside
            className="rounded-xl flex flex-col min-h-0 overflow-hidden"
            style={{
              background: surface.panel,
              border: `1px solid ${surface.border}`,
            }}
          >
            <div
              className="shrink-0 flex items-center justify-between gap-3 px-5 py-3"
              style={{ borderBottom: `1px solid ${surface.border}` }}
            >
              <p className="vox-eyebrow" style={{ color: surface.muted }}>
                Comentário do slide
              </p>
              <NoteSizeControl
                value={noteSize}
                onChange={setNoteSize}
                surface={surface}
              />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 px-5 py-5">
              <SlideCommentRender
                slide={current}
                size={noteSize}
                surface={surface}
              />
            </div>

            <div
              className="shrink-0 px-5 py-4"
              style={{ borderTop: `1px solid ${surface.border}` }}
            >
              {next ? (
                <NextSlideBlock slide={next} surface={surface} />
              ) : (
                <p className="vox-eyebrow text-xs" style={{ color: surface.muted }}>
                  Último slide
                </p>
              )}
            </div>
          </aside>
        ) : null}
      </main>

      <footer
        className="px-8 py-3 flex items-center justify-between"
        style={{ borderTop: `1px solid ${surface.border}` }}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goPrev}
            disabled={index === 0}
            style={{ color: surface.ink }}
          >
            ◀ Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goNext}
            disabled={index === total - 1}
            style={{ color: surface.ink }}
          >
            Próximo ▶
          </Button>
          <span
            className="vox-mono text-xs ml-3 hidden sm:inline"
            style={{ color: surface.muted }}
          >
            ← / → / espaço
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComment((s) => !s)}
            style={{ color: surface.soft }}
          >
            {showComment ? "Só slide" : "Slide + comentário"}
          </Button>
        </div>
      </footer>
    </div>
  );
}

/** Controle A− / A+ do tamanho do comentário. */
function NoteSizeControl({
  value,
  onChange,
  surface,
}: {
  value: NoteSize;
  onChange: (next: NoteSize) => void;
  surface: PresentSurface;
}) {
  const i = NOTE_ORDER.indexOf(value);
  function step(delta: number) {
    const next = NOTE_ORDER[Math.min(Math.max(i + delta, 0), NOTE_ORDER.length - 1)];
    if (next) onChange(next);
  }
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={i === 0}
        aria-label="Diminuir o texto"
        className="size-7 rounded flex items-center justify-center transition-colors hover:bg-black/5 disabled:opacity-30"
        style={{ color: surface.muted, fontSize: "13px" }}
      >
        A−
      </button>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={i === NOTE_ORDER.length - 1}
        aria-label="Aumentar o texto"
        className="size-7 rounded flex items-center justify-center transition-colors hover:bg-black/5 disabled:opacity-30"
        style={{ color: surface.muted, fontSize: "16px" }}
      >
        A+
      </button>
    </div>
  );
}

function SlideCommentRender({
  slide,
  size,
  surface,
}: {
  slide: PresentSlide | undefined;
  size: NoteSize;
  surface: PresentSurface;
}) {
  if (!slide) return null;
  const scale = NOTE_SIZES[size];

  // Este painel é a tela do apresentador, não a projeção. Mostra TUDO, inclusive
  // notas pessoais (que a audiência nunca vê) — do contrário um manuscrito de
  // folha em branco, cujos itens são todos `notas_pessoais`, aparece vazio.
  const sessionsWithContent = (slide.comment_items?.sessions ?? [])
    .map((session) => ({
      session,
      items: session.items.filter((i) => stripHtml(i.content).trim()),
    }))
    .filter((s) => s.items.length > 0);

  if (sessionsWithContent.length > 0) {
    return (
      <div>
        {sessionsWithContent.map(({ session, items }, sIdx) => (
          <section
            key={session.id}
            className={`relative pl-[19px] ${sIdx > 0 ? "mt-8" : ""}`}
          >
            {/* Mesmo código visual da construção: barra vertical no papel da
                sessão, ponto + rótulo na cor do bloco. Consultar durante a fala
                usa a mesma pista de cor de quem escreveu. */}
            <span
              aria-hidden
              className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full"
              style={{ background: sessionRoleColor(session.role, surface.isDark, sIdx) }}
            />
            {session.title ? (
              <h3
                className="vox-eyebrow mb-4"
                style={{
                  color: sessionRoleColor(session.role, surface.isDark, sIdx),
                  fontSize: "12px",
                }}
              >
                {session.title}
              </h3>
            ) : null}
            <div className="space-y-5">
              {items.map((item) => {
                const t = getBlockType(item.type);
                if (!t) return null;
                const isScripture = item.type === "texto_biblico";
                const isQuote = item.type === "citacao";
                const verbatim = isScripture || isQuote;
                const tone = blockColor(t.id, surface.isDark);
                return (
                  <div key={item.id}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        aria-hidden
                        className="inline-block size-1.5 rounded-full shrink-0"
                        style={{ background: tone }}
                      />
                      <p
                        className="vox-eyebrow"
                        style={{ color: tone, fontSize: "11px" }}
                      >
                        {t.label}
                      </p>
                    </div>
                    <ItemContent
                      onDarkSurface={surface.isDark}
                      html={item.content}
                      style={{
                        // Trecho pra ler em voz alta mantém o serif em itálico;
                        // nota de apoio vai na fonte de UI, que se lê de relance.
                        fontFamily: verbatim
                          ? "var(--vox-font-display)"
                          : "var(--vox-font-ui)",
                        fontStyle: verbatim ? "italic" : "normal",
                        fontSize: `${scale.px}px`,
                        lineHeight: scale.lh,
                        color: isScripture ? "var(--vox-gold)" : surface.ink,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (slide.comment) {
    return (
      <p
        style={{
          fontFamily: "var(--vox-font-ui)",
          fontSize: `${scale.px}px`,
          lineHeight: scale.lh,
          color: surface.ink,
        }}
      >
        {slide.comment}
      </p>
    );
  }

  return (
    <p className="italic" style={{ color: surface.muted }}>
      Sem comentário pra este slide.
    </p>
  );
}

function NextSlideBlock({
  slide,
  surface,
}: {
  slide: PresentSlide;
  surface: PresentSurface;
}) {
  // Primeiro item visível do próximo slide pra exibir como pré-aviso textual
  // Prévia do próximo slide, também só para os olhos do apresentador.
  const firstItem = slide.comment_items?.sessions
    ?.flatMap((s) => s.items)
    .find((i) => stripHtml(i.content).trim());
  const blockType = firstItem ? getBlockType(firstItem.type) : null;

  return (
    <div className="flex items-start gap-4">
      <div className="flex-1 min-w-0 order-2">
        <p
          className="vox-eyebrow mb-2"
          style={{ color: surface.muted, fontSize: "11px" }}
        >
          Próximo · slide {String(slide.order).padStart(2, "0")}
        </p>
        {firstItem && blockType ? (
          <p
            className="line-clamp-3"
            style={{
              fontFamily: "var(--vox-font-ui)",
              fontSize: "14px",
              lineHeight: 1.45,
              color: surface.soft,
            }}
          >
            {previewSnippet(firstItem.content, 140)}
          </p>
        ) : (
          <p className="vox-mono text-xs" style={{ color: surface.muted }}>
            Sem comentário
          </p>
        )}
      </div>

      {/* Miniatura compacta: referência visual, não protagonista. */}
      <div
        className="rounded-lg aspect-video w-36 shrink-0 overflow-hidden relative order-1"
        style={{
          background: slide.image_url
            ? `${surface.slideBg} url(${slide.image_url}) center / cover`
            : surface.slideBg,
          border: `1px solid ${surface.border}`,
        }}
      >
        {!slide.image_url ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="vox-mono"
              style={{
                fontSize: "28px",
                fontFamily: "var(--vox-font-display)",
                lineHeight: 1,
                color: surface.muted,
                opacity: 0.6,
              }}
            >
              {String(slide.order).padStart(2, "0")}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
