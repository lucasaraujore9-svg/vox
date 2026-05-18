// Painel de slides reformulado, densidade visual maior, menos espaço desperdiçado.
// Layout: rail compacto de thumbs (200px) + área principal com header "Slide N"
// embutido em uma barra fina + SermonEditor (manuscrito) ocupando o resto.

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SermonEditor } from "@/components/editor/SermonEditor";
import {
  emptyContentFor,
  type SermonContent,
} from "@/lib/sermons/sessions";
import type { FrameworkId } from "@/lib/mocks/frameworks";
import { cn } from "@/lib/utils";
import Image from "next/image";

export interface SlideItem {
  id: string;
  order: number;
  image_url?: string;
  comment_items?: SermonContent | null;
  comment?: string;
}

interface SlidesPanelProps {
  slides: SlideItem[];
  framework?: FrameworkId;
  empty?: boolean;
  className?: string;
}

export function SlidesPanel({
  slides,
  framework = "livre",
  empty = false,
  className,
}: SlidesPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(slides[0]?.id ?? null);
  const [contents, setContents] = useState<Record<string, SermonContent>>(() =>
    Object.fromEntries(
      slides.map((s) => [s.id, s.comment_items ?? legacyToContent(s.comment, framework)])
    )
  );

  const selected = slides.find((s) => s.id === selectedId) ?? null;
  const currentContent = selected ? contents[selected.id] : undefined;
  const selectedIdx = selected ? slides.findIndex((s) => s.id === selected.id) : -1;

  function handleContentChange(slideId: string, content: SermonContent) {
    setContents((prev) => ({ ...prev, [slideId]: content }));
  }

  function itemCount(slide: SlideItem): number {
    const c = contents[slide.id];
    if (!c) return 0;
    return c.sessions.reduce((sum, s) => sum + s.items.filter((i) => i.content.trim()).length, 0);
  }

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-5", className)}>
      {/* Rail compacto de slides */}
      <aside
        className="rounded-lg overflow-hidden border bg-card self-start sticky top-4"
        style={{ borderColor: "var(--vox-whisper)" }}
      >
        <div
          className="px-3 py-2.5 border-b flex items-center justify-between"
          style={{ borderColor: "var(--vox-whisper)" }}
        >
          <p className="vox-eyebrow text-[10px]">Slides</p>
          <span className="vox-mono text-xs text-vox-muted">{slides.length}</span>
        </div>
        <div className="p-2 space-y-1.5 max-h-[70vh] overflow-y-auto">
          {empty ? (
            <div
              className="rounded-md border-2 border-dashed p-5 text-center"
              style={{ borderColor: "var(--vox-whisper-strong)" }}
            >
              <p className="text-xs text-vox-prose">Arraste PDF ou cole link</p>
              <Button size="sm" variant="outline" className="mt-3 text-xs">
                Escolher arquivo
              </Button>
            </div>
          ) : (
            slides.map((slide) => {
              const total = itemCount(slide);
              const isActive = selectedId === slide.id;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setSelectedId(slide.id)}
                  className={cn(
                    "block w-full rounded-md overflow-hidden text-left transition-all border",
                    isActive ? "shadow-[var(--vox-shadow-card)]" : "hover:opacity-90"
                  )}
                  style={{
                    borderColor: isActive ? "var(--vox-forest)" : "var(--vox-whisper)",
                    borderWidth: isActive ? "1.5px" : "1px",
                  }}
                >
                  {/* Thumb aspect-video pequena */}
                  <div
                    className="aspect-video flex items-center justify-center relative"
                    style={{
                      background: slide.image_url
                        ? `url(${slide.image_url}) center / cover`
                        : "var(--vox-surface-deep)",
                    }}
                  >
                    {!slide.image_url ? (
                      <span
                        className="vox-mono text-base"
                        style={{
                          color: isActive ? "var(--vox-forest)" : "var(--vox-muted)",
                          opacity: 0.6,
                        }}
                      >
                        {String(slide.order).padStart(2, "0")}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between px-2 py-1">
                    <span
                      className="vox-mono text-[10px]"
                      style={{
                        color: isActive ? "var(--vox-forest)" : "var(--vox-muted)",
                      }}
                    >
                      {String(slide.order).padStart(2, "0")}
                    </span>
                    {total > 0 ? (
                      <span className="vox-mono text-[10px] text-vox-muted">
                        {total}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })
          )}

          {!empty ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-1 text-xs h-auto py-1.5"
            >
              + Slide
            </Button>
          ) : null}
        </div>
      </aside>

      {/* Área principal: header compacto + editor */}
      <section className="space-y-5 min-w-0">
        {selected ? (
          <>
            <SlideHeaderBar
              slide={selected}
              index={selectedIdx}
              total={slides.length}
            />
            <div>
              <p className="vox-eyebrow text-xs mb-3 text-vox-prose">
                Manuscrito do slide
              </p>
              {currentContent ? (
                <SermonEditor
                  key={selected.id}
                  framework={framework}
                  initialContent={currentContent}
                  onChange={(c) => handleContentChange(selected.id, c)}
                />
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center min-h-[400px] text-sm text-vox-muted">
            Selecione um slide para adicionar comentários
          </div>
        )}
      </section>
    </div>
  );
}

/** Barra fina no topo: thumb + slide N + descrição curta. */
function SlideHeaderBar({
  slide,
  index,
  total,
}: {
  slide: SlideItem;
  index: number;
  total: number;
}) {
  return (
    <div
      className="rounded-lg bg-card border p-4 flex items-center gap-4"
      style={{ borderColor: "var(--vox-whisper)" }}
    >
      {/* Miniatura à esquerda (~140px wide) */}
      <div
        className="aspect-video w-32 rounded-md overflow-hidden shrink-0 flex items-center justify-center relative"
        style={{
          background: slide.image_url
            ? `url(${slide.image_url}) center / cover`
            : "var(--vox-surface-deep)",
          border: "1px solid var(--vox-whisper)",
        }}
      >
        {slide.image_url ? (
          <Image
            src={slide.image_url}
            alt={`Slide ${slide.order}`}
            fill
            sizes="128px"
            className="object-cover"
          />
        ) : (
          <span className="vox-mono text-2xl" style={{ color: "var(--vox-muted)" }}>
            {String(slide.order).padStart(2, "0")}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <p
            className="vox-eyebrow"
            style={{ color: "var(--vox-forest)" }}
          >
            Slide {String(slide.order).padStart(2, "0")}
          </p>
          <span className="vox-mono text-xs text-vox-muted">
            {index + 1} de {total}
          </span>
        </div>
        <p className="vox-body text-sm text-vox-prose mt-1.5">
          Manuscrito estruturado · siga o modelo como num esboço.
        </p>
      </div>

      {/* Ações por slide (placeholder) */}
      <div className="flex gap-2 shrink-0">
        <Button variant="outline" size="sm">
          Substituir imagem
        </Button>
      </div>
    </div>
  );
}

function legacyToContent(legacy: string | undefined, framework: FrameworkId): SermonContent {
  if (!legacy?.trim()) return emptyContentFor(framework);
  return {
    sessions: [
      {
        id: cryptoRandomId(),
        title: "Anotações",
        role: "livre",
        order: 1,
        items: [
          {
            id: cryptoRandomId(),
            type: "notas_pessoais",
            content: legacy,
            order: 1,
          },
        ],
      },
    ],
  };
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 12);
}
