"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { BlockType } from "@/lib/mocks/blocks";
import { cn } from "@/lib/utils";

interface PresentEsbocoProps {
  title: string;
  bibleRef: string;
  frameworkName: string;
  blocks: Array<{ type: BlockType; content: string }>;
  backHref: string;
}

type FontSize = "md" | "lg" | "xl";
const FONT_SIZE: Record<FontSize, { px: number; lh: number }> = {
  md: { px: 28, lh: 1.5 },
  lg: { px: 36, lh: 1.45 },
  xl: { px: 48, lh: 1.4 },
};

export function PresentEsboco({
  title,
  bibleRef,
  frameworkName,
  blocks,
  backHref,
}: PresentEsbocoProps) {
  const [index, setIndex] = useState(0);
  const [fontSize, setFontSize] = useState<FontSize>("lg");
  const [stageDark, setStageDark] = useState(true);

  const total = blocks.length;
  const current = blocks[index];

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, total - 1));
  }, [total]);
  const prev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

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

  // Wake lock + fullscreen request
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    void (async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // sem suporte
      }
    })();
    return () => {
      void wakeLock?.release().catch(() => {});
    };
  }, []);

  const fontConfig = FONT_SIZE[fontSize];

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col",
        stageDark ? "stage" : ""
      )}
      style={{
        background: stageDark ? "var(--vox-stage-bg)" : "var(--vox-bg)",
        color: stageDark ? "#F1EDE7" : "var(--vox-ink)",
      }}
    >
      <header className="px-8 py-5 flex items-center justify-between gap-4 vox-mono text-xs opacity-70">
        <span>
          {frameworkName} · {current?.type.label} {index + 1}/{total}
        </span>
        <span>{bibleRef}</span>
      </header>

      <main className="flex-1 px-12 lg:px-32 flex items-center justify-center">
        <article className="max-w-5xl mx-auto w-full">
          {current?.type.id === "texto_biblico" ? (
            <p
              style={{
                fontFamily: "var(--vox-font-display)",
                fontStyle: "italic",
                fontSize: `${fontConfig.px}px`,
                lineHeight: fontConfig.lh,
                color: "var(--vox-gold)",
              }}
            >
              &ldquo;{current.content}&rdquo;
            </p>
          ) : (
            <p
              style={{
                fontFamily: "var(--vox-font-display)",
                fontSize: `${fontConfig.px}px`,
                lineHeight: fontConfig.lh,
                color: stageDark ? "#F1EDE7" : "var(--vox-ink)",
              }}
            >
              {current?.content}
            </p>
          )}
          {current?.type.id === "texto_biblico" ? (
            <p
              className="vox-mono mt-6 text-sm opacity-60"
              style={{ color: "var(--vox-gold)" }}
            >
              {bibleRef}
            </p>
          ) : null}
        </article>
      </main>

      <footer className="px-8 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={prev}
            disabled={index === 0}
            className="text-current opacity-80 hover:opacity-100"
          >
            ◀ Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={next}
            disabled={index === total - 1}
            className="text-current opacity-80 hover:opacity-100"
          >
            Próximo ▶
          </Button>
        </div>
        <div className="flex items-center gap-2 vox-mono text-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFontSize((f) => (f === "md" ? "lg" : f === "lg" ? "xl" : "md"))}
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
