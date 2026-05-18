// Service Worker do VOX (gerado pelo @serwist/next).
// Estratégia:
//   - precache: shell estático (assets do build), instalado no install.
//   - runtime cache: páginas (network-first), Bible API (stale-while-revalidate
//     via defaultCache), Supabase REST não cacheia (autenticado).
//   - navegação offline: fallback pra /offline (página estática).
//
// Webpack bundla este arquivo via @serwist/next plugin. Não é importado pelo app.

import { defaultCache } from "@serwist/next/worker";
import { Serwist, type PrecacheEntry } from "serwist";

interface SwScope {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  addEventListener: (type: string, listener: EventListener) => void;
}

// `self` no SW é ServiceWorkerGlobalScope; em build TS com lib dom,
// usamos um tipo local pra evitar conflito com lib webworker.
declare const self: SwScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }: { request: Request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
