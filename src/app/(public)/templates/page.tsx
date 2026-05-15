// Issue 015 — Biblioteca de Frameworks (proto público)

import Link from "next/link";
import { VOX_FRAMEWORKS } from "@/lib/mocks/frameworks";
import { VoxWordmark } from "@/components/brand/VoxWordmark";

export const metadata = {
  title: "Frameworks Homiléticos",
  description: "Seis estruturas de pregação. Uma para cada postura no púlpito.",
};

const WHEN_TO_USE: Record<string, string> = {
  expositivo: "Quando você quer honrar a sequência do texto bíblico verso a verso.",
  textual: "Quando uma única passagem (sentença/parágrafo) carrega o sermão inteiro.",
  narrativo: "Quando o texto bíblico já é uma história e você quer contá-la bem.",
  tematico: "Quando o tema é abstrato e você quer convergir várias passagens.",
  topico: "Quando o ponto de partida é um problema contemporâneo da congregação.",
  livre: "Devocional curto, sermão improvisado, ou estudo em formato aberto.",
};

export default function FrameworksPage() {
  return (
    <main className="min-h-screen px-6 sm:px-10 lg:px-16 py-12 sm:py-20">
      <header className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" aria-label="VOX">
          <VoxWordmark height={28} priority />
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/auth/login" className="text-vox-prose hover:text-vox-ink">Entrar</Link>
          <Link href="/auth/register" className="text-vox-forest underline-offset-4 hover:underline">
            Começar
          </Link>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto mt-16">
        <p className="vox-eyebrow">Biblioteca</p>
        <h1 className="vox-h1 mt-3">Frameworks homiléticos</h1>
        <p className="vox-body mt-5 max-w-2xl">
          Seis estruturas testadas no púlpito. Cada uma é uma postura — não uma fórmula.
          Escolha conforme o texto, a congregação e o momento.
        </p>
      </section>

      <section className="max-w-6xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {VOX_FRAMEWORKS.map((fw) => {
          const accent = `var(--vox-fw-${fw.id})`;
          return (
            <article
              key={fw.id}
              className="rounded-xl p-7 bg-card relative"
              style={{
                border: "1px solid var(--vox-whisper)",
                boxShadow: "var(--vox-shadow-card)",
              }}
            >
              <span
                className="absolute left-0 top-7 bottom-7 w-1 rounded-r"
                style={{ background: accent }}
                aria-hidden
              />
              <div className="flex items-center gap-2">
                <span className="inline-block size-2 rounded-full" style={{ background: accent }} />
                <p className="vox-eyebrow" style={{ color: accent }}>{fw.name}</p>
              </div>
              <h2 className="vox-h2 mt-3 text-2xl">{fw.tagline}</h2>
              <p className="vox-body mt-4">{fw.description}</p>

              <p className="vox-eyebrow mt-7 text-vox-prose">Quando usar</p>
              <p className="text-sm text-vox-prose mt-2">{WHEN_TO_USE[fw.id]}</p>

              <p className="vox-eyebrow mt-7 text-vox-prose">Estrutura</p>
              <ol className="mt-3 space-y-2">
                {fw.outline.map((block, idx) => (
                  <li
                    key={`${fw.id}-${idx}`}
                    className="flex items-start gap-3 text-sm"
                  >
                    <span className="vox-mono text-vox-muted text-xs pt-0.5 w-6 shrink-0">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-vox-ink">{block}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-7 flex">
                <Link
                  href={`/sermons/new?framework=${fw.id}`}
                  className="text-sm font-medium hover:underline underline-offset-4"
                  style={{ color: accent }}
                >
                  Usar este framework →
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      <footer className="max-w-6xl mx-auto mt-20 pt-10 border-t border-border text-sm text-vox-muted flex items-center justify-between">
        <span className="vox-mono">© VOX · Manuscritos cuidadosos</span>
        <Link href="/" className="hover:text-vox-ink underline-offset-4 hover:underline">
          Voltar
        </Link>
      </footer>
    </main>
  );
}
