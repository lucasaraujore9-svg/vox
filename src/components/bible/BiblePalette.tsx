"use client";

// Cmd+Shift+B (Ctrl+Shift+B no Windows/Linux) abre uma palette de busca bíblica
// global. Cmd+B continua sendo "negrito" no editor TipTap.
// Detecta automaticamente se você digitou uma REFERÊNCIA (vai pra fetch direto)
// ou uma PALAVRA (vai pro endpoint de busca textual).

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useBibleReference } from "@/hooks/useBibleReference";
import { findFirstReference } from "@/lib/bible/parser";
import { DEFAULT_VERSION, type BibleVersionId, BIBLE_VERSIONS } from "@/lib/bible/versions";
import { useRouter } from "next/navigation";

const DEBOUNCE_MS = 300;
const MIN_SEARCH = 3;

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

export function BiblePalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [version, setVersion] = useState<BibleVersionId>(DEFAULT_VERSION);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const router = useRouter();
  const lastSearchRef = useRef<string>("");

  // Atalho Cmd+Shift+B / Ctrl+Shift+B — Shift evita conflito com o "negrito"
  // do TipTap (⌘B) dentro do editor de sermão.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key.toLowerCase() === "b" &&
        e.shiftKey &&
        (e.metaKey || e.ctrlKey)
      ) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounce do input
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // Tenta parsear como referência primeiro
  const parsedRef = debounced.trim() ? findFirstReference(debounced) : null;
  const referenceQuery = parsedRef?.canonical ?? null;
  const refState = useBibleReference(referenceQuery, version);

  // Busca textual (quando não casa referência)
  useEffect(() => {
    if (!debounced || parsedRef || debounced.length < MIN_SEARCH) {
      setSearchResults(null);
      return;
    }
    const cacheKey = `${version}|${debounced}`;
    if (cacheKey === lastSearchRef.current) return;
    lastSearchRef.current = cacheKey;
    const controller = new AbortController();
    setSearchLoading(true);
    fetch(
      `/api/bible/search?version=${version}&q=${encodeURIComponent(debounced)}`,
      { signal: controller.signal }
    )
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data: SearchResult) => {
        setSearchResults(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setSearchResults(null);
      })
      .finally(() => setSearchLoading(false));
    return () => controller.abort();
  }, [debounced, parsedRef, version]);

  const handleNavigate = useCallback(
    (book: string, chapter: number) => {
      router.push(`/bible?book=${book}&chapter=${chapter}&version=${version}`);
      setOpen(false);
      setQuery("");
    },
    [router, version]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Busca bíblica"
      description="Digite uma referência (ex: Romanos 5:1) ou uma palavra (ex: graça)"
    >
      <CommandInput
        placeholder="Romanos 5:1—11 · graça · paz · justificação..."
        value={query}
        onValueChange={setQuery}
        autoFocus
      />
      <div className="px-3 py-2 border-b border-border flex items-center gap-1.5 text-xs">
        <span className="text-vox-muted vox-mono mr-1">Versão:</span>
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
      <CommandList className="max-h-[400px]">
        {!debounced ? (
          <CommandGroup heading="Sugestões">
            <CommandItem
              onSelect={() => handleNavigate("jo", 3)}
              className="cursor-pointer"
            >
              <span className="vox-mono">Ler João 3</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleNavigate("rm", 5)}
              className="cursor-pointer"
            >
              <span className="vox-mono">Ler Romanos 5</span>
            </CommandItem>
            <CommandItem
              onSelect={() => handleNavigate("sl", 23)}
              className="cursor-pointer"
            >
              <span className="vox-mono">Ler Salmo 23</span>
            </CommandItem>
          </CommandGroup>
        ) : null}

        {parsedRef && refState.data ? (
          <CommandGroup heading="Referência">
            <CommandItem
              onSelect={() =>
                handleNavigate(parsedRef.book.abbrev, parsedRef.chapter)
              }
              className="cursor-pointer items-start gap-3 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="vox-ref">{refState.data.canonical}</p>
                <p
                  className="vox-scripture text-sm mt-1.5 line-clamp-3"
                  style={{ color: "var(--vox-ink)" }}
                >
                  &ldquo;{refState.data.verses[0]?.text}&rdquo;
                </p>
                {refState.data.verses.length > 1 ? (
                  <p className="text-xs text-vox-muted mt-1">
                    + {refState.data.verses.length - 1} versículos
                  </p>
                ) : null}
              </div>
            </CommandItem>
          </CommandGroup>
        ) : null}

        {!parsedRef && debounced.length >= MIN_SEARCH ? (
          searchLoading ? (
            <CommandEmpty>Buscando…</CommandEmpty>
          ) : searchResults && searchResults.occurrence > 0 ? (
            <CommandGroup heading={`Concordância · ${searchResults.occurrence} ocorrências`}>
              {searchResults.verses.slice(0, 30).map((v, idx) => (
                <CommandItem
                  key={`${v.book.abbrev.pt}-${v.chapter}-${v.number}-${idx}`}
                  onSelect={() => handleNavigate(v.book.abbrev.pt, v.chapter)}
                  className="cursor-pointer items-start gap-3"
                >
                  <span className="vox-mono text-vox-gold text-xs shrink-0 pt-0.5 w-28">
                    {v.book.name} {v.chapter}:{v.number}
                  </span>
                  <span className="flex-1 text-sm line-clamp-2">{v.text}</span>
                </CommandItem>
              ))}
              {searchResults.verses.length > 30 ? (
                <p className="px-3 py-2 text-xs text-vox-muted">
                  Mostrando 30 de {searchResults.occurrence}. Refine a busca pra
                  resultados mais específicos.
                </p>
              ) : null}
            </CommandGroup>
          ) : (
            <CommandEmpty>Nenhum resultado.</CommandEmpty>
          )
        ) : null}

        {parsedRef && refState.loading ? (
          <CommandEmpty>Buscando passagem…</CommandEmpty>
        ) : null}

        {parsedRef && refState.error ? (
          <CommandEmpty>Erro: {refState.error}</CommandEmpty>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
