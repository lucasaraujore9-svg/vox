import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VOX_FRAMEWORKS } from "@/lib/mocks/frameworks";
import { VoxWordmark } from "@/components/brand/VoxWordmark";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = {
  title: "VOX, organiza a semana de quem prega",
  description:
    "Da página em branco na segunda ao púlpito no domingo, num só lugar. Editor em blocos, modelos de pregação, bíblia integrada e modos de apresentação.",
};

export default function LandingPage() {
  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--vox-bg)", color: "var(--vox-ink)" }}
    >
      <SiteHeader />
      <Hero />
      <Demo />
      <SuaSemana />
      <Modelos />
      <Preco />
      <SiteFooter />
    </main>
  );
}

function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md"
      style={{
        background: "rgba(249, 247, 244, 0.85)",
        borderBottom: "1px solid var(--vox-whisper)",
      }}
    >
      <div className="max-w-5xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" aria-label="VOX">
          <VoxWordmark height={26} priority />
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="#preco"
            className="hidden sm:inline px-3 py-1.5 text-vox-prose hover:text-vox-ink transition-colors"
          >
            Preço
          </Link>
          <Link
            href="/auth/login"
            className="px-3 py-1.5 text-vox-prose hover:text-vox-ink transition-colors"
          >
            Entrar
          </Link>
          <Button asChild size="sm">
            <Link href="#cadastro">Quero participar</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="px-6 sm:px-8 pt-20 sm:pt-28 pb-24">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-20 items-start">
        <div>
          <p
            className="vox-eyebrow mb-7"
            style={{ color: "var(--vox-forest)" }}
          >
            Por convite, primeiros assinantes
          </p>
          <h1
            className="vox-h1"
            style={{
              fontSize: "clamp(40px, 6vw, 64px)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
            }}
          >
            VOX organiza a semana de quem prega.
          </h1>
          <p
            className="vox-body mt-8 max-w-md"
            style={{ fontSize: "17px", lineHeight: 1.55 }}
          >
            Da página em branco na segunda ao púlpito no domingo, num só
            lugar. Editor com blocos coloridos, modelos prontos de pregação
            e bíblia integrada.
          </p>

          <ul className="mt-10 space-y-3.5 text-sm text-vox-prose max-w-md">
            <HeroLi>
              Modelos prontos, você só preenche
            </HeroLi>
            <HeroLi>
              Funciona offline no celular, tablet ou computador
            </HeroLi>
            <HeroLi>
              R$ 19,90/mês durante o lançamento, sem cartão agora
            </HeroLi>
          </ul>
        </div>

        <div
          id="cadastro"
          className="rounded-2xl p-7 sm:p-8 scroll-mt-24"
          style={{
            background: "var(--vox-surface)",
            border: "1px solid var(--vox-whisper)",
            boxShadow: "var(--vox-shadow-card)",
          }}
        >
          <RegisterForm />
        </div>
      </div>
    </section>
  );
}

function HeroLi({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-2 size-1.5 rounded-full shrink-0"
        style={{ background: "var(--vox-forest)" }}
      />
      <span>{children}</span>
    </li>
  );
}

function Demo() {
  return (
    <section
      className="px-6 sm:px-8 py-24"
      style={{
        background: "var(--vox-surface-deep)",
        borderTop: "1px solid var(--vox-whisper)",
        borderBottom: "1px solid var(--vox-whisper)",
      }}
    >
      <div className="max-w-5xl mx-auto">
        <p className="vox-eyebrow">É assim que se prepara</p>
        <h2
          className="vox-h2 mt-3 max-w-2xl"
          style={{ fontSize: "clamp(28px, 3.6vw, 36px)" }}
        >
          Você abre. Escolhe um modelo. A estrutura aparece. Você preenche.
        </h2>
        <p className="vox-body mt-5 max-w-xl text-base">
          Sem página em branco. Sem perder versículo no meio do texto. Sem
          colar de outro app.
        </p>

        <div
          className="mt-12 rounded-2xl overflow-hidden"
          style={{
            background: "var(--vox-surface)",
            border: "1px solid var(--vox-whisper)",
            boxShadow: "var(--vox-shadow-card)",
          }}
        >
          <EditorMock />
        </div>
      </div>
    </section>
  );
}

function EditorMock() {
  return (
    <div className="grid sm:grid-cols-[180px_1fr]">
      <aside
        className="p-5 hidden sm:flex flex-col gap-1.5"
        style={{
          background: "var(--vox-surface-deep)",
          borderRight: "1px solid var(--vox-whisper)",
        }}
      >
        <p className="vox-eyebrow mb-2">Modelo</p>
        <p
          className="vox-mono text-[11px] uppercase tracking-wider px-2 py-1.5 rounded-md"
          style={{
            background: "var(--vox-forest-soft)",
            color: "var(--vox-forest)",
          }}
        >
          Expositivo
        </p>
        <div className="mt-5 space-y-1.5">
          <MockNavItem color="var(--vox-gold)" label="Texto bíblico" active />
          <MockNavItem color="var(--vox-forest)" label="Contexto" />
          <MockNavItem color="var(--vox-forest)" label="Ponto principal" />
          <MockNavItem color="#0D7C7C" label="Aplicação" />
          <MockNavItem color="var(--vox-ink)" label="Conclusão" />
        </div>
      </aside>

      <div className="p-7 sm:p-10">
        <div className="flex items-center justify-between mb-1">
          <p className="vox-eyebrow">Texto bíblico</p>
          <span className="vox-mono text-[10px] text-vox-muted">
            salvo há 12s
          </span>
        </div>
        <p className="vox-scripture mt-4 text-lg sm:text-xl">
          &ldquo;Justificados, pois, pela fé, temos paz com Deus por meio do
          nosso Senhor Jesus Cristo&rdquo;
        </p>
        <p className="vox-ref mt-2">Romanos 5:1,11</p>

        <div
          className="mt-8 pt-7"
          style={{ borderTop: "1px solid var(--vox-whisper)" }}
        >
          <p className="vox-eyebrow mb-3">Ponto principal</p>
          <p className="text-vox-prose text-[15px] leading-relaxed">
            A paz com Deus não é resultado do nosso esforço, mas fruto da
            justificação pela fé. Paulo conecta a fé não a uma sensação
            passageira, mas a uma{" "}
            <span
              className="px-1.5 py-0.5 rounded"
              style={{
                background: "var(--vox-forest-soft)",
                color: "var(--vox-forest)",
                fontWeight: 500,
              }}
            >
              posição declarada por Deus
            </span>
            …
          </p>
        </div>

        <div
          className="mt-7 pt-5 flex items-center justify-between"
          style={{ borderTop: "1px solid var(--vox-whisper)" }}
        >
          <span className="vox-mono text-[10px] text-vox-muted">
            1.247 palavras · 14 min
          </span>
          <span
            className="vox-mono text-[10px] px-2 py-1 rounded-full"
            style={{
              background: "var(--vox-forest-soft)",
              color: "var(--vox-forest)",
            }}
          >
            pronto para o púlpito
          </span>
        </div>
      </div>
    </div>
  );
}

function MockNavItem({
  color,
  label,
  active,
}: {
  color: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-md"
      style={{
        background: active ? "var(--vox-surface)" : "transparent",
        border: active ? "1px solid var(--vox-whisper)" : "1px solid transparent",
      }}
    >
      <span
        className="size-1.5 rounded-full shrink-0"
        style={{ background: color }}
      />
      <span
        style={{
          color: active ? "var(--vox-ink)" : "var(--vox-prose)",
          fontWeight: active ? 500 : 400,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function SuaSemana() {
  const dias = [
    {
      etiqueta: "Segunda a sexta",
      titulo: "Você prepara.",
      corpo:
        "Escolhe um modelo de pregação, escreve nos blocos coloridos, busca versículos sem trocar de aba. Se faltar internet no metrô, continua editando.",
    },
    {
      etiqueta: "Domingo",
      titulo: "Você prega.",
      corpo:
        "Abre no celular ou notebook em três modos: teleprompter para manuscrito, slide fullscreen para projeção, ou apresentador com painel de controle e suas notas.",
    },
    {
      etiqueta: "Depois",
      titulo: "Fica guardado.",
      corpo:
        "Cada sermão indexado por livro bíblico, série, tema e tags. Daqui a três anos, você acha o que pregou em segundos. Pode exportar em PDF ou DOCX.",
    },
  ];

  return (
    <section className="px-6 sm:px-8 py-24">
      <div className="max-w-5xl mx-auto">
        <p className="vox-eyebrow">A sua semana com VOX</p>
        <h2
          className="vox-h2 mt-3 max-w-2xl"
          style={{ fontSize: "clamp(28px, 3.6vw, 36px)" }}
        >
          Da segunda ao próximo ano.
        </h2>

        <ol className="mt-14 space-y-12">
          {dias.map((d, i) => (
            <li
              key={d.titulo}
              className="grid sm:grid-cols-[180px_1fr] gap-6 sm:gap-12 items-start"
            >
              <div className="flex sm:flex-col gap-3 sm:gap-2 items-baseline sm:items-start">
                <span
                  className="vox-mono text-3xl sm:text-4xl"
                  style={{
                    color: "var(--vox-forest)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  0{i + 1}
                </span>
                <p
                  className="vox-mono text-[10px] uppercase tracking-wider text-vox-muted"
                >
                  {d.etiqueta}
                </p>
              </div>
              <div
                className="pb-12"
                style={{
                  borderBottom:
                    i < dias.length - 1
                      ? "1px solid var(--vox-whisper)"
                      : "none",
                }}
              >
                <h3
                  className="vox-h3"
                  style={{ fontSize: "clamp(22px, 2.8vw, 28px)" }}
                >
                  {d.titulo}
                </h3>
                <p className="vox-body mt-3 max-w-xl text-[15px] leading-relaxed">
                  {d.corpo}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Modelos() {
  const destaques = VOX_FRAMEWORKS.filter((fw) =>
    ["expositivo", "narrativo", "topico"].includes(fw.id)
  );

  return (
    <section
      className="px-6 sm:px-8 py-24"
      style={{
        background: "var(--vox-surface-deep)",
        borderTop: "1px solid var(--vox-whisper)",
        borderBottom: "1px solid var(--vox-whisper)",
      }}
    >
      <div className="max-w-5xl mx-auto">
        <p className="vox-eyebrow">Modelos de pregação</p>
        <h2
          className="vox-h2 mt-3 max-w-2xl"
          style={{ fontSize: "clamp(28px, 3.6vw, 36px)" }}
        >
          Você não precisa ter cursado homilética.
        </h2>
        <p className="vox-body mt-5 max-w-xl text-base">
          Cada modelo abre com a estrutura pronta, os blocos certos na ordem
          certa. Você escolhe um e só preenche.
        </p>

        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {destaques.map((fw) => (
            <article
              key={fw.id}
              className="rounded-xl p-6 flex flex-col"
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
                <p
                  className="vox-eyebrow"
                  style={{ color: `var(--vox-fw-${fw.id})` }}
                >
                  {fw.name}
                </p>
              </div>
              <p className="mt-3 vox-h3 text-lg leading-tight">{fw.tagline}</p>
              <p className="mt-3 text-sm text-vox-prose leading-relaxed flex-1">
                {fw.description}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-10 text-sm text-vox-prose">
          Existem outros três modelos (textual, temático e livre).{" "}
          <Link
            href="/templates"
            className="underline-offset-4 hover:underline"
            style={{ color: "var(--vox-forest)" }}
          >
            Ver os seis
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

function Preco() {
  return (
    <section id="preco" className="px-6 sm:px-8 py-24">
      <div className="max-w-3xl mx-auto">
        <p className="vox-eyebrow">Preço de lançamento</p>
        <h2
          className="vox-h2 mt-3"
          style={{ fontSize: "clamp(28px, 3.6vw, 36px)" }}
        >
          Um plano. Tudo incluído.
        </h2>
        <p className="vox-body mt-5 max-w-xl text-base">
          Pensado para o pregador real: o pastor de igreja pequena, o líder
          de célula, o professor da escola bíblica. Um valor que cabe.
        </p>

        <article
          className="mt-12 rounded-2xl p-8 sm:p-10"
          style={{
            background: "var(--vox-surface)",
            border: "1px solid var(--vox-forest)",
            boxShadow: "var(--vox-shadow-card-hover)",
          }}
        >
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="vox-mono text-vox-muted line-through text-lg">
              R$ 49,90
            </span>
            <span
              style={{
                fontFamily: "var(--vox-font-display)",
                fontSize: "clamp(56px, 8vw, 80px)",
                lineHeight: 1,
                color: "var(--vox-ink)",
                fontWeight: 500,
                letterSpacing: "-0.02em",
              }}
            >
              R$ 19,90
            </span>
            <span className="vox-mono text-sm text-vox-prose">/mês</span>
          </div>

          <p className="mt-6 text-[15px] text-vox-prose leading-relaxed max-w-lg">
            Ou{" "}
            <strong className="text-vox-ink">R$ 199 no ano</strong>{" "}
            <span className="text-vox-muted">
              (equivale a R$ 16,60/mês)
            </span>
            . Cancela quando quiser, sem multa. Os primeiros assinantes
            mantêm esse valor enquanto forem assinantes.
          </p>

          <div className="mt-8 grid sm:grid-cols-2 gap-x-8 gap-y-3">
            <PreItem>Editor em blocos coloridos</PreItem>
            <PreItem>Seis modelos de pregação</PreItem>
            <PreItem>Bíblia integrada</PreItem>
            <PreItem>Três modos de apresentação</PreItem>
            <PreItem>Séries, cursos e estudos</PreItem>
            <PreItem>Importa Word e exporta PDF</PreItem>
            <PreItem>Funciona offline</PreItem>
            <PreItem>IA opcional, você decide</PreItem>
          </div>

          <Button size="lg" asChild className="mt-10 w-full sm:w-auto">
            <Link href="#cadastro">Quero garantir minha vaga</Link>
          </Button>
          <p className="vox-mono mt-3 text-[10px] uppercase tracking-wider text-vox-muted">
            Sem cartão agora · cobrança só quando sua vaga abrir
          </p>
        </article>
      </div>
    </section>
  );
}

function PreItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-vox-prose">
      <span
        className="mt-1.5 size-1.5 rounded-full shrink-0"
        style={{ background: "var(--vox-forest)" }}
      />
      <span>{children}</span>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer
      className="px-6 sm:px-8 py-12"
      style={{ borderTop: "1px solid var(--vox-whisper)" }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <VoxWordmark height={20} />
          <span className="vox-mono text-xs text-vox-muted">
            Manuscritos cuidadosos
          </span>
        </div>
        <nav className="flex items-center gap-5 text-sm text-vox-prose">
          <Link href="#preco" className="hover:text-vox-ink">
            Preço
          </Link>
          <Link href="/auth/login" className="hover:text-vox-ink">
            Entrar
          </Link>
          <Link href="#cadastro" className="hover:text-vox-ink">
            Cadastro
          </Link>
        </nav>
      </div>
      <p className="vox-mono mt-8 text-[10px] uppercase tracking-wider text-vox-muted">
        © VOX, {new Date().getFullYear()}
      </p>
    </footer>
  );
}
