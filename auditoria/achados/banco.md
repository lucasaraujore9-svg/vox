# Auditoria — Banco de Dados
_Data: 2026-08-12 · Referência: .claude/skills/auditoria-saas/references/02-banco-dados.md · Itens do inventário cobertos: 32/32 migrations + camada de acesso a dados_

## Resumo
- Itens verificados: 17 tabelas (RLS), 32 migrations, ~30 pontos de acesso a dados · Achados: P0=0 P1=2 P2=5 P3=4 · Nota do domínio: 7/10

Contexto positivo (verificado, sem achado):
- **RLS habilitada em TODAS as 17 tabelas** (`enable row level security` em cada `create table`). Nenhuma tabela pública sem RLS.
- Storage `sermon-slides` criado como **PRIVATE** (`public=false`, 004:44-46) com 4 policies escopadas por `(storage.foldername(name))[1] = auth.uid()::text`. Leitura via signed URL em lote (`slides.ts:52-60`), sem N+1.
- Funções `SECURITY DEFINER` têm `search_path` fixado (001, 013, 027, 029) e `EXECUTE` revogado de public/anon/authenticated (014, 015, 027).
- Sem drift de schema: `src/types/database.ts` bate com as migrations (16 tabelas vivas; `exegeses` foi dropada em 026 e não aparece nos tipos).
- Sem N+1 clássico: nenhum `await supabase` dentro de `for`/`map`; agregações usam `Promise.all` e `.in()`/signed-urls em lote.
- Toda policy de dono escopa por `auth.uid()`; `UPDATE` sem `WITH CHECK` explícito herda o `USING` (Postgres), então não permite reatribuir `user_id`.

## Achados

### [DB-001] FK `sermons.series_id` sem índice (filtro de usuário + `on delete set null`)
- **Severidade:** P1
- **Status:** Aberto
- **Local:** supabase/migrations/003_sermons.sql:15,57-61 · uso em src/lib/sermons/queries.ts:48
- **Evidência:** A coluna é FK (`series_id uuid references public.series(id) on delete set null`) e é filtrada na listagem do banco de conteúdos: `if (filters.seriesId) query = query.eq("series_id", filters.seriesId);` (queries.ts:48). Os únicos índices de `sermons` são `sermons_search_idx`, `sermons_user_id_idx`, `sermons_created_at_idx`, `sermons_deleted_at_idx`, `sermons_type_idx`, `sermons_content_type_idx`, `sermons_archived_at_idx`. **Não existe índice em `series_id`.**
- **Impacto:** (1) Ao apagar uma série, o `on delete set null` faz seq scan em `sermons` para achar as linhas dependentes — lento e com lock à medida que a tabela cresce. (2) Filtrar o banco por série (`/sermons?seriesId=...`) faz seq scan por usuário. Degrada com o volume de sermões.
- **Correção:** Criar migration `033_index_sermons_series_id.sql`:
  ```sql
  create index if not exists sermons_series_id_idx
    on public.sermons(series_id)
    where series_id is not null;
  ```
- **Verificação:** `explain analyze select * from sermons where series_id = '<uuid>';` deve usar `Index Scan`. Conferir em `pg_indexes` que `sermons_series_id_idx` existe.

### [DB-002] `chapter_exegeses`: INSERT liberado a qualquer autenticado polui cache global compartilhado
- **Severidade:** P1
- **Status:** Aberto
- **Local:** supabase/migrations/026_chapter_exegeses.sql:64-66
- **Evidência:**
  ```sql
  drop policy if exists "Authed insert chapter_exegeses" on public.chapter_exegeses;
  create policy "Authed insert chapter_exegeses" on public.chapter_exegeses
    for insert with check (auth.uid() is not null);
  ```
  A própria migration reconhece o compromisso: "Pra simplicidade, deixo escrita aberta a authed também." A tabela é um **catálogo GLOBAL** (`unique (book_abbrev, chapter, version)`, sem `user_id`, lida por todos: policy SELECT `auth.uid() is not null`).
- **Impacto:** Qualquer usuário autenticado — inclusive do plano `manuscrito` (sem IA) — pode inserir linhas arbitrárias no cache compartilhado via REST direto (`POST /rest/v1/chapter_exegeses`), com `content`, `model`, `cost_usd`, `generated_by` livres. Como a chave é `(book_abbrev, chapter, version)`, um atacante **pré-insere uma exegese falsa** para um capítulo e envenena o cache que TODOS os pastores vão ler; também contorna o gating de `profile.ai_enabled`/plano feito só na aplicação, e falsifica métricas de custo/uso.
- **Correção:** Fechar a escrita para `service_role` (as Server Actions que geram exegese devem usar `createServiceClient`, após validarem plano/quota) e remover a policy aberta:
  ```sql
  drop policy if exists "Authed insert chapter_exegeses" on public.chapter_exegeses;
  create policy "Service role inserts chapter_exegeses" on public.chapter_exegeses
    for insert to service_role with check (true);
  -- (ou manter authenticated, mas exigindo plano concílio via subquery em profiles)
  ```
  Ajustar a action de geração para usar client service_role. Confirmar que nenhuma escrita de exegese depende do client anon/authenticated.
- **Verificação:** Logado como usuário comum (anon key), `POST /rest/v1/chapter_exegeses` deve retornar `401/403`. Geração via app (service_role) continua populando o cache.

### [DB-003] `signup_interests`: policy de INSERT `with check (true)` — escrita pública sem rate-limit
- **Severidade:** P2
- **Status:** Aberto
- **Local:** supabase/migrations/016_signup_interests.sql:30-32
- **Evidência:**
  ```sql
  create policy "Anyone submits interest" on public.signup_interests
    for insert with check (true);
  ```
  Comentário: "O Server Action chama via service_role mas deixamos a policy aberta pro caso de futuras integrações públicas". Com a policy aberta, o path via `service_role` é irrelevante: qualquer um com a `NEXT_PUBLIC_SUPABASE_ANON_KEY` (pública) pode inserir.
- **Impacto:** Vetor de abuso/spam e DoS de armazenamento: `POST /rest/v1/signup_interests` sem autenticação nem limite permite encher a tabela (e capturar `source_ip`/`source_ua`/`email` de terceiros com dados forjados). Sem rate-limit no DB.
- **Correção:** Como o formulário público já passa pela Server Action com `service_role`, revogar a escrita anônima direta:
  ```sql
  drop policy if exists "Anyone submits interest" on public.signup_interests;
  -- sem policy de insert para anon/authenticated: só service_role escreve (bypassa RLS)
  ```
  Se precisar de insert público direto no futuro, adicionar rate-limit (Upstash/edge) antes de reabrir.
- **Verificação:** `POST /rest/v1/signup_interests` com anon key deve falhar; o formulário público (Server Action) continua registrando interesse.

### [DB-004] RLS usa `auth.uid()`/`current_user_is_admin()` sem `(select ...)` — reavaliação por linha
- **Severidade:** P2
- **Status:** Aberto
- **Local:** sistêmico — todas as policies. Ex.: 003_sermons.sql:29-42, 013_user_roles.sql:28-35, 018_notes.sql:20-34, 016_signup_interests.sql:36-47
- **Evidência:** As expressões usam `auth.uid() = user_id` / `public.current_user_is_admin()` diretas, sem envelopar em `(select auth.uid())`. Grep por `select auth.uid()` nas migrations retorna vazio.
- **Impacto:** Recomendação oficial Supabase: sem o `(select ...)`, o Postgres reavalia a função de auth **por linha** (não faz initplan/cache), o que em listagens grandes (banco de sermões, notas) vira custo linear e, no caso do `current_user_is_admin()` (SECURITY DEFINER que consulta `profiles`), uma subconsulta por linha nas telas de admin. Perda de performance significativa em escala.
- **Correção:** Reescrever as policies envolvendo a chamada de auth em subquery. Ex. para sermons:
  ```sql
  drop policy if exists "Sermon owner reads" on public.sermons;
  create policy "Sermon owner reads" on public.sermons
    for select using ((select auth.uid()) = user_id);
  -- idem insert/update/delete e para admin:
  --   using ((select public.current_user_is_admin()))
  ```
  Aplicar o mesmo padrão em todas as tabelas.
- **Verificação:** `explain analyze` de um `select` em `sermons` deve mostrar o filtro de auth como `InitPlan` (avaliado uma vez), não por linha.

### [DB-005] Soft-delete depende só de filtro na aplicação (RLS não esconde `deleted_at`)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** supabase/migrations/019_fix_soft_delete_rls.sql:14-20
- **Evidência:** A 019 removeu o `and deleted_at is null` das policies SELECT de `sermons` e `notes` para contornar o erro de `return=representation` no soft-delete:
  ```sql
  create policy "Sermon owner reads" on public.sermons
    for select using (auth.uid() = user_id);   -- sem deleted_at
  create policy "Notes owner reads" on public.notes
    for select using (auth.uid() = user_id);    -- sem deleted_at
  ```
  Hoje o filtro vive só na app (queries.ts:27,84,102,106,111 e notes/queries.ts:29,62). Verificado: as listagens e o detalhe (`listSermons`, `getSermon`, `dashboardStats`, `listNotes`) filtram; porém há leituras por id que não filtram `deleted_at`: versions.ts:35-40 (snapshot ao "Salvar versão") e as checagens de posse nas rotas de slides (slides/google/route.ts:44, slides/manual/route.ts:27, slides/upload/route.ts:169). São leituras por id+user_id (sem vazamento entre tenants; no pior caso operam sobre um sermão do próprio dono já na lixeira).
- **Impacto:** Defense-in-depth ausente. Qualquer nova query que esquecer `.is("deleted_at", null)` expõe ao próprio dono registros que ele acredita ter apagado (lixeira). Não é vazamento entre tenants, mas quebra a semântica de "apagado". `courses` mantém `deleted_at is null` na RLS (006:22-23), gerando inconsistência de padrão entre tabelas.
- **Correção:** Recolocar o filtro na RLS **sem** reintroduzir o bug do `return=representation`, restringindo o filtro só ao SELECT direto e mantendo UPDATE/soft-delete via `Prefer: return=minimal` (updates da app já não usam `.select()` no soft-delete, ex. sermons/actions.ts:206). Alternativa robusta: policies separadas
  ```sql
  -- opção: manter SELECT amplo mas criar uma VIEW `sermons_active` com deleted_at is null
  -- ou padronizar: adicionar índice parcial e garantir por teste que toda query filtra.
  ```
  No mínimo: adicionar teste automatizado que verifica que toda query de `sermons`/`notes` inclui `.is("deleted_at", null)`, e alinhar `courses` ao mesmo padrão escolhido.
- **Verificação:** Soft-deletar um sermão e confirmar via REST direto (sem filtro app) se some ou não; garantir que nenhuma rota lista registros com `deleted_at != null`.

### [DB-006] FKs sem índice em colunas de cascade/lookup
- **Severidade:** P2
- **Status:** Aberto
- **Local:** 007_course_lessons.sql:7 (`sermon_id`) · 008_study.sql:32 (`module_id`) · 011_sermon_versions.sql:8 (`user_id`) · 012_sermon_engagements.sql:9 (`user_id`) · 026_chapter_exegeses.sql:40 (`generated_by`), 83 (`exegesis_id`)
- **Evidência:** Postgres não cria índice de FK automaticamente. Índices existentes cobrem só prefixos:
  - `course_lessons`: só `(course_id, "order")` e `unique(course_id, sermon_id)` → **`sermon_id` isolado sem índice**.
  - `study_sessions`: só `(user_id)` e `unique(user_id, module_id)` → **`module_id` sem índice**.
  - `sermon_versions`: só `(sermon_id, created_at)` → **`user_id` sem índice**.
  - `sermon_engagements`: só `(sermon_id, preached_at)` → **`user_id` sem índice**.
  - `chapter_exegeses.generated_by` e `sermon_exegeses.exegesis_id` (PK `(sermon_id, exegesis_id)` cobre só `sermon_id`) → **sem índice**.
- **Impacto:** Todo `DELETE`/`SET NULL` na tabela referenciada (apagar sermão → `course_lessons`, `sermon_versions`, `sermon_engagements`; apagar módulo → `study_sessions`; apagar usuário → várias) faz seq scan nas filhas. Também degrada lookups reversos (ex.: "quais sermões usam esta exegese").
- **Correção:** Migration `034_missing_fk_indexes.sql`:
  ```sql
  create index if not exists course_lessons_sermon_id_idx on public.course_lessons(sermon_id);
  create index if not exists study_sessions_module_id_idx on public.study_sessions(module_id);
  create index if not exists sermon_versions_user_id_idx on public.sermon_versions(user_id);
  create index if not exists sermon_engagements_user_id_idx on public.sermon_engagements(user_id);
  create index if not exists sermon_exegeses_exegesis_id_idx on public.sermon_exegeses(exegesis_id);
  create index if not exists chapter_exegeses_generated_by_idx on public.chapter_exegeses(generated_by)
    where generated_by is not null;
  ```
- **Verificação:** Consultar `pg_indexes` e rodar `explain analyze` de um delete no pai confirmando `Index Scan` nas checagens de FK.

### [DB-007] PITR / backup não comprovável pelo repositório (verificação manual)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** infra Supabase Cloud (fora do repo) · projeto `jzotuzxqekzymvcitxpq`
- **Evidência:** Migrations forward-only, sem rotina de backup versionada; a referência exige PITR habilitado com janela de retenção definida. Não há evidência no repo do tier/PITR.
- **Impacto:** Sem PITR/backup testado, um `drop`/`update` acidental (há migrations destrutivas — ver DB-010) ou incidente é irrecuperável dentro de um RPO aceitável.
- **Correção:** No dashboard Supabase (Database → Backups): confirmar tier com PITR, habilitar PITR, definir janela de retenção e **executar 1 restore de teste** documentado (RTO/RPO). Registrar o procedimento em `docs/`.
- **Verificação:** Print/registro do PITR habilitado + log de um restore de teste bem-sucedido.

### [DB-008] Funções SECURITY DEFINER usam `set search_path = public` em vez de `''`
- **Severidade:** P3
- **Status:** Aberto
- **Local:** 001_profiles.sql:36 · 013_user_roles.sql:17,43 · 027_user_is_active.sql:23 · 029_protect_is_active_service_role.sql:16 · 014_security_hardening.sql:9-10
- **Evidência:** Todas fixam `set search_path = public` (não mutável — o advisor `function_search_path_mutable` está satisfeito), mas a recomendação de hardening é `set search_path = ''` com nomes totalmente qualificados.
- **Impacto:** Baixo hoje (CREATE em `public` é revogado de PUBLIC por padrão no Supabase). Mas se algum dia se conceder CREATE em `public` a roles, uma função/tabela plantada poderia sequestrar chamadas não-qualificadas dentro dessas SECURITY DEFINER.
- **Correção:** Trocar para `set search_path = ''` e qualificar tudo (`public.profiles`, `pg_catalog` etc.). Ex.:
  ```sql
  alter function public.current_user_is_admin() set search_path = '';
  -- e garantir que o corpo usa public.profiles / auth.uid() qualificados
  ```
- **Verificação:** `select proname, proconfig from pg_proc where proname in ('current_user_is_admin','handle_new_user','protect_role_column','protect_is_active_column');` mostra `search_path=`.

### [DB-009] Seed de `study_modules` não idempotente (migration 008)
- **Severidade:** P3
- **Status:** Aberto
- **Local:** supabase/migrations/008_study.sql:57-94
- **Evidência:** `insert into public.study_modules (...) values (...) on conflict do nothing;` — não há chave natural única (id é `gen_random_uuid()`), então `on conflict do nothing` nunca acha conflito. Reexecutar a migration duplica os 5 módulos.
- **Impacto:** Reaplicar/rodar seed duas vezes cria trilhas duplicadas visíveis a todos os usuários (`Anyone reads active modules`).
- **Correção:** Adicionar chave natural e conflitar por ela:
  ```sql
  alter table public.study_modules add constraint study_modules_title_key unique (title);
  -- e no seed: on conflict (title) do nothing;
  ```
  Idealmente separar seeds de migrations de schema.
- **Verificação:** Rodar o seed 2x e confirmar `select count(*) from study_modules` estável.

### [DB-010] Migrations forward-only e destrutivas sem rollback/backup confirmado
- **Severidade:** P3
- **Status:** Aberto
- **Local:** 026_chapter_exegeses.sql:15 (`drop table if exists public.exegeses`) · 028:14-19, 031:18-33 (drop/re-add constraint)
- **Evidência:** Não há scripts `down`. A 026 dropa a tabela `exegeses` com a justificativa "está vazia em prod" (assunção não verificada). 028 e 031 dropam e recriam CHECK constraints.
- **Impacto:** Sem caminho de volta; um `drop table` baseado em premissa ("vazia") pode perder dados se a premissa falhar. A referência marca migração destrutiva como algo que exige backup confirmado + aprovação (o corretor não deve reexecutar sozinho).
- **Correção:** Para futuras migrations destrutivas: confirmar `select count(*)` antes do drop, exigir backup/PITR (DB-007) e documentar rollback. Não reverter as já aplicadas; apenas adotar o padrão daqui pra frente.
- **Verificação:** Checklist de migration destrutiva no repo + evidência de backup antes de aplicar.

## Cobertura

### Tabelas (RLS habilitada + policies por operação) — 17/17
- **profiles** (001, 013) — OK: RLS on; SELECT/INSERT/UPDATE por dono + SELECT/UPDATE admin; triggers protegem `role`/`is_active`. Escopo `auth.uid()`. (perf: DB-004)
- **series** (002) — OK: RLS on; `for all` dono. (perf: DB-004)
- **sermons** (003, 005, 017, 019) — OK isolamento; 4 operações; soft-delete → DB-005; índice `series_id` → DB-001; perf → DB-004
- **slides** (004) — OK: RLS on; `for all` via EXISTS no sermão do dono (using+with check). Storage privado OK.
- **courses** (006) — OK: RLS on; SELECT dono+`deleted_at is null`, `for all` write dono. (soft-delete inconsistente vs sermons → DB-005)
- **course_lessons** (007) — OK isolamento (EXISTS no curso do dono); índice FK `sermon_id` → DB-006
- **study_modules** (008) — OK: SELECT `is_active=true` (catálogo público, sem PII, por design); write só `service_role`; seed → DB-009
- **study_sessions** (008) — OK: `for all` dono; índice FK `module_id` → DB-006
- **block_color_preferences** (009) — OK: `for all` dono
- **sermon_versions** (011) — OK: `for all` dono; índice FK `user_id` → DB-006
- **sermon_engagements** (012) — OK: `for all` dono; trigger `refresh_sermon_preached_at`; índice FK `user_id` → DB-006
- **signup_interests** (016, 021) — Achado DB-003 (INSERT aberto); SELECT/UPDATE/DELETE admin OK
- **notes** (018, 019) — OK isolamento; 4 operações; soft-delete → DB-005
- **exegeses** (023) — N/A: dropada em 026 (não existe no estado final)
- **ai_settings** (024, 025) — OK: SELECT authed (singleton de config, sem PII sensível), UPDATE admin; sem INSERT/DELETE (seed via migration) — aceitável
- **chapter_exegeses** (026, 028, 030) — Achado DB-002 (INSERT aberto); SELECT authed por design (cache global); UPDATE admin; índices FK → DB-006
- **sermon_exegeses** (026) — OK: SELECT/INSERT/DELETE dono + SELECT admin; índice FK `exegesis_id` → DB-006
- **storage.objects / bucket sermon-slides** (004) — OK: bucket privado, 4 policies por `foldername[1]=auth.uid()`

### Funções / triggers — OK
- `handle_new_user` (SD, search_path set, execute revogado) · `set_updated_at` (search_path via 014) · `refresh_sermon_preached_at` (search_path via 014) · `current_user_is_admin` (SD, search_path, execute revogado) · `protect_role_column` (SD) · `protect_is_active_column` (SD, corrigida em 029 p/ service_role). Nuance search_path → DB-008.

### Índices vs queries — parcial
- OK: `sermons_user_id_idx`, `sermons_created_at_idx`, `sermons_deleted_at_idx` (parcial), `sermons_search_idx` (GIN FTS usado em `textSearch`), `sermons_type_idx`, `sermons_content_type_idx`, `sermons_archived_at_idx`, `notes_*`, `courses_*`, `series_*`, `study_sessions_user_idx`, `chapter_exegeses_lookup_idx`.
- Achado: `sermons.series_id` → DB-001; demais FKs → DB-006.

### N+1 / select('*') — OK
- Sem `await supabase` em laços. `select('*')` só em getSermon (linha única, com embed de série) e versions (linha única) — aceitável. Signed URLs de slides em lote (`createSignedUrls`).

### Migrations — 32/32 lidas
- 001–032 lidas integralmente. Estado FINAL de policies verificado (014/015/019/029 aplicadas). Idempotência: maioria usa `if not exists`/`drop policy if exists`; exceção seed 008 → DB-009. Reversibilidade/destrutivas → DB-010.

### Pendências de verificação manual (fora do repo)
- PITR/backup → DB-007. Connection pooling (Supavisor 6543): acesso é via PostgREST/HTTP (supabase-js), não conexão pg direta, então o esgotamento de conexões clássico não se aplica ao runtime atual; revisar na migração VPS (pgBouncer).
