"use client";

// Modo Simples (Projeção), só o slide em tela cheia, sem painel de comentário.
// Mesma estética da janela de audiência, mas standalone (não escuta channel).
// Pra usar quando o monitor é o mesmo onde o pastor está.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  VOX_BLOCK_TYPES,
  getBlockType,
  type BlockTypeId,
  blockColor,
} from "@/lib/mocks/blocks";
import type { SlideItem } from "@/components/slides/SlidesPanel";
import { ItemContent } from "@/components/present/ItemContent";
import { surfaceFor, usePresentTheme } from "@/lib/presenter/theme";

const VISIBLE_TYPES = new Set<BlockTypeId>(
  VOX_BLOCK_TYPES.filter((b) => b.visibleInPresentation).map((b) => b.id)
);

interface SlideProjectionProps {
  title: string;
  slides: SlideItem[];
  backHref: string;
}

export function SlideProjection({ title, slides, backHref }: SlideProjectionProps) {
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const surface = surfaceFor(usePresentTheme());

  const total = slides.length;
  const current = slides[index];

  const goNext = useCallback(() => setIndex((i) => Math.min(i + 1, total - 1)), [total]);
  const goPrev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
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
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onChange);
    };
  }, [goNext, goPrev]);

  // Swipe
  useEffect(() => {
    let startX = 0;
    function onStart(e: TouchEvent) {
      startX = e.touches[0]?.clientX ?? 0;
    }
    function onEnd(e: TouchEvent) {
      const endX = e.changedTouches[0]?.clientX ?? 0;
      const delta = endX - startX;
      if (Math.abs(delta) < 60) return;
      if (delta < 0) goNext();
      else goPrev();
    }
    window.addEventListener("touchstart", onStart);
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
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

  async function enterFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // sem suporte
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col${surface.isDark ? " stage" : ""}`}
      style={{ background: surface.bg, color: surface.ink }}
    >
      {!isFullscreen ? (
        <header className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <Button
            onClick={enterFullscreen}
            size="sm"
            variant="outline"
            className="text-current border-white/20 hover:bg-white/10"
          >
            Entrar em tela cheia
          </Button>
        </header>
      ) : null}

      <main className="flex-1 flex items-center justify-center">
        <SlideRender slide={current} isDark={surface.isDark} />
      </main>

      {!isFullscreen ? (
        <footer className="absolute bottom-3 left-3 right-3 flex items-center justify-between vox-mono text-xs">
          <span className="opacity-50">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} ·{" "}
            {title}
          </span>
          <div className="flex items-center gap-2">
            <Button
              onClick={goPrev}
              disabled={index === 0}
              size="sm"
              variant="ghost"
              className="text-current opacity-80"
            >
              ◀ Anterior
            </Button>
            <Button
              onClick={goNext}
              disabled={index === total - 1}
              size="sm"
              variant="ghost"
              className="text-current opacity-80"
            >
              Próximo ▶
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-current opacity-80">
              <Link href={backHref}>Sair</Link>
            </Button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

function SlideRender({
  slide,
  isDark,
}: {
  slide: SlideItem | undefined;
  isDark: boolean;
}) {
  if (!slide) {
    return <p className="opacity-50 italic">Sem slides.</p>;
  }
  if (slide.image_url) {
    return (
      <div
        className="w-full h-full"
        style={{
          background: `url(${slide.image_url}) center / contain no-repeat`,
        }}
      />
    );
  }
  // Slide sem imagem, primeiro item visível em destaque
  const firstItem = slide.comment_items?.sessions
    ?.flatMap((s) => s.items)
    .find((i) => VISIBLE_TYPES.has(i.type));
  const blockType = firstItem ? getBlockType(firstItem.type) : null;

  if (firstItem && blockType) {
    const isScripture = firstItem.type === "texto_biblico";
    return (
      <article className="max-w-5xl px-16 text-center">
        <p
          className="vox-eyebrow opacity-60 mb-6"
          style={{ color: blockColor(blockType.id, isDark) }}
        >
          {blockType.label}
        </p>
        <ItemContent
                      onDarkSurface={isDark}
          html={firstItem.content}
          style={{
            fontFamily: "var(--vox-font-display)",
            fontStyle: isScripture ? "italic" : "normal",
            fontSize: "clamp(36px, 5vw, 64px)",
            lineHeight: 1.35,
            color: isScripture ? "var(--vox-gold)" : isDark ? "#F5F2ED" : "var(--vox-ink)",
          }}
        />
      </article>
    );
  }

  return (
    <p
      className="text-9xl opacity-20"
      style={{ fontFamily: "var(--vox-font-display)" }}
    >
      {String(slide.order).padStart(2, "0")}
    </p>
  );
}
