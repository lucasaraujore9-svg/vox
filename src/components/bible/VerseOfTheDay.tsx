"use client";

// Card "Versículo do dia" pro Dashboard. Bate em /api/bible/random com cache 12h.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { BibleVersionId } from "@/lib/bible/versions";

interface RandomVerse {
  book: { name: string; abbrev: { pt: string } };
  chapter: number;
  number: number;
  text: string;
}

export function VerseOfTheDay({
  version = "acf" as BibleVersionId,
}: {
  version?: BibleVersionId;
}) {
  const [verse, setVerse] = useState<RandomVerse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/bible/random?version=${version}`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data: RandomVerse) => setVerse(data))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Erro");
      });
    return () => controller.abort();
  }, [version]);

  if (error) return null; // falha silenciosa — não desabilita o dashboard
  if (!verse) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="vox-eyebrow">Versículo do dia</p>
          <div className="mt-3 h-16 rounded animate-pulse bg-muted/40" />
        </CardContent>
      </Card>
    );
  }

  const canonical = `${verse.book.name} ${verse.chapter}:${verse.number}`;
  const encoded = encodeURIComponent(canonical);

  return (
    <Card className="relative overflow-hidden">
      <span
        className="absolute left-0 top-6 bottom-6 w-1 rounded-r"
        style={{ background: "var(--vox-gold)" }}
        aria-hidden
      />
      <CardContent className="py-7 px-7">
        <p className="vox-eyebrow" style={{ color: "var(--vox-gold)" }}>
          Versículo do dia
        </p>
        <p
          className="vox-scripture mt-4 leading-relaxed"
          style={{ fontSize: "var(--vox-text-lg)" }}
        >
          &ldquo;{verse.text}&rdquo;
        </p>
        <p className="vox-ref mt-3">{canonical}</p>
        <div className="mt-5 flex items-center gap-4 text-sm">
          <Link
            href={`/sermons/new?reference=${encoded}`}
            className="text-vox-forest hover:underline underline-offset-4"
          >
            Começar sermão a partir deste →
          </Link>
          <Link
            href={`/bible?book=${verse.book.abbrev.pt}&chapter=${verse.chapter}`}
            className="text-vox-prose hover:text-vox-ink"
          >
            Ler o capítulo
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
