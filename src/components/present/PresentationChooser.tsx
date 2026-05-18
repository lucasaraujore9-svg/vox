"use client";

// Tela de escolha do modo de apresentação. Aparece quando entra em
// /sermons/[id]/present sem ?mode.

import Link from "next/link";
import { cn } from "@/lib/utils";

interface PresentationChooserProps {
  sermonId: string;
  /** Título do sermão pra exibir no header */
  title: string;
  /** type do sermão, pra ajustar copy ("slides" vs "blocos") */
  isSlides: boolean;
}

export function PresentationChooser({
  sermonId,
  title,
  isSlides,
}: PresentationChooserProps) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6">
      <header className="text-center max-w-2xl">
        <p className="vox-eyebrow">Apresentar</p>
        <h1 className="vox-h1 mt-3">{title}</h1>
        <p className="vox-body mt-4">
          Como você vai entregar? Modo simples projeta direto nesta tela. Modo
          apresentador abre uma segunda janela pra audiência e mantém esta tela
          como painel de controle.
        </p>
      </header>

      <section className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl">
        <ChoiceCard
          href={`/sermons/${sermonId}/present?mode=presenter&role=control`}
          eyebrow="Duas telas · recomendado"
          title="Apresentador"
          description={
            isSlides
              ? "Esta aba vira o painel com slide, comentário estruturado, thumb do próximo slide e botão de projeção. Abre uma janela popup para a audiência."
              : "Esta aba vira o painel de controle com sessão atual, próxima sessão e roteiro. Abre uma janela popup para a audiência."
          }
          highlight
          shortcut="A"
        />
        <ChoiceCard
          href={`/sermons/${sermonId}/present?mode=simple`}
          eyebrow="Uma tela"
          title={isSlides ? "Só slide" : "Teleprompter"}
          description={
            isSlides
              ? "Só o slide projetado em tela cheia, sem comentário. Use quando esta tela é a que vai ser projetada."
              : "Sessão a sessão em tela cheia. Use quando esta é a única tela."
          }
          shortcut="↵"
        />
      </section>

      <footer className="mt-14">
        <Link
          href={`/sermons/${sermonId}`}
          className="text-sm text-vox-prose hover:text-vox-ink"
        >
          ← Voltar ao editor
        </Link>
      </footer>
    </div>
  );
}

function ChoiceCard({
  href,
  eyebrow,
  title,
  description,
  highlight,
  shortcut,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  highlight?: boolean;
  shortcut?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative block rounded-2xl p-7 transition-all bg-card",
        "border hover:shadow-[var(--vox-shadow-card-hover)]"
      )}
      style={{
        borderColor: highlight ? "var(--vox-forest)" : "var(--vox-whisper)",
        borderWidth: highlight ? "1.5px" : "1px",
        boxShadow: "var(--vox-shadow-card)",
      }}
    >
      <span
        className="absolute left-0 top-7 bottom-7 w-1 rounded-r"
        style={{ background: highlight ? "var(--vox-forest)" : "var(--vox-gold)" }}
        aria-hidden
      />
      <p
        className="vox-eyebrow"
        style={{ color: highlight ? "var(--vox-forest)" : "var(--vox-gold)" }}
      >
        {eyebrow}
      </p>
      <h2 className="vox-h2 mt-3 text-2xl">{title}</h2>
      <p className="vox-body mt-3 text-sm">{description}</p>
      {shortcut ? (
        <kbd
          className="vox-mono mt-5 inline-flex items-center px-2 py-0.5 rounded border text-xs"
          style={{ borderColor: "var(--vox-whisper)", color: "var(--vox-muted)" }}
        >
          {shortcut}
        </kbd>
      ) : null}
    </Link>
  );
}
