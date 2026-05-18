// Princípios homiléticos universais — destilados de Haddon Robinson (Big Idea),
// Bryan Chapell (Christ-Centered Preaching), Tim Keller (gospel-centered) e a
// tradição clássica de pregação. Reusados por todos os frameworks pra que o
// app sirva como auxílio didático a iniciantes na pregação.
//
// Cada princípio é um TIP curto (placeholder no editor) + uma EXPLICAÇÃO mais
// longa que aparece num popover de ajuda. A ideia é que o pregador iniciante
// consiga, lendo o esboço pronto, entender O QUÊ colocar em cada bloco, POR QUÊ
// aquele bloco existe e COMO começar.

import type { BlockTypeId } from "@/lib/mocks/blocks";

export interface PreachingPrinciple {
  /** Rótulo do passo, em linguagem ministerial brasileira. */
  label: string;
  /** Placeholder curto dentro do editor (até ~100 chars). */
  hint: string;
  /** Explicação mais longa (popover de ajuda). Markdown simples permitido. */
  tip: string;
}

/**
 * Biblioteca de princípios reutilizáveis.
 * Cada chave representa um "papel" pedagógico que pode aparecer em qualquer
 * framework — não está amarrada a um BlockType só.
 */
export const PRINCIPLES: Record<string, PreachingPrinciple> = {
  // -------------------- INTRODUÇÃO --------------------
  hook: {
    label: "Gancho",
    hint: "Uma cena, pergunta ou imagem que prende a atenção nos primeiros 30 segundos.",
    tip: "Os primeiros 30–60 segundos decidem se a congregação vai escutar o resto. Comece com algo concreto: uma cena cotidiana, uma manchete, uma pergunta provocativa, uma estatística que choca. Evite: começar com 'hoje vamos falar sobre…' ou pedindo desculpa. Princípio: você está competindo com a distração — capture antes de ensinar.",
  },
  audienceConnection: {
    label: "Conexão com o ouvinte",
    hint: "Mostre por que esse texto importa para a vida real da congregação hoje.",
    tip: "Antes de explicar o texto, mostre por que ele toca a vida do ouvinte. Pergunte-se: 'Que dor, dúvida ou desejo desta congregação esse trecho endereça?' Bryan Chapell chama isso de FCF — Fallen Condition Focus. Sem essa ponte, o sermão vira aula bíblica.",
  },
  bigIdea: {
    label: "Ideia central (Big Idea)",
    hint: "Em uma única frase: o que esse sermão quer que a congregação saiba e faça.",
    tip: "Haddon Robinson: 'a Big Idea é uma frase completa que reúne o assunto (do que se trata) + complemento (o que diz sobre o assunto)'. Se você não consegue resumir o sermão em uma frase, a congregação também não vai. Teste: a Big Idea cabe num tweet? Ela responde 'e daí?'?",
  },
  baseText: {
    label: "Texto base",
    hint: "Cole a passagem completa que vai ser pregada. Inclua versículos antes/depois se ajudar o contexto.",
    tip: "Sempre leia o texto antes de pregar — não confie só na memória do ouvinte. Em pregação expositiva, é o texto que conduz; em temática, é o texto que sustenta. Inclua a referência canônica completa (livro, capítulo, versículos) e a versão usada.",
  },
  historicalContext: {
    label: "Contexto",
    hint: "Autor, audiência original, ocasião. Apenas o que ilumina o texto — sem aula de história.",
    tip: "Contexto não é decoração: é a chave para não tirar o texto do seu sentido. Pergunte: 'O que o autor original queria que a audiência original entendesse?' Só inclua dados históricos que ILUMINAM o texto. Evite: 'desce muito na geografia da Palestina' ou 'lista todos os autores possíveis'.",
  },

  // -------------------- CORPO --------------------
  mainPoint: {
    label: "Ponto principal",
    hint: "Em uma frase: a verdade central deste segmento do sermão.",
    tip: "Cada ponto principal é uma sub-Big Idea — uma verdade que sustenta e desenvolve a Big Idea do sermão inteiro. Bom ponto: é uma afirmação completa, não uma palavra solta ('Graça' é título, não ponto; 'A graça nos liberta do medo' é ponto). Numere mentalmente: P1 + P2 + P3 = Big Idea.",
  },
  explanation: {
    label: "Explicação",
    hint: "O que o texto DIZ? Gramática, palavras-chave, fluxo do argumento.",
    tip: "Mostre — não apenas afirme — que o ponto vem do texto. Cite o verbo, a palavra, o conectivo que sustenta sua afirmação. Iniciantes tendem a pular a explicação e ir direto pra aplicação: resulta em sermão piedoso mas sem ancoragem bíblica. Regra: nada vai pra aplicação sem antes ter passado pela exegese.",
  },
  illustration: {
    label: "Ilustração",
    hint: "Uma história, imagem ou analogia que torna a verdade visível.",
    tip: "Ilustração é janela — deixa entrar luz na verdade abstrata. Use cenas concretas, sensoriais (vê, ouve, sente). Boas fontes: vida cotidiana, biografias, literatura, filmes, notícias. Evite: ilustrações longas que viram protagonistas (a verdade some atrás da história), ilustrações sobre você que viram autopromoção, ilustrações de internet famosas e clichês.",
  },
  application: {
    label: "Aplicação",
    hint: "O que essa verdade pede da congregação? Concreto, esta semana.",
    tip: "Aplicação tem 3 dimensões — cabeça (o que mudo no pensamento?), coração (o que mudo no afeto?), mãos (o que faço hoje?). Iniciantes costumam aplicar só em ideias ('confie mais em Deus') sem pedir ações. Especifique: a quem? Quando? Em que situação concreta? Tim Keller: 'a aplicação geral não muda ninguém'.",
  },
  transition: {
    label: "Transição",
    hint: "Frase de costura entre este ponto e o próximo. Recapitula + anuncia.",
    tip: "Transições são pontes — sem elas, o sermão parece uma colcha de retalhos. Padrão simples: 'Vimos que X. Mas isso levanta uma pergunta: Y. É o que o texto responde no próximo verso.' Em pregação oral, a congregação se perde sem essas costuras. Não precisa de transição entre todo ponto, mas pelo menos antes do clímax.",
  },
  rhetoricalQuestion: {
    label: "Pergunta retórica",
    hint: "Suspende o ouvinte. Não exige resposta imediata — só faz pensar.",
    tip: "Boa pergunta retórica reformula o problema do ângulo do ouvinte. Não é 'você concorda que devemos amar a Deus?' (resposta óbvia, ouvinte desliga). É 'mas se Deus é bom, por que ela morreu naquela manhã?' (entra na ferida). Coloque a pergunta ANTES da resposta do texto — cria expectativa.",
  },

  // -------------------- CONCLUSÃO --------------------
  summary: {
    label: "Síntese",
    hint: "Volte à Big Idea, costurando os pontos principais.",
    tip: "A síntese não é resumo escolar ('vimos três pontos: 1, 2, 3'). É a Big Idea voltando com peso, agora iluminada pelo que foi explicado. O ouvinte deve sair sabendo de uma coisa só, mesmo que tenha esquecido os pontos. Pergunte-se: 'Se eles esquecerem 90% do sermão, o que eu preciso que fiquem lembrando?'",
  },
  gospelConnection: {
    label: "Conexão com o evangelho",
    hint: "Onde Cristo aparece neste texto? Como ele resolve a tensão levantada?",
    tip: "Bryan Chapell e a tradição reformada: toda pregação cristã aponta para Cristo. Mesmo em textos do AT, há fios que apontam ao evangelho (promessa, tipo, contraste, consumação). Não é forçar Jesus em todo verso — é mostrar onde a história inteira está indo. Sem isso, o sermão vira moralismo ('seja mais como Davi').",
  },
  altarCall: {
    label: "Apelo",
    hint: "Convite claro a uma resposta. Concreto: o que fazer hoje, esta semana.",
    tip: "Apelo não é só convidar a se converter — é pedir UMA resposta concreta a partir do que foi pregado. Pode ser: arrepender-se de algo específico, perdoar alguém, dar um próximo passo de fé, agir diferente em casa esta semana. Iniciantes terminam vago ('reflitam sobre isso'). Termine com convite acionável.",
  },
  prayer: {
    label: "Oração",
    hint: "Oração final pedindo que a Palavra opere no coração da congregação.",
    tip: "A oração final é entrega — você pregou, o Espírito convence. Ore pelo que foi pregado, não por uma lista genérica. Específico: 'Pai, por essa Big Idea, por aquela aplicação, por aquela alma que está em luta com X agora.' Curta e sentida funciona melhor que longa e formal.",
  },

  // -------------------- TEMÁTICO / TÓPICO --------------------
  problem: {
    label: "O problema",
    hint: "Qual a questão real da congregação que este sermão endereça?",
    tip: "Pregação temática nasce de uma dor, dúvida ou desejo da congregação que a Escritura responde. Defina a questão antes do texto — assim o ouvinte sente o peso da resposta. Cuidado: não pregue 'sobre' temas (graça, fé) — pregue 'a' tema a partir de um problema humano concreto que ele resolve.",
  },
  theme: {
    label: "Tema",
    hint: "O assunto bíblico que será abordado, anunciado com clareza.",
    tip: "Bom tema é específico, não abstrato. Não 'graça', mas 'graça que te liberta do medo de ser descoberto'. Não 'oração', mas 'oração quando Deus parece em silêncio'. Especifique o ângulo — sermão amplo demais dispersa.",
  },

  // -------------------- NARRATIVO --------------------
  scene: {
    label: "Cenário",
    hint: "Personagens, lugar, época. Faça o ouvinte ENXERGAR a cena.",
    tip: "Pregação narrativa funciona quando a congregação entra na história. Descreva o que se vê, ouve, sente. Não diga 'era um dia difícil' — diga 'o sol estava a pino, a estrada quente, e ele já tinha caminhado três dias'. O texto bíblico já é sensorial — use o que está lá.",
  },
  tension: {
    label: "Tensão / conflito",
    hint: "O que está em jogo na narrativa? Qual é o conflito central?",
    tip: "Toda boa narrativa tem tensão — sem ela, não há história. Identifique o conflito: pode ser entre personagens, entre o personagem e Deus, entre expectativa e realidade. Faça o ouvinte sentir o peso ANTES da resolução. Iniciantes pulam direto para a moral, perdem o drama bíblico.",
  },
  turn: {
    label: "Reviravolta",
    hint: "O movimento que muda tudo na história — o gesto de graça inesperado.",
    tip: "Em narrativas bíblicas, a reviravolta quase sempre é a ação de Deus que ninguém esperava. É onde o evangelho aparece dentro do enredo. Marque o momento: 'mas então…', 'naquela hora…', 'e Deus disse…'. Esse é o ponto alto emocional — não o passe rápido.",
  },
};

/**
 * Atalho — devolve {label, hint, tip} de um princípio, opcionalmente
 * sobrescrevendo o tipo de bloco. Útil pra montar esqueletos de framework
 * sem repetir texto.
 */
export function principle(
  key: keyof typeof PRINCIPLES,
  blockType: BlockTypeId
): { type: BlockTypeId; label: string; hint: string; tip: string } {
  const p = PRINCIPLES[key];
  if (!p) {
    throw new Error(`Unknown preaching principle: ${String(key)}`);
  }
  return { type: blockType, label: p.label, hint: p.hint, tip: p.tip };
}
