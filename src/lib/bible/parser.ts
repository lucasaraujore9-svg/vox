// Parser de referências bíblicas em português.
// Aceita: "Romanos 5:1", "Rom 5:1", "1 Co 13:4", "1Co 13:4-7", "Sl 23",
// "Salmo 119:105", "Romanos 5:1—11" (em-dash), "Rom 5,1" (vírgula latina).

import { BIBLE_BOOK_INDEX, type BookInfo } from "./books";

export interface ParsedReference {
  book: BookInfo;
  chapter: number;
  /** undefined = livro/capítulo inteiro */
  verseStart?: number;
  verseEnd?: number;
  /** Trecho original do texto que casou */
  raw: string;
  /** Posição [start, end] dentro do texto original */
  start: number;
  end: number;
  /** Forma canônica curta (ex: "Romanos 5:1—11") */
  canonical: string;
}

// Em-dash, en-dash, hífen e travessão pra range.
// NÃO inclui vírgula — vírgula já é separador de capítulo/versículo em
// CV_SEP (ex: "Rom 5,1" = "Rom 5:1"). Incluí-la aqui produziria parsing
// ambíguo: "Rom 5:1,11" viraria range em vez de v.1 + v.11.
const RANGE_SEP = /[—–−\-]/;
// Dois-pontos ou vírgula latina entre capítulo e versículo
const CV_SEP = "[:,.]";

/**
 * Encontra todas as referências bíblicas num texto.
 * Performance: o regex é construído UMA vez a partir da lista de livros.
 */
let CACHED_REGEX: RegExp | null = null;
function buildRegex(): RegExp {
  if (CACHED_REGEX) return CACHED_REGEX;
  // Junta todas as variações de nome em uma alternância gigante.
  // Ordena por comprimento DESC pra "1 Coríntios" casar antes de "Coríntios".
  const variants = Object.keys(BIBLE_BOOK_INDEX)
    .sort((a, b) => b.length - a.length)
    .map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const booksPattern = `(?:${variants.join("|")})`;
  // Padrão completo: <livro> <cap>[:vs[-vsEnd]]
  // \b no início, opcional espaço após número (ex "1Co" ou "1 Co")
  const pattern = new RegExp(
    `\\b(${booksPattern})\\.?\\s*(\\d{1,3})(?:\\s*${CV_SEP}\\s*(\\d{1,3})(?:\\s*${RANGE_SEP.source}\\s*(\\d{1,3}))?)?\\b`,
    "giu"
  );
  CACHED_REGEX = pattern;
  return pattern;
}

export function findReferences(text: string): ParsedReference[] {
  const regex = buildRegex();
  const out: ParsedReference[] = [];
  let match: RegExpExecArray | null;
  // Reset state
  regex.lastIndex = 0;
  while ((match = regex.exec(text)) !== null) {
    const [raw, bookName, chapterStr, verseStartStr, verseEndStr] = match;
    if (!bookName) continue;
    const normalized = bookName.toLowerCase().replace(/\./g, "").trim();
    const book = BIBLE_BOOK_INDEX[normalized];
    if (!book) continue;
    const chapter = parseInt(chapterStr ?? "0", 10);
    if (chapter < 1 || chapter > book.chapters) continue;
    const verseStart = verseStartStr ? parseInt(verseStartStr, 10) : undefined;
    const verseEnd = verseEndStr ? parseInt(verseEndStr, 10) : undefined;
    out.push({
      book,
      chapter,
      verseStart,
      verseEnd,
      raw,
      start: match.index,
      end: match.index + raw.length,
      canonical: formatCanonical(book.name, chapter, verseStart, verseEnd),
    });
  }
  return out;
}

/** Acha a primeira referência. Útil pra parse de input do usuário. */
export function findFirstReference(text: string): ParsedReference | null {
  const refs = findReferences(text);
  return refs[0] ?? null;
}

/**
 * Formata uma referência na convenção VOX:
 * - Em-dash longo (—) pra intervalo
 * - Dois-pontos depois do capítulo
 * - Ex: "Romanos 5:1—11"
 */
export function formatCanonical(
  bookName: string,
  chapter: number,
  verseStart?: number,
  verseEnd?: number
): string {
  if (!verseStart) return `${bookName} ${chapter}`;
  if (!verseEnd || verseEnd === verseStart) return `${bookName} ${chapter}:${verseStart}`;
  return `${bookName} ${chapter}:${verseStart}—${verseEnd}`;
}
