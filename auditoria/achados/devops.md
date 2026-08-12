# Auditoria — DevOps, Deploy e Migração
_Data: 2026-08-12 · Referência: .claude/skills/auditoria-saas/references/08-devops-migracao.md · Itens do inventário cobertos: 14/14 (relevantes ao domínio)_

## Resumo
- Itens verificados: 14 · Achados: P0=0 P1=3 P2=5 P3=3 · Nota do domínio: **5/10**
- Portão de build **não** está furado (sem `ignoreBuildErrors`/`ignoreDuringBuilds`), mas **não há nada que o rode antes do deploy** (sem CI). O maior risco atual é operacional: o app pode subir "funcionando" sem proteção de rota (fail-open) e sem gate de qualidade. A prontidão para Docker Swarm é baixa (sem `output: 'standalone'`, sem Dockerfile, sem healthcheck).

---

## Achados

### [OPS-001] Sem CI/CD — Portão Zero-Erro não é executado antes do deploy
- **Severidade:** P1
- **Status:** Aberto
- **Local:** ausência de `.github/workflows/` (raiz do repo) · `package.json:5-11`
- **Evidência:** Não existe diretório `.github/` (busca `find .github -type f` retornou vazio). O `package.json` tem os scripts `lint`, `typecheck` e `build`, mas **não há `test`** e nenhum pipeline os invoca. O deploy da Vercel builda direto do push, sem gate. A referência é explícita: "Sem gate de CI = **P1** (bug vai pra prod)".
- **Impacto:** Um commit que quebra typecheck/lint/build (ou introduz regressão) pode ir para produção sem barreira automática. O Portão Zero-Erro exigido pelo CLAUDE.md global depende de execução manual e disciplinada. Como não há sequer script `test` nem testes (INVENTARIO: "Testes automatizados: 0"), o gate está incompleto por natureza.
- **Correção:**
  1. Criar `.github/workflows/ci.yml` disparado em `pull_request` e `push` para `main`, com job em `ubuntu-latest`, Node 20, `actions/setup-node@v4` com `cache: npm`.
  2. Passos: `npm ci` (frozen lockfile) → `npm run typecheck` → `npm run lint` → `npm run build`. Adicionar `npm test` quando existir runner (pendência QA, fora deste domínio).
  3. Proteger `main` em Settings → Branches: exigir PR + status check verde para merge.
  4. Em Vercel, configurar deploy via GitHub check com required checks (só builda com CI verde).
- **Verificação:** Abrir um PR com erro de tipo proposital e confirmar que o check falha e bloqueia o merge; `gh run list` mostra a execução.

### [OPS-002] Fail-open: middleware desativa TODA proteção de rota quando falta env, sem validação na inicialização
- **Severidade:** P1
- **Status:** Aberto
- **Local:** `src/middleware.ts:21-24`
- **Evidência:**
  ```ts
  // Sem Supabase configurado, segue sem proteção (modo dev sem credenciais)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }
  ```
  Não há módulo de validação de ambiente na inicialização (nenhum `env.ts`/schema Zod; o código lê `process.env.*` cru). O CLAUDE.md do projeto confirma: "Sem credenciais, caem em mocks (e o middleware deixa de proteger rotas)".
- **Impacto:** Se em produção `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` estiverem ausentes ou mal digitadas (deploy sem env na Vercel, secret errado no Swarm), o app **não falha o boot** — sobe com todas as rotas protegidas liberadas e páginas caindo em dados mock. Fail-open silencioso: o operador não percebe que subiu inseguro. Não há vazamento de dado real (mocks vazios), mas a proteção de rota fica desligada sem alarme.
- **Correção:**
  1. Criar `src/lib/env.ts` que valida com Zod, em tempo de import, as variáveis obrigatórias de servidor (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) e faz throw se faltarem quando `NODE_ENV === 'production'`.
  2. No middleware, trocar o `return NextResponse.next()` de fallback: em produção, retornar 500/negar (nunca liberar rota); manter o bypass **apenas** quando `NODE_ENV !== 'production'`.
  3. Adicionar `/api/health` (ver OPS-005) reportando se o Supabase está configurado, para o healthcheck derrubar container mal-configurado.
- **Verificação:** Rodar `NODE_ENV=production npm start` sem `NEXT_PUBLIC_SUPABASE_URL` e confirmar que o boot falha (ou middleware devolve 500), em vez de servir rotas protegidas.

### [OPS-003] `output: 'standalone'` ausente — bloqueia containerização para Docker Swarm
- **Severidade:** P1
- **Status:** Aberto
- **Local:** `next.config.ts:13-40` (objeto `nextConfig`, sem chave `output`)
- **Evidência:** O `next.config.ts` não declara `output: 'standalone'`. Sem ele, `next build` não emite `.next/standalone/` com `server.js` + node_modules podados — base recomendada de imagem Docker enxuta. `grep -n "output" next.config.*` → sem resultado.
- **Impacto:** Migração para VPS/Docker Swarm travada: sem standalone, a imagem carregaria `node_modules` inteiro ou dependeria de `next start` sobre o repo completo. Não é blocker do prod atual (Vercel), mas é pré-requisito da migração iminente citada no CLAUDE.md.
- **Correção:**
  1. Adicionar `output: "standalone"` ao `nextConfig` em `next.config.ts`.
  2. Validar que os assets de `pdfjs-dist` e `@napi-rs/canvas` (já em `serverExternalPackages` e `outputFileTracingIncludes`) sejam copiados para `.next/standalone` — testar upload de PDF na imagem (ver OPS-007).
  3. Confirmar que o Service Worker (`public/sw.js`, gerado pelo serwist) é servido pelo standalone.
- **Verificação:** `npm run build` gera `.next/standalone/server.js`; `node .next/standalone/server.js` sobe o app localmente.

### [OPS-004] Rate-limit de IA em memória por processo — não sobrevive a múltiplas instâncias
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `src/app/api/ai/suggest/route.ts:37-49`
- **Evidência:**
  ```ts
  // Rate-limit in-memory (per process, best-effort)
  const RATE_LIMIT = 10;
  ...
  if (bucket.count >= RATE_LIMIT) { ... }
  ```
  Comentário do arquivo (linhas 2-3): "Rate limit simples por usuário (10/h em memória). Em prod, mover rate limit para Upstash/Redis ou Supabase Edge Function." **Confirmado que o projeto NÃO usa `@upstash/*`** (grep `upstash` em todo o repo, fora de `node_modules`, retornou vazio) — o alerta do CLAUDE.md global sobre `@upstash/redis`→TCP **não se aplica**; o análogo aqui é este limitador em memória.
- **Impacto:** Já na Vercel (serverless multi-lambda) e mais ainda no Swarm (múltiplas réplicas), cada instância mantém seu contador: o teto efetivo vira `10 × nº de instâncias` e cold starts zeram o balde. O endpoint chama a OpenAI (custo por token) atrás de `profile.ai_enabled` — abuso pode escapar do limite e gerar custo. Ao escalar horizontalmente, a proteção some.
- **Correção:**
  1. Mover o contador para store compartilhado. Hoje (Vercel): Upstash Redis REST **ou** Supabase (tabela/Edge Function). Na migração ao Swarm: Redis TCP self-hosted via `ioredis` (não `@upstash/redis`, que é REST).
  2. Chave por `user.id`, janela deslizante (TTL 1h), incremento atômico (`INCR`+`EXPIRE`).
  3. Aplicar o mesmo padrão ao proxy `/api/bible` (o `middleware.ts:14` já promete "rate-limit no handler").
- **Verificação:** Disparar >10 req/h do mesmo usuário através de 2 instâncias e confirmar bloqueio compartilhado (`429`).

### [OPS-005] Falta prontidão de container: sem Dockerfile, stack.yml, .dockerignore e healthcheck `/api/health`
- **Severidade:** P2
- **Status:** Aberto
- **Local:** raiz do repo (ausência) · `src/app/api/` (sem diretório `health`)
- **Evidência:** `ls Dockerfile docker-compose*.yml docker-stack.yml .dockerignore` → nenhum existe. `find src/app/api -iname health` → vazio (só `ai`, `bible`, `series-and-courses`, `sermons`). A referência pede Dockerfile multi-stage, usuário não-root, `.dockerignore`, e healthcheck do Traefik apontando para `/api/health` profundo.
- **Impacto:** Migração para Swarm+Traefik sem base: sem imagem; sem `.dockerignore` (risco de copiar `.env.local`/`.next`/`node_modules` para a layer); sem endpoint de saúde para rolling update/rollback automático nem para o Traefik decidir se a réplica está viva. Sem healthcheck, container que subiu quebrado (ex.: OPS-002) segue recebendo tráfego.
- **Correção:**
  1. Criar `Dockerfile` multi-stage: stage `deps` (`npm ci --frozen-lockfile`), stage `build` (`npm run build` com `output: standalone`), stage `runner` com base **glibc** (`node:20-bookworm-slim`, não alpine — ver OPS-007), usuário não-root (`USER node`), copiando só `.next/standalone`, `.next/static`, `public`.
  2. Criar `.dockerignore`: `node_modules`, `.next`, `.git`, `.env*`, `DEPLOY_NOTES.md`, `auditoria/`, `design-system/`, `docs/`, `issues/`.
  3. Criar `src/app/api/health/route.ts` (runtime nodejs) checando env obrigatória + ping leve ao Postgres (`select 1`), retornando 200/503.
  4. Criar `docker-stack.yml` com labels Traefik (host/TLS Let's Encrypt), `healthcheck` (curl `/api/health`), `update_config` (paralelismo/delay), `rollback_config` e secrets via Docker Swarm secrets (não `.env` no repo da stack).
- **Verificação:** `docker build` conclui; `docker run` sobe e `curl localhost:3000/api/health` retorna 200; simular env faltando retorna 503 e o Swarm não promove a réplica.

### [OPS-006] `maxDuration` é config Vercel-specific — timeouts precisam migrar para o Traefik/proxy
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `src/app/api/sermons/slides/upload/route.ts:22` (300s) · `src/app/api/sermons/slides/[slideId]/route.ts:15` (60s) · `src/app/api/sermons/import/route.ts:17` (30s) · `src/app/api/ai/suggest/route.ts:13` (30s)
- **Evidência:** `grep -rn "maxDuration" src/` retorna as 4 rotas acima. `export const maxDuration = 300;` é interpretado só pela Vercel; fora dela não tem efeito.
- **Impacto:** Na migração, o upload de PDF (`/api/sermons/slides/upload`) processa páginas de forma **síncrona** por até 300s no mesmo request. Atrás do Traefik, timeouts padrão de proxy (frequentemente ≤60s) matam a conexão antes de terminar, quebrando upload de PDFs grandes. Também não há fila para esse job pesado.
- **Correção:**
  1. No `docker-stack.yml`, definir timeouts do Traefik para essas rotas e alinhar `keep-alive`/`proxy_read_timeout` do reverse proxy ao pior caso (300s).
  2. Considerar mover o processamento de PDF para fila/worker (job assíncrono, ver `performance`): o request só enfileira e o front faz polling.
  3. Manter `maxDuration` no código (inofensivo fora da Vercel), documentando que a fonte de verdade do timeout passa a ser o proxy.
- **Verificação:** Upload de PDF que leve ~2min atrás do Traefik completa (não corta em 60s).

### [OPS-007] Dependências nativas (sharp, @napi-rs/canvas, pdfjs-dist) exigem imagem Docker adequada
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `package.json:14,36,43` (`@napi-rs/canvas`, `pdfjs-dist`, `sharp`) · `next.config.ts:14,19-27` · `src/app/api/sermons/slides/upload/route.ts:37,60,76,94`
- **Evidência:** `serverExternalPackages: ["@napi-rs/canvas", "sharp", "pdfjs-dist"]` e `outputFileTracingIncludes` copiam worker/fontes/cmaps/wasm do pdfjs e `@napi-rs/**`. A rota de upload carrega `pdfjs-dist/legacy/build/pdf.worker.mjs` (linha 60) e o `@napi-rs/canvas` via factory do pdfjs (comentário linha 94). `sharp` não é importado direto em `src/` (usado pelo Next na otimização de imagem).
- **Impacto:** No Swarm, `@napi-rs/canvas` e `sharp` publicam binários pré-compilados por plataforma/libc. Base **alpine/musl** ou plataforma errada faz os prebuilds falharem em runtime (`Cannot find module`/erro de libc), quebrando otimização de imagem e upload de PDF. Os assets do pdfjs precisam existir no filesystem do container (o `outputFileTracingIncludes` cobre isso **se** `output: standalone` estiver ligado — ver OPS-003).
- **Correção:**
  1. Usar base **glibc** no runner (`node:20-bookworm-slim`, não `-alpine`).
  2. Rodar `npm ci` no build na **mesma arquitetura** de deploy (buildx/`--platform`) para baixar os prebuilds corretos de `@napi-rs/canvas` e `sharp`.
  3. Após ligar `output: standalone`, testar upload de PDF e otimização de imagem dentro do container.
- **Verificação:** No container final, `node -e "require('@napi-rs/canvas'); require('sharp')"` não lança; upload de PDF gera slides.

### [OPS-008] `shadcn` está como dependency de produção (deveria ser devDependency)
- **Severidade:** P3
- **Status:** Aberto
- **Local:** `package.json:42` (`"shadcn": "^4.7.0"` dentro de `dependencies`)
- **Evidência:** `shadcn` é a CLI de geração de componentes (usada em dev para copiar código para `src/components/ui`), não uma lib de runtime. Está listada em `dependencies`, junto de libs de runtime.
- **Impacto:** Em produção, `npm ci --omit=dev` ainda instala `shadcn` e sua árvore, engordando `node_modules` e a imagem Docker sem necessidade e ampliando a superfície de dependências no runtime.
- **Correção:** Mover `"shadcn": "^4.7.0"` de `dependencies` para `devDependencies` no `package.json` e rodar `npm install` para atualizar o lockfile. Confirmar que nenhum código de runtime importa de `shadcn`.
- **Verificação:** `npm ls shadcn --omit=dev` não lista o pacote; `npm run build` continua verde.

### [OPS-009] Binário grande e boilerplate commitados e servidos publicamente (`public/Logos.zip`, `public/vercel.svg`)
- **Severidade:** P3
- **Status:** Aberto
- **Local:** `public/Logos.zip` (1.3 MB, tracked) · `public/vercel.svg` (tracked)
- **Evidência:** `git ls-files public/Logos.zip` e `git ls-files public/vercel.svg` retornam os arquivos (versionados). `du -h public/Logos.zip` = 1.3M. Tudo em `public/` é servido estaticamente: `/Logos.zip` e `/vercel.svg` ficam publicamente baixáveis.
- **Impacto:** `Logos.zip` incha o repo e a imagem Docker (é copiado para `public/` no build) e expõe um pacote de assets de marca em URL pública sem propósito de runtime. `vercel.svg` é resíduo do `create-next-app`.
- **Correção:** Remover `public/Logos.zip` (`git rm public/Logos.zip`); guardar assets de marca fora de `public/` (`design-system/assets/` já existe) ou em storage. Remover `public/vercel.svg` se não referenciado (`grep -rn "vercel.svg" src/`).
- **Verificação:** `git ls-files public/ | grep -Ei 'logos.zip|vercel.svg'` vazio; build continua verde.

### [OPS-010] `.env.example` declara variáveis que o código não usa (ruído/confusão de onboarding)
- **Severidade:** P3
- **Status:** Aberto
- **Local:** `.env.example:13` (`NEXT_PUBLIC_APP_URL`) · `.env.example:24` (`NEXT_PUBLIC_PWA_ENABLED`)
- **Evidência:** Cruzamento do `.env.example` com todo `process.env.*` do repo. Variáveis efetivamente usadas em `src/`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `BIBLE_API_TOKEN`, `BIBLE_API_URL`, `NODE_ENV`. Busca por `NEXT_PUBLIC_APP_URL` e `NEXT_PUBLIC_PWA_ENABLED` em todo o repo (fora de `node_modules`/`.next`/lockfile) retornou **zero** ocorrências. Nenhuma variável usada no código está faltando no `.env.example` (cobertura completa nos dois sentidos, exceto estas duas sobrando).
- **Impacto:** Baixo: um dev novo preenche variáveis sem efeito. `NEXT_PUBLIC_PWA_ENABLED` sugere um flag de PWA que não existe no código — o serwist é ligado por `NODE_ENV` em `next.config.ts:10`. Gera confusão e falsa sensação de configuração.
- **Correção:** Remover as duas linhas do `.env.example` **ou** passar a lê-las no código se forem intencionais (`NEXT_PUBLIC_APP_URL` para URLs absolutas; `NEXT_PUBLIC_PWA_ENABLED` como gate real do serwist). Escolher um dos dois e alinhar.
- **Verificação:** `grep -rn "NEXT_PUBLIC_APP_URL\|NEXT_PUBLIC_PWA_ENABLED" src/` reflete a decisão (vazio se removidas; com uso se adotadas).

### [OPS-011] Não foi possível rodar `npm outdated`/`npm audit` (rede indisponível) — verificação manual
- **Severidade:** P2
- **Status:** Aberto
- **Local:** ambiente de auditoria (registry npm inacessível) · `package.json`
- **Evidência:** `npm outdated` retornou `ETIMEDOUT ... registry.npmjs.org`; `npm audit --omit=dev` não completou (rede). Não há evidência para afirmar/negar vulnerabilidades — não invento achado sem dado. Observação factual do `package.json`: `next@16.2.6`, `react@19.2.4`, `zod@^4.4.3` em majors recentes; `lucide-react@^1.16.0` chama atenção (a linha estável do lucide-react é 0.x — confirmar a resolução).
- **Impacto:** Sem `npm audit`, uma vulnerabilidade conhecida em dependência de produção pode passar despercebida até a migração/deploy.
- **Correção:** Em máquina com rede: `npm outdated` e `npm audit --omit=dev`; tratar só o acionável (vuln real de prod ou versão muito atrasada). Adicionar `npm audit --omit=dev --audit-level=high` como passo não-bloqueante no CI (OPS-001). Verificar `npm ls lucide-react`.
- **Verificação:** Saída de `npm audit --omit=dev` com 0 high/critical, ou plano de correção para as que aparecerem.

---

## Cobertura (itens do inventário relevantes ao domínio DevOps)

| Item | Veredito |
|---|---|
| `next.config.ts` — build/serwist/output/native | **OK parcial** — sem `ignoreBuildErrors`/`ignoreDuringBuilds` (portão **não** furado); serwist configurado corretamente (swSrc `src/app/sw.ts` existe, disable em dev); **falta `output: standalone`** → OPS-003; native deps tratadas em `serverExternalPackages`/`outputFileTracingIncludes` → nota migração OPS-007 |
| `package.json` scripts (build/lint/typecheck) | OK (existem) — **sem `test`** → parte de OPS-001 |
| `package.json` dependencies (`shadcn` prod) | Achado OPS-008 |
| `.env.example` × `process.env.*` | Achado OPS-010 (2 vars sobrando; nenhuma faltando) |
| `.gitignore` / segredos no histórico | **OK** — `.env.local` ignorado (`.gitignore:28`), **não** tracked, **sem** ocorrência em `git log --all`; só `.env.example` versionado; `.vercel` e `DEPLOY_NOTES.md` ignorados |
| `.vercel/project.json` (projectId/orgId) | **OK** — não tracked (`.gitignore:34`) |
| CI/CD (`.github/workflows`) | Achado OPS-001 (ausente) |
| `vercel.json` / deploy config | **N/A com ressalva** — não existe `vercel.json`; deploy usa defaults da Vercel (região/headers/redirects não versionados). Preview protection é config de dashboard → verificar manualmente no painel Vercel |
| Runtime das rotas (`export const runtime`) | **OK** — todas as 13 rotas são `nodejs` (nenhuma `edge`); migração para Node self-hosted não quebra por runtime Edge |
| `maxDuration` das rotas | Achado OPS-006 (Vercel-specific) |
| Middleware (proteção/refresh + env fallback) | Achado OPS-002 (fail-open) |
| Rate-limit / `@upstash/*` | **@upstash NÃO existe no projeto** (alerta global N/A) → análogo in-memory é OPS-004 |
| Dockerfile / stack.yml / .dockerignore / `/api/health` | Achado OPS-005 (ausentes) |
| Higiene: `src/stores` vazio, mocks, binários | `src/stores` vazio e **não tracked** (git não versiona dir vazio) → N/A benigno; `src/lib/mocks/` é majoritariamente **constantes reais** (VOX_FRAMEWORKS, VOX_BLOCK_TYPES, CONTENT_TYPES) e `import type`, com `MOCK_SERMONS`/`MOCK_SERIES` já **vazios** (`sermons.ts:44,46`) → nome enganoso, mas **sem dados mock indo a prod** (N/A); binários → OPS-009 |
| `npm outdated` / `npm audit` | Achado OPS-011 (não executável — rede) |
