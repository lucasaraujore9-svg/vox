"use client";

// Issue 030/031 — Hook genérico de auto-save com debounce.
// Em caso de erro de rede, persiste em IndexedDB via savePending (offline-first).

import { useEffect, useRef, useState } from "react";
import { savePending } from "@/lib/offline/db";

interface AutoSaveOptions<T> {
  value: T;
  /** Função que faz a persistência remota. Lance se falhar. */
  save: (value: T) => Promise<void>;
  /** Identificador para fallback no IndexedDB (ex: sermon id) */
  fallbackId: string;
  delay?: number;
}

export type AutoSaveStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "offline";

export function useAutoSave<T>({ value, save, fallbackId, delay = 1500 }: AutoSaveOptions<T>) {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const lastSavedRef = useRef<T>(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (Object.is(value, lastSavedRef.current)) return;
    setStatus("dirty");

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await save(value);
        lastSavedRef.current = value;
        setStatus("saved");
      } catch {
        try {
          await savePending(fallbackId, value as Record<string, unknown>);
          setStatus("offline");
        } catch {
          setStatus("dirty");
        }
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, save, fallbackId, delay]);

  return status;
}
