import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VOX_FRAMEWORKS } from "@/lib/mocks/frameworks";
import { VoxWordmark } from "@/components/brand/VoxWordmark";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = {
  title: "VOX, manuscritos cuidadosos para o púlpito",
  description:
    "Prepare, entregue e arquive seus sermões, palestras e aulas em um só lugar. Modelos de pregação, modos de apresentação e bíblia integrada.",
};

export default function LandingPage() {
  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--vox-bg)", color: "var(--vox-ink)" }}
    >
      <SiteHeader />
      <Hero />
      <SemanaPregador />
      <TresAtos />
      <ModelosPregacao />
      <Funcionalidades />
      <ModosApresentacao />
      <ProvaSocial />
      <Preco />
      <Faq />
      <Cadastro />
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
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 h-16 flex items-center justify-between">
        <Link href="/" aria-label="VOX">
          <VoxWordmark height={28} priority />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link
            href="#como-funciona"
            className="hidden md:inline px-3 py-1.5 text-vox-prose hover:text-vox-ink transition-colors"
          >
            Como funciona
          </Link>
          <Link
            href="#modelos"
            className="hidden md:inline px-3 py-1.5 text-vox-prose hover:text-vox-ink transition-colors"
          >
            Modelos
          </Link>
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
    <section className="px-6 sm:px-10 lg:px-16 pt-16 sm:pt-24 pb-20">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-start">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <span
              className="inline-block size-1.5 rounded-full"
              style={{ background: "var(--vox-forest)" }}
            />
            <p className="vox-eyebrow" style={{ color: "var(--vox-forest)" }}>
              Por convite, vagas limitadas
            </p>
          </div>
          <h1
            className="vox-h1"
            style={{ fontSize: "clamp(36px, 5.5vw, 56px)", lineHeight: 1.05 }}
          >
            O manuscrito que respeita o ofício da pregação.
          </h1>
          <p className="vox-body mt-7 max-w-xl text-base sm:text-[17px]">
            VOX organiza sua semana de preparo, sustenta o púlpito no domingo
            e guarda seu acervo pastoral por anos. Sem fricção, sem
            distrações, sem marketing evangélico.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="#cadastro">Quero participar</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#como-funciona">Ver como funciona</Link>
            </Button>
          </div>
          <p className="vox-mono mt-8 text-xs text-vox-muted uppercase tracking-wider">
            Sermões · Palestras · Aulas · Cursos · Estudos guiados
          </p>
        </div>

        <aside
          className="rounded-xl p-7 lg:translate-y-2"
          style={{
            background: "var(--vox-surface)",
            border: "1px solid var(--vox-whisper)",
            boxShadow: "var(--vox-shadow-card)",
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="vox-eyebrow">Estrutura, Expositivo</p>
            <span className="vox-mono text-[10px] text-vox-muted">
              salvo há 12s
            </span>
          </div>
          <p className="vox-scripture mt-4">
            &ldquo;Justificados, pois, pela fé, temos paz com Deus por meio do
            nosso Senhor Jesus Cristo&rdquo;
          </p>
          <p className="vox-ref mt-2">Romanos 5:1,11</p>
          <ul className="mt-6 space-y-3 text-sm text-vox-prose">
            <BlockItem color="var(--vox-gold)" label="Texto Bíblico" />
            <BlockItem color="var(--vox-forest)" label="Contexto histórico" />
            <BlockItem color="var(--vox-forest)" label="Ponto Principal" />
            <BlockItem color="#0D7C7C" label="Aplicação" />
            <BlockItem color="var(--vox-ink)" label="Conclusão" />
          </ul>
          <div
            className="mt-6 pt-5 flex items-center justify-between"
            style={{ borderTop: "1px solid var(--vox-whisper)" }}
          >
            <span className="vox-mono text-[10px] text-vox-muted">
              1.247 palavras · 14 min
            </span>
            <span className="vox-mono text-[10px] text-vox-muted">
              dom 18 mai
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}

function BlockItem({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-1.5 size-2 rounded-full shrink-0"
        style={{ background: color }}
      />
      <span>{label}</span>
    </li>
  );
}

function SemanaPregador() {
  const cenas = [
    {
      day: "Segunda",
      title: "Página em branco.",
      body: "Você abre o Word e fica encarando o cursor. Por onde começar dessa vez?",
    },
    {
      day: "Sábado",
      title: "Roteiro reescrito quatro vezes.",
      body: "O texto vai e volta entre Notion, Evernote e um arquivo no Drive.",
    },
    {
      day: "Domingo",
      title: "Folha amassada no púlpito.",
      body: "Você impressiona ninguém lendo de papel. E ainda perde o ponto.",
    },
  ];

  return (
    <section
      className="px-6 sm:px-10 lg:px-16 py-20"
      style={{
        background: "var(--vox-surface-deep)",
        borderTop: "1px solid var(--vox-whisper)",
        borderBottom: "1px solid var(--vox-whisper)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <p className="vox-eyebrow">A semana de quem prega</p>
        <h2 className="vox-h2 mt-3 max-w-2xl">
          Três cenas. O mesmo nó. Toda semana.
        </h2>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {cenas.map((c) => (
            <article key={c.day} className="space-y-3">
              <p
                className="vox-mono text-[11px] uppercase tracking-wider"
                style={{ color: "var(--vox-forest)" }}
              >
                {c.day}
              </p>
              <h3 className="vox-h3 text-xl">{c.title}</h3>
              <p className="text-sm text-vox-prose leading-relaxed">{c.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-12 vox-body text-base max-w-2xl">
          VOX foi feito para essas três cenas. Não é um editor genérico, nem um
          app motivacional. É um companheiro silencioso, do primeiro rascunho
          ao último amém.
        </p>
      </div>
    </section>
  );
}

function TresAtos() {
  const atos = [
    {
      n: "01",
      titulo: "Preparação",
      copy: "Editor em blocos coloridos, modelos prontos de pregação e bíblia integrada. Você escreve no fluxo, sem trocar de aba.",
      bullets: [
        "Seis modelos guiados (expositivo, narrativo, temático…)",
        "Cada parte do sermão em uma cor",
        "Busca de versículos sem sair do editor",
      ],
    },
    {
      n: "02",
      titulo: "Entrega",
      copy: "Três modos de apresentação para qualquer cenário. No púlpito, na tela ou no estúdio, o conteúdo aparece pronto.",
      bullets: [
        "Teleprompter para manuscrito",
        "Slide fullscreen para projeção",
        "Modo apresentador com painel de controle",
      ],
    },
    {
      n: "03",
      titulo: "Arquivo",
      copy: "Anos de pregação organizados, buscáveis e prontos para serem reaproveitados. Nada se perde.",
      bullets: [
        "Busca por livro, tema, série ou texto",
        "Séries com subpastas e árvore visual",
        "Exporta para PDF, DOCX ou TXT",
      ],
    },
  ];

  return (
    <section id="como-funciona" className="px-6 sm:px-10 lg:px-16 py-24">
      <div className="max-w-6xl mx-auto">
        <p className="vox-eyebrow">Como funciona</p>
        <h2 className="vox-h2 mt-3 max-w-2xl">
          Do primeiro rascunho ao arquivo histórico.
        </h2>
        <p className="vox-body mt-5 max-w-xl text-base">
          VOX cobre o ciclo inteiro. Tudo que você usa hoje (Word, Notion,
          Evernote, PowerPoint, Bíblia em outro app) cabe em um só lugar, com
          uma postura editorial e silenciosa.
        </p>

        <div className="mt-14 grid md:grid-cols-3 gap-7">
          {atos.map((ato) => (
            <article
              key={ato.n}
              className="rounded-xl p-7"
              style={{
                background: "var(--vox-surface)",
                border: "1px solid var(--vox-whisper)",
                boxShadow: "var(--vox-shadow-card)",
              }}
            >
              <p
                className="vox-mono text-xs"
                style={{ color: "var(--vox-forest)" }}
              >
                {ato.n}
              </p>
              <h3 className="vox-h3 mt-2 text-xl">{ato.titulo}</h3>
              <p className="text-sm text-vox-prose mt-3 leading-relaxed">
                {ato.copy}
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-vox-prose">
                {ato.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5">
                    <span
                      className="mt-2 size-1 rounded-full shrink-0"
                      style={{ background: "var(--vox-forest)" }}
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ModelosPregacao() {
  return (
    <section
      id="modelos"
      className="px-6 sm:px-10 lg:px-16 py-24"
      style={{
        background: "var(--vox-surface-deep)",
        borderTop: "1px solid var(--vox-whisper)",
        borderBottom: "1px solid var(--vox-whisper)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <p className="vox-eyebrow">Modelos de pregação</p>
        <h2 className="vox-h2 mt-3 max-w-2xl">
          Seis estruturas. Uma para cada postura no púlpito.
        </h2>
        <p className="vox-body mt-5 max-w-2xl text-base">
          Você não precisa ter cursado homilética. Cada modelo abre com a
          estrutura pronta, os blocos certos na ordem certa. Só preencher e
          deixar o texto respirar.
        </p>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {VOX_FRAMEWORKS.map((fw) => (
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
              <p className="vox-mono mt-5 text-[10px] uppercase tracking-wider text-vox-muted">
                {fw.outline.slice(0, 4).join(" · ")}
                {fw.outline.length > 4 ? " ·…" : ""}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Funcionalidades() {
  return (
    <section className="px-6 sm:px-10 lg:px-16 py-24">
      <div className="max-w-6xl mx-auto">
        <p className="vox-eyebrow">Tudo no mesmo lugar</p>
        <h2 className="vox-h2 mt-3 max-w-2xl">
          Pensado para quem prega. Não para quem vende cursos.
        </h2>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-6 gap-5 auto-rows-fr">
          <FeatureCard
            className="md:col-span-4"
            eyebrow="Editor"
            title="Blocos coloridos com propósito."
            body="Texto bíblico em dourado, aplicação em teal, notas pessoais em cinza. Você lê a estrutura do sermão no primeiro relance, mesmo de longe."
            tall
          />
          <FeatureCard
            className="md:col-span-2"
            eyebrow="Bíblia"
            title="Versículos sem trocar de aba."
            body="Busque em ACF, NVI, RA ou APEE. Citação inserida com referência."
          />
          <FeatureCard
            className="md:col-span-2"
            eyebrow="Acervo"
            title="Importe seus sermões antigos."
            body=".docx, .txt ou cola texto. VOX detecta a estrutura."
          />
          <FeatureCard
            className="md:col-span-2"
            eyebrow="Séries"
            title="Pregue Romanos em 12 domingos."
            body="Agrupe sermões em séries com subpastas e árvore visual."
          />
          <FeatureCard
            className="md:col-span-2"
            eyebrow="Offline"
            title="Funciona sem internet."
            body="Edite no metrô, pregue em igreja rural. Sincroniza quando voltar."
          />
          <FeatureCard
            className="md:col-span-3"
            eyebrow="IA opcional"
            title="A IA sugere. Você prega."
            body="Por padrão desligada. Quando ligar, ela só propõe estrutura e aplicações, nunca substitui sua voz pastoral."
          />
          <FeatureCard
            className="md:col-span-3"
            eyebrow="Escopo"
            title="Sermão, palestra, aula e cursos."
            body="Mesmo editor para o púlpito do domingo, a palestra de quarta e a aula da escola bíblica. Cursos agrupam aulas em ementa."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  eyebrow,
  title,
  body,
  className,
  tall,
}: {
  eyebrow: string;
  title: string;
  body: string;
  className?: string;
  tall?: boolean;
}) {
  return (
    <article
      className={`rounded-xl p-6 ${className ?? ""} ${tall ? "md:row-span-2" : ""}`}
      style={{
        background: "var(--vox-surface)",
        border: "1px solid var(--vox-whisper)",
        boxShadow: "var(--vox-shadow-card)",
      }}
    >
      <p className="vox-eyebrow">{eyebrow}</p>
      <h3 className="vox-h3 mt-3 text-lg leading-tight">{title}</h3>
      <p className="mt-3 text-sm text-vox-prose leading-relaxed">{body}</p>
    </article>
  );
}

function ModosApresentacao() {
  const modos = [
    {
      nome: "Teleprompter",
      desc: "Texto grande, fundo escuro, rolagem suave. Você lê o manuscrito sem parecer colado em papel.",
      mock: (
        <div
          className="rounded-md p-4 h-32 flex flex-col justify-center gap-2"
          style={{ background: "var(--vox-stage-bg)" }}
        >
          <div
            className="h-2 rounded-full w-3/4"
            style={{ background: "rgba(255,255,255,0.35)" }}
          />
          <div
            className="h-2 rounded-full w-full"
            style={{ background: "rgba(255,255,255,0.55)" }}
          />
          <div
            className="h-2 rounded-full w-5/6"
            style={{ background: "rgba(255,255,255,0.35)" }}
          />
          <div
            className="h-2 rounded-full w-2/3"
            style={{ background: "rgba(255,255,255,0.20)" }}
          />
        </div>
      ),
    },
    {
      nome: "Slide simples",
      desc: "Slide fullscreen sem UI, perfeito para projeção. Avança com clique, teclado ou controle remoto.",
      mock: (
        <div
          className="rounded-md h-32 flex items-center justify-center"
          style={{
            background: "var(--vox-stage-bg)",
            border: "1px solid var(--vox-whisper-strong)",
          }}
        >
          <div className="w-20 h-12 rounded bg-white/10 flex items-center justify-center">
            <span
              className="vox-mono text-[10px]"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              slide
            </span>
          </div>
        </div>
      ),
    },
    {
      nome: "Apresentador",
      desc: "Duas janelas, slide na tela do público, painel de controle com próximo slide e suas notas no seu monitor.",
      mock: (
        <div className="h-32 grid grid-cols-[1fr_0.6fr] gap-2">
          <div
            className="rounded-md flex items-center justify-center"
            style={{ background: "var(--vox-stage-bg)" }}
          >
            <div className="w-12 h-7 rounded bg-white/10" />
          </div>
          <div
            className="rounded-md p-2 flex flex-col gap-1.5"
            style={{
              background: "var(--vox-surface)",
              border: "1px solid var(--vox-whisper)",
            }}
          >
            <div
              className="h-1.5 rounded-full w-full"
              style={{ background: "var(--vox-forest)" }}
            />
            <div
              className="h-1.5 rounded-full w-3/4"
              style={{ background: "var(--vox-prose)", opacity: 0.4 }}
            />
            <div
              className="h-1.5 rounded-full w-5/6"
              style={{ background: "var(--vox-prose)", opacity: 0.4 }}
            />
            <div
              className="h-1.5 rounded-full w-2/3"
              style={{ background: "var(--vox-prose)", opacity: 0.4 }}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <section
      className="px-6 sm:px-10 lg:px-16 py-24"
      style={{ background: "var(--vox-surface-deep)" }}
    >
      <div className="max-w-6xl mx-auto">
        <p className="vox-eyebrow">No momento do púlpito</p>
        <h2 className="vox-h2 mt-3 max-w-2xl">
          Três modos. Para qualquer cenário.
        </h2>

        <div className="mt-12 grid md:grid-cols-3 gap-7">
          {modos.map((m) => (
            <article
              key={m.nome}
              className="rounded-xl p-6"
              style={{
                background: "var(--vox-surface)",
                border: "1px solid var(--vox-whisper)",
                boxShadow: "var(--vox-shadow-card)",
              }}
            >
              {m.mock}
              <h3 className="vox-h3 mt-5 text-lg">{m.nome}</h3>
              <p className="mt-2 text-sm text-vox-prose leading-relaxed">
                {m.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// SUBSTITUIR os depoimentos abaixo por feedback real dos primeiros assinantes.
// Mantenha 3 itens, ~2 frases cada, atribuição com nome + contexto pastoral curto.
const DEPOIMENTOS = [
  {
    quote:
      "Eu passava sábado inteiro reorganizando um arquivo do Word. No VOX, abro o modelo expositivo e a estrutura já está lá, é só preencher.",
    nome: "Pastor André M.",
    contexto: "Igreja Batista, interior de SP",
  },
  {
    quote:
      "O modo apresentador salvou minha noite de quarta. Vejo o próximo slide e minhas notas no notebook, enquanto a igreja vê só o slide limpo.",
    nome: "Pra. Carla R.",
    contexto: "Pregadora itinerante, MG",
  },
  {
    quote:
      "Não sou pastor, sou professor de escola bíblica. Os modelos prontos me deram confiança pra preparar aula sem travar na página em branco.",
    nome: "Diácono Rafael S.",
    contexto: "Líder de EBD, PE",
  },
];

function ProvaSocial() {
  return (
    <section className="px-6 sm:px-10 lg:px-16 py-24">
      <div className="max-w-6xl mx-auto">
        <p className="vox-eyebrow">Primeiros pregadores</p>
        <h2 className="vox-h2 mt-3 max-w-2xl">
          Quem já está usando, conta como é.
        </h2>
        <p className="vox-body mt-5 max-w-xl text-base">
          O VOX está em lançamento gradual. Esses são alguns dos primeiros
          pastores, pregadores e líderes que abriram o app na sua semana.
        </p>

        <div className="mt-12 grid md:grid-cols-3 gap-7">
          {DEPOIMENTOS.map((d, i) => (
            <article
              key={d.nome}
              className="rounded-xl p-7 flex flex-col"
              style={{
                background: "var(--vox-surface)",
                border: "1px solid var(--vox-whisper)",
                boxShadow: "var(--vox-shadow-card)",
              }}
            >
              <span
                className="font-display text-3xl leading-none"
                style={{
                  fontFamily: "var(--vox-font-display)",
                  color: "var(--vox-forest)",
                }}
                aria-hidden
              >
                &ldquo;
              </span>
              <blockquote className="mt-3 text-sm text-vox-prose leading-relaxed flex-1">
                {d.quote}
              </blockquote>
              <footer
                className="mt-6 pt-5"
                style={{ borderTop: "1px solid var(--vox-whisper)" }}
              >
                <p
                  className="vox-mono text-[11px] uppercase tracking-wider"
                  style={{ color: "var(--vox-ink)" }}
                >
                  {d.nome}
                </p>
                <p className="vox-mono text-[10px] uppercase tracking-wider text-vox-muted mt-1">
                  {d.contexto}
                </p>
              </footer>
              <span className="sr-only">depoimento {i + 1} de {DEPOIMENTOS.length}</span>
            </article>
          ))}
        </div>

        <p className="vox-mono mt-10 text-[10px] uppercase tracking-wider text-vox-muted">
          Trechos editados para clareza. Identificação completa sob consentimento.
        </p>
      </div>
    </section>
  );
}

function Preco() {
  return (
    <section id="preco" className="px-6 sm:px-10 lg:px-16 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 items-start">
          <div>
            <p className="vox-eyebrow">Preço de lançamento</p>
            <h2 className="vox-h2 mt-3">Um plano. Tudo incluído.</h2>
            <p className="vox-body mt-5 text-base">
              Pensamos no pregador real: o pastor de igreja pequena, o líder de
              célula, o professor da escola bíblica. Um valor que cabe e que
              respeita o trabalho.
            </p>
            <ul className="mt-7 space-y-3 text-sm text-vox-prose">
              <PreItem>Editor em blocos coloridos</PreItem>
              <PreItem>Seis modelos de pregação prontos</PreItem>
              <PreItem>Bíblia integrada (ACF, NVI, RA, APEE)</PreItem>
              <PreItem>Três modos de apresentação no púlpito</PreItem>
              <PreItem>Séries, cursos e estudos guiados</PreItem>
              <PreItem>Importação de .docx e exportação para PDF</PreItem>
              <PreItem>Funciona offline no celular e no computador</PreItem>
              <PreItem>IA opcional (você decide se liga)</PreItem>
            </ul>
          </div>

          <article
            className="rounded-2xl p-8 lg:p-10"
            style={{
              background: "var(--vox-surface)",
              border: "1px solid var(--vox-forest)",
              boxShadow: "var(--vox-shadow-card-hover)",
            }}
          >
            <div className="flex items-center gap-2 mb-6">
              <span
                className="inline-block size-1.5 rounded-full"
                style={{ background: "var(--vox-forest)" }}
              />
              <p
                className="vox-eyebrow"
                style={{ color: "var(--vox-forest)" }}
              >
                Plano único, primeiros assinantes
              </p>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <span
                className="vox-mono text-vox-muted line-through text-lg"
                aria-label="preço cheio"
              >
                R$ 49,90
              </span>
              <span
                className="font-display"
                style={{
                  fontFamily: "var(--vox-font-display)",
                  fontSize: "clamp(48px, 7vw, 72px)",
                  lineHeight: 1,
                  color: "var(--vox-ink)",
                  fontWeight: 500,
                }}
              >
                R$ 19,90
              </span>
              <span className="vox-mono text-sm text-vox-prose">/mês</span>
            </div>

            <p className="mt-5 text-sm text-vox-prose leading-relaxed">
              Cancela quando quiser, sem multa, sem letra miúda. Ou pague o ano
              inteiro por{" "}
              <strong className="text-vox-ink">R$ 199</strong>{" "}
              <span className="text-vox-muted">
                (equivale a R$ 16,60/mês)
              </span>
              .
            </p>

            <div
              className="mt-7 rounded-lg p-4"
              style={{
                background: "var(--vox-forest-soft)",
                border: "1px solid var(--vox-forest-tint)",
              }}
            >
              <p className="vox-mono text-[10px] uppercase tracking-wider text-vox-ink mb-1">
                Por que esse preço?
              </p>
              <p className="text-sm text-vox-prose leading-relaxed">
                Estamos abrindo o VOX em lotes. Os primeiros assinantes
                garantem esse valor enquanto forem assinantes. Quando o
                lançamento terminar, o plano sobe para R$ 49,90.
              </p>
            </div>

            <Button size="lg" asChild className="mt-7 w-full">
              <Link href="#cadastro">Quero garantir minha vaga</Link>
            </Button>
            <p className="vox-mono mt-3 text-[10px] uppercase tracking-wider text-vox-muted text-center">
              Sem cartão agora. Cobramos quando sua vaga for liberada.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

function PreItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-1.5 size-2 rounded-full shrink-0"
        style={{ background: "var(--vox-forest)" }}
      />
      <span>{children}</span>
    </li>
  );
}

function Faq() {
  const perguntas = [
    {
      q: "Funciona se eu não tenho formação em teologia?",
      a: "Funciona. Os modelos de pregação são guias prontos: você escolhe um e ele já organiza as partes do sermão (texto bíblico, ponto, aplicação, conclusão). Você só preenche.",
    },
    {
      q: "Preciso ser pastor para usar?",
      a: "Não. Líderes de célula, professores de escola bíblica, evangelistas, palestrantes de eventos, todos cabem. O VOX também serve para palestras e aulas, não só sermões.",
    },
    {
      q: "Preciso de internet para pregar?",
      a: "Não. O VOX funciona offline no celular, tablet e computador. Você pode editar e apresentar sem sinal, e tudo sincroniza quando voltar à rede.",
    },
    {
      q: "Posso trazer meus sermões antigos?",
      a: "Sim. Importe arquivos .docx, .txt ou cole o texto direto. O VOX tenta detectar a estrutura automaticamente.",
    },
    {
      q: "A IA vai escrever meu sermão?",
      a: "Não. A IA é opcional e vem desligada por padrão. Quando ligada, ela só sugere estrutura ou aplicações. A voz pastoral é sua, ponto.",
    },
    {
      q: "Quando minha vaga é liberada?",
      a: "Abrimos vagas em lotes pequenos para garantir bom suporte a cada novo assinante. Você recebe email quando sua vez chegar.",
    },
  ];

  return (
    <section
      className="px-6 sm:px-10 lg:px-16 py-24"
      style={{
        background: "var(--vox-surface-deep)",
        borderTop: "1px solid var(--vox-whisper)",
        borderBottom: "1px solid var(--vox-whisper)",
      }}
    >
      <div className="max-w-3xl mx-auto">
        <p className="vox-eyebrow">Perguntas honestas</p>
        <h2 className="vox-h2 mt-3">Antes de você cadastrar.</h2>

        <div className="mt-10 space-y-1">
          {perguntas.map((p, i) => (
            <details
              key={p.q}
              className="group py-5"
              style={{
                borderTop: i === 0 ? "1px solid var(--vox-whisper)" : "none",
                borderBottom: "1px solid var(--vox-whisper)",
              }}
            >
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                <span className="vox-h3 text-base sm:text-lg">{p.q}</span>
                <span
                  className="vox-mono text-xl shrink-0 transition-transform group-open:rotate-45"
                  style={{ color: "var(--vox-forest)" }}
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="mt-4 text-sm text-vox-prose leading-relaxed pr-10">
                {p.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cadastro() {
  return (
    <section id="cadastro" className="px-6 sm:px-10 lg:px-16 py-24">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.05fr] gap-14 items-start">
        <div>
          <p className="vox-eyebrow">Vaga por convite</p>
          <h2
            className="vox-h2 mt-3"
            style={{ fontSize: "clamp(28px, 4vw, 40px)" }}
          >
            Deixe seu interesse. Avaliamos cada cadastro com cuidado.
          </h2>
          <p className="vox-body mt-6 text-base max-w-md">
            O lançamento é gradual e por lotes. Você não paga nada agora,
            apenas registra que tem interesse. Quando sua vaga for liberada,
            avisamos por email e você decide se entra.
          </p>

          <div
            className="mt-8 rounded-lg p-5"
            style={{
              background: "var(--vox-surface)",
              border: "1px solid var(--vox-whisper)",
            }}
          >
            <p
              className="vox-mono text-[10px] uppercase tracking-wider mb-2"
              style={{ color: "var(--vox-forest)" }}
            >
              O que acontece depois
            </p>
            <ol className="space-y-3 text-sm text-vox-prose">
              <CadastroStep n="1" text="Você envia o formulário ao lado." />
              <CadastroStep
                n="2"
                text="A gente avalia em até 5 dias úteis, em ordem de chegada."
              />
              <CadastroStep
                n="3"
                text="Quando sua vaga abrir, você recebe um convite por email com o link de pagamento."
              />
              <CadastroStep
                n="4"
                text="Você entra com o preço de lançamento garantido enquanto for assinante."
              />
            </ol>
          </div>
        </div>

        <div
          className="rounded-2xl p-7 sm:p-9"
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

function CadastroStep({ n, text }: { n: string; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="vox-mono text-[10px] size-5 rounded-full shrink-0 flex items-center justify-center"
        style={{
          background: "var(--vox-forest-soft)",
          color: "var(--vox-forest)",
        }}
      >
        {n}
      </span>
      <span className="leading-relaxed">{text}</span>
    </li>
  );
}

function SiteFooter() {
  return (
    <footer
      className="px-6 sm:px-10 lg:px-16 py-12"
      style={{ borderTop: "1px solid var(--vox-whisper)" }}
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <VoxWordmark height={22} />
          <span className="vox-mono text-xs text-vox-muted">
            Manuscritos cuidadosos
          </span>
        </div>
        <nav className="flex items-center gap-5 text-sm text-vox-prose">
          <Link href="#modelos" className="hover:text-vox-ink">
            Modelos
          </Link>
          <Link href="#preco" className="hover:text-vox-ink">
            Preço
          </Link>
          <Link href="/auth/login" className="hover:text-vox-ink">
            Entrar
          </Link>
        </nav>
      </div>
      <p className="vox-mono mt-8 text-[10px] uppercase tracking-wider text-vox-muted">
        © VOX, {new Date().getFullYear()}
      </p>
    </footer>
  );
}
