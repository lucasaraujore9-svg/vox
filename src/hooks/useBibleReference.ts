"use client";

// Hook genérico pra buscar uma referência bíblica via /api/bible com cache local.

import { useEffect, useRef, useState } from "react";
import type { BibleVersionId } from "@/lib/bible/versions";

interface BibleVerseResponse {
  canonical: string;
  book: { abbrev: string; name: string };
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  version: string;
  verses: Array<{ chapter: number; number: number; text: string }>;
}

const CACHE = new Map<string, BibleVerseResponse>();

export interface UseBibleReferenceState {
  data: BibleVerseResponse | null;
  loading: boolean;
  error: string | null;
}

export function useBibleReference(
  reference: string | null | undefined,
  version: BibleVersionId
): UseBibleReferenceState {
  const [state, setState] = useState<UseBibleReferenceState>({
    data: null,
    loading: false,
    error: null,
  });
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    const key = `${version}|${reference}`;
    if (CACHE.has(key)) {
      setState({ data: CACHE.get(key) ?? null, loading: false, error: null });
      lastKey.current = key;
      return;
    }
    if (lastKey.current === key) return;
    lastKey.current = key;
    setState({ data: null, loading: true, error: null });
    const controller = new AbortController();
    fetch(
      `/api/bible?version=${encodeURIComponent(version)}&reference=${encodeURIComponent(reference)}`,
      { signal: controller.signal }
    )
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `Erro ${res.status}`);
        }
        return (await res.json()) as BibleVerseResponse;
      })
      .then((data) => {
        CACHE.set(key, data);
        if (lastKey.current === key) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Erro",
        });
      });
    return () => controller.abort();
  }, [reference, version]);

  return state;
}

export type { BibleVerseResponse };
