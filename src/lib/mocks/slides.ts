// Mocks de slides para sermões type='apresentação'.
// Cada slide tem `comment_items` (estrutura sessão+itens, mesma forma do esboço).

import type { SermonContent } from "@/lib/sermons/sessions";

export interface MockSlide {
  id: string;
  order: number;
  image_url?: string;
  comment_items: SermonContent;
}

function id() {
  return Math.random().toString(36).slice(2, 12);
}

// Aula "Como ler Provérbios em três passos" — 5 slides, cada um um manuscrito.
const AULA_PROVERBIOS_SLIDES: MockSlide[] = [
  {
    id: "sl-aula-1",
    order: 1,
    comment_items: {
      sessions: [
        {
          id: id(),
          title: "Abertura",
          role: "introducao",
          order: 1,
          items: [
            {
              id: id(),
              type: "pergunta_retorica",
              content:
                "Quantas vezes você abriu Provérbios e leu um versículo isolado, sem entender por que aquele estava ali e não outro?",
              order: 1,
            },
            {
              id: id(),
              type: "introducao",
              content:
                "Hoje vamos aprender três passos práticos para ler Provérbios sem cair em pragmatismo nem em moralismo. Não é receita — é postura.",
              order: 2,
            },
            {
              id: id(),
              type: "notas_pessoais",
              content:
                "Esperar 8 segundos depois da pergunta. Não responder. Deixar pesar.",
              order: 3,
            },
          ],
        },
      ],
    },
  },
  {
    id: "sl-aula-2",
    order: 2,
    comment_items: {
      sessions: [
        {
          id: id(),
          title: "Passo 1: Observe o gênero",
          role: "topico",
          order: 1,
          items: [
            {
              id: id(),
              type: "texto_biblico",
              content:
                "A resposta branda desvia o furor, mas a palavra dura suscita a ira. — Provérbios 15:1",
              order: 1,
            },
            {
              id: id(),
              type: "ponto_principal",
              content:
                "Provérbios são princípios gerais para a vida sábia — não são promessas absolutas. Quem confunde gênero, confunde Deus com uma máquina de respostas.",
              order: 2,
            },
            {
              id: id(),
              type: "ilustracao",
              content:
                "Como ler uma receita de bolo: o tempo de forno é guia, não juramento. Ler Provérbios como contrato gera amargura quando a vida diverge.",
              order: 3,
            },
            {
              id: id(),
              type: "aplicacao",
              content:
                "Antes de aplicar um provérbio, pergunte: este é um princípio para a normalidade da vida? Ou estou tratando como cláusula contratual?",
              order: 4,
            },
          ],
        },
      ],
    },
  },
  {
    id: "sl-aula-3",
    order: 3,
    comment_items: {
      sessions: [
        {
          id: id(),
          title: "Passo 2: Cruze com outros textos",
          role: "topico",
          order: 1,
          items: [
            {
              id: id(),
              type: "texto_biblico",
              content:
                "Não respondas ao tolo segundo a sua estultícia, para que também não te faças semelhante a ele. — Provérbios 26:4",
              order: 1,
            },
            {
              id: id(),
              type: "texto_biblico",
              content:
                "Responde ao tolo segundo a sua estultícia, para que não seja sábio aos seus próprios olhos. — Provérbios 26:5",
              order: 2,
            },
            {
              id: id(),
              type: "pergunta_retorica",
              content:
                "Os dois versículos consecutivos se contradizem? Ou estão dizendo: às vezes responda, às vezes silencie — discernimento é a virtude central?",
              order: 3,
            },
            {
              id: id(),
              type: "ponto_principal",
              content:
                "Provérbios devem ser lidos em coleção. O contraditório aparente revela que a sabedoria é situacional. Cruze sempre com outros provérbios e com os Evangelhos.",
              order: 4,
            },
          ],
        },
      ],
    },
  },
  {
    id: "sl-aula-4",
    order: 4,
    comment_items: {
      sessions: [
        {
          id: id(),
          title: "Passo 3: Aplique com discernimento",
          role: "topico",
          order: 1,
          items: [
            {
              id: id(),
              type: "ponto_principal",
              content:
                "Aplicação não é executar regras — é cultivar caráter. O fim de Provérbios é o temor do Senhor, não a eficácia social.",
              order: 1,
            },
            {
              id: id(),
              type: "citacao",
              content:
                "\"A sabedoria bíblica não é técnica de vida bem-sucedida; é caráter formado pelo temor de Deus.\" — Bruce Waltke",
              order: 2,
            },
            {
              id: id(),
              type: "aplicacao",
              content:
                "Escolha um provérbio para a semana. Não memorize — observe como o Senhor o trabalha em você nas microdecisões do dia.",
              order: 3,
            },
            {
              id: id(),
              type: "notas_pessoais",
              content:
                "Pedir que cada um anote o provérbio escolhido. Voltar à pergunta na próxima aula.",
              order: 4,
            },
          ],
        },
      ],
    },
  },
  {
    id: "sl-aula-5",
    order: 5,
    comment_items: {
      sessions: [
        {
          id: id(),
          title: "Fechamento",
          role: "conclusao",
          order: 1,
          items: [
            {
              id: id(),
              type: "conclusao",
              content:
                "Três passos: observe o gênero, cruze com outros textos, aplique pelo caráter. Provérbios devolvidos ao seu lugar — sabedoria pastoral, não fórmula mágica.",
              order: 1,
            },
            {
              id: id(),
              type: "oracao",
              content:
                "Senhor, que o temor de ti seja a porta da sabedoria nesta semana. Que possamos ler tua Palavra como filhos diante de um Pai, e não como clientes diante de um contrato.",
              order: 2,
            },
          ],
        },
      ],
    },
  },
];

// Palestra "Liderança em tempos de pressão" (s-005, já existente)
const PALESTRA_LIDERANCA_SLIDES: MockSlide[] = [
  {
    id: "sl-lid-1",
    order: 1,
    comment_items: {
      sessions: [
        {
          id: id(),
          title: "Pergunta de partida",
          role: "introducao",
          order: 1,
          items: [
            {
              id: id(),
              type: "pergunta_retorica",
              content:
                "Por que líderes que começam bem desabam no meio do caminho? Quase nunca por falta de talento. Sempre por falta de estrutura.",
              order: 1,
            },
            {
              id: id(),
              type: "introducao",
              content:
                "Êxodo 18 mostra Moisés à beira do colapso e o conselho do seu sogro Jetro. É um dos primeiros manuais de liderança da história — e segue atual.",
              order: 2,
            },
          ],
        },
      ],
    },
  },
  {
    id: "sl-lid-2",
    order: 2,
    comment_items: {
      sessions: [
        {
          id: id(),
          title: "O diagnóstico de Jetro",
          role: "topico",
          order: 1,
          items: [
            {
              id: id(),
              type: "texto_biblico",
              content:
                "Não convém o que fazes; sem dúvida desfalecerás, assim tu como este povo que está contigo. — Êxodo 18:17—18",
              order: 1,
            },
            {
              id: id(),
              type: "ponto_principal",
              content:
                "Jetro nomeia o que Moisés ainda não vê: o líder está cumprindo bem cada tarefa, mas o sistema é insustentável.",
              order: 2,
            },
            {
              id: id(),
              type: "aplicacao",
              content:
                "Você precisa de alguém de fora que possa olhar pra sua agenda e dizer: 'não convém o que fazes'. Quem é esse pra você?",
              order: 3,
            },
          ],
        },
      ],
    },
  },
  {
    id: "sl-lid-3",
    order: 3,
    comment_items: {
      sessions: [
        {
          id: id(),
          title: "A solução estrutural",
          role: "topico",
          order: 1,
          items: [
            {
              id: id(),
              type: "ponto_principal",
              content:
                "Jetro não pede que Moisés se esforce mais. Pede que ele delegue por níveis de competência e confiança — chefes de mil, cem, cinquenta e dez.",
              order: 1,
            },
            {
              id: id(),
              type: "subponto",
              content:
                "Delegar não é abdicar. Moisés segue julgando os casos mais difíceis — mas só os mais difíceis.",
              order: 2,
            },
            {
              id: id(),
              type: "ilustracao",
              content:
                "Como um cirurgião que não atende triagem: o tempo dele é caro demais pra ser gasto onde outros podem servir igualmente bem.",
              order: 3,
            },
          ],
        },
      ],
    },
  },
  {
    id: "sl-lid-4",
    order: 4,
    comment_items: {
      sessions: [
        {
          id: id(),
          title: "Aplicação pastoral",
          role: "topico",
          order: 1,
          items: [
            {
              id: id(),
              type: "aplicacao",
              content:
                "Identifique três tarefas que só você está fazendo nesta semana e que poderiam ser feitas por outro com 80% da sua qualidade. Delegue.",
              order: 1,
            },
            {
              id: id(),
              type: "pergunta_retorica",
              content:
                "Você está sendo o gargalo do que Deus quer fazer pela sua comunidade?",
              order: 2,
            },
          ],
        },
      ],
    },
  },
  {
    id: "sl-lid-5",
    order: 5,
    comment_items: {
      sessions: [
        {
          id: id(),
          title: "Encerramento",
          role: "conclusao",
          order: 1,
          items: [
            {
              id: id(),
              type: "conclusao",
              content:
                "Liderança sustentável tem nome bíblico: humildade estrutural. Moisés ouviu seu sogro porque sabia que o ministério não dependia de sua resistência.",
              order: 1,
            },
            {
              id: id(),
              type: "oracao",
              content:
                "Senhor, livra-nos da síndrome do imprescindível. Ensina-nos a construir o que continue funcionando depois que sairmos da sala.",
              order: 2,
            },
          ],
        },
      ],
    },
  },
];

/** Mapa sermon_id → slides. Usado por /sermons/[id] e /sermons/[id]/present. */
export const MOCK_SLIDES_BY_SERMON: Record<string, MockSlide[]> = {
  "s-005": PALESTRA_LIDERANCA_SLIDES,
  "s-007": AULA_PROVERBIOS_SLIDES,
};

export function getMockSlides(sermonId: string): MockSlide[] {
  return MOCK_SLIDES_BY_SERMON[sermonId] ?? [];
}
