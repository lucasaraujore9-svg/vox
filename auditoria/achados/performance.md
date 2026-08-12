# Auditoria — Performance
_Data: 2026-08-12 · Referência: .claude/skills/auditoria-saas/references/04-performance.md · Itens do inventário cobertos: ver seção Cobertura_

## Resumo
- Itens verificados: 22 rotas + 14 route handlers + libs de query/offline/present.
- Achados: **P0=0 · P1=3 · P2=6 · P3=4**
- Nota do domínio: **6.5/10**

Contexto do build: `next build --webpack` (Next 16.2.6) **não emite mais a tabela oficial de
First Load JS por rota** (só a árvore de rotas com marcador estático/dinâmico). Todos os números
abaixo foram **medidos diretamente** de `.next/static/chunks` (gzip via `gzip -c | wc -c`). Ver
PERF-011 (observabilidade de bundle).

Boas práticas já presentes (OK, não são achados):
- **Libs pesadas são server-only.** Grep em `.next/static/chunks` por `pdfjs`, `GlobalWorkerOptions`,
  `jspdf`/`jsPDF`, `mammoth`, `napi-rs`/`@napi`, `sharp`, `openai` → **0 ocorrências** no bundle do
  browser. As únicas ocorrências de `docx` são a string de extensão `.docx` na UI de import, não a lib.
  `next.config.ts` declara `serverExternalPackages: ["@napi-rs/canvas","sharp","pdfjs-dist"]`. Bom.
- **Fontes via `next/font/google`** (`Fraunces`, `Geist`, `Geist_Mono` em `src/app/layout.tsx:2`) —
  sem FOUT/CLS de fonte (display:swap é o default do next/font).
- **Sem `<img>` cru** em `src/` (grep vazio). `next/image` usado em `VoxWordmark`, `VoxMark`,
  `SlidesPanel`.
- **`dashboardStats` usa `Promise.all`** para os 3 counts (`queries.ts:97-116`) — paralelo, sem waterfall.
- **BroadcastChannel com cleanup correto** (`PresentSlides.tsx:99-102`, `AudienceView.tsx:75-78`):
  o `useEffect` fecha o channel no unmount; não vaza listener.
- **Auto-save com debounce de 1500ms** (`useAutoSave.ts:27`) — não dispara request por tecla.
- **`revalidatePath` usado nas mutations** (`sermons/actions.ts`, `series/actions.ts`, `courses/actions.ts`).
- **Sem Redis/Upstash no projeto** (confirmado: `package.json` não tem `@upstash/*`). Correto para a
  stack atual; ver PERF-003 para a camada de cache que falta na API bíblica.

---

## Achados

### [PERF-001] Imagens dos slides no púlpito são full-res via CSS `background-image` (sem next/image, sem preload do próximo)
- **Severidade:** P1
- **Status:** Aberto
- **Local:** `src/components/present/PresentSlides.tsx:216-220` e `:542-546`; `src/components/present/AudienceView.tsx:167-176`; `src/components/present/SlideProjection.tsx:173-181`
- **Evidência:** o slide corrente é pintado como `background: \`${surface.slideBg} url(${current.image_url}) center / contain no-repeat\`` (PresentSlides.tsx:218). A audiência idem (AudienceView.tsx:173: `background: \`url(${slide.image_url}) center / contain no-repeat\``). Não há `next/image`, nem `<link rel="preload">`, nem prefetch do `slides[index+1].image_url`. O único fetch antecipado é a miniatura de 144px do próximo (NextSlideBlock.tsx:542, `center / cover`), que **não** é a imagem full-res que será exibida ao avançar. As `image_url` são PNGs renderizados de páginas de PDF (via `@napi-rs/canvas`) servidos por URL assinada do Supabase Storage — arquivos grandes, sem redimensionamento responsivo.
- **Impacto:** este é exatamente o caminho de púlpito ("no Wi-Fi ruim de igreja ou 4G"). Ao apertar "Próximo", a imagem full-res do novo slide só começa a baixar naquele instante; em 4G lento a projeção fica em branco/flash por segundos na frente da congregação. Sem next/image, cada slide baixa em resolução total sem otimização de formato/tamanho, inflando LCP.
- **Correção:**
  1. Pré-carregar o próximo (e idealmente o anterior) slide. No `PresentSlides`/`SlideProjection`/`AudienceView`, adicionar um `useEffect([index])` que faz `const img = new Image(); img.src = slides[index+1]?.image_url` para forçar o browser a baixar antecipadamente; opcionalmente também `slides[index-1]`.
  2. Trocar o `background-image` por `next/image` com `fill`, `sizes` e `priority` no slide corrente, e `loading="eager"` no próximo pré-carregado. `*.supabase.co` já está em `next.config.ts > images.remotePatterns`, então o otimizador funciona.
  3. Alternativamente/adicionalmente, gerar os PNGs de slide já em resolução de projeção (ex.: 1600px de largura) no `@napi-rs/canvas` do upload, evitando servir a página do PDF em resolução cheia.
- **Verificação:** DevTools → Network throttled a "Fast 4G", abrir `/sermons/[id]/present?mode=presenter`, avançar slides e confirmar que a imagem do próximo já está `(from disk cache)`/`(prefetch cache)` no momento do clique (não uma request nova). Lighthouse na tela de projeção: LCP < 2.5s no throttle.

### [PERF-002] Tela de apresentação não tem fallback offline — o púlpito depende de render dinâmico no servidor
- **Severidade:** P1
- **Status:** Aberto
- **Local:** `src/app/(app)/sermons/[id]/present/page.tsx:29-63` (Server Component); infra offline não conectada: `src/lib/offline/db.ts` (`cacheSermon`/`getCachedSermon`) só é usada pelo editor, não pelo present.
- **Evidência:** `PresentPage` é `async` e faz `await getSermon(id)` + `await listSlidesForSermon(...)` (Supabase, cookies → rota `ƒ` dinâmica no build). Não há `loading.tsx`/`error.tsx` na rota (`INVENTARIO.md`: `error/loading/not-found = 0`). O IndexedDB tem `cached_sermons` (db.ts:102-120) mas **nenhum componente de present lê `getCachedSermon`** (grep: uso de `getCachedSermon` inexistente fora de db.ts). Se a rede cair no meio do culto, o server render falha → a tela não abre a partir do zero.
- **Impacto:** o caso de uso declarado como mais crítico (pastor no púlpito, Wi-Fi ruim) é o mais frágil. Se o pastor não deixou a aba já aberta antes de perder rede, `/present` não carrega offline. O SW (`@serwist/next`, `cacheOnNavigation:true`) pode cachear o shell, mas o conteúdo dinâmico + as URLs assinadas do Storage (que expiram) não têm garantia offline.
- **Correção:**
  1. Curto prazo: garantir que o SW (`src/app/sw.ts`) tenha runtime caching **NetworkFirst com fallback a cache** para `/sermons/*/present*` e **CacheFirst/StaleWhileRevalidate** para as imagens de slide do Storage, para que uma tela já visitada reabra offline.
  2. Médio prazo: ao entrar no editor/present online, chamar `cacheSermon(id, {sermon, slides})` e fazer o componente de present hidratar de `getCachedSermon(id)` quando o fetch do servidor falhar (padrão offline-first que o db.ts já suporta mas ninguém usa no present).
  3. Adicionar `loading.tsx` e `error.tsx` na pasta `present/` para não deixar a tela num estado indefinido.
- **Verificação:** abrir `/sermons/[id]/present`, ativar "Offline" no DevTools, recarregar a aba → a projeção deve reabrir com o último conteúdo cacheado (não tela de erro). Confirmar no Application → Service Workers/Cache Storage que a navegação e as imagens ficaram cacheadas.

### [PERF-003] API bíblica (conteúdo imutável) sem nenhuma camada de cache — cada referência bate na API.Bible externa
- **Severidade:** P1
- **Status:** Aberto
- **Local:** `src/app/api/bible/route.ts`, `src/app/api/bible/books/route.ts`, `src/app/api/bible/chapter/route.ts`, `src/app/api/bible/search/route.ts`, `src/app/api/bible/random/route.ts` (todos `nodejs`, sem `revalidate`/`unstable_cache`/`Cache-Control`).
- **Evidência:** o inventário lista os 5 route handlers de bible como `nodejs` sem config de cache. Grep de `unstable_cache`/`revalidateTag`/`export const revalidate` no projeto → só há `revalidatePath` em mutations; **nenhum handler de bible cacheia**. O texto bíblico e a lista de livros/capítulos são imutáveis (a tradução não muda). Sem Redis no projeto (confirmado), não há nem cache de aplicação.
- **Impacto:** cada leitura de capítulo/versículo faz round-trip à API.Bible pela rede da igreja (lenta). Latência alta no editor (inserir referência) e na página `/bible`, além de gastar cota da API.Bible desnecessariamente e criar ponto único de falha quando a API externa está lenta.
- **Correção:**
  1. Envolver as chamadas fetch à API.Bible com `unstable_cache` (ou `fetch(url, { next: { revalidate: 604800 } })`) por chave `versionId+bookId+chapter` — TTL longo (dias/semana) porque o conteúdo é imutável. Adicionar `revalidate` explícito nos handlers (ex.: `export const revalidate = 86400`).
  2. Devolver `Cache-Control: public, max-age=86400, s-maxage=604800, stale-while-revalidate` nas respostas dos handlers de bible para o SW/browser cachearem.
  3. No SW (`sw.ts`), registrar `/api/bible/*` como `CacheFirst` com expiração longa (o conteúdo bíblico deve ficar disponível offline para o pastor).
- **Verificação:** duas requisições ao mesmo capítulo — a segunda deve retornar de cache (medir latência; header `x-nextjs-cache: HIT` ou `age`/`cf-cache-status`). Offline: inserir uma referência já lida deve funcionar sem rede.

### [PERF-004] Banco de conteúdo com teto silencioso de 60 e sem paginação — sermões além do 60º ficam inacessíveis pela listagem
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `src/app/(app)/sermons/page.tsx:39-48` (`limit: 60`) e `:150-154` (contador `{sermons.length} manuscritos`). `listSermons` suporta `offset/range` (`queries.ts:66-69`) mas a página nunca passa `offset` nem renderiza controle de paginação.
- **Evidência:** `loadSermons` chama `listSermons({..., limit: 60})` fixo. Não há UI de "carregar mais"/páginas. O label mostra `sermons.length` (no máximo 60), então com 500 sermões o usuário vê "60 manuscritos" e não alcança o resto exceto por busca/filtro. `/notes` e `/admin/users` têm o mesmo padrão de limite fixo sem paginação (`notes/queries.ts:45` `limit ?? 200`; `admin/queries.ts:218,261` `limit(200)`).
- **Impacto:** com o acervo crescendo (o produto é "todo o seu ministério em um lugar"), conteúdo antigo desaparece da navegação e o número exibido engana. Não é lentidão de query (o limit protege o banco), é perda de acesso a dados + contagem incorreta.
- **Correção:**
  1. Implementar paginação keyset (preferível ao offset em listas grandes): ordenar por `updated_at` + `id` e passar cursor via querystring; botão "Carregar mais" ou páginas.
  2. Exibir o total real via `select('id', { count: 'exact', head: true })` com os mesmos filtros, separado da lista renderizada, para o contador não mentir.
  3. Mesmo tratamento para `/notes` (200) e `/admin/users` (200).
- **Verificação:** com >60 sermões, confirmar que dá para navegar além do 60º e que o contador mostra o total real.

### [PERF-005] `loadSeries` conta sermões no JS embarcando todos os `id`s de sermão de cada série
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `src/app/(app)/sermons/page.tsx:85-94`
- **Evidência:** `.from("series").select("id, title, parent_id, sermons:sermons(id)")` e depois `sermon_count: Array.isArray(s.sermons) ? s.sermons.length : 0`. O embed traz **todos os ids de sermão de todas as séries** só para tirar `.length` no app. Agregação feita no JS, não no banco.
- **Impacto:** payload cresce O(nº total de sermões) a cada abertura do `/sermons`, mesmo que a UI só precise do número. Com centenas de sermões, transfere/serializa uma lista grande à toa em toda visita ao banco.
- **Correção:** usar agregação/`count` do PostgREST: `.select("id, title, parent_id, sermons:sermons(count)")` (retorna `[{count: n}]`) e ler `s.sermons[0]?.count`, ou uma view/RPC que já devolva `sermon_count`. Evita trazer os ids.
- **Verificação:** inspecionar a resposta da query — o campo `sermons` deve conter só a contagem, não a lista de ids. Comparar tamanho do payload antes/depois.

### [PERF-006] Waterfall na página do banco: `loadSeries` e `loadSermons` são aguardados em sequência sem dependência real
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `src/app/(app)/sermons/page.tsx:112-116`
- **Evidência:** `const seriesList = await loadSeries();` → constrói `seriesIndex` → `const sermons = await loadSermons(filters, seriesIndex);`. `loadSermons` usa `seriesIndex` **apenas no `.map` de pós-processamento** (page.tsx:50-51) para anexar o nome da série; a query `listSermons` em si não depende de `seriesList`. Logo são dois round-trips ao Supabase executados serialmente sem necessidade.
- **Impacto:** soma as duas latências de rede na renderização do servidor (pior em rede ruim), atrasando o TTFB/LCP da tela mais visitada depois do dashboard.
- **Correção:** disparar as duas queries em paralelo e mapear depois: `const [seriesList, sermonRows] = await Promise.all([loadSeries(), listSermons({...})]);` construir `seriesIndex` do `seriesList` e então mapear `sermonRows`. Reestruturar `loadSermons` para separar o fetch (paralelizável) do map (que precisa do index).
- **Verificação:** medir o tempo de render do server component antes/depois (log de duração ou Server-Timing); as duas queries devem aparecer sobrepostas no trace.

### [PERF-007] Editor reconstrói a árvore inteira de sessões/itens a cada tecla
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `src/components/editor/SermonEditor.tsx:161-190` (`updateSessions`/`handleItemContentChange`)
- **Evidência:** cada digitação chama `handleItemContentChange` → `updateSessions` → `update({ sessions: mapper(content.sessions) })`, que faz `sessions.map(... items.map(...))` recriando o array inteiro e um novo objeto `content` a cada keystroke; `useCallback` de `updateSessions` depende de `[content.sessions, update]`, invalidando a cada mudança. Isso re-renderiza toda a árvore do editor (várias instâncias TipTap) por tecla.
- **Impacto:** em manuscritos grandes (muitos blocos/sessões), a digitação fica com jank/latência de input à medida que o número de blocos cresce — custo O(nº de blocos) por tecla + re-render de todos os editores.
- **Correção:**
  1. Memoizar os componentes de bloco (`React.memo`) com comparação por `item.id`/`item.content` para que apenas o bloco editado re-renderize.
  2. Manter a atualização imutável só do ramo alterado (já é imutável, mas garantir que os irmãos preservem identidade referencial para o memo funcionar) e evitar recriar `updateSessions` a cada render (usar functional update em `setContent` com ref para o estado atual, reduzindo dependências).
- **Verificação:** React DevTools Profiler — digitar num manuscrito com ~50 blocos e confirmar que só o bloco ativo re-renderiza; medir "commit duration" por keystroke antes/depois.

### [PERF-008] Polyfills legados (~38.6KB gz) enviados a todos os clientes
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `.next/static/chunks/polyfills-42372ed130431b0a.js` (build); sem `browserslist` no `package.json`.
- **Evidência:** medido — polyfills raw=112.594 bytes, **gz=39.503 bytes (~38.6KB)**. O `package.json` não define `browserslist`, então o Next inclui o bundle de polyfills conservador para todos.
- **Impacto:** ~38.6KB gz extras no First Load de toda rota, incluindo a de apresentação e o login, penalizando o first paint em 4G. Navegadores modernos (alvo de uma PWA) não precisam da maioria desses polyfills.
- **Correção:** adicionar `"browserslist": ["chrome >= 111", "safari >= 16", "firefox >= 111", "edge >= 111"]` (ou equivalente ao público real) ao `package.json` para o Next reduzir/eliminar o chunk de polyfills. Validar que o público-alvo (navegadores de celular dos pastores) é coberto.
- **Verificação:** rebuild e confirmar que `polyfills-*.js` encolheu ou sumiu; medir o First Load JS compartilhado antes/depois.

### [PERF-009] `versions.ts` usa `select("*")` e `getSermon` traz o jsonb `content` inteiro mesmo quando só metadados são usados
- **Severidade:** P3
- **Status:** Aberto
- **Local:** `src/lib/sermons/versions.ts:101` (`.select("*")`); `src/lib/sermons/queries.ts:80` (`getSermon`: `.select("*, series:series(id, title)")`)
- **Evidência:** `versions.ts:101` é a única ocorrência de `select("*")` no `lib/`. `getSermon` traz todas as colunas incluindo `content` (jsonb potencialmente grande) e é chamado por `present/page.tsx:38` — no caminho de apresentação de **slides** (`type=apresentação`) o `content` do esboço nem é usado (o conteúdo vem de `listSlidesForSermon`), mas é transferido do banco mesmo assim.
- **Impacto:** transferência/serialização de colunas não usadas; no present de slides, o jsonb de esboço grande viaja à toa. Pequeno, mas fácil de eliminar.
- **Correção:** em `getSermon`, aceitar uma lista de colunas (ou criar `getSermonMeta`) que selecione só o necessário quando `content` não for exibido; no `present/page.tsx` para `type=apresentação` selecionar apenas `id,title,framework,type,bible_ref`. Trocar o `select("*")` de `versions.ts:101` pelas colunas efetivamente usadas.
- **Verificação:** conferir que o present de slides não carrega mais o campo `content`; typecheck verde.

### [PERF-010] Sync offline processa registros em série (2 round-trips cada) e só sincroniza o campo `content`
- **Severidade:** P3
- **Status:** Aberto
- **Local:** `src/lib/offline/sync.ts:34-71`
- **Evidência:** `for (const record of pending) { ... await select(updated_at) ... await update(...) ... }` — laço sequencial, cada iteração faz um `select` seguido de um `update` (2 round-trips), sem paralelismo. Além disso, o `update` só envia `{ content: ... }` (sync.ts:49-51), ignorando `word_count`/`title` que o save online atualiza. `cached_sermons` (db.ts:102-120) não tem TTL/evicção (cresce por nº de sermões distintos, mas nunca limpa).
- **Impacto:** ao voltar de um período offline com vários sermões pendentes, a sincronização é lenta (2×N round-trips serializados) numa rede já ruim. `word_count` fica dessincronizado após edição offline. `cached_sermons` acumula indefinidamente (bounded por nº de sermões, mas sem limpeza).
- **Correção:**
  1. Paralelizar com `Promise.allSettled` (limitando concorrência, ex.: 4) em vez do `for...await` sequencial.
  2. Persistir no payload offline os campos necessários (`word_count`) e aplicá-los no `update` do sync.
  3. Adicionar evicção/TTL simples ao `cached_sermons` (ex.: manter os N mais recentes por `cached_at`).
- **Verificação:** simular 10 sermões pendentes e medir o tempo total de `syncPendingSermons`; confirmar `word_count` correto após sync de edição offline.

### [PERF-011] Build não emite tabela de First Load JS — falta observabilidade de bundle
- **Severidade:** P3
- **Status:** Aberto
- **Local:** `package.json` (script `build: "next build --webpack"`); sem `@next/bundle-analyzer` nas devDependencies.
- **Evidência:** a saída de `npm run build` (Next 16.2.6, webpack) lista só a árvore de rotas com `○`/`ƒ`, **sem coluna de tamanho** (ver log do build). Não há `@next/bundle-analyzer` instalado. Os tamanhos desta auditoria tiveram de ser extraídos manualmente de `.next/static/chunks`.
- **Impacto:** regressões de bundle (ex.: alguém importar `pdfjs`/`docx` num client component) passariam despercebidas — justamente o risco que hoje está controlado. Sem métrica no CI, o ganho de manter libs server-only pode se perder.
- **Correção:** adicionar `@next/bundle-analyzer` (devDependency) plugado no `next.config.ts` via `ANALYZE=true`, e documentar `ANALYZE=true npm run build` no fluxo de review. Opcionalmente falhar o CI se um chunk client passar de um teto.
- **Verificação:** `ANALYZE=true npm run build` abre o treemap; confirmar que nenhum chunk client contém `pdfjs-dist`/`jspdf`/`docx`/`mammoth`/`sharp`/`@napi-rs/canvas`.

### [PERF-012] Verificação manual — client Supabase no editor pode reinstanciar e reativar o efeito de auto-save
- **Severidade:** P3
- **Status:** Aberto
- **Local:** `src/components/editor/SermonEditor.tsx:138-151` (`save` com deps `[sermonId, supabase]`); `useAutoSave.ts:32-64` (efeito depende de `[value, save, fallbackId, delay]`).
- **Evidência:** o `useCallback` de `save` depende de `supabase`. Não consegui confirmar (nas linhas lidas) se `supabase` é memoizado (`useMemo`/`useRef`) ou recriado por render via `createClient()`. Se for recriado a cada render, `save` muda de identidade a cada render e o efeito de auto-save reexecuta — o guard `Object.is(value, lastSavedRef.current)` mitiga (retorna cedo quando `value` não mudou), mas convém confirmar que o timer de debounce não é resetado indevidamente.
- **Impacto:** potencial de resets espúrios do debounce ou de agendamentos redundantes; baixo, mas fácil de fechar.
- **Correção:** garantir `const supabase = useMemo(() => createClient(), [])` no `SermonEditor` (uma instância por montagem). Confirmar por leitura do topo do arquivo.
- **Verificação:** ler `SermonEditor.tsx` (linhas ~1-60) para confirmar a instanciação do client; React DevTools Profiler para confirmar que digitação não reagenda o timer fora do fluxo de mudança de valor.

---

## Tabela de First Load JS por rota (medida de `.next/static`, gzip)

> Next 16 `--webpack` não emitiu a tabela oficial. Valores medidos com `gzip -c | wc -c`.
> **Baseline compartilhado** (rootMainFiles): webpack 1.7KB + 4bd1b696 61.5KB + 5838 60.9KB +
> main-app 0.3KB = **~124.2KB gz** (+ polyfills 38.6KB gz só em browsers legados — ver PERF-008).
> Rotas em `(app)` somam ainda o layout `(app)` **8.1KB gz**. "First Load est." = baseline +
> layout aplicável + chunk da página. Rotas de editor puxam adicionalmente o vendor ProseMirror/TipTap
> (chunk `3497` ~240KB **raw** em disco), **não** incluído no chunk da página abaixo.

| Rota | Chunk da página (gz) | First Load est. (gz) | Observação |
|---|--:|--:|---|
| `/sermons/[id]` (editor) | 21.4KB | ~153.7KB **+ TipTap** | mais pesada; carrega vendor ProseMirror (chunk 3497, 240KB raw) |
| `/sermons/[id]/present` | 11.6KB | ~144.0KB | caminho de púlpito (ver PERF-001/002) |
| `/sermons` (banco) | 10.4KB | ~142.7KB | waterfall + count no JS (PERF-005/006) |
| `/settings` | 7.9KB | ~140.2KB | |
| `/sermons/new` | 6.9KB | ~139.2KB | |
| `/` (landing público) | 6.4KB | ~130.6KB | sem layout (app) |
| `/admin/ai` | 5.8KB | ~138.1KB | |
| `/import` | 5.7KB | ~138.0KB | libs de import são server-only (OK) |
| `/admin/users/[id]` | 4.8KB | ~137.1KB | |
| `/notes` | 4.2KB | ~136.5KB | sem paginação (PERF-004) |
| `/settings/blocks` | 3.8KB | ~136.1KB | |
| `/bible` | 3.6KB | ~135.9KB | sem cache da API (PERF-003) |
| `/auth/login` | 3.0KB | ~127.2KB | sem layout (app) |
| `/admin/users` | 3.0KB | ~135.3KB | |
| `/admin/interests` | 2.0KB | ~134.3KB | |
| `/dashboard` | 1.7KB | ~134.0KB | Promise.all nos counts (OK) |
| `/study`, `/study/[moduleId]`, `/courses` | 1.2KB | ~133.5KB | |
| `/courses/[id]` | 0.8KB | ~133.1KB | |
| `/series` | 0.2KB | ~132.5KB | server component quase puro |
| `/help`, `/templates`, `/offline` | ~0.2KB | ~124–132KB | JS client ~nulo (bom) |

Vendor chunks grandes em disco (raw, `du -k`): `3497` 240KB (ProseMirror/TipTap — rotas de editor),
`5990` 184KB, `8519` 108KB, `framework` 188KB. Os shared `4bd1b696` (196KB) e `5838` (224KB) já
estão no baseline.

---

## Cobertura

Itens do inventário relevantes a performance e o veredito:

- **Rotas de página (22):** todas classificadas `ƒ` (dinâmicas por cookies de auth Supabase) — não há
  `force-dynamic` explícito em página (só em API). Cacheáveis/ISR: as públicas `/`, `/templates`
  poderiam ser estáticas puras (já são `○` no build). `/bible` depende da API externa (PERF-003).
  `/sermons` (PERF-004/005/006), `/sermons/[id]` (PERF-007/012, bundle TipTap), `/sermons/[id]/present`
  (PERF-001/002) → **Achados**. Demais rotas de listagem (`/notes`, `/admin/users`) → PERF-004. Restante: OK.
- **Route handlers (14):** `/api/bible*` (5) → **PERF-003**. `/api/sermons/slides/upload` (maxDuration 300),
  `/import` (maxDuration 30), `/ai/suggest` (maxDuration 30) → jobs longos já isolados em route handler
  com `maxDuration` adequado e libs server-only; **OK** para a stack Vercel atual (na migração VPS
  viram candidatos a fila — fora do escopo deste domínio). `/api/sermons/export` → OK. `force-dynamic`
  nos 7 handlers de mutação/upload é **correto**.
- **Server Actions (16 módulos):** `sermons/actions.ts`, `series/actions.ts`, `courses/actions.ts`
  usam `revalidatePath` corretamente (OK). `versions.ts` → **PERF-009**.
- **Queries (`lib/**/queries.ts`):** `sermons/queries.ts` (listSermons colunas explícitas OK;
  dashboardStats Promise.all OK; getSermon `*` → PERF-009). `notes/queries.ts`, `admin/queries.ts`
  → limites fixos sem paginação (**PERF-004**). Sem N+1 dentro de map/Promise.all encontrado (a única
  agregação-no-JS é PERF-005).
- **Caminho de present (`components/present/*`, 11 componentes):** PresentSlides, AudienceView,
  SlideProjection → **PERF-001**; page.tsx present → **PERF-002**; channel.ts → **OK** (cleanup correto,
  sem vazamento/sem reconexão automática mas re-abre via botão). PresentSessions, PresenterControl,
  PresentEsboco, ItemContent, PresentThemeToggle, PresentationChooser → sem achado de performance.
- **Editor (`components/editor/*`, hooks):** SermonEditor → **PERF-007/012**; useAutoSave → debounce OK,
  observação PERF-012.
- **Offline (`lib/offline/*`):** db.ts / sync.ts → **PERF-010**; last-write-wins implementado (OK);
  fila `pending_sermons` é keyed-by-id (não cresce sem limite); `cached_sermons` sem evicção (PERF-010).
- **Bundle:** libs pesadas server-only confirmado por grep (**OK**); polyfills grandes → **PERF-008**;
  falta bundle-analyzer → **PERF-011**.
- **CWV:** next/font (OK), sem `<img>` cru (OK), imagens de slide como CSS bg no present → PERF-001.

**Pendências de verificação manual:** PERF-012 (memoização do client no SermonEditor — não confirmada
nas linhas lidas); PERF-002 (comportamento real do SW `src/app/sw.ts` para navigation/imagens não foi
lido em detalhe — precisa inspeção do runtime caching declarado no Serwist).
