"use client";

// Tema das telas de apresentação, compartilhado por todas elas.
//
// Padrão é CLARO: é o Parchment da marca, é o que combina com sala iluminada,
// e é a superfície para a qual as cores do editor foram escolhidas — texto
// colorido no manuscrito só se lê corretamente sobre fundo claro.
// Escuro fica como opção, para sala apagada.
//
// Store externa em vez de useState+useEffect: sobrevive à navegação entre as
// telas de apresentação, é SSR-safe (snapshot do servidor é sempre "claro") e
// sincroniza a janela de projeção com a do apresentador pelo evento `storage`.

import { useSyncExternalStore } from "react";

export type PresentTheme = "claro" | "escuro";

const STORAGE_KEY = "vox:present-theme";

let cached: PresentTheme | null = null;
const listeners = new Set<() => void>();

function readStored(): PresentTheme {
  if (cached) return cached;
  try {
    cached = localStorage.getItem(STORAGE_KEY) === "escuro" ? "escuro" : "claro";
  } catch {
    cached = "claro";
  }
  return cached;
}

function serverSnapshot(): PresentTheme {
  return "claro";
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    cached = e.newValue === "escuro" ? "escuro" : "claro";
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function setPresentTheme(next: PresentTheme): void {
  cached = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // modo privado ou storage cheio: vale só para esta sessão
  }
  for (const l of listeners) l();
}

export function usePresentTheme(): PresentTheme {
  return useSyncExternalStore(subscribe, readStored, serverSnapshot);
}

/** Paleta da superfície. Todos os pares abaixo foram medidos: ≥ 4.5:1. */
export interface PresentSurface {
  isDark: boolean;
  /** Fundo da tela toda. */
  bg: string;
  /** Fundo de painéis e cartões sobre a tela. */
  panel: string;
  /** Fundo do palco do slide (letterbox em volta da imagem). */
  slideBg: string;
  /** Texto principal. Contraste máximo contra `panel`. */
  ink: string;
  /** Rótulos e títulos de sessão: secundário, mas legível. */
  muted: string;
  /** Texto de apoio, como a prévia do próximo slide. */
  soft: string;
  /** Linhas divisórias. */
  border: string;
  /** Barra lateral de uma nota sem tipo definido. */
  plainRule: string;
}

const LIGHT: PresentSurface = {
  isDark: false,
  bg: "var(--vox-bg)",
  panel: "#FFFFFF",
  slideBg: "#EFEBE5",
  ink: "var(--vox-ink)", //  16.6:1
  muted: "#55606E", //        5.9:1
  soft: "#3F3F46", //         9.8:1
  border: "rgba(24,24,27,0.12)",
  plainRule: "rgba(24,24,27,0.18)",
};

const DARK: PresentSurface = {
  isDark: true,
  bg: "var(--vox-stage-bg)",
  panel: "#12181A",
  slideBg: "#11171B",
  ink: "#F5F2ED", //         16.1:1
  muted: "#9BB0AA", //        7.8:1
  soft: "rgba(245,242,237,0.72)", // 7.9:1
  border: "rgba(255,255,255,0.10)",
  plainRule: "rgba(255,255,255,0.16)",
};

export function surfaceFor(theme: PresentTheme): PresentSurface {
  return theme === "escuro" ? DARK : LIGHT;
}
