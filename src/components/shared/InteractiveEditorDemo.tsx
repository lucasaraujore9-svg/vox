"use client";

import { useState } from "react";
import { VOX_FRAMEWORKS, type FrameworkId } from "@/lib/mocks/frameworks";

type BlockContent =
  | { kind: "scripture"; verse: string; ref: string }
  | { kind: "prose"; body: string; highlight?: string };

const COLOR_BY_BLOCK: Record<string, string> = {
  "Texto Bíblico": "var(--vox-gold)",
  "Contexto": "var(--vox-forest)",
  "Introdução": "var(--vox-forest)",
  "Cenário": "var(--vox-forest)",
  "Tensão": "var(--vox-fw-narrativo)",
  "Reviravolta": "var(--vox-fw-narrativo)",
  "Ponto Principal": "var(--vox-ink)",
  "Subponto": "var(--vox-prose)",
  "Pergunta retórica": "var(--vox-fw-topico)",
  "Ilustração": "var(--vox-fw-topico)",
  "Aplicação": "#0D7C7C",
  "Conclusão": "var(--vox-ink)",
  "Oração": "var(--vox-forest)",
  "Notas pessoais": "var(--vox-muted)",
};

const EXAMPLES: Record<FrameworkId, Record<string, BlockContent>> = {
  expositivo: {
    "Texto Bíblico": {
      kind: "scripture",
      verse:
        "Justificados, pois, pela fé, temos paz com Deus por meio do nosso Senhor Jesus Cristo.",
      ref: "Romanos 5:1,11",
    },
    Contexto: {
      kind: "prose",
      body: "Paulo escreve a uma comunidade dividida entre judeus convertidos e gentios. Após argumentar nos primeiros quatro capítulos sobre justificação, ele inicia uma nova seção: as consequências de ter sido justificado.",
    },
    "Ponto Principal": {
      kind: "prose",
      body: "A paz com Deus não é resultado do nosso esforço, mas fruto da justificação pela fé. Paulo conecta a fé não a uma sensação passageira, mas a uma posição declarada por Deus.",
      highlight: "posição declarada por Deus",
    },
    Subponto: {
      kind: "prose",
      body: "Essa paz tem três efeitos no verso seguinte: acesso ao Pai, esperança da glória, alegria nas tribulações. Cada um merece atenção antes de prosseguir.",
    },
    Aplicação: {
      kind: "prose",
      body: "Você está tentando ganhar a paz com Deus, ou recebê-la? A diferença é tudo. Hoje, antes de orar pedindo algo, ore reconhecendo o que já é seu em Cristo.",
    },
    Conclusão: {
      kind: "prose",
      body: "A justificação é o solo. A paz é o fruto. Olhe para a cruz, não para o seu esforço. Essa é a única ordem que sustenta uma vida cristã sem ansiedade.",
    },
    Oração: {
      kind: "prose",
      body: "Senhor, obrigado por uma paz que não depende do que eu sinto hoje, mas do que Cristo fez. Que eu viva a partir dessa paz, não em busca dela. Amém.",
    },
  },
  textual: {
    "Texto Bíblico": {
      kind: "scripture",
      verse: "O Senhor é o meu pastor, nada me faltará.",
      ref: "Salmos 23:1",
    },
    Introdução: {
      kind: "prose",
      body: "Há frases bíblicas tão conhecidas que perderam o impacto. Esta é uma delas. Vamos desmontá-la palavra por palavra até ela voltar a doer e curar.",
    },
    "Ponto Principal": {
      kind: "prose",
      body: "Davi não diz \"o Senhor é um pastor\". Diz \"o Senhor é o meu pastor\". A diferença entre teologia e fé pessoal está nesse possessivo.",
    },
    Subponto: {
      kind: "prose",
      body: "\"Nada me faltará\" não promete ausência de pobreza ou doença. Promete suficiência. O pastor não dá tudo, dá o necessário, no tempo certo.",
    },
    Aplicação: {
      kind: "prose",
      body: "Você consegue dizer \"nada me faltará\" com a sua conta bancária atual? Se não, o que você está esperando do pastor que ele nunca prometeu?",
    },
    Conclusão: {
      kind: "prose",
      body: "Uma frase. Seis palavras em hebraico. Suficiente para sustentar a alma de Davi no campo e na fuga. Suficiente para você hoje.",
    },
  },
  narrativo: {
    "Texto Bíblico": {
      kind: "scripture",
      verse:
        "Pedro respondeu, e disse-lhe: Senhor, se és tu, manda-me ir ter contigo por cima das águas.",
      ref: "Mateus 14:28",
    },
    Cenário: {
      kind: "prose",
      body: "Madrugada. Mar da Galileia, vento forte. Doze homens num barco há horas. Aparece uma figura caminhando sobre a água. Eles gritam. É Jesus.",
    },
    Tensão: {
      kind: "prose",
      body: "Pedro não pede prova. Pede permissão. Sai do barco. Caminha. Vê o vento. Afunda. Grita. Jesus o pega. \"Por que duvidaste?\"",
      highlight: "Por que duvidaste?",
    },
    Reviravolta: {
      kind: "prose",
      body: "A pergunta de Jesus não é uma reprovação. É um diagnóstico. O problema de Pedro não foi sair do barco. Foi olhar para o vento depois que já estava fora.",
    },
    Ilustração: {
      kind: "prose",
      body: "Pense num funâmbulo. Ele não cai porque vai com medo. Cai quando começa a olhar pra baixo. A fé funciona igual: direção é tudo.",
    },
    Aplicação: {
      kind: "prose",
      body: "Onde você saiu do barco essa semana? E quando olhou para o vento? Volte a olhar para quem te chamou. Ele não saiu do lugar.",
    },
    Conclusão: {
      kind: "prose",
      body: "Pedro caminhou sobre a água. Por alguns segundos. Foi mais do que os outros onze, que ficaram seguros no barco e nunca souberam que era possível.",
    },
  },
  tematico: {
    Introdução: {
      kind: "prose",
      body: "Graça. Talvez a palavra mais usada e menos entendida do vocabulário cristão. Vamos olhar três passagens que a definem por contraste.",
    },
    "Texto Bíblico": {
      kind: "scripture",
      verse:
        "Pela graça sois salvos, mediante a fé; e isto não vem de vós; é dom de Deus.",
      ref: "Efésios 2:8",
    },
    "Ponto Principal": {
      kind: "prose",
      body: "Graça é o oposto de mérito. Não é Deus sendo bonzinho. É Deus dando o que ninguém poderia comprar, à pessoa que nem sabia que precisava.",
    },
    "Pergunta retórica": {
      kind: "prose",
      body: "Se a graça fosse mérito, ainda seria graça? Se você merecesse a salvação, ainda precisaria dela? Por que insistimos em transformar dom em troca?",
    },
    Aplicação: {
      kind: "prose",
      body: "Pense em alguém que te magoou. Ofereça hoje o que Deus te ofereceu: graça sem condição. Não porque a pessoa merece. Porque você já recebeu.",
    },
    Conclusão: {
      kind: "prose",
      body: "Graça recebida que não vira graça oferecida é graça mal compreendida. Comece pequeno. Comece hoje.",
    },
  },
  topico: {
    Introdução: {
      kind: "prose",
      body: "Ansiedade. Provavelmente metade desta igreja dormiu mal essa semana por causa dela. Não vou tratar como pecado nem como sintoma. Vou tratar como o que é.",
    },
    "Pergunta retórica": {
      kind: "prose",
      body: "Quantas das suas preocupações de cinco anos atrás de fato aconteceram? E quantas das que aconteceram você resolveu por preocupar-se a mais?",
    },
    "Texto Bíblico": {
      kind: "scripture",
      verse:
        "Não andeis ansiosos por coisa alguma; em tudo, porém, sejam conhecidas, diante de Deus, as vossas petições, pela oração e pela súplica.",
      ref: "Filipenses 4:6",
    },
    "Ponto Principal": {
      kind: "prose",
      body: "Paulo não diz \"relaxe\". Diz \"ore\". A ansiedade não some por força de vontade. Some quando muda de endereço, do seu peito para o trono de Deus.",
    },
    Ilustração: {
      kind: "prose",
      body: "Um mensageiro carrega uma carta pesada. Não importa o conteúdo, importa entregar. Sua oração é a carta. Deus é o destinatário. Você é só o mensageiro.",
    },
    Aplicação: {
      kind: "prose",
      body: "Faça uma lista. Não mental, escrita. Cada item, uma oração curta. Entregue, datada de hoje. Releia em um mês e veja quantas você ainda precisa carregar.",
    },
    Conclusão: {
      kind: "prose",
      body: "A paz de Deus, que excede todo entendimento, não é a ausência de problemas. É uma guarda. Um perímetro ao redor do coração. Hoje, escolha colocar a guarda.",
    },
  },
  livre: {
    "Notas pessoais": {
      kind: "prose",
      body: "Para devocional curto, devocional pessoal, mensagem improvisada de célula, ou bilhetes de oração. Sem estrutura, sem cor, sem peso. Só você e a Palavra.",
    },
  },
};

export function InteractiveEditorDemo() {
  const [modelId, setModelId] = useState<FrameworkId>("expositivo");
  const [blockIdx, setBlockIdx] = useState(0);

  const model = VOX_FRAMEWORKS.find((m) => m.id === modelId)!;
  const blockName = model.outline[blockIdx] ?? model.outline[0] ?? "";
  const content = blockName ? EXAMPLES[modelId]?.[blockName] : undefined;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--vox-surface)",
        border: "1px solid var(--vox-whisper)",
        boxShadow: "var(--vox-shadow-card)",
      }}
    >
      <div
        className="px-5 py-4 flex items-center gap-2 overflow-x-auto"
        style={{
          background: "var(--vox-surface-deep)",
          borderBottom: "1px solid var(--vox-whisper)",
        }}
      >
        <span className="vox-mono text-[10px] uppercase tracking-wider text-vox-muted shrink-0 pr-2">
          Modelo
        </span>
        {VOX_FRAMEWORKS.map((m) => {
          const active = m.id === modelId;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setModelId(m.id);
                setBlockIdx(0);
              }}
              className="vox-mono text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-md shrink-0 transition-all"
              style={{
                background: active
                  ? `var(--vox-fw-${m.id})`
                  : "var(--vox-surface)",
                color: active ? "#fff" : "var(--vox-prose)",
                border: active
                  ? `1px solid var(--vox-fw-${m.id})`
                  : "1px solid var(--vox-whisper)",
              }}
              aria-pressed={active}
            >
              {m.name}
            </button>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-[200px_1fr]">
        <aside
          className="p-4 sm:p-5 flex flex-row sm:flex-col gap-1.5 overflow-x-auto sm:overflow-visible"
          style={{
            background: "var(--vox-surface-deep)",
            borderRight: "1px solid var(--vox-whisper)",
          }}
        >
          <p className="hidden sm:block vox-eyebrow mb-2 shrink-0">
            Estrutura
          </p>
          {model.outline.map((b, i) => {
            const active = i === blockIdx;
            const color = COLOR_BY_BLOCK[b] ?? "var(--vox-prose)";
            return (
              <button
                key={`${modelId}-${b}-${i}`}
                type="button"
                onClick={() => setBlockIdx(i)}
                className="flex items-center gap-2 text-xs px-2.5 py-2 rounded-md shrink-0 text-left transition-all"
                style={{
                  background: active
                    ? "var(--vox-surface)"
                    : "transparent",
                  border: active
                    ? "1px solid var(--vox-whisper-strong)"
                    : "1px solid transparent",
                }}
                aria-pressed={active}
              >
                <span
                  className="size-1.5 rounded-full shrink-0"
                  style={{ background: color }}
                />
                <span
                  style={{
                    color: active ? "var(--vox-ink)" : "var(--vox-prose)",
                    fontWeight: active ? 500 : 400,
                    whiteSpace: "nowrap",
                  }}
                >
                  {b}
                </span>
              </button>
            );
          })}
        </aside>

        <div className="p-7 sm:p-10 min-h-[280px]">
          <div className="flex items-center justify-between mb-1">
            <p
              className="vox-eyebrow"
              style={{ color: COLOR_BY_BLOCK[blockName] ?? "var(--vox-prose)" }}
            >
              {blockName}
            </p>
            <span className="vox-mono text-[10px] text-vox-muted">
              salvo há 12s
            </span>
          </div>

          <EditorContent content={content} />

          <div
            className="mt-8 pt-5 flex items-center justify-between"
            style={{ borderTop: "1px solid var(--vox-whisper)" }}
          >
            <span className="vox-mono text-[10px] text-vox-muted">
              {model.outline.length} blocos · {model.name.toLowerCase()}
            </span>
            <span
              className="vox-mono text-[10px] px-2 py-1 rounded-full"
              style={{
                background: "var(--vox-forest-soft)",
                color: "var(--vox-forest)",
              }}
            >
              ao vivo, experimente
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorContent({ content }: { content?: BlockContent }) {
  if (!content) {
    return (
      <p className="mt-4 text-vox-muted text-[15px] italic">
        Aqui você escreveria essa parte.
      </p>
    );
  }

  if (content.kind === "scripture") {
    return (
      <>
        <p className="vox-scripture mt-4 text-lg sm:text-xl">
          &ldquo;{content.verse}&rdquo;
        </p>
        <p className="vox-ref mt-2">{content.ref}</p>
      </>
    );
  }

  if (content.highlight) {
    const [before, after] = content.body.split(content.highlight);
    return (
      <p className="mt-4 text-vox-prose text-[15px] leading-relaxed">
        {before}
        <span
          className="px-1.5 py-0.5 rounded"
          style={{
            background: "var(--vox-forest-soft)",
            color: "var(--vox-forest)",
            fontWeight: 500,
          }}
        >
          {content.highlight}
        </span>
        {after}
      </p>
    );
  }

  return (
    <p className="mt-4 text-vox-prose text-[15px] leading-relaxed">
      {content.body}
    </p>
  );
}
