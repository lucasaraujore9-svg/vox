// Static data for the VOX prototype.
window.VOX_DATA = (function () {
  const FRAMEWORKS = {
    expositivo: {
      id: "expositivo",
      name: "Expositivo",
      color: "var(--fw-expositivo)",
      tagline: "Verso a verso, fiel ao texto",
      description:
        "Pregação que explica o significado do texto bíblico em sua ordem natural, expondo cada parte para revelar o todo.",
      outline: ["Texto Bíblico", "Contexto", "Ponto Principal", "Subponto", "Aplicação", "Conclusão", "Oração"],
    },
    textual: {
      id: "textual",
      name: "Textual",
      color: "var(--fw-textual)",
      tagline: "Um texto, uma mensagem",
      description:
        "Centrada em uma única passagem curta, extrai os pontos principais diretamente da estrutura do texto.",
      outline: ["Texto Bíblico", "Introdução", "Ponto Principal", "Subponto", "Subponto", "Aplicação", "Conclusão"],
    },
    narrativo: {
      id: "narrativo",
      name: "Narrativo",
      color: "var(--fw-narrativo)",
      tagline: "História que prega",
      description:
        "Conduz o ouvinte pela narrativa bíblica, preservando tensão, personagens e desfecho para revelar a verdade.",
      outline: ["Texto Bíblico", "Cenário", "Tensão", "Reviravolta", "Ilustração", "Aplicação", "Conclusão"],
    },
    tematico: {
      id: "tematico",
      name: "Temático",
      color: "var(--fw-tematico)",
      tagline: "Tema bíblico, múltiplas vozes",
      description:
        "Desenvolve um tema percorrendo várias passagens, mostrando como as Escrituras o iluminam de ângulos distintos.",
      outline: ["Introdução", "Texto Bíblico", "Texto Bíblico", "Ponto Principal", "Pergunta retórica", "Aplicação", "Conclusão"],
    },
    topico: {
      id: "topico",
      name: "Tópico",
      color: "var(--fw-topico)",
      tagline: "Vida real à luz da Palavra",
      description:
        "Trata de um tópico contemporâneo (família, sofrimento, vocação) ancorando cada ponto em texto bíblico.",
      outline: ["Introdução", "Pergunta retórica", "Texto Bíblico", "Ponto Principal", "Ilustração", "Aplicação", "Conclusão"],
    },
    livre: {
      id: "livre",
      name: "Livre",
      color: "var(--fw-livre)",
      tagline: "Estrutura aberta",
      description:
        "Sem template fixo. Para devocionais, vigílias, palavras pastorais e formatos que pedem espontaneidade.",
      outline: ["Notas pessoais"],
    },
  };

  const BLOCK_TYPES = {
    "Texto Bíblico":      { color: "var(--gold)",     accent: "rgba(180,83,9,0.10)",  hint: "Cole ou digite a passagem. Será destacada e disponível no Modo Apresentação." },
    "Introdução":         { color: "var(--forest)",   accent: "var(--forest-soft)",   hint: "Como o sermão começa. Gancho, leitura, oração inicial." },
    "Contexto":           { color: "var(--fw-livre)", accent: "rgba(71,85,105,0.08)", hint: "Histórico, autor, audiência original, gênero literário." },
    "Ponto Principal":    { color: "var(--forest)",   accent: "var(--forest-soft)",   hint: "A ideia central que será desenvolvida nesta seção." },
    "Subponto":           { color: "var(--forest-mid)", accent: "rgba(21,128,61,0.08)", hint: "Desdobramento do ponto principal." },
    "Ilustração":         { color: "var(--fw-tematico)", accent: "rgba(180,83,9,0.08)", hint: "História, analogia, cena que ilumina a verdade do ponto." },
    "Aplicação":          { color: "var(--fw-textual)", accent: "rgba(13,124,124,0.08)", hint: "O que esta verdade pede da congregação esta semana?" },
    "Citação":            { color: "var(--gold)",     accent: "var(--gold-soft)",     hint: "Quote de autor, comentarista ou pai da igreja. Inclua atribuição." },
    "Pergunta retórica":  { color: "var(--fw-narrativo)", accent: "rgba(109,40,217,0.08)", hint: "Pergunta para suspender o ouvinte. Não exige resposta imediata." },
    "Conclusão":          { color: "var(--ink)",     accent: "rgba(24,24,27,0.05)",  hint: "Recapitulação, chamado, ponte para a próxima semana." },
    "Oração":             { color: "var(--fw-livre)", accent: "rgba(71,85,105,0.08)", hint: "Oração de encerramento ou de comissionamento." },
    "Notas pessoais":     { color: "var(--muted)",   accent: "rgba(156,163,175,0.10)", hint: "Visível apenas para você. Não aparece no Modo Apresentação." },
  };

  const SERMONS = [
    {
      id: "s1",
      title: "A graça que sustenta",
      ref: "Romanos 5:1—11",
      framework: "expositivo",
      status: "published",
      updatedAt: "12 de maio · 14:32",
      tags: ["Domingo de manhã", "Série Romanos"],
      words: 2840,
      durationMin: 38,
      note: "Última revisão antes da Série Romanos #07.",
    },
    {
      id: "s2",
      title: "Ouvir e fazer",
      ref: "Tiago 1:22—25",
      framework: "expositivo",
      status: "drafting",
      updatedAt: "ontem · 21:08",
      tags: ["Domingo de manhã"],
      words: 1620,
      durationMin: 26,
      progress: 0.62,
    },
    {
      id: "s3",
      title: "Quem é o meu próximo?",
      ref: "Lucas 10:25—37",
      framework: "narrativo",
      status: "drafting",
      updatedAt: "9 de maio · 08:15",
      tags: ["Culto da família"],
      words: 980,
      durationMin: 18,
      progress: 0.35,
    },
    {
      id: "s4",
      title: "O peso da glória",
      ref: "2 Coríntios 4:16—18",
      framework: "textual",
      status: "published",
      updatedAt: "5 de maio · 19:40",
      tags: ["Vigília", "Sofrimento"],
      words: 2210,
      durationMin: 31,
    },
    {
      id: "s5",
      title: "Quando a oração demora",
      ref: "Lucas 18:1—8",
      framework: "tematico",
      status: "drafting",
      updatedAt: "3 de maio · 11:22",
      tags: ["Reunião de oração"],
      words: 740,
      durationMin: 14,
      progress: 0.22,
    },
    {
      id: "s6",
      title: "O fruto que permanece",
      ref: "Gálatas 5:22—23",
      framework: "topico",
      status: "published",
      updatedAt: "28 de abril",
      tags: ["Série Espírito"],
      words: 2950,
      durationMin: 36,
    },
    {
      id: "s7",
      title: "Diante do silêncio",
      ref: "Salmo 13",
      framework: "livre",
      status: "draft",
      updatedAt: "26 de abril",
      tags: ["Devocional"],
      words: 420,
      durationMin: 9,
      progress: 0.12,
    },
    {
      id: "s8",
      title: "O bom pastor",
      ref: "João 10:1—18",
      framework: "narrativo",
      status: "published",
      updatedAt: "21 de abril",
      tags: ["Domingo de manhã", "Páscoa"],
      words: 3180,
      durationMin: 42,
    },
  ];

  // Editor preview document — a working draft of "Ouvir e fazer"
  const EDITOR_DOC = {
    sermonId: "s2",
    title: "Ouvir e fazer",
    ref: "Tiago 1:22—25",
    framework: "expositivo",
    lastSavedAgo: "salvo há 12 segundos",
    blocks: [
      {
        id: "b1",
        type: "Texto Bíblico",
        content:
          "Sede cumpridores da palavra e não somente ouvintes, enganando-vos a vós mesmos. Porque, se alguém é ouvinte da palavra e não cumpridor, é semelhante ao homem que contempla ao espelho o seu rosto natural; porque se contempla a si mesmo, e vai-se, e logo se esquece de como era. Aquele, porém, que atenta bem para a lei perfeita da liberdade, e nisso persevera, não sendo ouvinte esquecido, mas fazedor da obra, este tal será bem-aventurado no seu feito.",
        meta: "Almeida Corrigida Fiel · v. 22—25",
      },
      {
        id: "b2",
        type: "Introdução",
        content:
          "Tiago escreve a uma igreja dispersa, cansada e tentada a confundir frequência ao culto com fidelidade ao Senhor. A imagem que ele escolhe — o espelho — é doméstica, conhecida de todos: olhar e esquecer. Há um modo de ouvir a Palavra que não muda nada.",
      },
      {
        id: "b3",
        type: "Contexto",
        content:
          "A carta de Tiago é, em boa medida, um eco do Sermão do Monte. Em 1:19—21 ele acaba de tratar da prontidão para ouvir e da rejeição de toda imundícia. O verso 22 inicia a aplicação prática: ouvir sem fazer é forma sutil de autoengano.",
      },
      {
        id: "b4",
        type: "Ponto Principal",
        content:
          "A Palavra que apenas ouvimos nos deixa onde estamos. A Palavra na qual perseveramos nos refaz por dentro.",
      },
      {
        id: "b5",
        type: "Subponto",
        content:
          "Tiago usa três verbos sobre o homem do espelho: contempla, vai-se, esquece. O problema não é a curta atenção — é a vida que segue sem alteração.",
      },
      {
        id: "b6",
        type: "Ilustração",
        content:
          "Imagine ler uma carta urgente do médico e dobrá-la sem agir. A informação foi recebida; a vida não respondeu. É o que Tiago descreve de quem ouve a Palavra de domingo e atravessa a semana intocado por ela.",
      },
      {
        id: "b7",
        type: "Aplicação",
        content:
          "Esta semana, anote uma frase do sermão que tocou você. Pergunte: o que esta verdade me pede até quinta-feira? E busque uma pessoa para contar como Deus tem te formado por ela.",
      },
      {
        id: "b8",
        type: "Conclusão",
        content: "",
        placeholder: "Recapitular: ouvir sem fazer adormece; perseverar liberta. Encerrar com bem-aventurança de Tiago…",
      },
      {
        id: "b9",
        type: "Oração",
        content: "",
        placeholder: "Oração breve de comissionamento — pedir vida que escuta e responde.",
      },
      {
        id: "b10",
        type: "Notas pessoais",
        content:
          "Conferir nuance no original: ποιητής λόγου, fazedor da palavra — não apenas alguém que age, mas alguém de quem a Palavra brota como fruto. Possível ponte com Mt 7:24—27.",
      },
    ],
  };

  return { FRAMEWORKS, BLOCK_TYPES, SERMONS, EDITOR_DOC };
})();
