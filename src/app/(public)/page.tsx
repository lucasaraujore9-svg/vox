import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VOX_FRAMEWORKS } from "@/lib/mocks/frameworks";
import { VoxWordmark } from "@/components/brand/VoxWordmark";

export default function LandingPage() {
  return (
    <main className="min-h-screen px-6 sm:px-10 lg:px-16 py-12 sm:py-20">
      <header className="flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" aria-label="VOX">
          <VoxWordmark height={32} priority />
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/templates" className="text-vox-prose hover:text-vox-ink">
            Frameworks
          </Link>
          <Link href="/auth/login" className="text-vox-prose hover:text-vox-ink">
            Entrar
          </Link>
          <Button asChild size="sm">
            <Link href="/auth/register">Começar</Link>
          </Button>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto mt-20 sm:mt-28 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-start">
        <div>
          <p className="vox-eyebrow">Companheiro silencioso do púlpito</p>
          <h1 className="vox-h1 mt-4" style={{ fontSize: "clamp(36px, 6vw, 56px)" }}>
            O manuscrito que respeita o ofício da pregação.
          </h1>
          <p className="vox-body mt-6 max-w-xl">
            VOX cobre o ciclo completo do sermão — preparação, entrega e arquivo —
            com frameworks homiléticos como guias dentro do editor. Sem fricção,
            sem distrações, sem marketing evangélico.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/auth/register">Começar grátis</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/templates">Ver frameworks</Link>
            </Button>
          </div>
        </div>

        <aside
          className="rounded-xl p-7"
          style={{
            background: "var(--vox-surface)",
            border: "1px solid var(--vox-whisper)",
            boxShadow: "var(--vox-shadow-card)",
          }}
        >
          <p className="vox-eyebrow">Estrutura · Expositivo</p>
          <p className="vox-scripture mt-3">
            &ldquo;Justificados, pois, pela fé, temos paz com Deus por meio do
            nosso Senhor Jesus Cristo&rdquo;
          </p>
          <p className="vox-ref mt-2">Romanos 5:1—11</p>
          <ul className="mt-6 space-y-3 text-sm text-vox-prose">
            <li className="flex items-start gap-3">
              <span
                className="mt-1.5 size-2 rounded-full shrink-0"
                style={{ background: "var(--vox-gold)" }}
              />
              <span>Texto Bíblico</span>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="mt-1.5 size-2 rounded-full shrink-0"
                style={{ background: "var(--vox-forest)" }}
              />
              <span>Contexto histórico</span>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="mt-1.5 size-2 rounded-full shrink-0"
                style={{ background: "var(--vox-forest)" }}
              />
              <span>Ponto Principal</span>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="mt-1.5 size-2 rounded-full shrink-0"
                style={{ background: "#0D7C7C" }}
              />
              <span>Aplicação</span>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="mt-1.5 size-2 rounded-full shrink-0"
                style={{ background: "var(--vox-ink)" }}
              />
              <span>Conclusão</span>
            </li>
          </ul>
        </aside>
      </section>

      <section className="max-w-6xl mx-auto mt-28">
        <p className="vox-eyebrow">Frameworks disponíveis</p>
        <h2 className="vox-h2 mt-3">Seis estruturas. Uma para cada postura no púlpito.</h2>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {VOX_FRAMEWORKS.map((fw) => (
            <article
              key={fw.id}
              className="rounded-xl p-6"
              style={{
                background: "var(--vox-surface)",
                border: "1px solid var(--vox-whisper)",
                boxShadow: "var(--vox-shadow-card)",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ background: `var(--vox-fw-${fw.id})` }}
                />
                <p className="vox-eyebrow" style={{ color: `var(--vox-fw-${fw.id})` }}>
                  {fw.name}
                </p>
              </div>
              <p className="mt-3 vox-h3">{fw.tagline}</p>
              <p className="mt-3 text-sm text-vox-prose">{fw.outline.join(" · ")}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="max-w-6xl mx-auto mt-28 pt-10 border-t border-border text-sm text-vox-muted flex items-center justify-between">
        <span className="vox-mono">© VOX · Manuscritos cuidadosos</span>
        <Link href="/auth/register" className="underline-offset-4 hover:underline">
          Começar
        </Link>
      </footer>
    </main>
  );
}
