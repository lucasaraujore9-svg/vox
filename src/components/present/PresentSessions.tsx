"use client";

// Modo apresentação por sessões (teleprompter).
// Cada "slide" mostra uma sessão INTEIRA. Notas pessoais nunca aparecem.
//
// Responsivo:
//   - Portrait (h > w):   padding lateral menor, header empilhado, peek em barra
//                         fina no rodapé (acima dos controles), controles em 2 linhas.
//   - Landscape (w > h):  layout original, peek flutuante no canto direito, controles
//                         em uma linha só.
// Fonte default em telas estreitas é `md`, em landscape `lg`.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VOX_BLOCK_TYPES, type BlockTypeId, getBlockType } from "@/lib/mocks/blocks";
import type { SessionNode } from "@/lib/sermons/sessions";
import { nextSessionPeek } from "@/lib/sermons/sessions";
import { ItemContent } from "@/components/present/ItemContent";
import { stripHtml, previewSnippet } from "@/lib/editor/html";

type FontSize = "sm" | "md" | "lg" | "xl";
const FONT_SIZE: Record<FontSize, { px: number; lh: number }> = {
  sm: { px: 18, lh: 1.5 },
  md: { px: 22, lh: 1.45 },
  lg: { px: 28, lh: 1.4 },
  xl: { px: 36, lh: 1.35 },
};

const FONT_ORDER: FontSize[] = ["sm", "md", "lg", "xl"];

const VISIBLE_TYPES = new Set<BlockTypeId>(
  VOX_BLOCK_TYPES.filter((b) => b.visibleInPresentation).map((b) => b.id)
);

interface PresentSessionsProps {
  title: string;
  bibleRef: string;
  frameworkName: string;
  sessions: SessionNode[];
  backHref: string;
}

/** Hook simples: true quando viewport está em portrait. SSR-safe. */
function useOrientation(): { isPortrait: boolean; isCompact: boolean } {
  const [state, setState] = useState({ isPortrait: false, isCompact: false });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setState({
        isPortrait: h >= w,
        // breakpoint compact (≈ tablet portrait ou menor)
        isCompact: w < 900,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);
  return state;
}

export function PresentSessions({
  title,
  bibleRef,
  frameworkName,
  sessions,
  backHref,
}: PresentSessionsProps) {
  const { isPortrait, isCompact } = useOrientation();
  const [index, setIndex] = useState(0);
  // Em telas estreitas, default `md`; em desk, `lg`.
  const [fontSize, setFontSize] = useState<FontSize>("lg");
  const [stageDark, setStageDark] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sincroniza estado com mudanças de fullscreen (Esc, F11, etc.)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { });
    } else {
      document.documentElement.requestFullscreen().catch(() => { });
    }
  }, []);

  // Ajusta default de fonte uma vez quando descobre que está em viewport compacto
  useEffect(() => {
    if (isCompact) setFontSize((f) => (f === "lg" || f === "xl" ? "md" : f));
  }, [isCompact]);

  const total = sessions.length;
  const current = sessions[index];
  const visibleItems =
    current?.items.filter((item) => VISIBLE_TYPES.has(item.type)) ?? [];
  const peek = nextSessionPeek(sessions, index);

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, total - 1)), [total]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "+") {
        setFontSize((f) => {
          const i = FONT_ORDER.indexOf(f);
          return FONT_ORDER[Math.min(i + 1, FONT_ORDER.length - 1)]!;
        });
      } else if (e.key === "-") {
        setFontSize((f) => {
          const i = FONT_ORDER.indexOf(f);
          return FONT_ORDER[Math.max(i - 1, 0)]!;
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, toggleFullscreen]);

  // Swipe horizontal (touch), desabilita se o gesto começou em texto rolável
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    function onStart(e: TouchEvent) {
      startX = e.touches[0]?.clientX ?? 0;
      startY = e.touches[0]?.clientY ?? 0;
    }
    function onEnd(e: TouchEvent) {
      const endX = e.changedTouches[0]?.clientX ?? 0;
      const endY = e.changedTouches[0]?.clientY ?? 0;
      const dx = endX - startX;
      const dy = endY - startY;
      // Só dispara se o gesto for predominantemente horizontal
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) next();
      else prev();
    }
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [next, prev]);

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

  function cycleFont() {
    setFontSize((s) => {
      const i = FONT_ORDER.indexOf(s);
      return FONT_ORDER[(i + 1) % FONT_ORDER.length]!;
    });
  }

  const f = FONT_SIZE[fontSize];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col stage"
      style={{
        background: stageDark ? "var(--vox-stage-bg)" : "var(--vox-bg)",
        color: stageDark ? "#F1EDE7" : "var(--vox-ink)",
      }}
    >
      <header
        className={
          isCompact
            ? "px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-2 flex flex-col gap-1 vox-mono text-[11px] opacity-70"
            : "px-10 py-5 flex items-center justify-between gap-4 vox-mono text-xs opacity-70"
        }
      >
        <span className="truncate">
          {frameworkName} · {current?.title || "Sem título"} · {index + 1}/{total}
        </span>
        <span className="truncate">{bibleRef || title}</span>
      </header>

      <main
        className={
          isCompact
            ? "flex-1 px-4 py-2 overflow-y-auto"
            : "flex-1 px-12 lg:px-24 py-6 overflow-y-auto"
        }
      >
        {/* Reserva espaço no fim do conteúdo para o peek flutuante "Próximo"
            não ficar por cima do texto da sessão atual ao rolar até o fim.
            Só aplica no layout landscape (peek absoluto); em compact/portrait o
            peek é uma barra no fluxo. */}
        <article
          className="max-w-5xl mx-auto w-full"
          style={
            peek && !(isCompact || isPortrait) ? { paddingBottom: "12rem" } : undefined
          }
        >
          {current?.title ? (
            <p
              className={`vox-eyebrow opacity-60 ${isCompact ? "mb-3" : "mb-6"}`}
              style={{ color: stageDark ? "#94A3A0" : undefined }}
            >
              {current.title}
            </p>
          ) : null}

          <div className={isCompact ? "space-y-5" : "space-y-7"}>
            {visibleItems.map((item) => {
              const t = getBlockType(item.type);
              if (!t || !stripHtml(item.content).trim()) return null;
              const isScripture = item.type === "texto_biblico";
              return (
                <div
                  key={item.id}
                  className="relative pl-4 sm:pl-5"
                  style={{ borderLeft: `2px solid ${t.color}` }}
                >
                  <p
                    className="vox-eyebrow opacity-60 mb-2"
                    style={{ color: t.color }}
                  >
                    {t.label}
                  </p>
                  <ItemContent
                    html={item.content}
                    style={{
                      fontFamily: "var(--vox-font-display)",
                      fontStyle: isScripture ? "italic" : "normal",
                      fontSize: `${f.px}px`,
                      lineHeight: f.lh,
                      color: isScripture
                        ? "var(--vox-gold)"
                        : stageDark
                          ? "#F1EDE7"
                          : "var(--vox-ink)",
                      wordBreak: "break-word",
                    }}
                  />
                </div>
              );
            })}

            {visibleItems.length === 0 ? (
              <p className="opacity-50 text-sm italic">
                Esta sessão ainda não tem itens preenchidos.
              </p>
            ) : null}
          </div>
        </article>
      </main>

      {/* Peek "Próximo", flutuante em landscape, barra fina em portrait/compact */}
      {peek ? (
        isCompact || isPortrait ? (
          <div
            className="px-4 py-2 flex items-center gap-3 text-xs"
            style={{
              background: stageDark ? "rgba(255,255,255,0.04)" : "var(--vox-surface)",
              borderTop: stageDark
                ? "1px solid rgba(255,255,255,0.08)"
                : "1px solid var(--vox-whisper)",
              opacity: 0.95,
            }}
          >
            <span className="vox-eyebrow opacity-60 shrink-0">Próximo</span>
            <span className="truncate font-semibold">{peek.title}</span>
            {peek.firstItemType ? (
              <span className="vox-mono opacity-60 truncate hidden sm:inline">
                · {getBlockType(peek.firstItemType)?.label}
                {peek.firstItemContent && stripHtml(peek.firstItemContent).trim()
                  ? `, ${previewSnippet(peek.firstItemContent, 40)}`
                  : ""}
              </span>
            ) : null}
          </div>
        ) : (
          <div
            className="absolute right-10 bottom-20 max-w-sm rounded-lg p-4"
            style={{
              // Fundo OPACO, usa a cor do palco para mascarar o texto da sessão
              // atual quando ela rola até o rodapé. Sem isso, o conteúdo cruzava
              // com o card "Próximo".
              background: stageDark ? "var(--vox-stage-bg)" : "var(--vox-bg)",
              border: stageDark
                ? "1px solid rgba(255,255,255,0.18)"
                : "1px solid var(--vox-whisper)",
              boxShadow: stageDark
                ? "0 8px 24px rgba(0,0,0,0.45)"
                : "0 8px 24px rgba(0,0,0,0.08)",
            }}
          >
            <p className="vox-eyebrow opacity-60 text-xs">Próximo</p>
            <p
              className="mt-1 vox-h3 text-sm leading-tight"
              style={{ color: stageDark ? "#F1EDE7" : "var(--vox-ink)" }}
            >
              {peek.title}
            </p>
            {peek.firstItemType ? (
              <p className="vox-mono text-xs opacity-60 mt-2">
                {getBlockType(peek.firstItemType)?.label}
                {peek.firstItemContent && stripHtml(peek.firstItemContent).trim()
                  ? ` · ${previewSnippet(peek.firstItemContent, 60)}`
                  : ""}
              </p>
            ) : null}
          </div>
        )
      ) : null}

      <footer
        className={
          isCompact
            ? "px-3 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] flex items-center justify-between gap-2 border-t"
            : "px-10 py-5 flex items-center justify-between gap-4"
        }
        style={
          isCompact
            ? { borderColor: stageDark ? "rgba(255,255,255,0.08)" : "var(--vox-whisper)" }
            : undefined
        }
      >
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size={isCompact ? "sm" : "sm"}
            onClick={prev}
            disabled={index === 0}
            className="text-current opacity-80 hover:opacity-100"
            aria-label="Sessão anterior"
          >
            {isCompact ? "◀" : "◀ Sessão anterior"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={next}
            disabled={index === total - 1}
            className="text-current opacity-80 hover:opacity-100"
            aria-label="Próxima sessão"
          >
            {isCompact ? "▶" : "Próxima sessão ▶"}
          </Button>
        </div>

        <div className="flex items-center gap-1 vox-mono text-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={cycleFont}
            className="text-current opacity-80 hover:opacity-100 px-2"
            aria-label="Tamanho da fonte"
          >
            A {fontSize.toUpperCase()}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStageDark((s) => !s)}
            className="text-current opacity-80 hover:opacity-100 px-2"
            aria-label={stageDark ? "Modo claro" : "Modo noturno"}
          >
            {stageDark ? "☀" : "☾"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-current opacity-80 hover:opacity-100 px-2"
            aria-label={isFullscreen ? "Sair de tela cheia (F)" : "Tela cheia (F)"}
            title={isFullscreen ? "Sair de tela cheia (F)" : "Tela cheia (F)"}
          >
            {isFullscreen ? "⤡" : "⛶"}
          </Button>
          {!isCompact ? (
            <span className="opacity-60 px-2">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          ) : null}
          <Button asChild variant="ghost" size="sm" className="text-current opacity-80 hover:opacity-100 px-2">
            <Link href={backHref}>Sair</Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}
