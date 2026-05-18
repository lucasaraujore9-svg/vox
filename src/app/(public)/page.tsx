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
      <PorQueModelos />
      <Apresentador />
      <SuaSemana />
      <Faq />
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
            href="#porque"
            className="hidden md:inline px-3 py-1.5 text-vox-prose hover:text-vox-ink transition-colors"
          >
            Modelos
          </Link>
          <Link
            href="#faq"
            className="hidden md:inline px-3 py-1.5 text-vox-prose hover:text-vox-ink transition-colors"
          >
            Perguntas
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

function PorQueModelos() {
  const modelos = [
    {
      id: "expositivo",
      nome: "Expositivo",
      tagline: "Fidelidade ao texto",
      garante:
        "O sermão segue o ritmo do próprio texto bíblico: contexto, ponto, subpontos, aplicação. Nada é forçado, nada inventado.",
    },
    {
      id: "textual",
      nome: "Textual",
      tagline: "Profundidade em um trecho",
      garante:
        "Uma sentença ou parágrafo destrinchado em camadas. O modelo mantém o foco — você não escapa do texto pra dar voltas.",
    },
    {
      id: "narrativo",
      nome: "Narrativo",
      tagline: "História entregue como história",
      garante:
        "Cenário, tensão e reviravolta carregam o ouvinte. O modelo preserva o arco da própria Escritura, sem virar resumo.",
    },
    {
      id: "tematico",
      nome: "Temático",
      tagline: "Um tema, muitas vozes bíblicas",
      garante:
        "Graça, fé, perseverança — temas que atravessam a Bíblia. Cada texto puxado soma ao argumento em vez de competir com ele.",
    },
    {
      id: "topico",
      nome: "Tópico",
      tagline: "Vida real diante da Palavra",
      garante:
        "Ansiedade, perdão, dinheiro, vocação. O modelo começa pelo tópico e ancora cada passo na Escritura, sem virar palestra motivacional.",
    },
    {
      id: "livre",
      nome: "Livre",
      tagline: "Quando o caminho é seu",
      garante:
        "Para devocional curto, nota pessoal ou sermão improvisado. Sem estrutura imposta, com o mesmo editor de blocos e bíblia integrada.",
    },
  ] as const;

  return (
    <section id="porque" className="px-6 sm:px-8 py-24 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <p className="vox-eyebrow">O ofício, não o atalho</p>
        <h2
          className="vox-h2 mt-3 max-w-2xl"
          style={{ fontSize: "clamp(28px, 3.6vw, 36px)" }}
        >
          O sermão merece ter ossatura.
        </h2>
        <p className="vox-body mt-5 max-w-2xl text-base">
          Cada um dos seis modelos é uma estrutura homilética preservada pela
          igreja por séculos. Você escolhe o caminho, escreve seu conteúdo, o
          caminho mantém o sermão firme — texto, ponto, aplicação, conclusão.
          Sem rota, é mais fácil divagar, repetir uma mesma ideia ou esquecer
          de aplicar.
        </p>

        <ul className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {modelos.map((m) => (
            <li key={m.id}>
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="size-2 rounded-full shrink-0"
                  style={{ background: `var(--vox-fw-${m.id})` }}
                />
                <p
                  className="vox-mono text-[10px] uppercase tracking-wider"
                  style={{ color: `var(--vox-fw-${m.id})` }}
                >
                  Modelo
                </p>
              </div>
              <h3 className="vox-h3 mt-3 text-lg">{m.nome}</h3>
              <p
                className="vox-body mt-1 text-[13px]"
                style={{ color: "var(--vox-muted)" }}
              >
                {m.tagline}
              </p>
              <p className="mt-4 text-[14px] text-vox-prose leading-relaxed">
                {m.garante}
              </p>
            </li>
          ))}
        </ul>

        <p
          className="vox-mono mt-16 text-[11px] uppercase tracking-wider"
          style={{ color: "var(--vox-muted)" }}
        >
          Você troca o modelo a qualquer momento · seus blocos migram
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

function Faq() {
  const perguntas = [
    {
      q: "Preciso entender homilética pra usar o VOX?",
      a: "Não. Os modelos carregam a estrutura. Você traz o texto, a oração e o povo; o modelo mantém o sermão coerente do começo ao fim. Quanto mais você prega, mais o modelo vira segunda natureza.",
    },
    {
      q: "O VOX tem viés denominacional?",
      a: "Não. Os seis modelos são homiléticos, não doutrinários. Reformados, pentecostais, batistas, metodistas e pregadores leigos usam os mesmos caminhos, com seus próprios conteúdos e convicções.",
    },
    {
      q: "Funciona pra Palestra e Aula, ou só Sermão?",
      a: "Os três. Você escolhe o tipo no início. O editor é o mesmo; o que muda são os campos de duração, tópicos e a organização em séries ou cursos. Aula vira módulo dentro de um curso; palestra ganha cronômetro de tempo.",
    },
    {
      q: "Posso importar meus sermões antigos do Word?",
      a: "Pode. O VOX lê .docx e .txt. Se você marcou seções com títulos no Word, elas viram blocos automaticamente. Se o texto está corrido, entra como bloco único e você divide em um clique.",
    },
    {
      q: "A IA é obrigatória?",
      a: "Não. Vem desligada por padrão. Você liga em configurações se quiser sugestão de ilustração, paráfrase ou revisão de clareza. Desligada, a IA some completamente da interface — nenhum botão, nenhuma sugestão.",
    },
    {
      q: "Funciona sem internet?",
      a: "Sim. Você prepara no celular, tablet ou notebook offline — metrô, avião, sala com Wi-Fi caindo. Quando reconecta, o app sincroniza sozinho. Seus sermões nunca ficam presos numa única máquina.",
    },
    {
      q: "Onde meus sermões ficam guardados?",
      a: "Na sua conta, criptografados. Só você vê. Você pode exportar em PDF ou DOCX a qualquer momento e baixar tudo se um dia decidir sair.",
    },
    {
      q: "Quando minha vaga abre?",
      a: "Os primeiros assinantes entram por convite, em lotes pequenos, pra que a gente acompanhe cada um. Cadastre seu email no topo da página e te avisamos assim que sua vaga estiver pronta.",
    },
  ];

  return (
    <section
      id="faq"
      className="px-6 sm:px-8 py-24 scroll-mt-20"
      style={{
        background: "var(--vox-surface-deep)",
        borderTop: "1px solid var(--vox-whisper)",
        borderBottom: "1px solid var(--vox-whisper)",
      }}
    >
      <div className="max-w-3xl mx-auto">
        <p className="vox-eyebrow">Antes de cadastrar</p>
        <h2
          className="vox-h2 mt-3"
          style={{ fontSize: "clamp(28px, 3.6vw, 36px)" }}
        >
          O que pastor sério pergunta antes.
        </h2>
        <p className="vox-body mt-5 max-w-xl text-base">
          Respostas diretas para as dúvidas que aparecem antes de você confiar
          seus sermões a um app.
        </p>

        <ul className="mt-12 divide-y" style={{ borderColor: "var(--vox-whisper)" }}>
          {perguntas.map((item) => (
            <li
              key={item.q}
              style={{ borderTop: "1px solid var(--vox-whisper)" }}
            >
              <details className="group py-5">
                <summary
                  className="flex items-start justify-between gap-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden"
                >
                  <span className="vox-h3 text-[17px] sm:text-lg leading-snug text-vox-ink">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className="vox-mono text-xl shrink-0 transition-transform group-open:rotate-45"
                    style={{ color: "var(--vox-forest)", lineHeight: 1 }}
                  >
                    +
                  </span>
                </summary>
                <p className="mt-4 max-w-2xl text-[15px] text-vox-prose leading-relaxed">
                  {item.a}
                </p>
              </details>
            </li>
          ))}
        </ul>

        <p
          className="vox-mono mt-12 text-[10px] uppercase tracking-wider"
          style={{ color: "var(--vox-muted)" }}
        >
          Ainda com dúvida? Cadastre o email e responda direto no nosso convite
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
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-vox-prose">
          <Link href="#porque" className="hover:text-vox-ink">
            Modelos
          </Link>
          <Link href="#faq" className="hover:text-vox-ink">
            Perguntas
          </Link>
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
