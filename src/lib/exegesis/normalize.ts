// Normalização de referência bíblica pra chave de cache (book + chapter).
// Reusa o parser existente; descarta versículos (granularidade da exegese é o capítulo).

import { findFirstReference } from "@/lib/bible/parser";
import { BIBLE_BOOKS, type BookInfo } from "@/lib/bible/books";

export interface NormalizedChapter {
  book: BookInfo;
  chapter: number;
  /** Forma canônica curta usada em exibição: "Romanos 5". */
  canonical: string;
}

export type NormalizeError =
  | { ok: false; error: "parse"; message: string }
  | { ok: false; error: "chapter_range"; message: string };

export type NormalizeResult =
  | { ok: true; value: NormalizedChapter }
  | NormalizeError;

/**
 * Normaliza qualquer referência ("Rm 5:1-11", "Romanos 5", "1Co 13", "Sl 119:105")
 * pra { book, chapter }. Versículos são descartados — a exegese é sempre
 * por capítulo completo.
 *
 * Range de capítulos ("Rm 5-6") é rejeitado: o usuário deve gerar exegeses
 * separadas pra cada capítulo.
 */
export function normalizeChapter(input: string): NormalizeResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return {
      ok: false,
      error: "parse",
      message: "Informe um livro e capítulo (ex: Romanos 5).",
    };
  }

  // Detecta range de capítulos antes do parser
  // Padrão: "<livro> <n>-<m>" sem dois-pontos (sem versículo)
  const chapterRange = /^\s*[\dA-Za-zÀ-ú\s.]+?\s+\d+\s*[—–\-]\s*\d+\s*$/u;
  if (chapterRange.test(trimmed) && !trimmed.includes(":") && !trimmed.includes(",")) {
    return {
      ok: false,
      error: "chapter_range",
      message:
        "A exegese é sempre por um único capítulo. Gere exegeses separadas.",
    };
  }

  const ref = findFirstReference(trimmed);
  if (!ref) {
    return {
      ok: false,
      error: "parse",
      message:
        "Não consegui identificar o livro e capítulo. Use o formato Romanos 5 ou Rm 5.",
    };
  }
  if (ref.chapter < 1 || ref.chapter > ref.book.chapters) {
    return {
      ok: false,
      error: "parse",
      message: `${ref.book.name} tem ${ref.book.chapters} capítulos. Você pediu o ${ref.chapter}.`,
    };
  }

  return {
    ok: true,
    value: {
      book: ref.book,
      chapter: ref.chapter,
      canonical: `${ref.book.name} ${ref.chapter}`,
    },
  };
}

/** Catálogo público dos 66 livros (re-export pra evitar import direto). */
export const BIBLE_BOOK_LIST = BIBLE_BOOKS;
