"use client";

// Modo apresentação por sessões.
// Cada "slide" mostra uma sessão INTEIRA (todos os itens visíveis em apresentação).
// Rodapé canto-direito: "Próximo: <título> — <primeiro item type> snippet".
// Notas pessoais nunca aparecem.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VOX_BLOCK_TYPES, type BlockTypeId, getBlockType } from "@/lib/mocks/blocks";
import type { SessionNode } from "@/lib/sermons/sessions";
import { nextSessionPeek } from "@/lib/sermons/sessions";

type FontSize = "md" | "lg" | "xl";
const FONT_SIZE: Record<FontSize, { px: number; lh: number }> = {
  md: { px: 22, lh: 1.45 },
  lg: { px: 28, lh: 1.4 },
  xl: { px: 36, lh: 1.35 },
};

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

export function PresentSessions({
  title,
  bibleRef,
  frameworkName,
  sessions,
  backHref,
}: PresentSessionsProps) {
  const [index, setIndex] = useState(0);
  const [fontSize, setFontSize] = useState<FontSize>("lg");
  const [stageDark, setStageDark] = useState(true);

  const total = sessions.length;
  const current = sessions[index];
  const visibleItems =
    current?.items.filter((item) => VISIBLE_TYPES.has(item.type)) ?? [];
  const peek = nextSessionPeek(sessions, index);

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, total - 1)), [total]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      } else if (e.key === "+") {
        setFontSize((f) => (f === "md" ? "lg" : "xl"));
      } else if (e.key === "-") {
        setFontSize((f) => (f === "xl" ? "lg" : "md"));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // Swipe (touch)
  useEffect(() => {
    let startX = 0;
    function onStart(e: TouchEvent) {
      startX = e.touches[0]?.clientX ?? 0;
    }
    function onEnd(e: TouchEvent) {
      const endX = e.changedTouches[0]?.clientX ?? 0;
      const delta = endX - startX;
      if (Math.abs(delta) < 60) return;
      if (delta < 0) next();
      else prev();
    }
    window.addEventListener("touchstart", onStart);
    window.addEventListener("touchend", onEnd);
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
    return () => void lock?.release().catch(() => {});
  }, []);

  const f = FONT_SIZE[fontSize];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col stage"
      style={{
        background: stageDark ? "var(--vox-stage-bg)" : "var(--vox-bg)",
        color: stageDark ? "#F1EDE7" : "var(--vox-ink)",
      }}
    >
      <header className="px-10 py-5 flex items-center justify-between gap-4 vox-mono text-xs opacity-70">
        <span>
          {frameworkName} · {current?.title} · {index + 1}/{total}
        </span>
        <span>{bibleRef || title}</span>
      </header>

      <main className="flex-1 px-12 lg:px-24 py-6 overflow-y-auto">
        <article className="max-w-5xl mx-auto w-full">
          <p
            className="vox-eyebrow opacity-60 mb-6"
            style={{ color: stageDark ? "#94A3A0" : undefined }}
          >
            {current?.title}
          </p>

          <div className="space-y-7">
            {visibleItems.map((item) => {
              const t = getBlockType(item.type);
              if (!t || !item.content.trim()) return null;
              const isScripture = item.type === "texto_biblico";
              const isQuote = item.type === "citacao";
              return (
                <div
                  key={item.id}
                  className="relative pl-5"
                  style={{ borderLeft: `2px solid ${t.color}` }}
                >
                  <p
                    className="vox-eyebrow opacity-60 mb-2"
                    style={{ color: t.color }}
                  >
                    {t.label}
                  </p>
                  <p
                    style={{
                      fontFamily:
                        isScripture || isQuote
                          ? "var(--vox-font-display)"
                          : "var(--vox-font-display)",
                      fontStyle: isScripture ? "italic" : "normal",
                      fontSize: `${f.px}px`,
                      lineHeight: f.lh,
                      color: isScripture
                        ? "var(--vox-gold)"
                        : stageDark
                          ? "#F1EDE7"
                          : "var(--vox-ink)",
                    }}
                  >
                    {item.content}
                  </p>
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

      {peek ? (
        <div
          className="absolute right-10 bottom-20 max-w-sm rounded-lg p-4"
          style={{
            background: stageDark ? "rgba(255,255,255,0.04)" : "var(--vox-surface)",
            border: stageDark
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid var(--vox-whisper)",
            opacity: 0.85,
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
              {peek.firstItemContent.trim()
                ? ` · ${peek.firstItemContent.slice(0, 60)}${
                    peek.firstItemContent.length > 60 ? "…" : ""
                  }`
                : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      <footer className="px-10 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={prev}
            disabled={index === 0}
            className="text-current opacity-80 hover:opacity-100"
          >
            ◀ Sessão anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={next}
            disabled={index === total - 1}
            className="text-current opacity-80 hover:opacity-100"
          >
            Próxima sessão ▶
          </Button>
        </div>
        <div className="flex items-center gap-2 vox-mono text-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFontSize((s) => (s === "md" ? "lg" : s === "lg" ? "xl" : "md"))}
            className="text-current opacity-80 hover:opacity-100"
          >
            A {fontSize.toUpperCase()}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStageDark((s) => !s)}
            className="text-current opacity-80 hover:opacity-100"
          >
            {stageDark ? "Modo claro" : "Modo noturno"}
          </Button>
          <span className="opacity-60 px-2">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <Button asChild variant="ghost" size="sm" className="text-current opacity-80 hover:opacity-100">
            <Link href={backHref}>Sair</Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}
