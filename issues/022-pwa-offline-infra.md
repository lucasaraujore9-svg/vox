# Issue 022 — PWA + Offline (cache básico)

**Status:** [ ] PENDENTE
**Tipo:** infra
**Página:** global
**Depende de:** 020
**Prioridade:** P0

---

## O Que Fazer

Configurar o VOX como PWA instalável com suporte básico a offline:
cache de assets, navegação offline e cache de sermões para leitura sem internet.

## Componentes Envolvidos

- `next.config.ts` — Configuração do next-pwa
- `public/manifest.json` — Web App Manifest
- `src/lib/offline/sync.ts` — Lógica de sync offline → online
- `src/hooks/useOfflineSync.ts` — Hook de detecção e sync
- `public/icons/` — Ícones do app (TODO: gerar com design system)

## Comportamentos

- App instalável em Android e iOS (botão "Adicionar à tela inicial")
- Service Worker cacheia: assets estáticos, páginas shell, fontes
- Sermões recentemente acessados ficam disponíveis offline (NetworkFirst)
- Edições feitas offline são salvas no IndexedDB
- Ao reconectar, sync automático envia pendentes para Supabase
- Indicador visual de status: "Online" / "Offline — salvando localmente"
- Conflict resolution no MVP: last-write-wins

## Critério de Aceite

- [ ] App instalável (manifesto válido, service worker registrado)
- [ ] Navegação básica funciona sem internet (páginas shell)
- [ ] Sermões carregados previamente acessíveis offline
- [ ] Edição offline salva no IndexedDB sem erros
- [ ] Ao reconectar, mudanças são sincronizadas com Supabase
- [ ] Indicador de status online/offline na UI
- [ ] Ícones do app configurados (pelo menos 192x192 e 512x512)
- [ ] Lighthouse PWA score >= 90

## Notas de Implementação

### Packages necessários
```bash
npm install next-pwa idb
```

### next.config.ts
```typescript
import withPWA from 'next-pwa'

const pwaConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api',
        expiration: { maxEntries: 100, maxAgeSeconds: 86400 }
      }
    }
  ]
})
```

### IndexedDB schema (usando `idb`)
```typescript
// src/lib/offline/db.ts
interface OfflineDB {
  pending_syncs: {
    key: string           // sermon id
    value: {
      id: string
      content: unknown
      updated_at: string
      synced: boolean
    }
  }
}
```

### public/manifest.json
```json
{
  "name": "VOX — Palestras e Sermões",
  "short_name": "VOX",
  "description": "Ferramenta pastoral para preparação e arquivo de sermões",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "TODO: cor primária do design system",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Atenção
- `next-pwa` gera `sw.js` e `workbox-*.js` em `/public` — adicionar ao `.gitignore`
- Testar offline com DevTools → Network → Offline
- Wake Lock API (modo apresentação) é separado desta issue — ver issue 033

## Plano de Implementação

### Pré-requisitos
- Issue 020 concluída (projeto Next.js funcional)
- `npm install next-pwa idb`
- Gerar ícones 192×192 e 512×512 (placeholder por ora)

### Passos

**1. Criar manifest.json**
Criar `public/manifest.json`:
- Usar estrutura das Notas, substituindo `theme_color` por `#166534` (--vox-forest)
- `background_color: "#F9F7F4"` (--vox-bg)
- Adicionar `"purpose": "any maskable"` nos ícones

**2. Configurar next-pwa**
Editar `next.config.ts`:
- Envolver configuração com `withPWA` conforme código das Notas
- Adicionar cache rule para rotas Supabase (NetworkFirst, 24h)
- Adicionar cache rule para fontes Google (CacheFirst, 1 ano)

**3. Criar cliente IndexedDB**
Criar `src/lib/offline/db.ts`:
- Usar `openDB` do `idb` para criar store `pending_syncs`
- Exportar funções: `savePending(sermon)`, `getPending()`, `markSynced(id)`, `clearSynced()`

**4. Criar lógica de sync**
Criar `src/lib/offline/sync.ts`:
- `syncPendingSermons(supabase)`: busca pendentes no IndexedDB → upsert no Supabase → marca como synced
- Lógica last-write-wins: usa `updated_at` para comparar

**5. Criar hook useOfflineSync**
Criar `src/hooks/useOfflineSync.ts`:
- `useState` para `isOnline` (inicial: `navigator.onLine`)
- Event listeners em `window`: `online` → trigger sync; `offline` → atualizar estado
- Ao ficar online: chamar `syncPendingSermons`
- Retorna: `{ isOnline, isSyncing }`

**6. Adicionar indicador de status no AppHeader**
Editar `src/components/shared/AppHeader.tsx`:
- Importar `useOfflineSync`
- Badge discreto: "Offline" (vermelho) quando desconectado, invisível quando online

**7. Atualizar .gitignore**
Editar `.gitignore`:
- Adicionar `public/sw.js`, `public/workbox-*.js`

### Como Verificar
- Lighthouse PWA audit >= 90 (aba Application no DevTools)
- DevTools → Network → Offline → recarregar: app carrega (shell + cached pages)
- Editar sermão offline → DevTools → Application → IndexedDB: entry em `pending_syncs`
- Reconectar → sync roda → entrada some do IndexedDB, sermão atualizado no Supabase
