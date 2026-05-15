"use client";

// Grid de frameworks reusável — usado em /settings (aba Frameworks) e em /templates.
// Cada card abre a dica do framework no click.

import { useState } from "react";
import Link from "next/link";
import { FrameworkHintDialog } from "@/components/sermon/FrameworkHintDialog";
import { VOX_FRAMEWORKS, type FrameworkId } from "@/lib/mocks/frameworks";

const WHEN_TO_USE: Record<FrameworkId, string> = {
  expositivo: "Quando você quer honrar a sequência do texto bíblico verso a verso.",
  textual: "Quando uma única passagem carrega o sermão inteiro.",
  narrativo: "Quando o texto já é uma história e você quer contá-la bem.",
  tematico: "Quando o tema é abstrato e você quer convergir várias passagens.",
  topico: "Quando o ponto de partida é um problema contemporâneo da congregação.",
  livre: "Devocional curto, sermão improvisado ou estudo aberto.",
};

export function FrameworksGrid({
  showStartLink = true,
}: {
  /** Se true, mostra link "Usar este framework" (não usar em /settings) */
  showStartLink?: boolean;
}) {
  const [hintFor, setHintFor] = useState<FrameworkId | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {VOX_FRAMEWORKS.map((fw) => {
          const accent = `var(--vox-fw-${fw.id})`;
          return (
            <article
              key={fw.id}
              className="rounded-xl p-6 bg-card relative"
              style={{
                border: "1px solid var(--vox-whisper)",
                boxShadow: "var(--vox-shadow-card)",
              }}
            >
              <span
                className="absolute left-0 top-6 bottom-6 w-1 rounded-r"
                style={{ background: accent }}
                aria-hidden
              />
              <div className="flex items-center gap-2">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ background: accent }}
                />
                <p className="vox-eyebrow" style={{ color: accent }}>
                  {fw.name}
                </p>
              </div>
              <h3 className="vox-h3 mt-3 text-lg">{fw.tagline}</h3>
              <p className="vox-body text-sm mt-3">{fw.description}</p>

              <p className="vox-eyebrow mt-5 text-vox-prose text-[10px]">
                Quando usar
              </p>
              <p className="text-sm text-vox-prose mt-1.5">{WHEN_TO_USE[fw.id]}</p>

              <p className="vox-eyebrow mt-5 text-vox-prose text-[10px]">
                Estrutura sugerida
              </p>
              <p className="text-xs text-vox-muted mt-1.5">
                {fw.outline.join(" · ")}
              </p>

              <footer className="mt-5 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setHintFor(fw.id)}
                  className="hover:underline underline-offset-4"
                  style={{ color: accent }}
                >
                  Ver dica completa →
                </button>
                {showStartLink ? (
                  <Link
                    href={`/sermons/new?framework=${fw.id}`}
                    className="text-vox-prose hover:text-vox-ink underline-offset-4 hover:underline"
                  >
                    Usar este
                  </Link>
                ) : null}
              </footer>
            </article>
          );
        })}
      </div>
      {hintFor ? (
        <FrameworkHintDialog
          framework={hintFor}
          open={Boolean(hintFor)}
          onOpenChange={(v) => !v && setHintFor(null)}
          key={hintFor}
        />
      ) : null}
    </>
  );
}
