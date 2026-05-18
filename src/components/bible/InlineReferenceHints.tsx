"use client";

// Componente "live" — recebe o texto atual de um item, detecta referências
// bíblicas com debounce, e renderiza uma pílula ReferenceHint pra cada uma.

import { useEffect, useMemo, useState } from "react";
import { findReferences } from "@/lib/bible/parser";
import { ReferenceHint } from "./ReferenceHint";
import type { BibleVersionId } from "@/lib/bible/versions";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 350;

interface InlineReferenceHintsProps {
  text: string;
  version: BibleVersionId;
  /** Referências canônicas já dispensadas/inseridas pelo usuário —
      persistidas no item.dismissedRefs. */
  dismissed?: string[];
  /** Notifica o pai para persistir o dismiss (na decisão do usuário ou
      após inserir). Também usado pra "ressuscitar" hints quando uma ref
      sai do texto e volta. */
  onDismissedChange?: (next: string[]) => void;
  onInsert?: (canonical: string, fullText: string, version: BibleVersionId) => void;
  className?: string;
}

export function InlineReferenceHints({
  text,
  version,
  dismissed = [],
  onDismissedChange,
  onInsert,
  className,
}: InlineReferenceHintsProps) {
  // Debounce — só re-analisa o texto após parada
  const [debounced, setDebounced] = useState(text);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [text]);

  const canonicals = useMemo(() => {
    if (!debounced.trim()) return [] as string[];
    const refs = findReferences(debounced);
    // Dedupe por canonical
    return Array.from(new Set(refs.map((r) => r.canonical)));
  }, [debounced]);

  // Limpa do dismissed as refs que SUMIRAM do texto — assim, se o usuário
  // apagar e digitar de novo, o hint reaparece (regra explícita do produto).
  useEffect(() => {
    if (!onDismissedChange) return;
    if (dismissed.length === 0) return;
    const presentSet = new Set(canonicals);
    const filtered = dismissed.filter((d) => presentSet.has(d));
    if (filtered.length !== dismissed.length) {
      onDismissedChange(filtered);
    }
    // canonicals e dismissed são as fontes; onDismissedChange é estável.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canonicals.join("|"), dismissed.join("|")]);

  const dismissedSet = new Set(dismissed);
  const visible = canonicals.filter((c) => !dismissedSet.has(c));

  if (visible.length === 0) return null;

  function markDismissed(canonical: string) {
    if (!onDismissedChange) return;
    if (dismissedSet.has(canonical)) return;
    onDismissedChange([...dismissed, canonical]);
  }

  return (
    <div className={cn("flex flex-wrap gap-2 mt-2", className)}>
      {visible.map((canonical) => (
        <ReferenceHint
          key={canonical}
          canonical={canonical}
          version={version}
          onInsert={(c, fullText, chosenVersion) => {
            onInsert?.(c, fullText, chosenVersion);
            markDismissed(canonical);
          }}
          onDismiss={() => markDismissed(canonical)}
        />
      ))}
    </div>
  );
}
