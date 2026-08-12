// Casca compartilhada das páginas legais (/termos, /privacidade).

import Link from "next/link";
import { VoxWordmark } from "@/components/brand/VoxWordmark";
import {
  LEGAL_ENTITY_INCOMPLETE,
  LEGAL_UPDATED_AT,
  LEGAL_VERSION,
} from "@/lib/legal/entity";

export function LegalShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen px-6 sm:px-10 lg:px-16 py-12 sm:py-20">
      <header className="max-w-3xl mx-auto flex items-center justify-between">
        <Link href="/" aria-label="VOX">
          <VoxWordmark height={28} />
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/termos" className="text-vox-prose hover:text-vox-ink">
            Termos
          </Link>
          <Link href="/privacidade" className="text-vox-prose hover:text-vox-ink">
            Privacidade
          </Link>
        </nav>
      </header>

      <article className="max-w-3xl mx-auto mt-16">
        <p className="vox-eyebrow">{eyebrow}</p>
        <h1 className="vox-h1 mt-3">{title}</h1>
        <p className="vox-body mt-5">{intro}</p>
        <p className="vox-mono mt-6 text-xs text-vox-muted">
          Versão {LEGAL_VERSION} · Última atualização em {LEGAL_UPDATED_AT}
        </p>

        {LEGAL_ENTITY_INCOMPLETE && (
          <div
            role="note"
            className="mt-8 rounded-xl p-5"
            style={{
              border: "1px solid var(--vox-gold)",
              background: "var(--vox-gold-soft)",
            }}
          >
            <p className="vox-mono text-xs uppercase tracking-wider text-vox-ink">
              Rascunho, não publique ainda
            </p>
            <p className="vox-body text-sm mt-2">
              Os dados do controlador ainda não foram preenchidos. Complete{" "}
              <code className="vox-mono text-xs">src/lib/legal/entity.ts</code> e
              submeta o texto a revisão jurídica antes de cobrar de qualquer
              cliente. Este aviso some sozinho quando os campos forem
              preenchidos.
            </p>
          </div>
        )}

        <div className="mt-12 flex flex-col gap-10">{children}</div>

        <footer
          className="mt-20 pt-8"
          style={{ borderTop: "1px solid var(--vox-whisper)" }}
        >
          <Link
            href="/"
            className="text-sm text-vox-forest underline-offset-4 hover:underline"
          >
            Voltar para a página inicial
          </Link>
        </footer>
      </article>
    </main>
  );
}

export function LegalSection({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="vox-h3">
        <span className="vox-mono text-vox-muted mr-2 text-sm">{n}.</span>
        {title}
      </h2>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="vox-body">{children}</p>;
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="vox-body flex flex-col gap-2 pl-5 list-disc">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
