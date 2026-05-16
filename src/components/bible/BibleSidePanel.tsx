"use client";

// Painel lateral da Bíblia para consulta enquanto se escreve um sermão.
// Sheet à direita — não bloqueia o foco do editor.
//
// Funcionalidades:
//   - Busca por referência (Romanos 5:1—11) ou palavra
//   - Lê capítulo inteiro ou versículos
//   - Botão "copiar" pra área de transferência
//   - Histórico das últimas 10 consultas (localStorage)
//   - Atalho ⌘⇧B / Ctrl+Shift+B

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookMarked, Clock, Copy, Search } from "lucide-react";
import { toast } from "sonner";
import { findFirstReference } from "@/lib/bible/parser";
import {
  BIBLE_VERSIONS,
  DEFAULT_VERSION,
  type BibleVersionId,
} from "@/lib/bible/versions";

const HISTORY_KEY = "vox.bible.history";
const MAX_HISTORY = 10;
const DEBOUNCE_MS = 350;
const MIN_SEARCH = 3;

interface Verse {
  number: number;
  text: string;
}

interface RefData {
  canonical: string;
  version: string;
  verses: Verse[];
}

interface SearchVerse {
  book: { abbrev: { pt: string }; name: string };
  chapter: number;
  number: number;
  text: string;
}
interface SearchResult {
  occurrence: number;
  version: string;
  verses: SearchVerse[];
}

interface BibleSidePanelProps {
  trigger?: React.ReactNode;
  defaultReference?: string;
}

export function BibleSidePanel({ trigger, defaultReference }: BibleSidePanelProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(defaultReference ?? "");
  const [debounced, setDebounced] = useState(defaultReference ?? "");
  const [version, setVersion] = useState<BibleVersionId>(DEFAULT_VERSION);
  const [refData, setRefData] = useState<RefData | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const lastQueryRef = useRef("");

  // Atalho de teclado ⌘⇧B
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key.toLowerCase() === "b" &&
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey
      ) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Carrega histórico do localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      // ignora
    }
  }, []);

  function saveHistory(ref: string) {
    setHistory((prev) => {
      const next = [ref, ...prev.filter((r) => r !== ref)].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // ignora
      }
      return next;
    });
  }

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // Busca / referência
  useEffect(() => {
    if (!debounced.trim()) {
      setRefData(null);
      setSearchResults(null);
      return;
    }
    const cacheKey = `${version}|${debounced}`;
    if (cacheKey === lastQueryRef.current) return;
    lastQueryRef.current = cacheKey;

    const parsedRef = findFirstReference(debounced);
    const controller = new AbortController();
    setLoading(true);

    if (parsedRef) {
      // Busca a referência
      fetch(
        `/api/bible?version=${version}&reference=${encodeURIComponent(
          parsedRef.canonical
        )}`,
        { signal: controller.signal }
      )
        .then((r) => (r.ok ? r.json() : Promise.reject(r)))
        .then((data: RefData) => {
          setRefData(data);
          setSearchResults(null);
          saveHistory(parsedRef.canonical);
        })
        .catch(() => {
          if (!controller.signal.aborted) setRefData(null);
        })
        .finally(() => setLoading(false));
    } else if (debounced.length >= MIN_SEARCH) {
      // Busca por palavra
      fetch(
        `/api/bible/search?version=${version}&q=${encodeURIComponent(debounced)}`,
        { signal: controller.signal }
      )
        .then((r) => (r.ok ? r.json() : Promise.reject(r)))
        .then((data: SearchResult) => {
          setSearchResults(data);
          setRefData(null);
        })
        .catch(() => {
          if (!controller.signal.aborted) setSearchResults(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    return () => controller.abort();
  }, [debounced, version]);

  const copy = useCallback((text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${label} copiado`))
      .catch(() => toast.error("Não consegui copiar"));
  }, []);

  function copyAll() {
    if (!refData) return;
    const text =
      refData.verses.map((v) => `${v.number}. ${v.text}`).join(" ") +
      ` — ${refData.canonical}`;
    copy(text, refData.canonical);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" aria-label="Abrir Bíblia">
            <BookMarked className="size-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Bíblia</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
        style={{ background: "var(--vox-surface-elev)" }}
      >
        <SheetHeader className="px-5 pt-5 pb-3 shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <BookMarked className="size-4" style={{ color: "var(--vox-gold)" }} />
            Consulta bíblica
          </SheetTitle>
        </SheetHeader>

        <div className="px-5 pb-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-vox-muted" />
            <Input
              autoFocus
              placeholder="Romanos 5:1—11 · graça · paz…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="vox-mono text-vox-muted mr-1">Versão:</span>
            {BIBLE_VERSIONS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVersion(v.id)}
                className="px-2 py-0.5 rounded-full vox-mono transition-colors"
                style={{
                  background: v.id === version ? "var(--vox-forest)" : "transparent",
                  color: v.id === version ? "#fff" : "var(--vox-prose)",
                  border:
                    v.id === version
                      ? "1px solid var(--vox-forest)"
                      : "1px solid var(--vox-whisper)",
                }}
              >
                {v.abbreviation}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {loading ? (
            <p className="text-sm text-vox-muted italic">Buscando…</p>
          ) : null}

          {!loading && refData ? (
            <article className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="vox-ref">{refData.canonical}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAll}
                  className="text-xs px-2"
                >
                  <Copy className="size-3.5 mr-1.5" />
                  Copiar todos
                </Button>
              </div>
              <div className="space-y-2">
                {refData.verses.map((v) => (
                  <div
                    key={v.number}
                    className="flex gap-2 group"
                    style={{
                      paddingLeft: 6,
                      borderLeft: "2px solid var(--vox-gold)",
                    }}
                  >
                    <span className="vox-mono text-vox-muted text-xs shrink-0 pt-1">
                      {v.number}
                    </span>
                    <p className="vox-scripture text-sm flex-1">{v.text}</p>
                    <button
                      type="button"
                      onClick={() =>
                        copy(
                          `${v.text} — ${refData.canonical.split(":")[0]} ${
                            v.number
                          }`,
                          `v.${v.number}`
                        )
                      }
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-vox-muted hover:text-vox-ink"
                      aria-label={`Copiar versículo ${v.number}`}
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="vox-mono text-xs text-vox-muted uppercase pt-2">
                {refData.version}
              </p>
            </article>
          ) : null}

          {!loading && searchResults && searchResults.occurrence > 0 ? (
            <article>
              <p className="vox-eyebrow mb-3">
                {searchResults.occurrence} ocorrência
                {searchResults.occurrence > 1 ? "s" : ""}
              </p>
              <ul className="space-y-2">
                {searchResults.verses.slice(0, 30).map((v, idx) => (
                  <li
                    key={`${v.book.abbrev.pt}-${v.chapter}-${v.number}-${idx}`}
                    className="text-sm group"
                  >
                    <button
                      type="button"
                      onClick={() => setQuery(`${v.book.name} ${v.chapter}:${v.number}`)}
                      className="text-left w-full"
                    >
                      <span className="vox-mono text-vox-gold text-xs">
                        {v.book.name} {v.chapter}:{v.number}
                      </span>
                      <p className="mt-0.5 line-clamp-2 text-vox-ink hover:text-vox-forest transition-colors">
                        {v.text}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
              {searchResults.verses.length > 30 ? (
                <p className="vox-mono text-xs text-vox-muted mt-3">
                  Mostrando 30 de {searchResults.occurrence}.
                </p>
              ) : null}
            </article>
          ) : null}

          {!loading && !refData && !searchResults && debounced.trim() ? (
            <p className="text-sm text-vox-muted italic">
              Nada encontrado. Tente uma referência (ex: João 3:16) ou outra palavra.
            </p>
          ) : null}

          {!debounced.trim() ? (
            <div className="space-y-4">
              {history.length > 0 ? (
                <section>
                  <p className="vox-eyebrow mb-2 flex items-center gap-1.5">
                    <Clock className="size-3" />
                    Recentes
                  </p>
                  <ul className="space-y-1">
                    {history.map((ref) => (
                      <li key={ref}>
                        <button
                          type="button"
                          onClick={() => setQuery(ref)}
                          className="text-sm vox-mono text-vox-prose hover:text-vox-forest transition-colors"
                        >
                          {ref}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              <section>
                <p className="vox-eyebrow mb-2">Sugestões</p>
                <ul className="space-y-1">
                  {["João 3:16", "Romanos 5:1—11", "Salmo 23", "1 Coríntios 13:4-7"].map(
                    (s) => (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => setQuery(s)}
                          className="text-sm vox-mono text-vox-prose hover:text-vox-forest transition-colors"
                        >
                          {s}
                        </button>
                      </li>
                    )
                  )}
                </ul>
              </section>
              <p className="text-xs text-vox-muted">
                Atalho:{" "}
                <kbd
                  className="vox-mono inline-flex items-center px-1.5 py-0.5 rounded border text-[10px]"
                  style={{ borderColor: "var(--vox-whisper)" }}
                >
                  ⌘⇧B
                </kbd>
              </p>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
