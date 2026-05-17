#!/usr/bin/env node
// Carrega a versão revisada do sermão "Alinhamento com o Propósito de Deus"
// (Eclesiastes 3:1,11) na linha existente do Supabase.
//
// Uso:
//   node scripts/load-alinhamento.mjs                  # busca por título
//   node scripts/load-alinhamento.mjs <sermon-id>      # força um id específico
//
// Dependências: lê .env.local (NEXT_PUBLIC_SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY) e usa @supabase/supabase-js já instalado.

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

function loadEnvLocal() {
  const here = dirname(fileURLToPath(import.meta.url));
  const envPath = join(here, "..", ".env.local");
  const raw = readFileSync(envPath, "utf8");
  const out = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const env = loadEnvLocal();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em .env.local"
  );
  process.exit(1);
}

const TITLE = "Alinhamento com o Propósito de Deus";

// Helpers ---------------------------------------------------------------
const p = (s) => `<p>${s}</p>`;
function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function scripture(ref, text) {
  return (
    p(`<em>${escapeHtml(text)}</em>`) +
    p(`<strong>${escapeHtml(ref)}</strong>`)
  );
}
function item(type, content, label) {
  return {
    id: randomUUID(),
    type,
    content,
    order: 0, // será reindexado abaixo
    ...(label ? { label } : {}),
  };
}
function session(title, role, items) {
  return {
    id: randomUUID(),
    title,
    role,
    order: 0,
    items: items.map((it, idx) => ({ ...it, order: idx + 1 })),
  };
}

// Conteúdo do sermão -----------------------------------------------------
const sessions = [
  session("Introdução", "introducao", [
    item(
      "texto_biblico",
      scripture(
        "Eclesiastes 3:1",
        "Tudo tem o seu tempo determinado, e há tempo para todo o propósito debaixo do céu."
      ) +
        scripture(
          "Eclesiastes 3:11",
          "Tudo fez formoso em seu tempo; também pôs o mundo no coração do homem, sem que este possa descobrir a obra que Deus fez desde o princípio até ao fim."
        ),
      "Texto base"
    ),
    item(
      "introducao",
      p(
        "Existe uma diferença enorme entre estar cansado e estar fora de tempo. Muitas vezes, achamos que nossas forças se esgotaram porque a vida ficou pesada, quando, na verdade, o que se esgotou foi a estação. Deus já virou a página, mas continuamos relendo o capítulo anterior. Ele já mudou a paisagem, mas continuamos olhando pelo retrovisor."
      ),
      "Contexto"
    ),
    item(
      "pergunta_retorica",
      p(
        "Será que estamos cansados porque Deus mudou a nossa estação, ou porque estamos insistindo em carregar as malas de um tempo que já passou?"
      ),
      "Pergunta retórica"
    ),
    item(
      "ponto_principal",
      p(
        "Uma nova estação exige realinhamento. Exige mudança de direção. Nem tudo o que foi bom antes permanece bom para o agora. Deus é o Senhor dos tempos, e o alinhamento com Ele é o que nos move do desgaste para o propósito, do esforço para a graça, da repetição para a renovação."
      ) +
        p(
          "Esta manhã, quero compartilhar três tempos de Deus para a nossa vida: o tempo de nos refazer, o tempo de receber e o tempo de Deus."
        ),
      "Ideia central"
    ),
  ]),

  session("O tempo de nos refazer", "topico", [
    item(
      "texto_biblico",
      scripture(
        "Lucas 5:36—38",
        "Ninguém tira um remendo de roupa nova e o costura em roupa velha; se o fizer, estragará a roupa nova, além do que o remendo da nova não se ajustará à velha. E ninguém põe vinho novo em vasilha de couro velha; se o fizer, o vinho novo rebentará a vasilha, se derramará, e a vasilha se estragará. Ao contrário, vinho novo deve ser posto em vasilha de couro nova."
      ),
      "Texto bíblico"
    ),
    item(
      "desenvolvimento",
      p(
        "Às vezes queremos viver o novo de Deus mantendo o velho de nós mesmos. Queremos colher o fruto da promessa, mas com o mesmo coração, a mesma mente, os mesmos hábitos, as mesmas companhias e a mesma forma de pensar do tempo anterior. Jesus, com uma ilustração simples, nos ensina que isto é impossível. O novo de Deus exige um odre novo."
      ) +
        p(
          "Tudo o que vivemos foi importante. O ruim nos ensinou, talvez até mais do que o bom. As marcas e as dores que carregamos serão, um dia, respostas para outras pessoas. Porém, é impossível viver o novo de Deus sem antes sermos transformados. A transformação que Deus opera em nós é a preparação para o novo. Ele nos tira da condição de odre velho — duro, ressecado, marcado pelo tempo — e nos restaura como vasilha nova, capaz de receber o vinho novo sem se romper."
        ) +
        p(
          "O passado não pode ser mudado, mas pode ser entregue. Deus tem marcado o fim de um tempo de choro, de tristeza, de infelicidade. Talvez esse tempo tenha sido necessário — refinador, formador, lapidador — mas agora chegou um novo tempo. O tempo da tristeza passou. Um vinho novo te espera."
        ),
      "Desenvolvimento"
    ),
    item(
      "aplicacao",
      p(
        "Entregue ao Senhor o seu passado. Libere perdão — inclusive a si mesmo. Renuncie aos vícios de pensamento, às identidades antigas, às narrativas de derrota que você ensaiou por anos. Deixe o Senhor derramar um vinho novo sobre a sua vida."
      ),
      "Aplicação"
    ),
    item(
      "transicao",
      p(
        "Mas o vinho novo só é plenamente derramado onde há com quem compartilhar. E isso nos leva ao segundo tempo."
      ),
      "Transição"
    ),
  ]),

  session("O tempo de receber", "topico", [
    item(
      "desenvolvimento",
      p(
        "Deus nos criou para viver em unidade e em comunidade. Todo grande derramar do Senhor acontece quando um grupo de pessoas está reunido em comunhão. No Pentecostes, foi assim — estavam todos juntos no mesmo lugar. Em Atos 2, foi assim — perseveravam unânimes no templo. Eclesiastes 3 lista tempos para tudo: para nascer e para morrer, para plantar e para colher, para chorar e para rir, para abraçar e para se afastar — mas em nenhum momento o sábio menciona “tempo de estar sozinho”, porque o isolamento nunca foi o plano de Deus para o ser humano."
      ),
      "Desenvolvimento"
    ),
    item(
      "texto_biblico",
      scripture(
        "Salmos 133",
        "Oh! quão bom e quão suave é que os irmãos vivam em união. É como o óleo precioso sobre a cabeça, que desce sobre a barba, a barba de Arão, e que desce à orla das suas vestes. Como o orvalho de Hermom, e como o que desce sobre os montes de Sião, porque ali o Senhor ordena a bênção e a vida para sempre."
      ),
      "Texto bíblico"
    ),
    item(
      "ponto_principal",
      p(
        "Atente para a palavra “ali”. O Senhor ordena a bênção ali — onde há comunhão. Onde a unidade está quebrada, a bênção fica retida. Onde os relacionamentos foram destruídos, a nova estação não consegue chegar. O óleo precioso desce, mas não encontra cabeça para ungir; o orvalho desce, mas não encontra solo unido para fertilizar. A bênção de Deus não é apenas pessoal; ela é também relacional."
      ),
      "Ponto principal"
    ),
    item(
      "pergunta_retorica",
      p(
        "O que tem te prendido no passado? Falta de perdão? Traumas? Palavras malditas ditas sobre você ou ditas por você? Ofensas guardadas? Ausências que doeram?"
      ) +
        p(
          "O tempo de chorar já passou. O tempo de sofrer já se foi. Agora é hora de viver uma nova estação em comunhão — com a sua família, com os seus irmãos, com o povo de Deus."
        ),
      "Pergunta retórica"
    ),
    item(
      "aplicacao",
      p(
        "Perdoe quem precisa ser perdoado. Procure quem você ofendeu. Refaça os laços que o diabo quebrou para te prender ao passado. Restaure altares de relacionamento. Onde o inimigo dividiu, o Senhor quer ordenar a bênção."
      ),
      "Aplicação"
    ),
    item(
      "transicao",
      p(
        "E quando nos refazemos por dentro e nos reconectamos por fora, somos finalmente conduzidos ao lugar mais importante de todos: o tempo de Deus."
      ),
      "Transição"
    ),
  ]),

  session("O tempo de Deus", "topico", [
    item(
      "texto_biblico",
      scripture(
        "Eclesiastes 3:11",
        "Tudo fez formoso em seu tempo; também pôs o mundo no coração do homem, sem que este possa descobrir a obra que Deus fez desde o princípio até ao fim."
      ),
      "Texto bíblico"
    ),
    item(
      "desenvolvimento",
      p(
        "Viver o tempo de Deus não é ter o que queremos quando queremos. Não é uma vida sem problemas, sem deserto, sem dor. Viver o tempo de Deus é entregar a Ele a nossa vida — não pensando apenas em salvação, mas em controle. É render o leme. É confessar, com sinceridade, que Ele sabe mais do que eu, vê mais longe do que eu e ama mais do que eu sou capaz de amar a mim mesmo."
      ) +
        p(
          "Viver o tempo de Deus depende de confiança. É entender que, ainda que eu não saiba o porquê de ter vivido o que vivi, ou o porquê de estar passando pelo que estou passando agora, eu sei que Deus está no controle e que foi Ele quem me conduziu até aqui. Isso fica explícito em Mateus 4."
        ),
      "Desenvolvimento"
    ),
    item(
      "texto_biblico",
      scripture(
        "Mateus 4:1",
        "Então foi conduzido Jesus pelo Espírito ao deserto, para ser tentado pelo diabo."
      ),
      "Texto bíblico"
    ),
    item(
      "ponto_principal",
      p(
        "Observe a beleza e o paradoxo deste verso. Foi o próprio Espírito Santo quem conduziu Jesus ao deserto. O Filho amado, sobre quem o Pai acabara de declarar — no capítulo anterior — “este é o meu Filho amado, em quem me comprazo”, foi levado pelo Espírito não para um trono, mas para um deserto. Não para um banquete, mas para um jejum de quarenta dias. Não para o conforto, mas para o confronto com o diabo."
      ) +
        p(
          "Por quê? Porque o tempo de Deus não é apenas o tempo dos momentos bons. O tempo de Deus é o tempo em que estamos com Ele — em todos os momentos. No deserto e na fartura. No silêncio e na resposta. No vale e no monte. O mesmo Espírito que te conduz ao deserto é o que te sustenta no deserto e o que te tira dele no tempo certo. O deserto, quando é deserto de Deus, não é castigo: é preparação."
        ) +
        p(
          "Quem vive o tempo de Deus para de medir a sua vida pela ausência ou presença de problemas e passa a medi-la pela presença de Deus em meio a tudo. Esta é a maturidade espiritual: confiar mais no Condutor do que no caminho."
        ),
      "Ponto principal"
    ),
    item(
      "aplicacao",
      p(
        "Entregue o controle. Pare de exigir do céu o roteiro que você escreveu e abrace o roteiro que Deus está escrevendo. Confie no Condutor mesmo quando o caminho passar pelo deserto. Lá também há propósito. Lá também há formação. Lá também há Deus."
      ),
      "Aplicação"
    ),
  ]),

  session("Conclusão", "conclusao", [
    item(
      "conclusao",
      p("Igreja, Deus está nos chamando hoje para um realinhamento.") +
        p(
          "Há um tempo de nos refazer — de nos tornarmos odres novos para receber o vinho novo que o Senhor quer derramar."
        ) +
        p(
          "Há um tempo de receber — de restaurar relacionamentos, de viver em comunhão e de nos posicionarmos no lugar onde o Senhor ordena a bênção."
        ) +
        p(
          "E há o tempo de Deus — o tempo em que entregamos o controle, confiamos no Condutor e descobrimos que a Sua presença é mais preciosa do que a ausência de problemas."
        ) +
        p(
          "Tudo tem o seu tempo determinado. Tudo Ele fez formoso em seu tempo. Inclusive o seu tempo. Inclusive a sua história. Inclusive o capítulo que você está vivendo agora."
        ),
      "Recapitulação"
    ),
    item(
      "pergunta_retorica",
      p(
        "Você vai continuar carregando as malas do tempo que já passou, ou vai permitir que o Senhor te alinhe com o tempo que Ele está iniciando?"
      ),
      "Pergunta de fechamento"
    ),
    item(
      "aplicacao",
      p("Quero convidar a igreja, neste momento, a responder ao Senhor:") +
        p(
          "Se hoje você precisa entregar o seu passado a Deus e receber o vinho novo, levante a sua mão."
        ) +
        p(
          "Se hoje você precisa restaurar um relacionamento, dar um passo de perdão, refazer um laço, levante a sua mão."
        ) +
        p(
          "Se hoje você precisa entregar o controle da sua vida ao Senhor e dizer “eu confio em Ti mesmo quando não entendo”, levante a sua mão."
        ),
      "Chamada à decisão"
    ),
    item(
      "oracao",
      p(
        "Senhor, hoje nos colocamos diante de Ti. Reconhecemos que muitas vezes resistimos à mudança de estação que Tu trouxeste para as nossas vidas. Perdoa-nos por insistir em carregar o que Tu já mandaste deixar. Faz de nós odres novos. Restaura os nossos laços. Toma o controle da nossa caminhada. Que a nossa vida esteja alinhada com o Teu propósito, no Teu tempo, debaixo da Tua mão. Em nome de Jesus, amém."
      ),
      "Oração final"
    ),
    item(
      "texto_biblico",
      scripture(
        "1 Pedro 5:10",
        "E o Deus de toda a graça, que em Cristo Jesus vos chamou à sua eterna glória, depois de haverdes padecido um pouco, ele mesmo vos aperfeiçoará, confirmará, fortificará e fundamentará."
      ),
      "Texto de bênção"
    ),
  ]),
];

// Reindexa order das sessões
const content = {
  sessions: sessions.map((s, idx) => ({ ...s, order: idx + 1 })),
};

// Calcula word_count aproximado (tira HTML)
function stripHtml(html) {
  return html.replace(/<[^>]+>/g, " ");
}
let wordCount = 0;
for (const s of content.sessions) {
  wordCount += s.title.split(/\s+/).filter(Boolean).length;
  for (const it of s.items) {
    wordCount += stripHtml(it.content).split(/\s+/).filter(Boolean).length;
  }
}

// Update -----------------------------------------------------------------
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let sermonId = process.argv[2];
if (!sermonId) {
  // Busca por título — pega o mais recente caso haja duplicatas.
  const { data, error } = await supabase
    .from("sermons")
    .select("id, title, user_id, updated_at")
    .eq("title", TITLE)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(5);
  if (error) {
    console.error("Erro buscando sermão:", error.message);
    process.exit(1);
  }
  if (!data || data.length === 0) {
    console.error(`Nenhum sermão encontrado com título "${TITLE}".`);
    console.error("Passe o id como argumento: node scripts/load-alinhamento.mjs <id>");
    process.exit(1);
  }
  if (data.length > 1) {
    console.log("Múltiplos sermões com esse título:");
    for (const row of data) console.log(`  ${row.id}  (updated_at ${row.updated_at})`);
    console.log(`Usando o mais recente: ${data[0].id}`);
  }
  sermonId = data[0].id;
}

console.log("Atualizando sermão", sermonId);
const { error: updErr } = await supabase
  .from("sermons")
  .update({
    title: TITLE,
    framework: "tematico",
    bible_ref: "Eclesiastes 3:1,11",
    bible_book: "Eclesiastes",
    content,
    word_count: wordCount,
  })
  .eq("id", sermonId);

if (updErr) {
  console.error("Falha no UPDATE:", updErr.message);
  process.exit(1);
}

console.log(`OK — ${content.sessions.length} sessões, ${wordCount} palavras.`);
