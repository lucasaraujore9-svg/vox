# Auditoria — Testes e QA
_Data: 2026-08-12 · Referência: .claude/skills/auditoria-saas/references/11-testes-qa.md · Itens do inventário cobertos: 12/12 áreas de risco_

## Resumo
- Itens verificados: 10 áreas · Achados: P0=0 P1=3 P2=5 P3=2 · Nota do domínio: **2/10**
- Estado confirmado por comando: **ZERO** testes. Sem `*.test.ts(x)`, sem `*.spec.ts(x)`, sem `vitest.config`/`jest.config`/`playwright.config`, sem `vitest.setup`, sem deps de teste no `package.json`, sem script `test`, sem `.github/workflows`.
- `package.json` tem `typecheck` (`tsc --noEmit`) e `lint`, mas **não tem** `test` → Portão Zero-Erro estruturalmente incompleto.
- Evidências brutas (read-only):
  - `find . -name '*.test.ts*' -o -name '*.spec.ts*'` → vazio.
  - `ls vitest.config.* jest.config.* playwright.config.*` → `no matches found`.
  - `grep -nE '"(test|typecheck|lint|build|e2e)"' package.json` → só `build`, `lint`, `typecheck`.
  - `grep -nE 'vitest|jest|playwright|testing-library' package.json` → `nenhuma dep de teste`.
  - `ls .github/workflows` → `sem .github/workflows`.
  - `ls supabase` → só `migrations/` (sem `config.toml`, sem `seed.sql`).

---

## Achados

### [QA-001] Ausência de teste de isolamento por usuário (RLS) — o mais grave
- **Severidade:** P1
- **Status:** Aberto
- **Local:** src/lib/sermons/queries.ts:76-88 (getSermon) e :20-74 (listSermons); policies em supabase/migrations/003_sermons.sql:29-42 e supabase/migrations/019_fix_soft_delete_rls.sql:14-20
- **Evidência:** `getSermon(id)` faz `.from("sermons").select("*, series:series(id, title)").eq("id", id).is("deleted_at", null).maybeSingle()` — **sem `.eq("user_id", ...)`**. `listSermons` idem: nenhum filtro por dono. A separação entre usuários depende **inteiramente** da RLS (`for select using (auth.uid() = user_id)`). A migration 019 ainda **afrouxou** a SELECT policy removendo `deleted_at is null`, delegando o filtro de soft-delete só à aplicação. Não há nenhum teste que exercite essas policies contra um banco real.
- **Impacto:** É o risco P0 do produto (vazamento entre contas). Qualquer regressão — uma policy dropada numa migration futura, um `select` que esqueça o `.eq("user_id")` numa nova query, um embed PostgREST que atravesse FK sem RLS na tabela relacionada (`series`) — expõe manuscritos, notas, exegeses e slides de um pastor a outro, e ninguém percebe: `tsc`, `eslint` e `build` continuam verdes. Sem teste, a defesa é invisível e frágil.
- **Correção:**
  1. Provisionar banco de teste (ver QA-009). 
  2. Escrever teste de integração `src/lib/sermons/__tests__/rls-isolation.test.ts` que: (a) cria usuário A e usuário B via Auth Admin API; (b) insere sermão do A; (c) com o **cliente autenticado como B** (anon key + sessão de B), chama `getSermon(sermaoDoA.id)` e `listSermons()` e **espera 0 linhas / null**; (d) com B, tenta `softDeleteSermonAction`, `archiveSermonAction`, `permanentDeleteSermonAction`, `updateSermonMetaAction` sobre o sermão de A e **espera falha/0 rows afetadas**; (e) repete para `notes`, `sermon_versions`, `exegeses`, `series`, `study_modules`, `courses` e o embed `series:series(...)`.
  3. Adicionar um teste que prova o inverso (A **consegue** ler o próprio) para evitar falso-positivo por RLS que bloqueia tudo.
- **Verificação:** `npm run test -- rls-isolation` verde; forçar regressão temporária (dropar a SELECT policy no banco de teste) deve fazer o teste **falhar**.

### [QA-002] Sem infraestrutura de teste e sem script `test` — Portão Zero-Erro incompleto
- **Severidade:** P1
- **Status:** Aberto
- **Local:** package.json:5-11 (scripts) e :49-58 (devDependencies)
- **Evidência:** `scripts` = `dev/build/start/lint/typecheck`; **não existe** `"test"`. Nenhum runner (`vitest`/`jest`) nem lib de asserção nas dependências. Inventário Fase 0: "Testes automatizados: 0".
- **Impacto:** O guardrail de "Definição de Pronto" (`install → typecheck → lint → build → testes`) não pode ser satisfeito: o passo 5 (testes) não tem como rodar. É o achado QA-001 canônico da skill (script + runner mínimo). Sem isso, nenhuma correção futura pode ser validada por teste, e a skill exige criar o mínimo, não pular.
- **Correção:** Adicionar stack compatível com Next 16 / React 19:
  - devDeps: `vitest@^3`, `@vitejs/plugin-react@^4`, `vite-tsconfig-paths@^5`, `jsdom@^25`, `@testing-library/react@^16`, `@testing-library/jest-dom@^6`, `@testing-library/user-event@^14`, `@playwright/test@^1.49`, `@vitest/coverage-v8@^3`.
  - `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:coverage": "vitest run --coverage"`, `"test:e2e": "playwright test"`.
  - Criar `vitest.config.ts`:
    ```ts
    import { defineConfig } from "vitest/config";
    import react from "@vitejs/plugin-react";
    import tsconfigPaths from "vite-tsconfig-paths";
    export default defineConfig({
      plugins: [tsconfigPaths(), react()],
      test: {
        environment: "jsdom",
        setupFiles: ["./vitest.setup.ts"],
        globals: true,
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
        exclude: ["e2e/**", "node_modules/**"],
        coverage: { provider: "v8", reporter: ["text", "lcov"],
          thresholds: { "src/lib/sermons/**": { lines: 60 }, "src/lib/bible/**": { lines: 80 } } },
      },
    });
    ```
  - Criar `vitest.setup.ts` com `import "@testing-library/jest-dom/vitest";`.
  - Criar `playwright.config.ts` apontando `testDir: "./e2e"`, `webServer` rodando `next start` contra o Supabase de teste.
  - Escrever 1 **smoke test** puro para provar que o runner funciona: `src/lib/bible/__tests__/parser.smoke.test.ts` → `expect(findFirstReference("Romanos 5")?.canonical).toBe("Romanos 5")`.
- **Verificação:** `npm ci && npm run test` executa e passa; `npm run typecheck && npm run lint && npm run build` seguem verdes (config de teste não deve entrar no bundle de produção).

### [QA-003] Sem gate de CI — Portão Zero-Erro não é aplicado em PR
- **Severidade:** P1
- **Status:** Aberto
- **Local:** repositório sem `.github/workflows/` (confirmado: `ls .github/workflows` → não existe)
- **Evidência:** Nenhum workflow. Nada bloqueia merge/deploy quando typecheck/lint/test/build quebram.
- **Impacto:** A skill trata "sem gate = P1": o Portão só protege se for institucionalizado no CI. Hoje uma regressão de tipos, lint, teste (quando existirem) ou build entra em `main` e vai pra Vercel sem barreira.
- **Correção:** Criar `.github/workflows/ci.yml`:
  ```yaml
  name: CI
  on: [pull_request, push]
  jobs:
    gate:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: 20, cache: npm }
        - run: npm ci
        - run: npm run typecheck
        - run: npm run lint
        - run: npm run test
        - run: npm run build
  ```
  Marcar o job `gate` como **required** na proteção de branch de `main`. E2E/integração-Supabase podem ir em job separado com secrets do projeto de teste (não bloqueante no início, depois obrigatório).
- **Verificação:** Abrir um PR de teste com um erro de tipo proposital → CI vermelho e merge bloqueado.

### [QA-004] Sem teste de proteção de rota (middleware) nem de AuthZ do /admin
- **Severidade:** P2
- **Status:** Aberto
- **Local:** src/middleware.ts:18-52; src/lib/supabase/middleware.ts:33-52; guards por página em src/app/(app)/admin/*/page.tsx (ex.: admin/users/page.tsx:13-14 `isCurrentUserAdmin()` → `redirect("/dashboard")`)
- **Evidência:** O middleware redireciona não-autenticado (linhas 44-49) e trata conta desativada (29-34), mas **não** tem regra para `/admin` — a autorização de admin vive **só** em cada `page.tsx` via `isCurrentUserAdmin()`. Se uma nova rota `/admin/*` esquecer o guard, fica exposta. Nada disso é testado.
- **Impacto:** Regressões silenciosas em dois pontos sensíveis: (1) rota protegida deixando de redirecionar sem sessão; (2) rota de admin acessível a `usuario`. `getUser()` (não `getSession()`) está correto hoje, mas sem teste um refactor pode trocar por cookie e reabrir CVE de sessão forjada.
- **Correção:** 
  1. Unit test do middleware (`src/__tests__/middleware.test.ts`) com `NextRequest` mockado e `updateSession` stubado: sem user + path privado → `NextResponse.redirect` para `/auth/login?redirectedFrom=...`; user logado em `/auth/login` → redirect `/dashboard`; `deactivated` → redirect `/auth/login?reason=deactivated`.
  2. E2E Playwright (`e2e/auth.spec.ts`): visitante anônimo em `/dashboard` cai em `/auth/login`; usuário com role `usuario` em `/admin/users` cai em `/dashboard`; admin acessa `/admin/users`.
- **Verificação:** `npm run test -- middleware` e `npm run test:e2e -- auth` verdes.

### [QA-005] Sem teste das Server Actions destrutivas e de mudança de papel
- **Severidade:** P2
- **Status:** Aberto
- **Local:** src/lib/sermons/actions.ts (softDeleteSermonAction:188-214, permanentDeleteSermonAction:167-184, archive/unarchive:127-161); src/lib/profile/actions.ts:189-203 (deleteAccountAction); src/lib/admin/users.ts (updateUserRoleAction:114-141, setUserActiveAction:177-222, deleteUserAction:224-256)
- **Evidência:** As actions de sermão fazem `.eq("id", id).eq("user_id", user.id)` (defesa em profundidade correta), e admin usa `assertAdmin()` + regra "super_admin para promover" (users.ts:128-130) e "não pode se auto-desativar/excluir" (184-185, 230-231). `deleteAccountAction` faz **soft-delete** dos sermões e `signOut`, **sem exigir reautenticação** e **sem apagar o usuário Auth**. Nenhuma dessas regras tem teste.
- **Impacto:** São operações irreversíveis/sensíveis (billing/permissão/exclusão exigem audit trail pelo guardrail). Uma regressão que remova o `.eq("user_id")`, o `assertAdmin()`, a trava de auto-desativação, ou a regra super_admin, não é pega por typecheck/lint. Também não há teste garantindo que `permanentDelete` só apague a própria row.
- **Correção:** Testes de integração (banco de teste) por action:
  - `permanentDeleteSermonAction` de B sobre sermão de A → 0 rows; sobre o próprio → row some.
  - `updateUserRoleAction`: `usuario` chamando → "Acesso restrito"; `admin` promovendo para `admin` → "Apenas super_admin..."; `super_admin` → ok.
  - `setUserActiveAction`/`deleteUserAction`: auto-alvo → erro específico.
  - `deleteAccountAction`: soft-deleta só os sermões do próprio user e chama signOut. (Registrar como achado separado de produto que ela não remove o Auth user — fora do escopo QA, mas cobrir o comportamento atual no teste.)
- **Verificação:** `npm run test -- actions` verde; mutação proposital (remover `assertAdmin`) faz o teste falhar.

### [QA-006] Sem testes unitários dos parsers puros (fruta madura, alto valor)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** src/lib/bible/parser.ts, src/lib/import/parser.ts, src/lib/exegesis/normalize.ts, src/lib/series/tree.ts, src/lib/editor/html.ts, src/lib/sermons/export-html.ts
- **Evidência:** Todas funções puras, determinísticas, sem I/O — trivialmente testáveis e hoje com 0 cobertura. Funções exportadas que merecem teste e o caso de borda concreto que quebraria:
  - **bible/parser.ts** `findReferences`/`findFirstReference`/`formatCanonical`: regex cacheado em módulo (`CACHED_REGEX`, l.34) — borda: capítulo fora de range é descartado (`chapter > book.chapters`, l.66); "Rom 5:1,11" **não** deve virar range (vírgula fora de `RANGE_SEP`, l.22-26); em-dash `Romanos 5:1—11`; `1Co 13:4-7` sem espaço; ordenação por comprimento p/ "1 Coríntios" antes de "Coríntios" (l.39-41).
  - **import/parser.ts** `parseTaggedTextToContent`/`parseTextToContent`/`parsePlainText`/`hasStructuredTags`/`countWords`: borda: tag `@desconhecida` → `notas_pessoais` (l.197); conteúdo antes de qualquer `@` é **descartado** se não houver bloco corrente (l.207-209); heurística "linha ≤80 sem ponto final = cabeçalho" (l.90); `## Introdução` sem bloco abre sessão default (l.198).
  - **exegesis/normalize.ts** `normalizeChapter`: borda: "Rm 5-6" (range de capítulo) → erro `chapter_range` (l.42-50); string vazia → erro `parse`; capítulo > total → mensagem com nº de capítulos (l.61-66); "Rm 5,1" **não** deve ser tratado como range (l.43 checa `!includes(",")`).
  - **series/tree.ts** `buildSeriesTree`/`flattenTree`/`descendantIds`: borda: `parent_id` quebrado vira raiz (l.26-31); ordenação `localeCompare pt-BR`; `descendantIds` exclui o próprio nó (impede mover pasta para dentro de si).
  - **editor/html.ts** `safeHtml`/`stripHtml`/`previewSnippet`/`withoutInlineColors`/`isHtmlContent`: borda: `safeHtml` remove `<script>`, `on*=` e `javascript:` em href (l.53-62) — **atenção**: o próprio comentário admite que não é defesa cross-account; testar que XSS básico é neutralizado; `withoutInlineColors` remove só `color`/`background`/`background-color` preservando o resto (l.74-87).
  - **sermons/export-html.ts** `htmlToParas` (+ tokenizer): borda: tags aninhadas `<strong><em>`, `<ul>/<ol>` com `<li>` e `depth`, `<br>` vira `\n` (l.207-213), entidades `&#39;`/`&amp;` (l.39-48), tag desconhecida ignorada (l.165-167).
- **Impacto:** São o núcleo do editor, import, exegese e export/apresentação. Regressões aqui corrompem manuscrito importado, referência bíblica errada no púlpito, ou HTML quebrado no PDF/DOCX — sem sinal de tipo/lint. Custo de teste é baixíssimo (funções puras), valor alto.
- **Correção:** Um arquivo `__tests__/<modulo>.test.ts` por módulo cobrindo cada função exportada com os casos de borda acima. São testes síncronos sem mock; começar por `bible/parser` e `import/parser`.
- **Verificação:** `npm run test:coverage` mostrando ≥80% de linhas em `src/lib/bible/**` e cobertura dos ramos de borda citados.

### [QA-007] Sem teste do sync offline (last-write-wins / perda de dado)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** src/lib/offline/sync.ts:34-72 (syncPendingSermons) e src/lib/offline/db.ts (fila IndexedDB)
- **Evidência:** LWW compara timestamps como string ISO: `if (!remoteTimestamp || localTimestamp >= remoteTimestamp)` (sync.ts:46). Se remoto é `null` **grava sempre**; empate (`>=`) o **local vence** e sobrescreve o remoto; o update (l.52-55) **não** escopa por `user_id` (depende de RLS). A fila (`listPending` filtra `!synced`, db.ts:70; `clearSynced` apaga só `synced`, db.ts:92-100). Zero teste.
- **Impacto:** É exatamente onde se perde dado do usuário: um empate de timestamp ou clock skew pode fazer uma edição antiga do IndexedDB sobrescrever uma versão mais nova do servidor. Sem teste, qualquer mexida na estratégia de conflito passa silenciosa.
- **Correção:** Teste (jsdom + `fake-indexeddb` ou mock de `./db`) mockando `createClient`:
  - remoto mais novo que local → **não** faz update (descarta local), mas marca `synced`.
  - local mais novo → faz `update` com o `content`.
  - remoto `null` (row nova) → grava.
  - empate de timestamp → documentar/assertar o comportamento atual (local vence) para travar regressão.
  - erro do supabase → `failed++` e `errors[]` populado, sem quebrar o loop; `clearSynced` só remove sincronizados.
- **Verificação:** `npm run test -- offline` verde cobrindo os 5 ramos.

### [QA-008] Sem teste do caminho de apresentação (presenter channel)
- **Severidade:** P3
- **Status:** Aberto
- **Local:** src/lib/presenter/channel.ts:16-46 (channelName/openChannel/postMessage/openAudienceWindow); componentes em src/components/present/ (11)
- **Evidência:** Protocolo de mensagens tipado (`PresenterMessage`, l.9-14) com `navigate/audience-ready/request-state/exit`; canal namespaced por `sermonId` (`vch-presenter:${id}`, l.16-18); `postMessage` engole erro se a janela fechou (l.32-36). Nenhum teste do contrato de mensagens nem da navegação de slides.
- **Impacto:** É o momento de maior custo de falha (pastor no púlpito, ao vivo). Uma quebra no contrato de mensagens dessincroniza a janela da audiência do painel do apresentador. Menor severidade porque não há perda de dado persistente e o modo Simples/Teleprompter são fallbacks, mas o impacto de UX é alto.
- **Correção:** Unit test do contrato (`channelName` determinístico por id; `postMessage(null, ...)` é no-op; shape das mensagens) e E2E Playwright com duas páginas (`context.newPage()`) validando que "avançar slide" no controlador muda o índice na audiência via BroadcastChannel.
- **Verificação:** `npm run test -- presenter` e `npm run test:e2e -- present` verdes.

### [QA-009] Sem ambiente de teste Supabase isolado (falta config.toml e seed)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** supabase/ (só `migrations/`; sem `config.toml`, sem `seed.sql`); .env.example (10 chaves)
- **Evidência:** `ls supabase` → apenas `migrations`. Não há `supabase/config.toml` (necessário para `supabase start` local) nem `seed.sql`. Sem isso, os testes de integração/RLS (QA-001, QA-005, QA-007) não têm banco onde rodar sem tocar produção (`jzotuzxqekzymvcitxpq`).
- **Impacto:** Impossível provar RLS/actions de forma reprodutível e segura. Rodar contra produção para testar é inaceitável (P0 de dados). É o pré-requisito bloqueante do achado mais grave (QA-001).
- **Correção:**
  1. `supabase init` para gerar `supabase/config.toml` versionado.
  2. Criar `supabase/seed.sql` com 2 usuários fixos (A e B) e dados mínimos por tabela, OU um helper de factory que cria usuários via Auth Admin no `globalSetup` do Vitest.
  3. Documentar em `docs/` o fluxo: `supabase start` → `supabase db reset` (aplica migrations 001–032 + seed) → export de `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`/`SERVICE_ROLE_KEY` locais para `.env.test`.
  4. Alternativa CI: um **branch/projeto Supabase de teste** separado, com secrets próprios no workflow (nunca os de produção).
- **Verificação:** `supabase start && supabase db reset` aplica as 32 migrations sem erro; `npm run test -- rls-isolation` roda contra o banco local.

### [QA-010] Sem thresholds de cobertura nos módulos críticos
- **Severidade:** P3
- **Status:** Aberto
- **Local:** (config inexistente) vitest.config.ts a criar; alvos: src/lib/sermons/**, src/lib/bible/**, src/lib/import/**, src/lib/offline/**, src/middleware.ts
- **Evidência:** Não há configuração de cobertura porque não há runner. A skill pede thresholds nos módulos críticos (auth/tenant/billing), não 100% global.
- **Impacto:** Sem piso de cobertura, os testes novos podem degradar sem alarme. Baixa severidade porque é uma salvaguarda de manutenção, não um bug ativo.
- **Correção:** Após QA-002, ligar `coverage.thresholds` no `vitest.config.ts` para os módulos críticos (ex.: `src/lib/bible/**` ≥80% linhas, `src/lib/sermons/**` e `src/middleware.ts` ≥60%) e rodar `test:coverage` no CI (QA-003).
- **Verificação:** `npm run test:coverage` falha quando a cobertura de um módulo crítico cai abaixo do piso.

---

## Cobertura (áreas de risco do inventário relevantes ao domínio de testes)

| Área / item do inventário | Veredito |
|---|---|
| Suíte de testes (0 testes, sem runner) | Achado QA-002 |
| Script `test` no package.json | Achado QA-002 |
| Script `typecheck` no package.json | OK (existe, l.10) |
| Gate de CI (.github/workflows) | Achado QA-003 |
| Isolamento por usuário / RLS — sermons/queries.ts + migrations 003/019 | Achado QA-001 |
| Auth / proteção de rota — middleware.ts + supabase/middleware.ts | Achado QA-004 |
| AuthZ /admin — admin/*/page.tsx (isCurrentUserAdmin) | Achado QA-004 |
| Server Actions destrutivas — sermons/actions.ts | Achado QA-005 |
| deleteAccountAction — profile/actions.ts | Achado QA-005 |
| Admin users (role/active/delete) — admin/users.ts | Achado QA-005 |
| Parser bíblico — bible/parser.ts | Achado QA-006 |
| Import parser — import/parser.ts | Achado QA-006 |
| Normalize exegese — exegesis/normalize.ts | Achado QA-006 |
| Árvore de séries — series/tree.ts | Achado QA-006 |
| HTML utils — editor/html.ts | Achado QA-006 |
| Export HTML — sermons/export-html.ts | Achado QA-006 |
| Sync offline — offline/sync.ts + db.ts | Achado QA-007 |
| Apresentação — presenter/channel.ts + present/ | Achado QA-008 |
| Ambiente de teste Supabase (config.toml/seed) | Achado QA-009 |
| Thresholds de cobertura | Achado QA-010 |
| Route handlers /api/* (14) | N/A neste domínio — cobertos por E2E em QA-004/integração; auditoria funcional é do domínio de APIs |
| Validação Zod de entrada (Server Actions/route handlers) | Parcial — presente no código (ex.: actions.ts:28-36); teste de "payload inválido → erro, não 500" a incluir em QA-005 |

---

## Retorno ao coordenador

**Contagem por severidade:** P0=0 · P1=3 · P2=5 · P3=2 (total 10).

**Títulos P0:** nenhum.

**Títulos P1:**
- QA-001 — Ausência de teste de isolamento por usuário (RLS) — o mais grave.
- QA-002 — Sem infraestrutura de teste e sem script `test` (Portão Zero-Erro incompleto).
- QA-003 — Sem gate de CI (.github/workflows ausente).

**Os 10 primeiros testes a escrever, em ordem:**
1. Smoke unit (bootstrap do runner): `findFirstReference("Romanos 5").canonical === "Romanos 5"` — prova que Vitest roda.
2. RLS-isolação leitura: usuário B **não** lê sermão de A via `getSermon`/`listSermons` (0 rows/null); A lê o próprio.
3. RLS-isolação escrita: B **não** consegue `softDelete`/`archive`/`permanentDelete`/`updateMeta` sermão de A (0 rows afetadas).
4. Proteção de rota (middleware): sem sessão em rota privada → redirect `/auth/login?redirectedFrom=...`.
5. AuthZ /admin (E2E): role `usuario` em `/admin/users` → redirect `/dashboard`; admin acessa.
6. bible/parser `findReferences`: capítulo fora de range descartado; "Rom 5:1,11" não vira range; em-dash e "1Co 13:4-7".
7. import/parser `parseTaggedTextToContent`/`parseTextToContent`: tag desconhecida → `notas_pessoais`; conteúdo antes de `@` sem bloco é descartado.
8. exegesis/normalize `normalizeChapter`: "Rm 5-6" → `chapter_range`; vazio → `parse`; capítulo > total → mensagem com nº de capítulos.
9. offline/sync `syncPendingSermons`: remoto mais novo descarta local; local mais novo grava; remoto null grava; empate local vence.
10. editor/html `safeHtml`/`stripHtml`: remove `<script>`, `on*=`, `javascript:`; `withoutInlineColors` remove só color/background.
