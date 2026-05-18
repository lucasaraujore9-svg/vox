// Issue 010, Sessão de estudo guiado UI proto. Behavior em 042.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ moduleId: string }>;
}

export default async function StudySessionPage({ params }: PageProps) {
  const { moduleId } = await params;

  return (
    <div className="space-y-10">
      <header>
        <p className="vox-eyebrow">
          <Link href="/study" className="hover:underline">Estudo guiado</Link> · Sessão 3 de 6
        </p>
        <h1 className="vox-h1 mt-3">Como ler um texto bíblico em três passos</h1>
        <p className="vox-body mt-3 max-w-2xl">
          Nesta sessão você vai praticar a leitura indutiva, observar, interpretar e
          aplicar, sobre um trecho curto de Filipenses 2.
        </p>
      </header>

      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: "var(--vox-whisper)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: "40%", background: "var(--vox-forest)" }}
        />
      </div>

      <section className="grid lg:grid-cols-[1fr_320px] gap-10">
        <main className="space-y-7">
          <article className="rounded-xl p-7 bg-card border" style={{ borderColor: "var(--vox-whisper)" }}>
            <p className="vox-eyebrow text-vox-gold">Texto base</p>
            <p
              className="mt-3"
              style={{
                fontFamily: "var(--vox-font-display)",
                fontStyle: "italic",
                fontSize: "var(--vox-text-lg)",
                lineHeight: 1.7,
              }}
            >
              &ldquo;Tende em vós aquele sentimento que houve também em Cristo Jesus, que,
              sendo em forma de Deus, não considerou como usurpação o ser igual a Deus,
              mas esvaziou-se a si mesmo&rdquo;
            </p>
            <p className="vox-ref mt-2">Filipenses 2:5,7</p>
          </article>

          <article className="space-y-3">
            <p className="vox-eyebrow">Passo 1 · Observe</p>
            <p className="vox-body">
              Antes de interpretar, anote o que o texto realmente diz. Quem fala? Para quem?
              O que se repete? Quais verbos carregam o peso da frase?
            </p>
            <textarea
              rows={5}
              placeholder="Anote suas observações…"
              className="w-full rounded-lg bg-card border p-4 text-sm focus-visible:outline-none"
              style={{ borderColor: "var(--vox-whisper)" }}
            />
          </article>

          <article className="space-y-3">
            <p className="vox-eyebrow">Passo 2 · Interprete</p>
            <p className="vox-body">
              O que o autor original quis dizer? Por que esta ordem importou para Paulo
              escrevendo aos filipenses?
            </p>
            <textarea
              rows={5}
              placeholder="Anote sua interpretação…"
              className="w-full rounded-lg bg-card border p-4 text-sm focus-visible:outline-none"
              style={{ borderColor: "var(--vox-whisper)" }}
            />
          </article>

          <article className="space-y-3">
            <p className="vox-eyebrow">Passo 3 · Aplique</p>
            <p className="vox-body">
              Que postura este texto pede da congregação hoje?
            </p>
            <textarea
              rows={5}
              placeholder="Anote a aplicação…"
              className="w-full rounded-lg bg-card border p-4 text-sm focus-visible:outline-none"
              style={{ borderColor: "var(--vox-whisper)" }}
            />
          </article>

          <footer className="flex items-center justify-between pt-4">
            <Button variant="outline">Sessão anterior</Button>
            <Button size="lg">Salvar e continuar →</Button>
          </footer>
        </main>

        <aside className="space-y-5">
          <Card>
            <CardContent className="pt-6">
              <p className="vox-eyebrow">Gerar conteúdo</p>
              <p className="text-sm text-vox-prose mt-3">
                Suas notas podem virar um esboço de sermão, palestra ou aula.
              </p>
              <div className="mt-5 space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Gerar sermão (Expositivo)
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Gerar aula (Textual)
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Gerar devocional
                </Button>
              </div>
              <p className="vox-mono text-xs text-vox-muted mt-4">
                Módulo: {moduleId}
              </p>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}
