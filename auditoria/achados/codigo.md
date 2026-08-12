# Auditoria — Código e Arquitetura
_Data: 2026-08-12 · Referência: .claude/skills/auditoria-saas/references/03-codigo-arquitetura.md · Prefixo: COD_

> Baseline confirmado: `tsc --noEmit` 0 erros, `eslint` 0 erros, `next build` OK.
> O foco aqui é o que essas ferramentas NÃO pegam: robustez em runtime, contratos,
> validação, dívida e drift de documentação. Read-only; nenhum arquivo do projeto foi alterado.

## Resumo
- Itens verificados: 22 páginas · 14 route handlers · 16 módulos `"use server"` · 196 exports lib/hooks · 95 componentes
- Achados: **P0=0 · P1=1 · P2=8 · P3=4** (total 13)
- Nota do domínio: **6.5/10** — base sólida (Zod nos caminhos principais, `getUser()` server-side, escopo por `user_id`, `revalidatePath` nas mutações centrais), mas sem rede de segurança de erro no App Router, erros de Supabase engolidos em silêncio em várias ações, contrato de retorno heterogêneo e documentação enganosa.

---

## Achados

### [COD-001] App Router sem NENHUM `error.tsx` / `not-found.tsx` / `global-error.tsx` / `loading.tsx`
- **Severidade:** P1
- **Status:** Aberto
- **Local:** `src/app/**` (varredura completa — zero arquivos), confirmado em `auditoria/INVENTARIO.md:14`
- **Evidência:** `find src/app -name "error.tsx" -o -name "not-found.tsx" -o -name "global-error.tsx" -o -name "loading.tsx"` retorna vazio. Vários Server Components/ações fazem `throw` real, ex.: `src/lib/supabase/server.ts:36` (`throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurado")`), `src/app/api/sermons/slides/upload/route.ts:101` e leituras Supabase em páginas server (`dashboard`, `sermons/[id]`, `admin/*`) que podem lançar.
- **Impacto:** Qualquer exceção não tratada dentro de um segmento (leitura Supabase que estoura, jsonb malformado, env faltando) derruba a árvore inteira e mostra a tela de erro genérica do Next (tela branca/500 sem marca), sem botão "tentar de novo" e sem `not-found` para IDs inexistentes. É exatamente o cenário "páginas quebradas" que a referência classifica como P1.
- **Correção:**
  1. Criar `src/app/global-error.tsx` (client component com `reset()`), usando tokens VOX (`--vox-bg`, `--vox-ink`, fontes Fraunces/Geist), sem `#000` nem Inter.
  2. Criar `src/app/(app)/error.tsx` cobrindo o grupo autenticado, e `error.tsx` específicos em segmentos que leem dados que podem falhar: `sermons/[id]`, `sermons/[id]/present`, `courses/[id]`, `study/[moduleId]`, `admin/users/[id]`.
  3. Criar `not-found.tsx` na raiz e em `sermons/[id]`, `courses/[id]`, `study/[moduleId]`, `admin/users/[id]`, chamando `notFound()` nas páginas quando o registro escopado por `user_id` volta `null` (hoje várias renderizam estado vazio em vez de 404).
  4. Adicionar `loading.tsx` nos segmentos com leitura remota mais lenta (`dashboard`, `sermons`, `admin/*`) para dar fallback de suspense.
- **Verificação:** Forçar erro (ex.: remover `NEXT_PUBLIC_SUPABASE_URL` e abrir `/dashboard`, ou acessar `/sermons/<uuid-inexistente>`) e confirmar fallback com marca em vez de tela branca. `npm run build` continua verde.

---

### [COD-002] Erros do Supabase engolidos em silêncio em várias Server Actions (retornam `void`/`ok` mesmo falhando)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** múltiplos — ver evidência
- **Evidência:**
  - `src/lib/courses/actions.ts:97-108` `unlinkLessonAction` — `await supabase.from("course_lessons").delete()...` sem checar `error`, retorna `void`.
  - `src/lib/courses/actions.ts:110-122` `softDeleteCourseAction` — `if (!user) return;` (retorno mudo) e `update({ deleted_at })` sem checar `error`.
  - `src/lib/study/actions.ts:83-89` `generateFromStudyAction` — `update({ content: session.notes_content })` sem checar `error`; se falhar, o novo sermão fica sem conteúdo e a função ainda retorna `{ ok: true, id }`.
  - `src/lib/admin/users.ts:90-97` `createUserAction` — após criar o usuário no Auth, o `service.from("profiles").update({ role, name, denomination })` NÃO checa `error`; retorna `{ ok: true }` mesmo se o role não gravou → usuário criado como `usuario` em silêncio quando deveria ser `admin`.
  - `src/lib/exegesis/actions.ts:516-526` `retryFailedGroupsAction` — `update({ content, ... })` final sem checar `error`, retorna `{ ok: true }`.
  - `src/lib/profile/actions.ts:196-201` `deleteAccountAction` — soft-delete de todos os sermões sem checar `error` antes do `signOut()`.
  - `src/lib/sermons/actions.ts:299-302` `publishSermonAction` — chama `updateSermonMetaAction(...)` ignorando o retorno e faz `redirect()`; se o update falhou, o usuário é redirecionado como se tivesse publicado.
- **Impacto:** Operações de escrita (algumas sensíveis: mudança de role, exclusão de conta, publicação) falham sem qualquer sinal ao usuário nem log no servidor. Estado divergente entre UI e banco; bugs "fantasma" impossíveis de diagnosticar.
- **Correção:** Em cada ponto acima, capturar `const { error } = await ...` e retornar `{ ok: false, error: error.message }` (ou o formato padronizado do COD-005). Nos casos `void`, mudar a assinatura para `Promise<{ ok: boolean; error?: string }>`. Em `createUserAction`, se o `update` do profile falhar, considerar rollback (deletar o usuário Auth recém-criado) ou ao menos retornar erro explícito. Adicionar `console.error` com contexto (sem PII) no servidor antes de retornar.
- **Verificação:** Simular falha (ex.: `unlink` de par inexistente, ou negar RLS) e confirmar que a action agora retorna erro tratável e a UI exibe toast; grep `\.delete()\|\.update()\|\.insert(` nessas actions deve ter `error` checado logo abaixo.

---

### [COD-003] Rate-limit/cooldown em `Map` de memória — ineficaz em serverless e com vazamento de memória
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `src/app/api/ai/suggest/route.ts:38-54` · `src/lib/interests/actions.ts:42-50`
- **Evidência:**
  - `const buckets = new Map<string, { count: number; resetAt: number }>();` (linha 38) com comentário admitindo "In prod, mover rate limit para Upstash/Redis" (linhas 1-3).
  - `const INTEREST_COOLDOWN_KEYS = new Map<string, number>();` (linha 42) usado por `checkCooldown`.
- **Impacto:** Em Vercel/serverless cada invocação pode cair numa instância diferente e o `Map` reinicia em cold start; o limite de 10/h e o cooldown de 60s são efetivamente contornáveis. Pior: as chaves nunca são removidas (sem TTL/eviction) → o `Map` cresce indefinidamente na instância quente (memory leak). O `CLAUDE.md` global manda usar Upstash Redis para rate-limit.
- **Correção:** Trocar por `@upstash/redis` com `INCR`+`EXPIRE` (ou `@upstash/ratelimit`), chaveado por `userId`/`ip+email`. Deixar preparado para a migração ao Swarm (comentar que em TCP será `ioredis`). Enquanto Redis não estiver disponível, ao menos evictar chaves expiradas para conter o leak.
- **Verificação:** Após a troca, disparar >10 requisições em janelas separadas simulando instâncias distintas e confirmar contagem consistente; inspecionar que não há `new Map()` de nível de módulo para rate-limit (`grep -rn "new Map" src/app/api src/lib`).

---

### [COD-004] Server Actions que gravam no banco com argumentos escalares SEM validação Zod
- **Severidade:** P2
- **Status:** Aberto
- **Local:** múltiplos — ver evidência
- **Evidência:** a regra do projeto é "sempre Zod antes de salvar". As actions com input em objeto validam, mas as que recebem IDs/escalares soltos vão direto ao banco:
  - `src/lib/courses/actions.ts:75-95` `linkLessonAction(courseId, sermonId, order)` — `upsert` em `course_lessons` sem Zod.
  - `src/lib/series/actions.ts:144-162` `linkSermonToSeriesAction(sermonId, seriesId)` — `update` de `sermons.series_id` sem Zod (uuid não validado).
  - `src/lib/sermons/versions.ts:19-65` `saveSermonVersion({ sermonId, note })` — `insert` em `sermon_versions`; `SnapshotInput` é interface TS, não schema Zod.
  - `src/lib/sermons/actions.ts:127,145,167,188` `archive/unarchive/permanentDelete/softDelete` — recebem `id: string` cru e vão ao `update/delete`.
  - `src/lib/sermons/engagements.ts:81-101` `deleteEngagement(engagementId, sermonId)` — sem Zod.
  - `src/lib/exegesis/actions.ts:400,535` `retryFailedGroupsAction`, `unlinkExegesisFromSermonAction` — args crus.
  - `src/lib/admin/users.ts:114,143,177,224` `updateUserRole/Plan/setActive/delete` — `userId: string` cru chega a escrita com **service_role** (bypassa RLS) sem `z.string().uuid()`.
- **Impacto:** Viola regra inegociável do `CLAUDE.md` ("Sempre Zod"). Sem validação de formato, IDs malformados chegam ao PostgREST; nos writes com service_role (admin/users) a ausência de validação é mais grave por não ter RLS como rede.
- **Correção:** Definir schemas Zod (`z.string().uuid()` para IDs, `z.number().int().min(0)` para `order`, etc.) e `safeParse` no topo de cada action antes de tocar o banco, retornando o erro no formato padrão. Para as actions admin, validar `userId` como uuid explicitamente.
- **Verificação:** `grep -L "safeParse" ` nas actions listadas deve ficar vazio; passar um id inválido e confirmar rejeição antes da query.

---

### [COD-005] Contrato de retorno das Server Actions é heterogêneo (5+ formatos diferentes)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** transversal aos módulos `"use server"`
- **Evidência:** coexistem, sem padrão único:
  - União discriminada `{ ok: true; id } | { ok: false; error }`: `sermons/actions.ts:38` `CreateResult`, `courses/actions.ts:19`, `series/actions.ts:16`, `sermons/engagements.ts:19`, `admin/users.ts:23`, `sermons/versions.ts:10`.
  - Frouxo `{ ok: boolean; error?: string }`: `sermons/actions.ts:275`, `courses/actions.ts:79`, `series/actions.ts:79,128,147`, `study/actions.ts:18`, todas as `profile/actions.ts`, `admin/users.ts:117,146,180,227`, `blocks/colors.ts:32`, `exegesis/actions.ts:402,538`.
  - `void`: `courses/actions.ts:100,110`, `sermons/actions.ts:299` (`publishSermonAction`), `supabase/actions.ts:149` (`logoutAction`).
  - `{ ok; id?; error? }` / `{ ok; sermonId? }`: `study/actions.ts:54`, `sermons/versions.ts:110`.
  - `MutationResult<T>` com `data?`: `notes/actions.ts:13`.
  - `ActionState`/`InterestState` com `fieldErrors`: `supabase/actions.ts:41`, `interests/actions.ts:27`.
- **Impacto:** A UI não consegue tratar retorno de forma uniforme; cada caller precisa saber o formato exato. Divergências silenciosas (ex.: caller esperando `{ error }` e recebendo `void`) viram bugs de "nada acontece" ou toast que nunca aparece. Aumenta o custo de cada nova tela e o risco de regressão.
- **Correção:** Padronizar um único tipo `ActionResult<T = void>` (ex.: `{ ok: true; data?: T } | { ok: false; error: string; fieldErrors?: Record<string,string> }`) em `src/lib/types.ts` e migrar as actions para ele, eliminando os retornos `void`. Ajustar os callers.
- **Verificação:** `grep -rn "Promise<void>" src/lib/**/actions.ts src/lib/**/*.ts` (arquivos `"use server"`) não deve retornar mutações; conferir que a UI usa um helper único para exibir `result.error`.

---

### [COD-006] `src/lib/mocks/` guarda CONFIG e TIPOS de produção (nome enganoso; risco de exclusão indevida)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `src/lib/mocks/blocks.ts`, `frameworks.ts`, `content-types.ts` — importados por ~40 arquivos de produção
- **Evidência:** `grep` de imports de `@/lib/mocks/*` fora de `mocks/` retorna ~40 ocorrências em rotas, route handlers, `lib/` e componentes, todas de **config real**, não dado falso:
  - `src/lib/blocks/colors.ts:8`, `src/app/api/sermons/export/route.ts:14-15`, `src/lib/import/parser.ts:13,20`, `src/lib/sermons/{slides,sessions,preaching-principles,export-tokens}.ts`, `src/components/editor/*`, `src/components/present/*` importam `VOX_BLOCK_TYPES`, `getBlockType`, `blockColor`, `VOX_FRAMEWORKS`, `getFramework`, `CONTENT_TYPES` e os tipos `BlockTypeId`/`FrameworkId`.
  - Os arrays de dado mock de fato (`MOCK_SERMONS`, `MOCK_SERIES`, `MOCK_SLIDES_BY_SERMON`) estão **vazios** (`src/lib/mocks/sermons.ts:44-46`, `slides.ts:15`) — ou seja, nenhuma tela mostra dado falso; o problema é de arquitetura/nomenclatura.
- **Impacto:** Constantes canônicas do domínio (tipos de bloco, frameworks homiléticos, tipos de conteúdo) e tipos usados como shape de dados vivem sob um diretório chamado `mocks`. Qualquer dev fazendo "limpeza de mocks antes de produção" quebra o app inteiro (editor, apresentação, export, import). É uma armadilha de manutenção séria e viola a expectativa de `lib/` conter a fonte da verdade.
- **Correção:** Mover o conteúdo de produção para módulos com nome honesto e atualizar imports:
  - `mocks/blocks.ts` → `src/lib/blocks/types.ts` (VOX_BLOCK_TYPES, BlockType, BlockTypeId, getBlockType, blockColor, sessionRoleColor).
  - `mocks/frameworks.ts` → `src/lib/frameworks/catalog.ts`.
  - `mocks/content-types.ts` → `src/lib/content-types.ts`.
  - Renomear os tipos `MockSermon`/`MockEngagement`/`MockVersion`/`MockSlide` para `SermonSummary`/`Engagement`/`VersionMeta`/`Slide` em `src/types/`.
  - Fazer um `codemod`/find-replace dos imports. Manter em commit atômico separado do resto.
- **Verificação:** `grep -rn "@/lib/mocks" src` só deve sobrar (idealmente zero) em arquivos realmente de fixture; `npm run typecheck && npm run build` verdes.

---

### [COD-007] Sem validação de variáveis de ambiente no boot (`env.ts` com Zod ausente)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** projeto inteiro; asserts em `src/lib/supabase/server.ts:11-12,39`, `middleware.ts:12-13`, `client.ts:9-10`
- **Evidência:** não existe módulo de validação de env (`grep` por `envSchema`/`createEnv`/`z.object` sobre `process.env` retorna vazio; não há `src/env.ts`). Os clients Supabase usam non-null assertion cega: `process.env.NEXT_PUBLIC_SUPABASE_URL!`. A checagem real está espalhada em `if (!process.env.NEXT_PUBLIC_SUPABASE_URL)` dezenas de vezes nas actions (modo demo).
- **Impacto:** Se uma env obrigatória faltar em produção, o `!` esconde o problema em tempo de compilação e o app quebra tarde e de forma obscura em runtime (`createServerClient(undefined!, ...)`), em vez de falhar cedo e claro. A referência classifica ausência de validação de env no boot como P2. Além disso, as ~30 checagens espalhadas de "modo demo" são a consequência de não ter um ponto único.
- **Correção:** Criar `src/env.ts` validando com Zod (`NEXT_PUBLIC_SUPABASE_URL: z.string().url()`, `NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1)`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `BIBLE_API_TOKEN`, etc., com `.optional()` para as que são opcionais). Importar no topo dos clients e substituir os `!` por acesso ao objeto validado. Documentar quais são obrigatórias vs opcionais.
- **Verificação:** Remover uma env obrigatória e confirmar erro claro no boot/build citando a variável; `grep -rn "process.env.NEXT_PUBLIC_SUPABASE_URL!" src` deve zerar.

---

### [COD-008] Documentação (`CLAUDE.md`/`.env.example`) diverge do repositório — armadilha para dev novo
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `CLAUDE.md` (raiz) vs `package.json`, `next.config.ts`, `src/lib/bible/client.ts`, `src/types/database.ts`
- **Evidência (drift concreto):**
  1. **PWA/Service Worker:** `CLAUDE.md` ("Sabotagens conhecidas") afirma "o SW não [está pronto], `next-pwa` ainda não suporta Next 16" e a tabela de stack diz "PWA/Offline: next-pwa". Realidade: `package.json:15,41` tem `@serwist/next` e `serwist`; `next.config.ts` chama `withSerwistInit({ swSrc: "src/app/sw.ts", swDest: "public/sw.js" })`; existem `src/app/sw.ts` e `src/components/shared/ServiceWorkerRegister.tsx`. O SW está implementado.
  2. **Next/Hospedagem:** `CLAUDE.md` diz "Next.js 15"; `package.json:33` = `next 16.2.6`.
  3. **`database.ts`:** `CLAUDE.md` diz que é "stub manual" sem "Relationships reais". Realidade: `src/types/database.ts` tem 868 linhas com `Row/Insert/Update/Relationships` completos gerados (ex.: `:41-49`). O cabeçalho do próprio arquivo diz "gerados automaticamente".
  4. **Bíblia:** `CLAUDE.md` diz "API.Bible atrás de /api/bible" e cita a env `BIBLE_API_KEY`. Realidade: `src/lib/bible/client.ts:45,49` usa `process.env.BIBLE_API_URL` (default `abibliadigital.com.br`) e `process.env.BIBLE_API_TOKEN`. `.env.example` confirma `BIBLE_API_TOKEN`/`BIBLE_API_URL`. Um dev que seguir o `CLAUDE.md` define `BIBLE_API_KEY` e a integração da Bíblia não funciona.
  5. **Escopo:** `CLAUDE.md` descreve "32 issues do MVP" e não menciona admin, planos, exegeses, notas nem papéis — todos presentes (migrations `013`..`032`, `src/lib/admin/*`, `exegesis/*`, `notes/*`, `interests/*`).
- **Impacto:** Instruções que o próprio ambiente marca como OVERRIDE de comportamento estão factualmente erradas. Um dev (ou agente) novo configura a env errada da Bíblia, tenta "substituir o stub" que já é real, ou reimplementa o SW. Perda de tempo e configuração quebrada.
- **Correção:** Atualizar `CLAUDE.md`: (a) stack PWA = `@serwist/next` + `src/app/sw.ts`; (b) Next 16; (c) `database.ts` já é tipo gerado real (remover o item de "sabotagem"); (d) Bíblia = abibliadigital.com.br via `BIBLE_API_TOKEN`/`BIBLE_API_URL` (corrigir a menção a `BIBLE_API_KEY`); (e) acrescentar admin/planos/exegeses/notas/papéis ao "Produto"/"Estado atual". Fazer em commit `docs:` isolado.
- **Verificação:** Reler o `CLAUDE.md` corrigido lado a lado com `package.json`/`next.config.ts`/`bible/client.ts` sem divergências.

---

### [COD-009] `any` explícito e casts `as unknown as` em fronteiras de dados sem validação de runtime
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `src/lib/exegesis/actions.ts` e queries com jsonb/joins
- **Evidência:**
  - `src/lib/exegesis/actions.ts:89-90` — `// eslint-disable-next-line @typescript-eslint/no-explicit-any` seguido de `schema: any`. É `any` de fato em código de domínio, proibido pela regra 2 do `CLAUDE.md`; o lint só passa porque foi suprimido.
  - `src/lib/exegesis/actions.ts:429` — `const currentContent = row.content as unknown as ExegesisContent;` — jsonb do banco convertido para tipo rico **sem Zod**; se o shape gravado divergir, o código acessa `currentContent.pericope`/`.sintese` e quebra em runtime.
  - `src/lib/exegesis/actions.ts:340,519` — `content as unknown as never` para driblar o tipo `Json` do Insert.
  - `src/lib/admin/ai-queries.ts:27` e `src/lib/ai/client.ts:74` — `data.model_prices as unknown as Record<string, ModelPrice>` (jsonb → tipo, sem validação).
  - `src/lib/admin/queries.ts:281` — `(links ?? []) as unknown as LinkRow[]`; `src/lib/exegesis/queries.ts:55` — `(data ?? []) as unknown as JoinRow[]`; `src/app/api/sermons/slides/[slideId]/route.ts:42` — `data as unknown as { sermons?: ... }` (tipo de join aninhado).
- **Impacto:** Nas fronteiras jsonb/join o compilador está cego; o valor "tipado" pode não corresponder ao que veio do banco. Leituras subsequentes de campos podem lançar (`Cannot read properties of undefined`) e — combinado com o COD-001 — resultam em tela branca. A referência trata `any`/cast em boundary de dados como P2 (P1 se em boundary crítico).
- **Correção:** Substituir o `schema: any` por um tipo mínimo (ex.: `{ name: string; schema: Record<string, unknown>; strict?: boolean }` conforme o formato `json_schema` do OpenAI). Para os jsonb (`ExegesisContent`, `model_prices`, `content`), definir schema Zod e usar `zSchema.parse(row.content)` (ou `safeParse` com fallback) em vez de `as unknown as`, derivando o tipo com `z.infer`. Para joins, considerar regenerar tipos e usar o retorno tipado do Supabase.
- **Verificação:** `grep -rn ": any\|as unknown as\|@ts-expect-error\|@ts-ignore" src` só deve sobrar em casts de bibliotecas nativas realmente sem tipo (ex.: canvas do pdfjs em `slides/upload/route.ts`, que é documentado). Fronteiras de dados passam por Zod.

---

### [COD-010] Código morto: diretório `src/stores/` vazio e funções/arrays de `mocks/` nunca importados
- **Severidade:** P3
- **Status:** Aberto
- **Local:** `src/stores/` · `src/lib/mocks/{sermons,slides,versions,engagements}.ts`
- **Evidência:**
  - `ls -la src/stores/` → apenas `.`/`..` (diretório morto; o `CLAUDE.md` lista `stores/` e cita Zustand, mas não há nenhum store).
  - `grep` fora de `mocks/` por `getMockEngagements`, `getMockSlides`, `getMockVersions`, `recentSermons`, `mockSermonContent`, `MOCK_SERIES`, `MOCK_SERMONS`, `MOCK_SLIDES_BY_SERMON` → **zero** usos. Essas funções/arrays (`src/lib/mocks/sermons.ts:32,44,46,48`, `slides.ts:15,17`, `versions.ts:13`, `engagements.ts:14`) são exports órfãos.
- **Impacto:** Ruído de manutenção e falsa impressão de features (stores/Zustand). Exports órfãos confundem quem procura a origem dos dados.
- **Correção:** Remover `src/stores/` (ou popular quando houver store real). Após o COD-006, apagar as funções/arrays mock não usados (`getMock*`, `recentSermons`, `mockSermonContent`, `MOCK_*`). Atualizar o `CLAUDE.md` se `stores/` sair.
- **Verificação:** `git status` mostra remoções; `npm run typecheck && npm run build` verdes; `grep -rn "getMock\|MOCK_SERMONS\|recentSermons" src` zera.

---

### [COD-011] Mutações sem `revalidatePath` deixam a UI stale
- **Severidade:** P3
- **Status:** Aberto
- **Local:** `src/lib/study/actions.ts:51-91` · `src/lib/interests/actions.ts:121-150`
- **Evidência:**
  - `generateFromStudyAction` cria um novo sermão e atualiza seu `content`, mas **não** chama `revalidatePath("/sermons")` nem revalida a página do sermão criado (compare com `createSermonAction`, que revalida `/sermons` e `/dashboard`).
  - `updateInterestStatusAction` faz `update` em `signup_interests` e retorna `{ ok: true }` **sem** `revalidatePath("/admin/interests")`; a lista de interesses do admin continua mostrando o status antigo até refresh manual.
- **Impacto:** Após gerar um sermão a partir do estudo, ele não aparece na lista `/sermons` sem reload; após mudar o status de um interesse, a tabela admin fica desatualizada. Inconsistência com o resto do código, que revalida.
- **Correção:** Em `generateFromStudyAction`, antes do `return`, `revalidatePath("/sermons")` e `revalidatePath("/dashboard")`. Em `updateInterestStatusAction`, `revalidatePath("/admin/interests")`.
- **Verificação:** Exercitar os dois fluxos e confirmar atualização imediata da lista sem reload manual.

---

### [COD-012] Boilerplate de autenticação duplicado entre os módulos de actions (padrão inconsistente)
- **Severidade:** P3
- **Status:** Aberto
- **Local:** `courses/actions.ts`, `series/actions.ts`, `study/actions.ts`, `profile/actions.ts`, `sermons/engagements.ts`, `sermons/versions.ts`, `exegesis/actions.ts`
- **Evidência:** o trio `const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return { ok: false, error: "Não autenticado" };` se repete literalmente em ~20 funções. Alguns módulos já extraíram um helper (`sermons/actions.ts:112` `getAuthedClient()`, `notes/actions.ts:24` `authed()`, `admin/users.ts:27` `assertAdmin()`), mas os demais copiam inline — sem um padrão único.
- **Impacto:** Baixa manutenibilidade e risco de esquecer a checagem em uma action nova (já há actions que fazem `if (!user) return;` mudo — COD-002). A referência pede baixo acoplamento e responsabilidade única.
- **Correção:** Extrair um único helper compartilhado (ex.: `src/lib/supabase/authed.ts` exportando `requireUser()`/`requireAdmin()` retornando a união `{ ok, supabase, userId } | { ok:false, error }`) e reusar em todos os módulos de action, eliminando as cópias inline.
- **Verificação:** `grep -rn "auth.getUser()" src/lib/**/actions.ts` deve ficar concentrado no helper; typecheck/build verdes.

---

### [COD-013] Data-fetching em `useEffect` de Client Component onde caberia Server Component
- **Severidade:** P3
- **Status:** Aberto
- **Local:** `src/components/bible/VerseOfTheDay.tsx:27` · `src/components/sermon/LinkPicker.tsx:53` · `src/components/sermon/LinkSeriesDialog.tsx:55`
- **Evidência:** os três componentes têm `"use client"` e disparam `fetch(...)` dentro de `useEffect` (`/api/bible/random`, `/api/series-and-courses`). O `LinkPicker`/`LinkSeriesDialog` buscam a lista de séries/cursos toda vez que abrem; `VerseOfTheDay` busca o versículo no cliente. A regra 7 do `CLAUDE.md` diz "Fetch de dados sempre em Server Components ou Route Handlers".
- **Impacto:** Menor — os fetches passam por route handlers (não expõem segredo) e há motivos plausíveis (lazy-load ao abrir diálogo, widget que pode querer atualizar). Mas geram flash de loading, waterfalls no cliente e poderiam ser Server Components/props para dados que já existem no request. Nota como dívida de padrão, não bug funcional.
- **Correção:** Onde os dados já existem no server (ex.: séries/cursos do usuário no fluxo de criação), passar por props a partir de um Server Component pai em vez de refetch no `useEffect`. Para `VerseOfTheDay`, avaliar renderizar o versículo inicial no server e só refazer no cliente se houver interação. Manter route handler apenas onde a interatividade justifica.
- **Verificação:** Após refatorar, confirmar que a lista já vem preenchida na abertura sem flash e sem chamada de rede redundante (aba Network).

---

## Cobertura

### Route handlers (14/14)
| Handler | Veredito |
|---|---|
| `api/ai/suggest` | Achado COD-003 (rate-limit em memória); Zod + auth + `ai_enabled` OK |
| `api/bible`, `bible/books`, `bible/chapter`, `bible/random`, `bible/search` | OK (proxy; env `BIBLE_API_TOKEN` — ver drift COD-008) |
| `api/series-and-courses` | OK com ressalva: `catch { return empty }` (`route.ts:57`) engole erro e devolve listas vazias em vez de sinalizar falha — relacionado a COD-002 (silencioso, baixo impacto) |
| `api/sermons/export` | OK (importa config de `mocks/` — COD-006) |
| `api/sermons/import` | OK (`content as unknown as Json` — família COD-009) |
| `api/sermons/import/template` | OK (`export function GET()`; inventário marcou "sem método" por só varrer `async` — falso alarme do inventário) |
| `api/sermons/slides/[slideId]` | OK; cast de join documentado (COD-009 `route.ts:42`) |
| `api/sermons/slides/google`, `slides/manual`, `slides/upload` | OK (Zod + auth + ownership + limpeza de órfãos); casts do canvas pdfjs são de lib nativa sem tipo, documentados |

### Módulos `"use server"` (16/16)
| Módulo | Veredito |
|---|---|
| `sermons/actions.ts` | COD-002 (`publishSermonAction`), COD-004, COD-005 |
| `sermons/engagements.ts` | COD-004, COD-005 |
| `sermons/versions.ts` | COD-004 (SnapshotInput sem Zod), COD-005 |
| `courses/actions.ts` | COD-002 (`unlink`/`softDelete` mudos), COD-004, COD-005 |
| `series/actions.ts` | COD-004 (`linkSermonToSeries`), COD-005; defesa anti-ciclo OK |
| `study/actions.ts` | COD-002, COD-004, COD-005, COD-011 |
| `notes/actions.ts` | OK — melhor padrão (helper `authed()`, Zod, revalidate); `skeleton as unknown as Json` (COD-009 leve) |
| `profile/actions.ts` | COD-002 (`deleteAccount`), COD-005; gates de plano/IA OK |
| `interests/actions.ts` | COD-003 (cooldown Map), COD-011 (revalidate), COD-005 |
| `admin/users.ts` | COD-002 (`createUser` não checa update de role — **grave**), COD-004; `assertAdmin` OK |
| `admin/ai.ts` | OK — `isCurrentUserAdmin` + Zod + revalidate |
| `admin/ai-queries.ts`, `admin/ai-types.ts` | COD-009 (`model_prices as unknown as`) |
| `blocks/colors.ts` | OK (Zod, revalidate); importa de `mocks/` (COD-006) |
| `exegesis/actions.ts` | COD-002 (`retry` update mudo), COD-004, COD-009 (`schema: any`, casts de `content`) |
| `supabase/actions.ts` (auth) | OK — Zod, `getUser`, mensagens amigáveis, bloqueio de conta inativa; `logoutAction` retorna void (COD-005) |

### Type safety / boundary (item A)
- `tsconfig strict` ON, tipos Supabase reais em uso (`createServerClient<Database>`). Achados: COD-009 (`any` + casts jsonb/join) e COD-007 (`!` em env). `database.ts` é gerado real (contraria o `CLAUDE.md` — COD-008).

### Server/Client, duplicação, dead code (itens D, E, I)
- 88 arquivos `"use client"` — amostrados os de fetch (COD-013). `src/lib/mocks/` = config de produção (COD-006). `src/stores/` vazio + exports mock órfãos (COD-010). Duplicação de auth (COD-012). Imports de `mocks/` fora de `mocks/`: ~40 (todos config/tipo, dados mock vazios — sem tela com dado falso).

### Itens sem achado (OK)
- `revalidatePath` presente na grande maioria das mutações (13 módulos). `getUser()` (não `getSession()`) usado server-side em todas as actions/handlers verificados. Escopo por `user_id` presente nas queries de dados do usuário. Zod presente em todas as actions com input em objeto e em todos os route handlers de escrita. Sem `catch` engolindo erro em código server crítico além dos listados (a maioria dos `catch {}` está em client components para best-effort: localStorage, BroadcastChannel, wakeLock — aceitável).

### Pendências de verificação manual
- **Testes automatizados:** 0 (inventário linha 21). Fora do escopo estrito deste domínio (QA), mas registrado: sem script `test`/runner, nenhuma das correções acima terá regressão coberta. Recomenda-se criar o runner e testar ao menos os contratos de retorno (COD-005) e as actions com erro silencioso (COD-002).

---

### [COD-014] `eslint` falha (exit 1) — 93 erros; o baseline "lint limpo" desta auditoria estava errado
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `eslint.config.mjs:9-15` (globalIgnores) · 15 componentes em `src/components/**` · `src/hooks/useBibleReference.ts:39`
- **Evidência:** `npx eslint .` retorna **exit 1** com `191 problems (93 errors, 98 warnings)`.
  A Fase 0 desta auditoria registrou "lint 0 erros" — leitura **incorreta**: o comando foi executado
  com pipe (`npx eslint . | tail`), e o `$?` capturado era o do `tail`, não o do eslint. Medição correta:

  | Escopo | Erros | Avisos |
  |---|--:|--:|
  | `src/` | **18** | 9 |
  | `design-system/` + `public/sw.js` | 75 | 89 |

  Os 75 erros de fora do `src/` são ruído de configuração, não dívida real:
  `design-system/vox/*.jsx` é biblioteca de referência visual (usa componentes não importados →
  70× `react/jsx-no-undef`) e `public/sw.js` é artefato **gerado pelo build** e ignorado pelo git
  (`.gitignore:41`), minificado (→ `no-unused-expressions`). O `globalIgnores` de
  `eslint.config.mjs` sobrescreve os defaults do `eslint-config-next` e não reintroduz
  `public/sw.js` nem `design-system/**`.

  Os 18 erros reais em `src/` são:
  - **16× regra do React Compiler** "Calling setState synchronously within an effect can trigger
    cascading renders" — `CreateUserDialog.tsx:96`, `RegisterForm.tsx:41`, `BiblePalette.tsx:79`,
    `BibleSidePanel.tsx:97,124`, `SlashCommandMenu.tsx:169`, `VersionsDialog.tsx:72`,
    `NotesWorkspace.tsx:86,98`, `PresentSessions.tsx:112`, `FrameworkHintDialog.tsx:49`,
    `LinkSeriesDialog.tsx:51`, `SermonActionsMenu.tsx:63`, `AppSidebar.tsx:56`,
    `OfflineBadge.tsx:11`, `useBibleReference.ts:39`.
  - **1× `prefer-const`** — `ExegesisMarkdown.tsx:15` (`remaining` nunca reatribuído).
  - **1× `@next/next/no-html-link-for-pages`** — `AppHeader.tsx:106`. **Confirma o FE-006** por via
    independente: o lint já apontava esse bug, mas ninguém executava o lint.
- **Impacto:** Duplo. (a) O Portão Zero-Erro nunca esteve verde de verdade — a etapa de lint falha
  hoje, e como não há CI (OPS-001) ninguém percebeu. (b) Os 16 `setState` em efeito são renders em
  cascata reais, que agravam o PERF-007 (jank do editor). O FE-006 prova que há bug de produto
  escondido nesse ruído: com 93 erros na saída, ninguém lê a saída.
- **Correção:**
  1. Em `eslint.config.mjs`, acrescentar ao `globalIgnores`: `"public/sw.js"`, `"public/workbox-*.js"`,
     `"design-system/**"`. Isso derruba 75 erros que não são código da aplicação e torna a saída legível.
  2. `npx eslint src --fix` resolve o `prefer-const`.
  3. Corrigir `AppHeader.tsx:106` trocando `<a>` por `<Link>` (fecha FE-006 junto).
  4. Tratar os 16 `setState`-em-efeito um a um: a maioria é estado derivado que deve virar valor
     calculado em render ou `useMemo`, não `useEffect` + `setState`.
  5. Só então o lint pode entrar no CI como etapa bloqueante (OPS-001).
- **Verificação:** `npx eslint .; echo $?` deve imprimir `0` — conferir o exit code **sem pipe**,
  que é justamente o erro de método que produziu o baseline falso.
