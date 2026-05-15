// Leitor bíblico reformulado.
// Layout: rail compacto com livros + main centralizado com versículos em prose
// generoso + ação por versículo no hover + nav prev/next destacada.

import Link from "next/link";
import { fetchChapter } from "@/lib/bible/client";
import { BIBLE_BOOKS, findBookByAbbrev, type BookInfo } from "@/lib/bible/books";
import {
  BIBLE_VERSIONS,
  DEFAULT_VERSION,
  type BibleVersionId,
} from "@/lib/bible/versions";
import { BibleChapterNav } from "@/components/bible/BibleChapterNav";
import { BibleVerseLine } from "@/components/bible/BibleVerseLine";

export const metadata = { title: "Bíblia" };

interface PageProps {
  searchParams: Promise<{
    book?: string;
    chapter?: string;
    version?: string;
  }>;
}

export default async function BiblePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const bookAbbrev = params.book ?? "jo";
  const chapterNum = Math.max(1, parseInt(params.chapter ?? "1", 10) || 1);
  const versionId = (params.version as BibleVersionId) ?? DEFAULT_VERSION;

  const book = findBookByAbbrev(bookAbbrev) ?? findBookByAbbrev("jo")!;
  const safeChapter = Math.min(chapterNum, book.chapters);
  const versionMeta = BIBLE_VERSIONS.find((v) => v.id === versionId);

  let chapter;
  let error: string | null = null;
  try {
    chapter = await fetchChapter(versionId, book.abbrev, safeChapter);
  } catch (err) {
    error = err instanceof Error ? err.message : "Erro ao buscar capítulo";
  }

  return (
    <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] gap-10 max-w-7xl">
      {/* Rail compacto */}
      <aside className="space-y-6 self-start lg:sticky lg:top-4">
        <header>
          <p className="vox-eyebrow text-xs">Leitura</p>
          <h1
            className="vox-h2 mt-2"
            style={{ fontSize: "var(--vox-text-2xl)" }}
          >
            Bíblia
          </h1>
        </header>

        <div className="space-y-2">
          <p className="vox-eyebrow text-[10px]">Versão</p>
          <div className="flex flex-wrap gap-1.5">
            {BIBLE_VERSIONS.map((v) => (
              <Link
                key={v.id}
                href={`/bible?book=${book.abbrev}&chapter=${safeChapter}&version=${v.id}`}
                className="px-2 py-0.5 rounded-full text-[11px] vox-mono transition-colors"
                style={{
                  background:
                    v.id === versionId ? "var(--vox-forest)" : "transparent",
                  color: v.id === versionId ? "#fff" : "var(--vox-prose)",
                  border:
                    v.id === versionId
                      ? "1px solid var(--vox-forest)"
                      : "1px solid var(--vox-whisper)",
                }}
              >
                {v.abbreviation}
              </Link>
            ))}
          </div>
        </div>

        <BookRail current={book.abbrev} version={versionId} />
      </aside>

      {/* Capítulo */}
      <main className="min-w-0">
        <header className="flex items-end justify-between gap-4 mb-8 flex-wrap pb-6 border-b border-border">
          <div>
            <p
              className="vox-eyebrow"
              style={{
                color:
                  book.testament === "VT"
                    ? "var(--vox-gold)"
                    : "var(--vox-forest)",
              }}
            >
              {book.testament === "VT" ? "Antigo Testamento" : "Novo Testamento"}{" "}
              · {book.name}
            </p>
            <h2
              className="vox-h1 mt-2"
              style={{
                fontSize: "clamp(36px, 4vw, 48px)",
                letterSpacing: "-0.015em",
              }}
            >
              Capítulo {safeChapter}
            </h2>
            {versionMeta ? (
              <p className="vox-mono text-xs text-vox-muted mt-3">
                {versionMeta.name}
                {versionMeta.note ? ` · ${versionMeta.note}` : ""}
              </p>
            ) : null}
          </div>
          <BibleChapterNav
            book={book}
            current={safeChapter}
            version={versionId}
          />
        </header>

        {error ? (
          <div
            className="rounded-lg p-5 text-sm"
            style={{
              background: "rgba(225,29,72,0.08)",
              border: "1px solid rgba(225,29,72,0.2)",
              color: "var(--vox-destructive)",
            }}
          >
            {error}
          </div>
        ) : chapter ? (
          <article className="max-w-2xl space-y-0.5">
            {chapter.verses.map((v) => (
              <BibleVerseLine
                key={v.number}
                bookAbbrev={book.abbrev}
                bookName={book.name}
                chapter={chapter.chapter.number}
                number={v.number}
                text={v.text}
              />
            ))}
          </article>
        ) : null}

        {chapter ? (
          <footer className="mt-12 pt-6 border-t border-border grid grid-cols-2 gap-4">
            {safeChapter > 1 ? (
              <Link
                href={`/bible?book=${book.abbrev}&chapter=${safeChapter - 1}&version=${versionId}`}
                className="group rounded-lg p-4 transition-colors hover:bg-accent/40"
                style={{ border: "1px solid var(--vox-whisper)" }}
              >
                <p className="vox-mono text-xs text-vox-muted">← Anterior</p>
                <p className="vox-h3 mt-1.5 text-base group-hover:text-vox-forest">
                  {book.name} {safeChapter - 1}
                </p>
              </Link>
            ) : (
              <span />
            )}
            {safeChapter < book.chapters ? (
              <Link
                href={`/bible?book=${book.abbrev}&chapter=${safeChapter + 1}&version=${versionId}`}
                className="group rounded-lg p-4 text-right transition-colors hover:bg-accent/40"
                style={{ border: "1px solid var(--vox-whisper)" }}
              >
                <p className="vox-mono text-xs text-vox-muted">Próximo →</p>
                <p className="vox-h3 mt-1.5 text-base group-hover:text-vox-forest">
                  {book.name} {safeChapter + 1}
                </p>
              </Link>
            ) : (
              <span />
            )}
          </footer>
        ) : null}
      </main>
    </div>
  );
}

function BookRail({
  current,
  version,
}: {
  current: string;
  version: BibleVersionId;
}) {
  const vt = BIBLE_BOOKS.filter((b) => b.testament === "VT");
  const nt = BIBLE_BOOKS.filter((b) => b.testament === "NT");
  return (
    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      <BookGroup
        label="Antigo Testamento"
        books={vt}
        current={current}
        version={version}
      />
      <BookGroup
        label="Novo Testamento"
        books={nt}
        current={current}
        version={version}
      />
    </div>
  );
}

function BookGroup({
  label,
  books,
  current,
  version,
}: {
  label: string;
  books: BookInfo[];
  current: string;
  version: BibleVersionId;
}) {
  return (
    <section>
      <p className="vox-mono text-[10px] text-vox-muted mb-2 uppercase tracking-wider">
        {label}
      </p>
      <div className="grid grid-cols-1 gap-0.5">
        {books.map((b) => {
          const active = b.abbrev === current;
          return (
            <Link
              key={b.abbrev}
              href={`/bible?book=${b.abbrev}&chapter=1&version=${version}`}
              className="block px-2 py-1 rounded-md text-xs transition-colors flex items-center justify-between"
              style={{
                background: active ? "var(--vox-forest-soft)" : "transparent",
                color: active ? "var(--vox-forest)" : "var(--vox-prose)",
                fontWeight: active ? 500 : 400,
              }}
            >
              <span className="truncate">{b.name}</span>
              <span className="vox-mono text-vox-muted text-[10px] shrink-0">
                {b.chapters}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
