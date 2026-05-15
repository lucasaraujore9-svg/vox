// Issue 011 — Modo Apresentador UI proto.
// Behavior real (BroadcastChannel + duas janelas) em 043.
// Aqui simulamos as duas telas lado a lado num único componente.

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface PresenterSlide {
  order: number;
  image_url?: string;
  comment?: string;
  /** Optional block comments to show as colored bars */
  comment_blocks?: Array<{ type: string; color: string; text: string }>;
}

interface PresenterModeProps {
  title: string;
  slides: PresenterSlide[];
  backHref: string;
}

export function PresenterMode({ title, slides, backHref }: PresenterModeProps) {
  const [index, setIndex] = useState(0);
  const total = slides.length;
  const current = slides[index];
  const next = slides[index + 1] ?? null;

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
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col stage"
      style={{ background: "var(--vox-stage-bg)", color: "#F1EDE7" }}
    >
      <header className="px-8 py-4 flex items-center justify-between gap-4 border-b border-white/5">
        <p className="vox-mono text-xs opacity-70">
          {title} · Modo Apresentador
        </p>
        <p className="vox-mono text-xs opacity-70">
          Slide {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 p-6">
        {/* Janela 1 — espelhada para a audiência */}
        <section className="flex flex-col gap-3 min-h-0">
          <p className="vox-eyebrow opacity-60">Audiência (Janela 1)</p>
          <div
            className="flex-1 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden"
            style={{
              background: current?.image_url
                ? `url(${current.image_url}) center / contain no-repeat`
                : "#11171B",
            }}
          >
            {!current?.image_url ? (
              <p
                className="text-6xl opacity-40"
                style={{ fontFamily: "var(--vox-font-display)" }}
              >
                {String(current?.order ?? 1).padStart(2, "0")}
              </p>
            ) : null}
          </div>
        </section>

        {/* Janela 2 — painel do apresentador */}
        <section className="flex flex-col gap-3 min-h-0">
          <p className="vox-eyebrow opacity-60">Painel do apresentador (Janela 2)</p>

          <div className="flex gap-3 min-h-0 flex-1">
            {/* Comentário */}
            <article
              className="flex-1 rounded-xl p-6 overflow-y-auto"
              style={{ background: "#11171B", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="vox-eyebrow opacity-60">Comentário</p>
              <p
                className="mt-3"
                style={{
                  fontFamily: "var(--vox-font-display)",
                  fontSize: "26px",
                  lineHeight: 1.5,
                }}
              >
                {current?.comment ?? "(sem comentário para este slide)"}
              </p>
              {current?.comment_blocks?.length ? (
                <ul className="mt-5 space-y-2">
                  {current.comment_blocks.map((block, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <span
                        className="size-1.5 rounded-full mt-2 shrink-0"
                        style={{ background: block.color }}
                      />
                      <span>
                        <span
                          className="vox-eyebrow opacity-70 mr-2"
                          style={{ color: block.color }}
                        >
                          {block.type}
                        </span>
                        {block.text}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>

            {/* Próximo slide */}
            <aside
              className="w-64 rounded-xl p-4 flex flex-col gap-3"
              style={{ background: "#0E1411", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="vox-eyebrow opacity-60">Próximo</p>
              <div
                className="rounded-lg aspect-video flex items-center justify-center"
                style={{
                  background: next?.image_url
                    ? `url(${next.image_url}) center / cover`
                    : "#1A2126",
                }}
              >
                {!next?.image_url ? (
                  <span className="opacity-50 vox-mono text-2xl">
                    {next ? String(next.order).padStart(2, "0") : "—"}
                  </span>
                ) : null}
              </div>
              <p className="text-xs opacity-70 line-clamp-3">
                {next?.comment ?? "Fim da apresentação"}
              </p>
            </aside>
          </div>
        </section>
      </div>

      <footer className="px-8 py-4 flex items-center justify-between border-t border-white/5">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goPrev}
            disabled={index === 0}
            className="text-current opacity-80 hover:opacity-100"
          >
            ◀ Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goNext}
            disabled={index === total - 1}
            className="text-current opacity-80 hover:opacity-100"
          >
            Próximo ▶
          </Button>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-current opacity-80">
          <Link href={backHref}>Sair</Link>
        </Button>
      </footer>
    </div>
  );
}
