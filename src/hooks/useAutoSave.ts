"use client";

// Issue 030/031, Hook genérico de auto-save com debounce.
// Offline-first: SEMPRE escreve no IndexedDB antes de tentar o remoto, para que
// nenhuma edição se perca se a página recarregar (SW, refresh, navegação) antes
// do round-trip ao Supabase. Em caso de sucesso remoto, marca como sincronizado.

import { useEffect, useRef, useState } from "react";
import { savePending, markSynced } from "@/lib/offline/db";

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
      // 1) Sempre escreve no IDB primeiro, defesa contra reload/SW/crash
      //    antes do round-trip ao Supabase concluir.
      try {
        await savePending(fallbackId, value as Record<string, unknown>);
      } catch {
        // IDB indisponível (private mode? quota?), segue tentando remoto.
      }
      // 2) Tenta o remoto. Se ok, marca o IDB como sincronizado.
      try {
        await save(value);
        lastSavedRef.current = value;
        try {
          await markSynced(fallbackId);
        } catch {
          // ok, sync limpa depois
        }
        setStatus("saved");
      } catch {
        setStatus("offline");
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, save, fallbackId, delay]);

  return status;
}
