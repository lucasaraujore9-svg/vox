// Pré-injeção do texto bíblico do capítulo na chamada de IA.
//
// O modelo NÃO deve "lembrar" do texto bíblico, ele deve VÊ-LO.
// Buscamos o capítulo via /api/bible (API.Bible) e injetamos como
// contexto. Isso elimina alucinação de versos e ancora a perícope/
// crítica textual/tradução em texto verificável.

import { fetchChapter, BibleApiError } from "@/lib/bible/client";

/**
 * Busca o capítulo numa versão portuguesa de fácil leitura e formata
 * como bloco verso-numerado pra inclusão no prompt.
 *
 * Escolha de versão padrão: 'nvi' por ser uma tradução amplamente
 * usada e textualmente clara. Não é o original (a exegese técnica é
 * dos originais), mas serve como ANCORAGEM REAL pra evitar invenção
 * de versículos.
 */
export async function fetchChapterAsContext(
  bookAbbrev: string,
  chapter: number
): Promise<{ text: string; verseCount: number } | null> {
  // Tenta NVI primeiro; fallback pra ACF (Almeida Corrigida Fiel,
  // mais conservadora e disponível na API).
  const versions = ["nvi", "acf"];
  for (const version of versions) {
    try {
      const data = await fetchChapter(version, bookAbbrev, chapter);
      const lines = data.verses.map(
        (v) => `${v.number}. ${v.text.trim()}`
      );
      return {
        text: lines.join("\n"),
        verseCount: data.verses.length,
      };
    } catch (err) {
      // Continua tentando outra versão; se for outro erro (timeout,
      // 500), também tenta a próxima.
      if (err instanceof BibleApiError && err.status === 404) continue;
      // Erro inesperado: log silencioso, continua tentando.
      continue;
    }
  }
  return null;
}
