// Cliente server-side da API abibliadigital.com.br.
// USAR APENAS em Route Handlers / Server Actions. Versículos são imutáveis →
// cache permanente (1 ano). Erros HTTP encapsulados em BibleApiError.

const DEFAULT_URL = "https://www.abibliadigital.com.br/api";

export interface BibleBook {
  abbrev: { pt: string; en: string };
  author: string;
  chapters: number;
  group: string;
  name: string;
  testament: "VT" | "NT";
}

export interface BibleVerse {
  book: { abbrev: { pt: string; en: string }; name: string; author: string; group: string; version: string };
  chapter: number;
  number: number;
  text: string;
}

export interface BibleChapter {
  book: { abbrev: { pt: string; en: string }; name: string; author: string; group: string; version: string };
  chapter: { number: number; verses: number };
  verses: Array<{ number: number; text: string }>;
}

export interface BibleSearchResult {
  occurrence: number;
  version: string;
  verses: BibleVerse[];
}

export class BibleApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "BibleApiError";
  }
}

function apiBase(): string {
  return process.env.BIBLE_API_URL || DEFAULT_URL;
}

function authHeader(): Record<string, string> {
  const token = process.env.BIBLE_API_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function get<T>(path: string, revalidate: number | false = 31_536_000): Promise<T> {
  const url = `${apiBase()}${path}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...authHeader(),
    },
    next: revalidate === false ? undefined : { revalidate },
  });
  if (!response.ok) {
    throw new BibleApiError(
      response.status,
      `Bible API ${response.status}: ${await response.text().catch(() => "erro desconhecido")}`
    );
  }
  return (await response.json()) as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new BibleApiError(
      response.status,
      `Bible API ${response.status}: ${await response.text().catch(() => "erro desconhecido")}`
    );
  }
  return (await response.json()) as T;
}

/** Lista os 66 livros canônicos. Cache permanente. */
export async function fetchBooks(): Promise<BibleBook[]> {
  return get<BibleBook[]>("/books");
}

/** Detalhe de um livro pela abreviação PT (gn, rm, sl, etc). */
export async function fetchBook(abbrev: string): Promise<BibleBook> {
  return get<BibleBook>(`/books/${abbrev}`);
}

/** Capítulo inteiro. */
export async function fetchChapter(
  version: string,
  abbrev: string,
  chapter: number
): Promise<BibleChapter> {
  return get<BibleChapter>(`/verses/${version}/${abbrev}/${chapter}`);
}

/** Versículo único. */
export async function fetchVerse(
  version: string,
  abbrev: string,
  chapter: number,
  verse: number
): Promise<BibleVerse> {
  return get<BibleVerse>(`/verses/${version}/${abbrev}/${chapter}/${verse}`);
}

/**
 * Intervalo de versículos (ex: Romanos 5:1—11).
 * A API não suporta range direto → busca o capítulo e filtra.
 */
export async function fetchRange(
  version: string,
  abbrev: string,
  chapter: number,
  from: number,
  to: number
): Promise<BibleVerse[]> {
  const chap = await fetchChapter(version, abbrev, chapter);
  const filtered = chap.verses.filter((v) => v.number >= from && v.number <= to);
  return filtered.map((v) => ({
    book: chap.book,
    chapter: chap.chapter.number,
    number: v.number,
    text: v.text,
  }));
}

/** Versículo aleatório de uma versão. */
export async function fetchRandomVerse(version: string): Promise<BibleVerse> {
  // sem cache, random pra cada request
  return get<BibleVerse>(`/verses/${version}/random`, false);
}

/** Busca por palavra. */
export async function searchVerses(
  version: string,
  query: string
): Promise<BibleSearchResult> {
  return post<BibleSearchResult>("/verses/search", { version, search: query });
}
