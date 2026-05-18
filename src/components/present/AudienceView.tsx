"use client";

// Janela da audiência (popup aberto pelo apresentador).
// Renderiza o slide ou sessão atual em fullscreen, escuta o BroadcastChannel
// pra navegar e mostra um botão "Entrar em tela cheia" no canto.

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { openChannel, postMessage } from "@/lib/presenter/channel";
import {
  VOX_BLOCK_TYPES,
  getBlockType,
  type BlockTypeId,
} from "@/lib/mocks/blocks";
import type { SessionNode } from "@/lib/sermons/sessions";
import type { SlideItem } from "@/components/slides/SlidesPanel";
import { ItemContent } from "@/components/present/ItemContent";
import { stripHtml } from "@/lib/editor/html";

const VISIBLE_TYPES = new Set<BlockTypeId>(
  VOX_BLOCK_TYPES.filter((b) => b.visibleInPresentation).map((b) => b.id)
);

interface AudienceViewProps {
  sermonId: string;
  /** Pra apresentação: lista de slides */
  slides?: SlideItem[];
  /** Pra esboço: lista de sessões */
  sessions?: SessionNode[];
  title: string;
}

export function AudienceView({
  sermonId,
  slides,
  sessions,
  title,
}: AudienceViewProps) {
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const totalSlides = slides?.length ?? 0;
  const totalSessions = sessions?.length ?? 0;
  const total = totalSlides || totalSessions;

  // Conecta ao BroadcastChannel
  useEffect(() => {
    const ch = openChannel(sermonId);
    channelRef.current = ch;
    if (!ch) return;

    ch.onmessage = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;
      if (msg.type === "navigate" && typeof msg.index === "number") {
        setIndex(msg.index);
        setConnected(true);
      } else if (msg.type === "exit") {
        window.close();
      }
    };

    // Anuncia que chegou e pede estado atual
    postMessage(ch, { type: "audience-ready", sermonId });
    postMessage(ch, { type: "request-state" });

    return () => {
      postMessage(ch, { type: "audience-bye" });
      ch.close();
    };
  }, [sermonId]);

  // Detecta mudança de fullscreen
  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Wake lock
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    void (async () => {
      try {
        if ("wakeLock" in navigator)
          lock = await navigator.wakeLock.request("screen");
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
      // sem permissão / sem suporte
    }
  }

  const safeIndex = Math.min(index, Math.max(0, total - 1));
  const currentSlide = slides?.[safeIndex];
  const currentSession = sessions?.[safeIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col stage"
      style={{
        background: "var(--vox-stage-bg)",
        color: "#F1EDE7",
      }}
    >
      {!isFullscreen ? (
        <header className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <span
            className="vox-mono text-xs opacity-50 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            {connected ? "● Audiência conectada" : "○ Aguardando…"}
          </span>
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
        {currentSlide ? (
          <SlideRender slide={currentSlide} />
        ) : currentSession ? (
          <SessionRender session={currentSession} />
        ) : (
          <div className="text-center opacity-60">
            <p className="vox-mono text-xs uppercase mb-3">{title}</p>
            <p className="text-2xl" style={{ fontFamily: "var(--vox-font-display)" }}>
              Aguardando o apresentador…
            </p>
          </div>
        )}
      </main>

      {!isFullscreen ? (
        <footer className="absolute bottom-3 left-3 vox-mono text-xs opacity-50">
          {total > 0
            ? `${String(safeIndex + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`
            : ""}
        </footer>
      ) : null}
    </div>
  );
}

function SlideRender({ slide }: { slide: SlideItem }) {
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
  // Slide sem imagem, mostra o primeiro item visível do comentário em destaque
  const sessions = slide.comment_items?.sessions ?? [];
  const firstItem = sessions
    .flatMap((s) => s.items)
    .find((i) => VISIBLE_TYPES.has(i.type));
  const blockType = firstItem ? getBlockType(firstItem.type) : null;

  if (firstItem && blockType) {
    const isScripture = firstItem.type === "texto_biblico";
    return (
      <article className="max-w-5xl px-16 text-center">
        <p
          className="vox-eyebrow opacity-60 mb-6"
          style={{ color: blockType.color }}
        >
          {blockType.label}
        </p>
        <ItemContent
          html={firstItem.content}
          style={{
            fontFamily: "var(--vox-font-display)",
            fontStyle: isScripture ? "italic" : "normal",
            fontSize: "clamp(36px, 5vw, 64px)",
            lineHeight: 1.35,
            color: isScripture ? "var(--vox-gold)" : "#F1EDE7",
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

function SessionRender({ session }: { session: SessionNode }) {
  const visibleItems = session.items.filter((i) => VISIBLE_TYPES.has(i.type));
  return (
    <article className="max-w-5xl px-16 w-full">
      <p className="vox-eyebrow opacity-60 mb-7">{session.title}</p>
      <div className="space-y-7">
        {visibleItems.map((item) => {
          const t = getBlockType(item.type);
          if (!t || !stripHtml(item.content).trim()) return null;
          const isScripture = item.type === "texto_biblico";
          return (
            <div
              key={item.id}
              className="pl-5"
              style={{ borderLeft: `2px solid ${t.color}` }}
            >
              <ItemContent
                html={item.content}
                style={{
                  fontFamily: "var(--vox-font-display)",
                  fontStyle: isScripture ? "italic" : "normal",
                  fontSize: "clamp(28px, 3.5vw, 44px)",
                  lineHeight: 1.4,
                  color: isScripture ? "var(--vox-gold)" : "#F1EDE7",
                }}
              />
            </div>
          );
        })}
      </div>
    </article>
  );
}
