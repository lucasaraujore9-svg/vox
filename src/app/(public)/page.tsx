import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VoxWordmark } from "@/components/brand/VoxWordmark";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { InteractiveEditorDemo } from "@/components/shared/InteractiveEditorDemo";
import { PresenterDemo } from "@/components/shared/PresenterDemo";

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
      <Apresentador />
      <SuaSemana />
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
          Escolha um modelo. A estrutura aparece. Você preenche.
        </h2>
        <p className="vox-body mt-5 max-w-xl text-base">
          São seis modelos para postura de pregação. Clique nos botões abaixo
          para experimentar agora.
        </p>

        <div className="mt-12">
          <InteractiveEditorDemo />
        </div>

        <p className="vox-mono mt-6 text-[10px] uppercase tracking-wider text-vox-muted">
          Demo navegável · troque o modelo, clique nos blocos
        </p>
      </div>
    </section>
  );
}

function Apresentador() {
  return (
    <section className="px-6 sm:px-8 py-24">
      <div className="max-w-5xl mx-auto">
        <p className="vox-eyebrow">No domingo, duas telas</p>
        <h2
          className="vox-h2 mt-3 max-w-2xl"
          style={{ fontSize: "clamp(28px, 3.6vw, 36px)" }}
        >
          O slide pra igreja. O esboço pra você.
        </h2>
        <p className="vox-body mt-5 max-w-2xl text-base">
          A congregação vê só o slide, limpo, sem distrações. No seu notebook
          aparece o próximo slide, o cronômetro e suas notas em blocos
          coloridos. Funciona pra sermão, palestra ou aula com slides.
        </p>

        <div className="mt-12">
          <PresenterDemo />
        </div>

        <div className="mt-10 grid sm:grid-cols-3 gap-5">
          <ModoCard
            etiqueta="Modo 1"
            nome="Apresentador"
            desc="Duas telas. Slide pra audiência, painel de controle pra você."
            destaque
          />
          <ModoCard
            etiqueta="Modo 2"
            nome="Teleprompter"
            desc="Manuscrito em fonte grande, fundo escuro. Você lê sem parecer colado em papel."
          />
          <ModoCard
            etiqueta="Modo 3"
            nome="Slide simples"
            desc="Slide fullscreen sem UI. Avança com clique, teclado ou controle."
          />
        </div>
      </div>
    </section>
  );
}

function ModoCard({
  etiqueta,
  nome,
  desc,
  destaque,
}: {
  etiqueta: string;
  nome: string;
  desc: string;
  destaque?: boolean;
}) {
  return (
    <article
      className="rounded-xl p-5"
      style={{
        background: destaque ? "var(--vox-forest-soft)" : "var(--vox-surface)",
        border: destaque
          ? "1px solid var(--vox-forest-tint)"
          : "1px solid var(--vox-whisper)",
      }}
    >
      <p
        className="vox-mono text-[10px] uppercase tracking-wider"
        style={{
          color: destaque ? "var(--vox-forest)" : "var(--vox-muted)",
        }}
      >
        {etiqueta}
      </p>
      <h3 className="vox-h3 mt-2 text-base">{nome}</h3>
      <p className="mt-2 text-sm text-vox-prose leading-relaxed">{desc}</p>
    </article>
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
