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
  onInsert?: (canonical: string, fullText: string, version: BibleVersionId) => void;
  className?: string;
}

export function InlineReferenceHints({
  text,
  version,
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

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = canonicals.filter((c) => !dismissed.has(c));

  if (visible.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2 mt-2", className)}>
      {visible.map((canonical) => (
        <ReferenceHint
          key={canonical}
          canonical={canonical}
          version={version}
          onInsert={(c, fullText, chosenVersion) => {
            onInsert?.(c, fullText, chosenVersion);
            // Após inserir, dispensa pra evitar a pílula ficar pedindo de novo
            setDismissed((prev) => new Set(prev).add(canonical));
          }}
          onDismiss={() => setDismissed((prev) => new Set(prev).add(canonical))}
        />
      ))}
    </div>
  );
}
