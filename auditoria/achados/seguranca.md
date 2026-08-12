# Auditoria — Segurança
_Data: 2026-08-12 · Referência: .claude/skills/auditoria-saas/references/01-seguranca.md · Itens do inventário cobertos: 14/14 route handlers, 16/16 arquivos "use server", middleware, 4/4 páginas admin, migrations RLS_

## Resumo
- Itens verificados: 14 route handlers + 16 módulos de Server Actions + middleware + 4 páginas admin + 17 tabelas RLS + npm audit + varredura de histórico git · Achados: P0=0 P1=1 P2=6 P3=4 · Nota do domínio: 6.5/10

## Achados

### [SEG-001] Política de INSERT aberta em `chapter_exegeses` permite envenenar o cache global compartilhado entre todos os usuários
- **Severidade:** P1
- **Status:** Aberto
- **Local:** supabase/migrations/026_chapter_exegeses.sql:56-66 (política) · src/lib/exegesis/actions.ts:333-350 (write via anon client)
- **Evidência:**
  ```sql
  -- Qualquer autenticado lê o catálogo (cache compartilhado)
  create policy "Authed read chapter_exegeses" on public.chapter_exegeses
    for select using (auth.uid() is not null);
  -- Apenas service_role escreve (...) Pra simplicidade, deixo escrita aberta a authed também.
  create policy "Authed insert chapter_exegeses" on public.chapter_exegeses
    for insert with check (auth.uid() is not null);
  ```
  `chapter_exegeses` é um catálogo GLOBAL, único por `(book_abbrev, chapter, version)` (linha 43), lido por TODOS os usuários autenticados. O `createExegesisAction` faz cache-lookup e devolve o conteúdo dessa tabela para qualquer usuário (src/lib/exegesis/actions.ts:183-206). A única barreira de plano/ai_enabled está na camada de aplicação (linhas 161-180); a policy de banco não a replica.
- **Impacto:** Qualquer usuário autenticado (inclusive plano `manuscrito`, sem IA) pode, direto do browser com a anon key + o próprio JWT, executar `supabase.from('chapter_exegeses').insert({ book_abbrev:'rm', chapter:5, version:'ARC', content:{...conteúdo malicioso...}, model:'x' })` e pré-semear a entrada de um capítulo. Como o `unique(book_abbrev,chapter,version)` transforma essa linha no "cache hit" servido a todos, o atacante injeta conteúdo teológico falso/malicioso que TODO usuário Concílio passa a ler como se fosse a exegese oficial. É corrupção de dado multi-tenant (integridade cross-tenant) + bypass do gate de plano/custo/cap.
- **Correção:** Restringir a escrita ao `service_role` e rotear toda gravação por Server Action/route usando `createServiceClient()` DEPOIS de validar plano. Passos: (1) nova migration que faz `drop policy "Authed insert chapter_exegeses"` e recria como `for insert with check (auth.role() = 'service_role')`; (2) em `createExegesisAction` e `retryFailedGroupsAction`, trocar o `createClient()` que grava em `chapter_exegeses` por `createServiceClient()` após checar `plan==='concilio' && ai_enabled` e o cap. (3) Manter SELECT como está (catálogo compartilhado é intencional).
- **Verificação:** Como usuário não-admin autenticado, `await supabase.from('chapter_exegeses').insert({...})` deve retornar erro de RLS (`new row violates row-level security policy`). SQL: `select policyname, cmd, with_check from pg_policies where tablename='chapter_exegeses';` — INSERT deve exigir `service_role`.

### [SEG-002] Proxy `/api/bible/*` é público sem autenticação e SEM rate limiting (o comentário afirma que há, mas não existe)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** src/middleware.ts:14 · src/app/api/bible/route.ts, src/app/api/bible/search/route.ts, src/app/api/bible/random/route.ts, src/app/api/bible/chapter/route.ts, src/app/api/bible/books/route.ts
- **Evidência:** No middleware:
  ```ts
  if (pathname.startsWith("/api/bible")) return true; // proxy público (rate-limit no handler)
  ```
  Porém nenhum dos 5 handlers de `/api/bible/*` implementa rate limiting — não há `Map`, nem `@upstash/ratelimit`, nem checagem de auth. `searchVerses` faz `POST` ao serviço externo com `cache: "no-store"` (src/lib/bible/client.ts:71-89), e `random` usa `revalidate:false` (client.ts:142-145), ou seja, sem cache. Todas as chamadas usam o `BIBLE_API_TOKEN` do servidor (client.ts:48-51).
- **Impacto:** Qualquer pessoa na internet (sem login) pode marretelar `/api/bible/search?q=...` e `/api/bible/random`, cada request batendo em abibliadigital.com.br com o token do servidor → exaustão de cota/limite do token externo (possível ban), custo, e uso do app como proxy aberto (SSRF limitado ao host fixo). A promessa "rate-limit no handler" é falsa.
- **Correção:** Adicionar rate limiting por IP (Upstash `Ratelimit` — coerente com a stack; na VPS trocar adaptador p/ Redis TCP) nos handlers de `/api/bible/*`, e/ou exigir sessão. Cachear `search` (mesma query → mesmo resultado por 24h). Como mínimo, limitar requisições anônimas por IP e por janela.
- **Verificação:** `for i in $(seq 1 60); do curl -s -o /dev/null -w "%{http_code}\n" 'https://<host>/api/bible/random'; done` — deve retornar `429` após o limite configurado.

### [SEG-003] `retryFailedGroupsAction` chama a OpenAI sem checar plano/`ai_enabled` nem o cap mensal — abuso de custo por qualquer autenticado
- **Severidade:** P2
- **Status:** Aberto
- **Local:** src/lib/exegesis/actions.ts:400-529
- **Evidência:** A função só valida `if (!user) return { ok:false, error:"Não autenticado" }` (linhas 406-407). Depois lê `chapter_exegeses` por id SEM checagem de propriedade/plano (409-416) e chama `callGroup(...)` → OpenAI para cada grupo em `failedGroups` (434-503). Não há o guard que existe em `createExegesisAction` (161-227: `profile.plan !== 'concilio'`, `!profile.ai_enabled`, `monthly_user_cap_usd`).
- **Impacto:** Qualquer usuário autenticado (mesmo `manuscrito`, IA desligada) pode disparar chamadas pagas à OpenAI passando um `exegesisId` válido. Como a policy de SELECT de `chapter_exegeses` é aberta a todo autenticado (SEG-001), os ids e `failed_groups` são descobríveis. Chamadas repetidas queimam orçamento sem nenhum cap. (O UPDATE na tabela é bloqueado silenciosamente pela RLS de admin, mas o custo da OpenAI já foi incorrido antes.)
- **Correção:** Replicar o guard de `createExegesisAction` no início de `retryFailedGroupsAction`: carregar `profiles.plan, ai_enabled`, exigir `plan==='concilio' && ai_enabled`, e checar `monthly_user_cap_usd` ANTES de qualquer `callGroup`. Além disso, verificar que o usuário tem direito de tocar naquela exegese (ex.: existe vínculo em `sermon_exegeses` com `user_id = user.id`, ou é admin).
- **Verificação:** Autenticado como `manuscrito`, chamar `retryFailedGroupsAction(<id>)` deve retornar erro de plano ANTES de qualquer chamada à OpenAI (nenhum incremento de tokens/custo em `chapter_exegeses`).

### [SEG-004] `plan` e `ai_enabled` são auto-atribuíveis pelo próprio usuário — sem billing e sem trigger de proteção (bypass do paywall / habilita custo de IA)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** src/lib/profile/actions.ts:130-158 (updatePlanAction) · supabase/migrations/001_profiles.sql:27-29 (policy owner update) · supabase/migrations/022_plans.sql
- **Evidência:** `updatePlanAction` recebe `plan` do usuário e grava sem qualquer verificação de pagamento/autorização:
  ```ts
  const updates = { plan: parsed.data.plan, ai_enabled: parsed.data.plan === "concilio" };
  await supabase.from("profiles").update(updates).eq("id", user.id);
  ```
  A RLS "Profile owner updates" (`for update using (auth.uid() = id)`) libera o dono a atualizar qualquer coluna não-protegida. Só `role` (013) e `is_active` (027/029) têm trigger de proteção; `plan` e `ai_enabled` NÃO. Logo o usuário também pode `supabase.from('profiles').update({ plan:'concilio', ai_enabled:true }).eq('id', <self>)` direto do browser.
- **Impacto:** `concilio` é o tier pago/IA. Qualquer usuário se auto-promove de graça e liga a IA, gerando custo de OpenAI para a plataforma. O cap `monthly_user_cap_usd` (default US$5) limita a exegese, mas `/api/ai/suggest` NÃO tem cap algum. Se o plano é uma fronteira de billing/autorização, isto é bypass de autorização/cobrança.
- **Correção:** Se `plan` é pago: (1) mover upgrades para trás de verificação de pagamento server-side (ou tornar admin-only via `admin/users.updateUserPlanAction`, que já checa admin); (2) adicionar trigger `protect_plan_column` espelhando `protect_is_active_column` (027) restringindo mudança de `plan`/`ai_enabled` a `service_role`/admin; (3) manter `updatePlanAction` só para downgrade, ou gate de upgrade atrás de billing.
- **Verificação:** Tentar `supabase.from('profiles').update({plan:'concilio'}).eq('id',<self>)` via anon client → negado pelo trigger; UI de upgrade só conclui após billing.

### [SEG-005] Cabeçalhos de segurança ausentes (CSP, HSTS, X-Frame-Options/frame-ancestors, X-Content-Type-Options, Referrer-Policy)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** next.config.ts (sem função `headers()`)
- **Evidência:** `next.config.ts` define `serverExternalPackages`, `outputFileTracingIncludes`, `images.remotePatterns` — mas NÃO há `async headers()`. O `src/middleware.ts` também não injeta headers de segurança. Nenhum CSP/HSTS/frame-ancestors no repositório.
- **Impacto:** Ausência total de headers de borda: sem proteção a clickjacking (as telas `present`/teleprompter podem ser enquadradas em iframe de terceiros), sem HSTS (downgrade), sem CSP (mitigação de XSS — relevante dado o `dangerouslySetInnerHTML` em SEG-007), sem `nosniff`. Referência: ausência total = P2.
- **Correção:** Adicionar `async headers()` em `next.config.ts` retornando para todas as rotas: `Content-Security-Policy` (default-src 'self'; permitir supabase.co, docs.google.com, abibliadigital.com.br conforme uso), `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Frame-Options: DENY` (ou `frame-ancestors 'none'` no CSP), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` mínima.
- **Verificação:** `curl -I https://<host>/dashboard` deve listar os headers; ou testar em securityheaders.com.

### [SEG-006] Middleware falha ABERTO (sem proteção) quando faltam as env vars do Supabase
- **Severidade:** P2
- **Status:** Aberto
- **Local:** src/middleware.ts:21-24
- **Evidência:**
  ```ts
  // Sem Supabase configurado, segue sem proteção (modo dev sem credenciais)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }
  ```
  O mesmo padrão fail-open aparece em vários handlers/queries (ex.: src/app/api/sermons/export/route.ts:558-563, src/lib/admin/queries.ts:58) — sem env, deixam passar/retornam vazio em vez de bloquear.
- **Impacto:** Se as env vars sumirem/forem mal configuradas em produção (erro de deploy, rotação de secret, typo), TODAS as rotas protegidas passam a ser acessíveis sem autenticação e o middleware para de proteger. O sistema falha aberto em vez de fechado.
- **Correção:** Em produção não falhar aberto: quando `NODE_ENV === 'production'` e faltarem as env vars, retornar erro/redirect de indisponibilidade (ou bloquear tudo). Manter o bypass de dev explicitamente atrás de `process.env.NODE_ENV !== 'production'`.
- **Verificação:** Build "prod-like" sem as envs → acessar `/dashboard` deve dar 500/redirect, nunca renderizar conteúdo protegido.

### [SEG-011] Vulnerabilidades conhecidas em dependências de produção: `sharp`/libvips (untrusted uploads) e `shadcn` CLI arrastando pacotes high para o bundle de prod
- **Severidade:** P2
- **Status:** Aberto
- **Local:** package.json (dependencies) · node_modules (árvore) · uso runtime: src/app/api/sermons/slides/upload/route.ts:139-145, src/app/api/sermons/slides/[slideId]/route.ts:144-159
- **Evidência:** `npm audit --omit=dev` → "16 vulnerabilities (2 low, 4 moderate, 10 high)". Rastreio da árvore (`npm ls`):
  - `sharp` (dep direta) → CVEs de libvips (GHSA-f88m-g3jw-g9cj / CVE-2026-33327/33328/35590/35591, high). `sharp` é usado em runtime para converter PDFs/imagens ENVIADOS pelo usuário em WebP (`imageToWebpBuffer`, `pdfToWebpBuffers`, e o PUT de slide) — ou seja, processa conteúdo não confiável.
  - `dompurify@3.4.3` ← `jspdf@4.2.1` (usado em `/api/sermons/export` PDF): advisories moderate de bypass de sanitização.
  - `shadcn@4.7.0` está em `dependencies` (não devDependencies) e arrasta para o install de produção: `brace-expansion` (high, DoS), `@hono/node-server` (path traversal), `@modelcontextprotocol/sdk`, `@babel/core` (arbitrary file read), `body-parser`. São ferramentas de scaffold, não runtime do app.
- **Impacto:** `sharp`/libvips com CVEs processando uploads não confiáveis (PDF/imagem) é o item de maior risco real (potencial crash/DoS ou pior no worker de conversão). Os pacotes high vindos de `shadcn` inflam a superfície de ataque e o audit de produção sem necessidade (a CLI não roda em produção).
- **Correção:** (1) `npm audit fix` para bumps não-breaking (dompurify via jspdf, brace-expansion, body-parser, @hono/node-server); (2) atualizar `sharp` para a versão corrigida (`npm audit fix --force` sobe para sharp@0.35.3 — validar o Portão Zero-Erro: typecheck/build/upload de slides após o bump); (3) mover `shadcn` de `dependencies` para `devDependencies` no package.json (é CLI de scaffold), removendo brace-expansion/@hono/node-server/@modelcontextprotocol/sdk/@babel/core do install de produção; (4) configurar Dependabot/Renovate (referência item 8.2).
- **Verificação:** `npm audit --omit=dev` deve zerar as high após (2)+(3); `npm ls sharp` mostra a versão corrigida; `npm run build` + upload de um PDF de teste continuam verdes.

### [SEG-007] Sanitização de HTML por regex (`safeHtml`) é frágil e alimenta `dangerouslySetInnerHTML`
- **Severidade:** P3
- **Status:** Aberto
- **Local:** src/lib/editor/html.ts:43-64 · src/components/present/ItemContent.tsx:25-33
- **Evidência:** `safeHtml` remove `<script>/<iframe>/<style>` e handlers `on\w+="..."`/`'...'` por regex, mas NÃO cobre handlers sem aspas (`<img src=x onerror=alert(1)>`), `<svg onload=...>`, `<a href=javascript:...>` sem aspas, etc. O próprio comentário admite: "não é defesa contra atacante criando conteúdo cross-account." O resultado vai direto para `dangerouslySetInnerHTML` em `ItemContent`. (Há também `<style dangerouslySetInnerHTML>` em src/components/blocks/BlockColorsProvider.tsx:36, mas a partir de cores validadas por regex em blocks/colors.ts — risco menor.)
- **Impacto:** Hoje o conteúdo é escrito pelo próprio dono sob RLS e só renderizado para ele mesmo (self-XSS, baixo). Mas a segurança depende inteiramente dessa premissa: se qualquer feature futura renderizar conteúdo de outro usuário (sermão compartilhado, preview no admin), o sanitizador por regex é contornável → XSS armazenado cross-tenant.
- **Correção:** Trocar o sanitizador regex por um real (`isomorphic-dompurify`) em `safeHtml`/`ItemContent` antes de qualquer `dangerouslySetInnerHTML`; manter allowlist de tags/atributos do TipTap.
- **Verificação:** Teste unitário: `safeHtml('<img src=x onerror=alert(1)>')` não deve conter `onerror`; `safeHtml('<svg onload=alert(1)>')` idem.

### [SEG-008] Server Actions administrativas sem validação Zod de `userId`/`role`; `updateInterestStatusAction` sem checagem explícita de papel
- **Severidade:** P3
- **Status:** Aberto
- **Local:** src/lib/admin/users.ts:114-256 · src/lib/interests/actions.ts:121-150
- **Evidência:** `updateUserRoleAction(userId, role)`, `updateUserPlanAction`, `setUserActiveAction`, `deleteUserAction` recebem `userId: string` sem `z.string().uuid()`; `role` chega tipado como `UserRole` mas sem `z.enum` em runtime. Em `deleteUserAction` o `userId` cru é interpolado em URL do Admin API com service_role: `fetch(.../auth/v1/admin/users/${userId}, {...})` (users.ts:239-248), idem logout (users.ts:203). Em `updateInterestStatusAction` a única checagem é `if (!user) return ...` (interests/actions.ts:131-134); a autorização de admin fica só na RLS de `signup_interests`.
- **Impacto:** As ações de admin exigem conta admin (assertAdmin cobre users.ts), então a exploração pressupõe privilégio; ainda assim, interpolar `userId` não validado numa URL de Admin API service_role é arriscado (manipulação de path/param) e viola a regra do projeto "Sempre Zod". `updateInterestStatusAction` retorna `ok:true` para não-admin enquanto a RLS silenciosamente não altera nada (comportamento confuso; o único guard é a RLS).
- **Correção:** Validar `z.string().uuid()` em todos os `userId` antes de usar; validar `role` com `z.enum(["usuario","admin","super_admin"])`. Adicionar `isCurrentUserAdmin()` explícito no início de `updateInterestStatusAction`.
- **Verificação:** Chamar as ações com `userId` não-uuid → rejeitado com erro de validação; chamada de não-admin a `updateInterestStatusAction` → "Não autorizado" explícito.

### [SEG-009] Rate limits em memória (ai/suggest e submitInterest) são ineficazes em serverless; formulário público de interesse sem CAPTCHA
- **Severidade:** P3
- **Status:** Aberto
- **Local:** src/app/api/ai/suggest/route.ts:37-54 · src/lib/interests/actions.ts:42-50, 93-103
- **Evidência:** `/api/ai/suggest` usa `const buckets = new Map<...>()` "per process, best-effort" (o próprio comentário diz "Em prod, mover rate limit para Upstash/Redis"). `submitInterestAction` usa `INTEREST_COOLDOWN_KEYS = new Map()` (cooldown 60s em memória) e grava via `createServiceClient()` (bypassa RLS) numa ação pública não autenticada, sem CAPTCHA.
- **Impacto:** Na Vercel (múltiplas instâncias lambda + cold starts) o limite de 10/h da IA e o cooldown de 60s do interesse são amplamente contornáveis. O formulário público de interesse (não autenticado, escrita service_role) pode ser inundado de spam. `/api/ai/suggest` além disso não tem cap de custo.
- **Correção:** Mover rate limiting para `@upstash/ratelimit` chaveado por `userId`/IP; adicionar CAPTCHA/Turnstile no formulário público de interesse; considerar throttle/uniqueness no banco. Na migração p/ VPS, trocar o adaptador Upstash REST por Redis TCP.
- **Verificação:** Requisições concorrentes atravessando instâncias continuam limitadas (contagem no Redis, não no processo).

### [SEG-010] `/api/sermons/slides/google` valida a URL com `.includes()` em vez do host — embed aberto
- **Severidade:** P3
- **Status:** Aberto
- **Local:** src/app/api/sermons/slides/google/route.ts:12-19
- **Evidência:**
  ```ts
  url: z.string().url().refine((u) => u.includes("docs.google.com/presentation"), {...})
  ```
  `https://evil.com/#docs.google.com/presentation` passa tanto `z.url()` quanto `.includes()`. A URL é gravada em `sermons.slides_url` e depois embutida em `<iframe>` no modo apresentação (arch doc, seção Google Slides).
- **Impacto:** É escopado ao dono (self), então majoritariamente auto-infligido; mas a validação fraca permite armazenar uma URL arbitrária e renderizá-la em iframe na tela do apresentador/audiência. Se as telas de apresentação forem compartilhadas no futuro, vira vetor de open-embed/redirect.
- **Correção:** Validar o host: `const h = new URL(u).hostname; return h === 'docs.google.com' && new URL(u).pathname.startsWith('/presentation/')`.
- **Verificação:** Submeter host não-google contendo a substring → rejeitado (400).

## Cobertura

### Route handlers (14/14)
- `/api/ai/suggest` (POST) — **OK**: getUser + plano concílio + ai_enabled + Zod + rate limit (in-memory, ver SEG-009). Sem cap de custo (parte de SEG-009).
- `/api/bible` (GET) — **SEG-002**: público, Zod OK, sem rate limit.
- `/api/bible/books` (GET) — **SEG-002**: público estático (catálogo local), sem rate limit; baixo risco isolado.
- `/api/bible/chapter` (GET) — **SEG-002**: público, Zod OK, sem rate limit.
- `/api/bible/random` (GET) — **SEG-002**: público, sem cache, sem rate limit.
- `/api/bible/search` (GET) — **SEG-002**: público, POST externo sem cache, sem rate limit.
- `/api/series-and-courses` (GET) — **OK**: getUser + RLS; retorna vazio sem sessão.
- `/api/sermons/export` (GET) — **OK**: getUser + `.eq('user_id', user.id)` + Zod; fail-open sem env (ver SEG-006).
- `/api/sermons/import` (POST) — **OK**: getUser + Zod meta + limite 10MB + checagem de tipo (.docx/.txt); insere com `user_id`.
- `/api/sermons/import/template` (GET) — **N/A**: conteúdo estático, sem auth por design.
- `/api/sermons/slides/[slideId]` (DELETE/PUT) — **OK**: getUser + `loadOwnedSlide` (join sermons.user_id) + RLS slides; Zod uuid; `isValidSourcePath` valida path do usuário.
- `/api/sermons/slides/google` (POST) — **SEG-010**: getUser + `.eq('user_id')` OK, validação de URL fraca.
- `/api/sermons/slides/manual` (POST) — **OK**: getUser + `.eq('user_id', user.id)` na confirmação de propriedade + Zod uuid.
- `/api/sermons/slides/upload` (POST) — **OK**: getUser + confere `sermons.user_id` + `isValidSourcePath` (bloqueia `..` e exige prefixo `uid/sermonId/_src/`) + Zod; converte antes de gravar.

### Módulos "use server" (16/16)
- `admin/ai.ts` — **OK**: `isCurrentUserAdmin()` + Zod + getUser.
- `admin/users.ts` — **SEG-008** (validação Zod de userId/role ausente); autorização admin OK (`assertAdmin`), service_role só server, promoção a admin restrita a super_admin.
- `admin/ai-queries.ts` — **OK** (não é action apesar do nome; checa `isCurrentUserAdmin()`).
- `admin/ai-types.ts` — **N/A**: só tipos (a diretiva citada no comentário fez o grep casar).
- `blocks/colors.ts` — **OK**: getUser + Zod (regex de cor) + RLS owner.
- `courses/actions.ts` — **OK**: getUser + `.eq('user_id')` + Zod. `unlinkLessonAction` não filtra por user mas RLS de `course_lessons` (migration 007) escopa por dono do curso.
- `exegesis/actions.ts` — `createExegesisAction` **OK** (plano+ai+cap+Zod); `retryFailedGroupsAction` **SEG-003** (sem gate de plano/cap); insert em `chapter_exegeses` **SEG-001**.
- `interests/actions.ts` — `submitInterestAction` **SEG-009** (público, in-memory, sem CAPTCHA); `updateInterestStatusAction` **SEG-008** (sem checagem explícita de admin; RLS cobre).
- `notes/actions.ts` — **OK**: getUser + `.eq('user_id')` + Zod uuid.
- `profile/actions.ts` — **SEG-004**: `updatePlanAction`/`updateAISettingsAction` permitem auto-upgrade sem billing. Demais patches OK (getUser + Zod + `.eq('id',user.id)`).
- `series/actions.ts` — **OK**: getUser + `.eq('user_id')` + Zod + defesa contra ciclo.
- `sermons/actions.ts` — **OK**: getUser + `.eq('user_id', user.id)` em todas as mutações + Zod.
- `sermons/engagements.ts` — **OK**: getUser + `.eq('user_id')` + Zod (data/rating/tamanho).
- `sermons/versions.ts` — **OK**: getUser + `.eq('user_id')` em leitura e escrita.
- `study/actions.ts` — **OK**: getUser + `.eq('user_id')` + Zod; upsert escopado.
- `supabase/actions.ts` — **OK**: login/register/logout via Supabase Auth + Zod; checa `is_active` no login.

### Middleware / auth
- `src/middleware.ts` — **SEG-006** (fail-open sem env). Matcher cobre tudo exceto estáticos; `/admin/**` cai em rotas protegidas (não é público). `getUser()` usado (não `getSession`).
- `src/lib/supabase/middleware.ts` — **OK**: `getUser()` revalida token; força logout de conta desativada.

### Páginas /admin (4/4)
- `/admin/users`, `/admin/users/[id]`, `/admin/ai`, `/admin/interests` — **OK**: todas chamam `isCurrentUserAdmin()` no servidor (RSC) e `redirect('/dashboard')` se não-admin; queries revalidam admin server-side.

### Chaves / segredos
- `service_role`/`SUPABASE_SERVICE_ROLE_KEY` — **OK**: só em código server (`lib/admin/*`, `lib/supabase/server.ts`, `lib/interests/actions.ts`), nunca em `NEXT_PUBLIC_*`, nunca importado por client component (grep de cruzamento client↔server vazio).
- `getSession(` em contexto server — **OK**: zero ocorrências em `src/`.
- `.env` — **OK**: `.gitignore` cobre `.env*.local` e `.env`; só `.env.example` versionado, com placeholders (sem valores reais).

### RLS (17/17 tabelas com RLS habilitada)
- profiles, series, sermons, slides, courses, course_lessons, study_modules, study_sessions, block_color_preferences, sermon_engagements, sermon_versions, notes, signup_interests, ai_settings, chapter_exegeses, sermon_exegeses — todas com `enable row level security` e políticas escopadas por `auth.uid()`/papel. Único `with check (true)` é o INSERT público intencional de `signup_interests` (016) — leitura/edição restritas a admin.
- **SEG-001**: `chapter_exegeses` INSERT aberto a authed (poisoning cross-tenant).
- Observação (OK): triggers protegem `role` (013) e `is_active` (027/029) contra alteração por não-admin; `plan`/`ai_enabled` NÃO têm trigger (ver SEG-004).

### Pendências de verificação manual
- SEG-005/SEG-006: confirmar headers e comportamento sem env em ambiente de produção.
- `npm audit --omit=dev` executado (ver SEG-011). Varredura de histórico git (`git log -p --all | grep -iE segredos`) — **OK**: nenhum VALOR de segredo commitado; só nomes de env em comentários/docs/`.env.example` (placeholders) e `process.env.*`.

---

### [SEG-012] RCE potencial: `pdfjs-dist` vulnerável processando PDF do usuário no processo que carrega a `service_role`
- **Severidade:** P0
- **Status:** Aberto
- **Local:** `package.json:36` (`pdfjs-dist@^5.7.284`, resolvido para 5.7.284) · `src/app/api/sermons/slides/upload/route.ts:85-91` (`getDocument`) · `src/lib/supabase/server.ts:36` (service_role no mesmo processo)
- **Evidência:**
  - `npm audit --omit=dev` reporta: `pdfjs-dist >=5.6.83 <6.2.108 — Severity: high — PDF.js: Arbitrary JavaScript execution upon opening a malicious PDF` (GHSA-hq66-cqwq-w95j). Versão instalada confirmada: `node -p "require('./node_modules/pdfjs-dist/package.json').version"` → **5.7.284** (dentro da faixa vulnerável).
  - A rota de upload chama:
    ```ts
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBytes),
      standardFontDataUrl: assetDir("standard_fonts"),
      cMapUrl: assetDir("cmaps"),
      cMapPacked: true,
      wasmUrl: assetDir("wasm"),
    });
    ```
    **Sem `isEvalSupported: false`** — que é a mitigação documentada dessa classe de falha no PDF.js. O `pdfBytes` vem direto do arquivo enviado pelo usuário (conteúdo não confiável).
  - O mesmo processo Node tem `SUPABASE_SERVICE_ROLE_KEY` disponível em `process.env` (lido por `createServiceClient()` em `src/lib/supabase/server.ts:36`), chave que **bypassa toda a RLS**.
- **Impacto:** Um usuário autenticado que suba um PDF criado sob medida pode conseguir execução de JavaScript arbitrário dentro da função de servidor. Como esse processo tem acesso à `service_role`, a escalada natural é ler a chave de `process.env` e, com ela, ler/alterar/apagar os dados de **todos os usuários** — ignorando a RLS que é a única barreira multi-tenant do sistema. É o caminho mais curto entre "conta comum" e "vazamento total da base". A conta é por convite, o que reduz a probabilidade, mas não a severidade: basta uma conta legítima abusiva ou comprometida.
- **Correção:** Em ordem, do mais rápido ao definitivo:
  1. **Mitigação imediata (1 linha):** passar `isEvalSupported: false` no objeto de `getDocument` em `upload/route.ts:85`. Desliga o vetor de execução via `eval` sem quebrar o pipeline de conversão.
  2. **Correção de fato:** atualizar `pdfjs-dist` para `>= 6.2.108` (`npm audit fix --force` sobe para a linha 6.x — é breaking change). Revalidar a conversão de PDF ponta a ponta, porque o projeto depende de detalhes internos do pacote (`canvasFactory` do `doc`, `globalThis.pdfjsWorker`, assets de `standard_fonts`/`cmaps`/`wasm`) que podem ter mudado na major.
  3. **Defesa em profundidade:** isolar a conversão de PDF do processo que detém a `service_role` (worker/fila separada sem essa env), conforme já sugerido em PERF/OPS sobre mover o processamento pesado para fila.
  4. Aplicar junto o bump de `sharp` (SEG-011), que também processa o mesmo upload não confiável.
- **Verificação:** `npm audit --omit=dev` não deve mais listar `pdfjs-dist`; `npm ls pdfjs-dist` mostra >= 6.2.108; upload de um PDF real continua gerando os slides corretamente (Portão Zero-Erro verde + teste manual da rota). Após (1), confirmar por leitura que `isEvalSupported: false` está no `getDocument`.
