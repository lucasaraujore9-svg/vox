// Página de ajuda. Cobre dúvidas sem precisar de suporte humano.
// Sections: Primeiros passos · Editor · Frameworks · Bíblia · Apresentação
// · Cursos & Estudo · Offline · Conta & dados · Tecla de atalho.

import Link from "next/link";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex items-center px-1.5 py-0.5 rounded border vox-mono text-[10px] tracking-wide shrink-0"
      style={{ borderColor: "var(--vox-whisper-strong)", color: "var(--vox-prose)" }}
    >
      {children}
    </kbd>
  );
}

export const metadata = { title: "Ajuda" };

interface Section {
  id: string;
  title: string;
  items: Array<{ q: string; a: React.ReactNode }>;
}

const SECTIONS: Section[] = [
  {
    id: "primeiros-passos",
    title: "Primeiros passos",
    items: [
      {
        q: "O que é o VOX?",
        a: (
          <p>
            VOX é uma ferramenta pastoral pra preparar, entregar e arquivar
            sermões, palestras e aulas. O diferencial são os frameworks
            homiléticos — templates guiados que ajudam você a estruturar a
            comunicação sem ter que partir do zero.
          </p>
        ),
      },
      {
        q: "Como crio meu primeiro esboço?",
        a: (
          <p>
            Vá em <Link href="/sermons" className="text-vox-forest underline-offset-4 hover:underline">Esboços</Link>{" "}
            e clique em <strong>Novo</strong>. Escolha o tipo de conteúdo
            (sermão, palestra ou aula), o formato (esboço ou apresentação) e
            um framework homilético. O editor abre pronto pra você começar.
          </p>
        ),
      },
      {
        q: "Qual a diferença entre esboço e apresentação?",
        a: (
          <p>
            <strong>Esboço</strong> é texto estruturado em blocos — ideal pra
            preparar e usar no púlpito (modo teleprompter).{" "}
            <strong>Apresentação</strong> é uma sequência de slides PDF — ideal
            pra projetar em telas. Os dois modos podem coexistir num mesmo
            sermão.
          </p>
        ),
      },
    ],
  },
  {
    id: "editor",
    title: "Editor",
    items: [
      {
        q: "Os blocos coloridos no editor têm significado?",
        a: (
          <p>
            Sim. Cada bloco representa um movimento da mensagem (introdução,
            tese, ilustração, aplicação, etc.). As cores ajudam você a ver
            o ritmo da pregação rapidamente. Você pode customizar as cores em{" "}
            <Link href="/settings/blocks" className="text-vox-forest underline-offset-4 hover:underline">
              Configurações → Cores dos blocos
            </Link>
            .
          </p>
        ),
      },
      {
        q: "Como adiciono uma referência bíblica?",
        a: (
          <>
            <p>
              Digite a referência diretamente no texto (ex:{" "}
              <span className="vox-mono text-xs">Romanos 5:1-11</span>) ou
              pressione <Kbd>⌘ B</Kbd> em qualquer lugar
              do app pra abrir a busca rápida.
            </p>
            <p className="mt-2">
              O editor sugere o texto da passagem em tempo real — escolha a
              versão (NVI, ARC, ARA, etc.) na barra de ferramentas.
            </p>
          </>
        ),
      },
      {
        q: "O texto salva sozinho?",
        a: (
          <p>
            Salva. O auto-save grava no servidor a cada poucos segundos. Se
            você perder conexão, o conteúdo é mantido no seu dispositivo e
            sincronizado quando a internet voltar. Veja o indicador de
            <em> salvo há N segundos </em> no canto superior do editor.
          </p>
        ),
      },
      {
        q: "Como organizo um sermão em sessões?",
        a: (
          <p>
            Use o painel lateral pra criar sessões (Introdução, Desenvolvimento,
            Aplicação, Conclusão, etc.). Cada sessão recebe blocos
            individuais. As sessões viram a estrutura quando você exporta
            ou entra em modo apresentação.
          </p>
        ),
      },
    ],
  },
  {
    id: "frameworks",
    title: "Frameworks",
    items: [
      {
        q: "O que são frameworks homiléticos?",
        a: (
          <p>
            São modelos consagrados de estrutura de pregação: Expositivo,
            Textual, Narrativo, Temático, Tópico e Livre. Cada um sugere
            uma sequência de blocos e dicas pra você não esquecer movimentos
            importantes. Veja{" "}
            <Link href="/settings/frameworks" className="text-vox-forest underline-offset-4 hover:underline">
              Configurações → Frameworks
            </Link>{" "}
            pra ler o que cada um propõe.
          </p>
        ),
      },
      {
        q: "Posso mudar o framework depois de começar?",
        a: (
          <p>
            Pode. Abra o menu de ações (...) no topo do editor e escolha
            <em> Trocar framework</em>. O conteúdo dos blocos é preservado —
            apenas os rótulos e dicas mudam.
          </p>
        ),
      },
      {
        q: "E se eu quiser pregar sem framework?",
        a: (
          <p>
            Use o framework <strong>Livre</strong>. Ele oferece os blocos
            disponíveis sem prescrever uma sequência. Útil pra mensagens
            curtas, devocionais ou quando você já tem estrutura própria.
          </p>
        ),
      },
    ],
  },
  {
    id: "biblia",
    title: "Bíblia",
    items: [
      {
        q: "Quais versões estão disponíveis?",
        a: (
          <p>
            NVI, ARC (Almeida Revista e Corrigida), ARA (Almeida Revista e
            Atualizada), NTLH e ACF. Mais versões serão adicionadas conforme
            disponibilidade da API.
          </p>
        ),
      },
      {
        q: "Posso comparar versões lado a lado?",
        a: (
          <p>
            Sim. Em <Link href="/bible" className="text-vox-forest underline-offset-4 hover:underline">Bíblia</Link>{" "}
            você abre uma passagem e ativa duas ou mais versões em paralelo.
            Útil pra estudo prévio e pra escolher qual versão usar no púlpito.
          </p>
        ),
      },
    ],
  },
  {
    id: "apresentacao",
    title: "Apresentação",
    items: [
      {
        q: "Qual a diferença entre os modos de apresentação?",
        a: (
          <ul className="space-y-2 list-disc pl-5">
            <li>
              <strong>Teleprompter:</strong> texto do esboço rolando — ideal
              pra você ler discretamente do tablet/celular.
            </li>
            <li>
              <strong>Simples:</strong> slide em tela cheia, sem UI. É o que
              o público vê no projetor.
            </li>
            <li>
              <strong>Apresentador:</strong> duas janelas — uma com o slide
              atual pro público, outra com próximo slide + comentários só
              pra você.
            </li>
          </ul>
        ),
      },
      {
        q: "Como uso o modo apresentador com duas telas?",
        a: (
          <p>
            Conecte o projetor (ou outra tela) ao seu computador. Inicie a
            apresentação no modo <em>Apresentador</em>. O app abre uma janela
            secundária com o slide do público — arraste essa janela pra tela
            do projetor e coloque em tela cheia. As duas janelas ficam
            sincronizadas automaticamente.
          </p>
        ),
      },
      {
        q: "Posso adicionar comentários aos slides?",
        a: (
          <p>
            Sim, cada slide tem campo de comentário pessoal. Eles aparecem
            apenas no painel do apresentador, nunca pro público. Use pra
            anotar transições, gatilhos emocionais ou pontos de oração.
          </p>
        ),
      },
      {
        q: "O upload aceita PowerPoint?",
        a: (
          <p>
            Hoje aceita apenas PDF. Pra usar slides do PowerPoint ou Keynote,
            exporte como PDF antes de subir. Conversão automática está no
            roadmap.
          </p>
        ),
      },
    ],
  },
  {
    id: "cursos-estudo",
    title: "Cursos & Estudo",
    items: [
      {
        q: "Pra que servem os Cursos?",
        a: (
          <p>
            Cursos agrupam várias aulas numa sequência intencional — pra
            ensino bíblico, treinamento de líderes, escola dominical etc.
            Cada aula é um conteúdo do tipo <em>Aula</em> em{" "}
            <Link href="/sermons" className="text-vox-forest underline-offset-4 hover:underline">Esboços</Link>;
            o curso é a casca que organiza a ordem e o progresso.
          </p>
        ),
      },
      {
        q: "Qual a diferença entre Curso e Estudo Guiado?",
        a: (
          <p>
            <strong>Curso</strong> é pra quando você ensina pra alguém.{" "}
            <strong>Estudo Guiado</strong> é pra quando você estuda — anotações
            pessoais sobre um livro, tema ou passagem, organizadas em
            sessões com blocos. Pense num módulo de estudo como um caderno
            estruturado de devocionais.
          </p>
        ),
      },
    ],
  },
  {
    id: "offline",
    title: "Offline e sincronização",
    items: [
      {
        q: "O VOX funciona sem internet?",
        a: (
          <p>
            Funciona pra leitura e edição do conteúdo que você já abriu.
            O conteúdo é guardado localmente no seu dispositivo
            (IndexedDB). Mudanças feitas offline são sincronizadas quando
            a conexão volta.
          </p>
        ),
      },
      {
        q: "O que acontece se eu editar o mesmo sermão em dois dispositivos offline?",
        a: (
          <p>
            A resolução de conflitos hoje é <em>last write wins</em>: a
            última escrita sincronizada sobrescreve as anteriores. Pra
            preservar o trabalho de ambos os dispositivos, conecte primeiro
            o que tem as mudanças mais importantes.
          </p>
        ),
      },
      {
        q: "Posso instalar o VOX como app?",
        a: (
          <p>
            Sim. Em celulares e tablets, use a opção <em>Adicionar à tela
            inicial</em> do navegador. No desktop, Chrome e Edge oferecem
            o ícone de <em>Instalar app</em> na barra de endereço.
          </p>
        ),
      },
    ],
  },
  {
    id: "conta",
    title: "Conta e dados",
    items: [
      {
        q: "Como crio uma conta?",
        a: (
          <p>
            O VOX é por convite — não há cadastro público. Se você quer
            acesso, deixe seu interesse em{" "}
            <Link href="/auth/register" className="text-vox-forest underline-offset-4 hover:underline">
              /auth/register
            </Link>{" "}
            (mesmo logado, é a URL pública). Um administrador avalia o
            pedido e cria sua conta.
          </p>
        ),
      },
      {
        q: "Posso convidar outros pastores?",
        a: (
          <p>
            Se você é administrador da plataforma, pode criar contas e
            converter solicitações de interesse em usuários ativos. Veja
            <em> Administração → Usuários</em> no menu do seu avatar.
            Usuários comuns ainda não podem convidar diretamente — esse
            recurso está no roadmap.
          </p>
        ),
      },
      {
        q: "Meus dados são privados?",
        a: (
          <p>
            Sim. Cada usuário só vê o próprio conteúdo. O acesso é
            protegido por <em>Row Level Security</em> no banco — isso é
            aplicado pelo servidor, não pelo cliente, então não há como
            burlar pela URL ou pelo navegador.
          </p>
        ),
      },
      {
        q: "Como exporto meus sermões?",
        a: (
          <p>
            No editor, abra o menu <em>(...)</em> no topo e escolha{" "}
            <em>Exportar</em>. Você pode baixar o esboço em formatos como
            DOCX ou TXT pra usar fora do app.
          </p>
        ),
      },
      {
        q: "Como apago minha conta?",
        a: (
          <p>
            Hoje, peça a um administrador. Vai ser auto-serviço quando o
            recurso estiver disponível em <em>Configurações → Conta</em>.
          </p>
        ),
      },
    ],
  },
  {
    id: "atalhos",
    title: "Atalhos de teclado",
    items: [
      {
        q: "Quais atalhos posso usar?",
        a: (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span>Buscar passagem bíblica</span>
              <Kbd>⌘ B</Kbd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Próximo slide (apresentação)</span>
              <Kbd>→</Kbd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Slide anterior</span>
              <Kbd>←</Kbd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Sair da apresentação</span>
              <Kbd>Esc</Kbd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Salvar (já é automático)</span>
              <Kbd>⌘ S</Kbd>
            </div>
          </div>
        ),
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-12 max-w-3xl">
      <header>
        <p className="vox-eyebrow">Ajuda</p>
        <h1 className="vox-h1 mt-3">Como usar o VOX</h1>
        <p className="vox-body mt-3">
          Tudo o que você precisa saber pra preparar, entregar e arquivar
          mensagens com o VOX. Se algo aqui não responder, fale com quem
          te convidou — esta página substitui suporte humano genérico.
        </p>
      </header>

      <nav
        aria-label="Sumário"
        className="rounded-xl p-5"
        style={{
          background: "var(--vox-surface-elev)",
          border: "1px solid var(--vox-whisper)",
        }}
      >
        <p className="vox-eyebrow mb-3 text-[10px]">Sumário</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="text-vox-prose hover:text-vox-forest underline-offset-4 hover:underline"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {SECTIONS.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="space-y-4 scroll-mt-8"
        >
          <h2 className="vox-h2">{section.title}</h2>
          <div className="space-y-2">
            {section.items.map((item) => (
              <details
                key={item.q}
                className="group rounded-lg bg-card overflow-hidden"
                style={{ border: "1px solid var(--vox-whisper)" }}
              >
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none hover:bg-accent/30 transition-colors">
                  <span className="font-medium text-sm">{item.q}</span>
                  <span
                    className="vox-mono text-xs text-vox-muted shrink-0 transition-transform group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <div
                  className="px-5 pb-5 vox-body text-sm space-y-2 text-vox-prose"
                  style={{ borderTop: "1px solid var(--vox-whisper)" }}
                >
                  <div className="pt-4">{item.a}</div>
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}

      <footer
        className="rounded-xl p-6 mt-12"
        style={{
          background: "var(--vox-surface-elev)",
          border: "1px solid var(--vox-whisper)",
        }}
      >
        <p className="vox-eyebrow">Não encontrou?</p>
        <p className="vox-body mt-2 text-sm">
          Se você é pastor e precisa de ajuda específica, fale com quem te
          convidou pro VOX. Pra problemas técnicos urgentes, descreva o
          que aconteceu e em qual tela — quanto mais detalhado, mais rápido
          a solução chega.
        </p>
      </footer>
    </div>
  );
}
