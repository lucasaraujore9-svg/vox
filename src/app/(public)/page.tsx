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
      <Exegese />
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
            href="#exegese"
            className="hidden md:inline px-3 py-1.5 text-vox-prose hover:text-vox-ink transition-colors"
          >
            Exegese
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
              A partir de R$ 19,90/mês, sem cartão agora
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

function Exegese() {
  const grupos = [
    {
      nome: "Texto",
      desc: "Delimitação da perícope e variantes textuais relevantes do capítulo.",
    },
    {
      nome: "Contexto",
      desc: "Gênero literário, contexto próximo e posição da passagem dentro do livro.",
    },
    {
      nome: "Forma",
      desc: "Estrutura literária, análise gramatical-sintática e termos-chave no original.",
    },
    {
      nome: "Background",
      desc: "Pano de fundo histórico-cultural, intertextualidade e eixo teológico.",
    },
    {
      nome: "Síntese",
      desc: "História da interpretação, princípios atemporais e ponte de aplicação.",
    },
    {
      nome: "Cache da comunidade",
      desc: "Cada capítulo é estudado uma única vez. Quando outro pregador o pedir, recebe pronto.",
    },
  ] as const;

  return (
    <section
      id="exegese"
      className="px-6 sm:px-8 py-24 scroll-mt-20"
      style={{
        background: "var(--vox-surface-deep)",
        borderTop: "1px solid var(--vox-whisper)",
        borderBottom: "1px solid var(--vox-whisper)",
      }}
    >
      <div className="max-w-5xl mx-auto">
        <p className="vox-eyebrow" style={{ color: "var(--vox-forest)" }}>
          Estudo do texto, não palpite
        </p>
        <h2
          className="vox-h2 mt-3 max-w-2xl"
          style={{ fontSize: "clamp(28px, 3.6vw, 36px)" }}
        >
          A exegese pronta na lateral, enquanto você escreve.
        </h2>
        <p className="vox-body mt-5 max-w-2xl text-base">
          Você digita o capítulo que vai pregar e o VOX traz, na barra
          lateral do editor, o texto estudado em cinco frentes. Sem precisar
          abrir cinco livros, cinco abas ou recorrer ao ChatGPT.
        </p>

        <ul className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {grupos.map((g, i) => (
            <li key={g.nome}>
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="vox-mono text-[10px] uppercase tracking-wider"
                  style={{
                    color: "var(--vox-forest)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="vox-mono text-[10px] uppercase tracking-wider text-vox-muted"
                >
                  {i < 5 ? "Frente" : "Método"}
                </span>
              </div>
              <h3 className="vox-h3 mt-3 text-lg">{g.nome}</h3>
              <p className="mt-3 text-[14px] text-vox-prose leading-relaxed">
                {g.desc}
              </p>
            </li>
          ))}
        </ul>

        <div
          className="mt-16 rounded-2xl p-7 sm:p-8 max-w-3xl"
          style={{
            background: "var(--vox-surface)",
            border: "1px solid var(--vox-whisper)",
          }}
        >
          <p
            className="vox-mono text-[10px] uppercase tracking-wider"
            style={{ color: "var(--vox-forest)" }}
          >
            Não é ChatGPT com vestes de pastor
          </p>
          <p className="vox-body mt-3 text-[15px] leading-relaxed">
            É um pipeline acadêmico-pastoral em cinco etapas paralelas, com
            cache global compartilhado e formato estruturado. Você revê
            cada frente, edita, descarta o que não couber e regera grupos
            isolados quando precisar. A IA pesquisa; o púlpito é seu.
          </p>
          <p
            className="vox-mono mt-6 text-[10px] uppercase tracking-wider text-vox-muted"
          >
            Disponível no plano Concílio ·{" "}
            <Link
              href="#preco"
              className="underline hover:text-vox-ink transition-colors"
              style={{ color: "var(--vox-forest)" }}
            >
              ver preço
            </Link>
          </p>
        </div>
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
      a: "Não. A exegese assistida vive no plano Concílio e pode ser desligada a qualquer momento em configurações. Desligada, a IA some completamente da interface — nenhum botão, nenhuma sugestão. Quem quiser apenas o editor fica no plano Manuscrito.",
    },
    {
      q: "A exegese substitui meu próprio estudo?",
      a: "Não. Ela puxa de uma vez o que você precisaria abrir em quatro abas: léxico, comentário, dicionário bíblico, panorama histórico. Quem decide o que serve pro sermão é você. O material aparece na barra lateral do editor como insumo, não como manuscrito pronto.",
    },
    {
      q: "E se a exegese errar em algum ponto?",
      a: "Cada exegese mostra a fonte do raciocínio em cinco frentes separadas — texto, contexto, forma, background e síntese. Você pode regerar uma frente isolada sem refazer as outras. O cache compartilhado nunca trava numa resposta ruim: refeita uma vez, todo mundo se beneficia da versão melhor.",
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
    <section id="preco" className="px-6 sm:px-8 py-24 scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <p className="vox-eyebrow">Preço de lançamento</p>
        <h2
          className="vox-h2 mt-3 max-w-2xl"
          style={{ fontSize: "clamp(28px, 3.6vw, 36px)" }}
        >
          Dois planos. Você escolhe a profundidade.
        </h2>
        <p className="vox-body mt-5 max-w-2xl text-base">
          Manuscrito é o editor completo. Concílio adiciona a exegese
          assistida na lateral. Você troca de plano quando quiser, sem
          multa, sem perder seus sermões.
        </p>

        <div className="mt-14 grid lg:grid-cols-2 gap-6">
          <PlanoCard
            nome="Manuscrito"
            tagline="O editor completo"
            precoCheio="R$ 49,90"
            preco="R$ 19,90"
            anual="R$ 199 no ano"
            anualEquivalente="equivale a R$ 16,60/mês"
            descricao="Pra quem quer escrever sermão, palestra e aula do começo ao fim no editor, sem IA."
            itens={[
              "Editor em blocos coloridos",
              "Seis modelos de pregação",
              "Bíblia integrada",
              "Três modos de apresentação",
              "Séries, cursos e estudos",
              "Importa Word, exporta PDF",
              "Funciona offline",
            ]}
            cta="Quero o Manuscrito"
          />
          <PlanoCard
            destaque
            nome="Concílio"
            tagline="Com exegese assistida"
            precoCheio="R$ 79,90"
            preco="R$ 39,90"
            anual="R$ 399 no ano"
            anualEquivalente="equivale a R$ 33,25/mês"
            descricao="Tudo do Manuscrito mais a exegese em cinco frentes, ao lado do editor, no capítulo que você está pregando."
            itens={[
              "Tudo do plano Manuscrito",
              "Exegese em cinco frentes",
              "30 exegeses novas por mês",
              "Cache da comunidade ilimitado",
              "Histórico de exegeses ilimitado",
              "Regera frentes isoladas quando quiser",
              "Liga e desliga a IA a qualquer momento",
            ]}
            cta="Quero o Concílio"
          />
        </div>

        <p
          className="vox-mono mt-12 text-[10px] uppercase tracking-wider text-vox-muted text-center"
        >
          Sem cartão agora · cobrança só quando sua vaga abrir · cancela
          quando quiser
        </p>
      </div>
    </section>
  );
}

function PlanoCard({
  nome,
  tagline,
  precoCheio,
  preco,
  anual,
  anualEquivalente,
  descricao,
  itens,
  cta,
  destaque,
}: {
  nome: string;
  tagline: string;
  precoCheio: string;
  preco: string;
  anual: string;
  anualEquivalente: string;
  descricao: string;
  itens: readonly string[];
  cta: string;
  destaque?: boolean;
}) {
  return (
    <article
      className="rounded-2xl p-8 sm:p-9 flex flex-col"
      style={{
        background: destaque ? "var(--vox-surface)" : "var(--vox-surface)",
        border: destaque
          ? "1px solid var(--vox-forest)"
          : "1px solid var(--vox-whisper)",
        boxShadow: destaque ? "var(--vox-shadow-card-hover)" : "var(--vox-shadow-card)",
      }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3
            className="vox-h3"
            style={{
              fontSize: "clamp(22px, 2.8vw, 26px)",
              color: destaque ? "var(--vox-forest)" : "var(--vox-ink)",
            }}
          >
            {nome}
          </h3>
          <p
            className="vox-mono mt-1 text-[10px] uppercase tracking-wider"
            style={{ color: destaque ? "var(--vox-forest)" : "var(--vox-muted)" }}
          >
            {tagline}
          </p>
        </div>
        {destaque ? (
          <span
            className="vox-mono text-[10px] uppercase tracking-wider rounded-full px-2.5 py-1"
            style={{
              background: "var(--vox-forest-soft)",
              color: "var(--vox-forest)",
              border: "1px solid var(--vox-forest-tint)",
            }}
          >
            Mais escolhido
          </span>
        ) : null}
      </div>

      <p className="mt-5 text-[14px] text-vox-prose leading-relaxed">
        {descricao}
      </p>

      <div className="mt-7 flex items-baseline gap-3 flex-wrap">
        <span className="vox-mono text-vox-muted line-through text-base">
          {precoCheio}
        </span>
        <span
          style={{
            fontFamily: "var(--vox-font-display)",
            fontSize: "clamp(44px, 5vw, 56px)",
            lineHeight: 1,
            color: "var(--vox-ink)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
          }}
        >
          {preco}
        </span>
        <span className="vox-mono text-sm text-vox-prose">/mês</span>
      </div>

      <p className="mt-3 text-[13px] text-vox-prose leading-relaxed">
        Ou <strong className="text-vox-ink">{anual}</strong>{" "}
        <span className="text-vox-muted">({anualEquivalente})</span>.
      </p>

      <ul className="mt-7 space-y-2.5 flex-1">
        {itens.map((i) => (
          <li key={i} className="flex items-start gap-2.5 text-[14px] text-vox-prose">
            <span
              className="mt-1.5 size-1.5 rounded-full shrink-0"
              style={{
                background: destaque ? "var(--vox-forest)" : "var(--vox-prose)",
              }}
            />
            <span>{i}</span>
          </li>
        ))}
      </ul>

      <Button
        size="lg"
        asChild
        variant={destaque ? "default" : "outline"}
        className="mt-9 w-full"
      >
        <Link href="#cadastro">{cta}</Link>
      </Button>
    </article>
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
          <Link href="#exegese" className="hover:text-vox-ink">
            Exegese
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
          <Link href="/termos" className="hover:text-vox-ink">
            Termos
          </Link>
          <Link href="/privacidade" className="hover:text-vox-ink">
            Privacidade
          </Link>
        </nav>
      </div>
      <p className="vox-mono mt-8 text-[10px] uppercase tracking-wider text-vox-muted">
        © VOX, {new Date().getFullYear()}
      </p>
    </footer>
  );
}
