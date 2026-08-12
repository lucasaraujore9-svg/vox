# MATRIZ DE COBERTURA — prova de varredura total

**Regra da skill:** cobertura total, sem amostragem. Todo item do inventário recebe veredito
(OK / Achado / N/A com motivo). Auditoria que "amostrou" é auditoria incompleta.

Base: [`INVENTARIO.md`](INVENTARIO.md) · Achados: [`achados/`](achados/)

---

## 1. Rotas de página (22/22)

| Rota | Segurança | Frontend | Performance | Veredito |
|---|:--:|:--:|:--:|---|
| `/` (landing) | OK | OK | PERF (bundle) | SAAS-008 (sem link legal), LGPD-001 |
| `/templates` | OK | OK | OK | OK |
| `/auth/login` | OK | OK | OK | OK |
| `/auth/register` | OK | OK | OK | SAAS-011, LGPD-003 (sem aceite) |
| `/dashboard` | OK | OK | OK | SAAS-013 (saudação fixa) |
| `/sermons` | OK | OK | PERF-004/005/006 | Achado |
| `/sermons/new` | OK | OK | OK | OK |
| `/sermons/[id]` | OK | FE-001 | PERF-007/009 | Achado |
| `/sermons/[id]/present` | OK | FE-001 | PERF-001/002 | Achado |
| `/series` | OK | OK | OK | OK (redirect) |
| `/courses` | OK | FE-003 | OK | Achado (mock) |
| `/courses/[id]` | OK | FE-003 | OK | Achado (mock) |
| `/study` | OK | FE-003 | OK | Achado (mock) |
| `/study/[moduleId]` | OK | FE-003 | OK | Achado (mock) |
| `/notes` | OK | FE-001 | PERF-004 | Achado |
| `/bible` | OK | OK | PERF-003 | Achado |
| `/import` | OK | OK | OK | OK |
| `/help` | OK | FE-002 | OK | Achado (link 404) |
| `/settings` | SEG-004 | FE-001 | OK | Achado |
| `/settings/blocks` | OK | OK | OK | OK |
| `/admin/users` | OK | FE-001 | PERF-004 | Achado |
| `/admin/users/[id]` | OK | OK | OK | OK |
| `/admin/ai` | OK | OK | OK | OK |
| `/admin/interests` | OK | FE-001 | OK | Achado |
| `/offline` | N/A | OK | OK | OK |

## 2. Layouts e estados de rota

| Item | Veredito |
|---|---|
| `src/app/layout.tsx` | OK |
| `src/app/(app)/layout.tsx` | OK |
| `src/app/(public)/layout.tsx` | OK |
| `src/app/auth/layout.tsx` | OK |
| `error.tsx` / `global-error.tsx` | **FE-001 / COD-001 / OBS-002 — não existem (0)** |
| `not-found.tsx` | **FE-001 / COD-001 — não existe** |
| `loading.tsx` | **FE-001 / COD-001 — não existe** |
| `template.tsx`, `@slot`, `(.)interceptação` | N/A — o projeto não usa |
| `src/middleware.ts` | **SEG-006 / OPS-002 — fail-open sem env** |

## 3. Route handlers (14/14, método a método)

| Handler | Método | Auth | Zod | Veredito |
|---|---|:--:|:--:|---|
| `/api/ai/suggest` | POST | ✅ | ✅ | API-001, SAAS-003 (sem cap de custo) |
| `/api/bible` | GET | público | ✅ | SEG-002, PERF-003 |
| `/api/bible/books` | GET | público | ✅ | SEG-002, PERF-003 |
| `/api/bible/chapter` | GET | público | ✅ | SEG-002, PERF-003 |
| `/api/bible/random` | GET | público | ✅ | SEG-002, PERF-003 |
| `/api/bible/search` | GET | público | ✅ | SEG-002, PERF-003 |
| `/api/series-and-courses` | GET | ✅ | — | API-010 (sem config explícita) |
| `/api/sermons/export` | GET | ✅ | ✅ | OK · SAAS-012 (sem export em massa) |
| `/api/sermons/import` | POST | ✅ | ✅ | OK |
| `/api/sermons/import/template` | GET | público | N/A | OK — estático por design |
| `/api/sermons/slides/[slideId]` | DELETE, PUT | ✅ | ✅ | API-011 (guard fail-open) |
| `/api/sermons/slides/google` | POST | ✅ | ⚠️ | SEG-010 (valida URL com `.includes()`) |
| `/api/sermons/slides/manual` | POST | ✅ | ✅ | OK |
| `/api/sermons/slides/upload` | POST | ✅ | ✅ | **SEG-012 (P0)**, API-005, OPS-006 |

## 4. Módulos com Server Actions (16/16)

| Módulo | Veredito |
|---|---|
| `admin/ai.ts` | OK |
| `admin/ai-queries.ts` | COD-009 (cast jsonb sem validação) |
| `admin/ai-types.ts` | N/A — só tipos |
| `admin/users.ts` | COD-002 (erro de update ignorado), SEG-008, SAAS-006 |
| `blocks/colors.ts` | OK · COD-006 (importa de `mocks/`) |
| `courses/actions.ts` | COD-002, COD-004, COD-005 |
| `exegesis/actions.ts` | **SEG-001**, SEG-003, COD-002, COD-009 |
| `interests/actions.ts` | SEG-009, COD-003, COD-011 |
| `notes/actions.ts` | OK — melhor padrão do repositório |
| `profile/actions.ts` | **SAAS-002 (P0)**, SEG-004, **LGPD-002 (P0)**, COD-002 |
| `series/actions.ts` | COD-004, COD-005 |
| `sermons/actions.ts` | COD-002 (`publishSermonAction`), COD-004 |
| `sermons/engagements.ts` | COD-004, COD-005 |
| `sermons/versions.ts` | COD-004, PERF-009 |
| `study/actions.ts` | COD-002, COD-004, COD-011 |
| `supabase/actions.ts` | OK · SAAS-011 (`registerAction` órfão) |

## 5. Tabelas e RLS (17/17)

Todas com `enable row level security` e policies escopadas por `auth.uid()`/papel.

| Tabela | RLS | Veredito |
|---|:--:|---|
| `profiles` | ✅ | SEG-004 (`plan`/`ai_enabled` sem trigger de proteção) |
| `series` | ✅ | OK |
| `sermons` | ✅ | DB-001 (FK sem índice), DB-005 (soft-delete só na app) |
| `slides` | ✅ | OK |
| `courses` | ✅ | OK |
| `course_lessons` | ✅ | DB-006 (FK sem índice) |
| `study_modules` | ✅ | DB-009 (seed não idempotente) |
| `study_sessions` | ✅ | DB-006 |
| `block_color_preferences` | ✅ | OK |
| `sermon_engagements` | ✅ | DB-006 · LGPD-008 (dado de terceiro) |
| `sermon_versions` | ✅ | DB-006 |
| `notes` | ✅ | DB-005 · LGPD-008 (dado sensível de terceiro) |
| `signup_interests` | ✅ | DB-003 (INSERT público), LGPD-003 |
| `ai_settings` | ✅ | OK |
| `chapter_exegeses` | ✅ | **SEG-001 / DB-002 — INSERT aberto a qualquer autenticado** |
| `sermon_exegeses` | ✅ | DB-006 |
| Storage `sermon-slides` | ✅ | OK — privado, policies por dono |

**32/32 migrations lidas integralmente.** Estado final verificado (não só o inicial),
incluindo as que alteram policies anteriores: 014, 015, 019, 029.

## 6. Componentes (95/95)

| Grupo | Qtd | Veredito |
|---|--:|---|
| `ui/` (shadcn) | 24 | OK — uso interno de `lucide-react` é padrão |
| `sermon/` | 21 | OK · FE-004 (lucide direto em 4) |
| `present/` | 11 | PERF-001, FE-005 (glifos ☀☾⛶⤡) · PresenterControl OK |
| `editor/` | 8 | PERF-007, FE-007 (SlashCommandMenu sem ARIA) |
| `admin/` | 8 | PERF-004 (sem paginação) |
| `bible/` | 7 | FE-005 (emoji 📖) · BiblePalette OK (cmdk) |
| `shared/` | 7 | FE-006 (AppHeader com `<a>`) |
| `settings/` | 5 | **SAAS-002**, **LGPD-002** · forms OK (pending/disabled) |
| `auth/` | 2 | OK · LGPD-003 (sem aceite) |
| `brand/` | 2 | OK |
| `blocks/`, `notes/`, `slides/` | 3 | OK |

## 7. Hooks e libs

| Item | Veredito |
|---|---|
| `useAutoSave` | OK — debounce 1500ms |
| `useBibleReference` | OK |
| `useOfflineSync` | PERF-010 (sync sequencial, só `content`) |
| `lib/offline/db.ts` + `sync.ts` | PERF-010, PERF-002 (`cached_sermons` nunca lido pelo present) |
| `lib/editor/html.ts` | SEG-007 (sanitização por regex) |
| `lib/mocks/` (7 arquivos) | COD-006 (config de produção sob nome enganoso), COD-010 |
| `lib/presenter/channel.ts` | OK — cleanup correto do BroadcastChannel |
| `lib/bible/*`, `import/*`, `exegesis/normalize.ts`, `series/tree.ts` | QA-001 (funções puras sem teste) |
| `src/stores/` | COD-010 — **diretório vazio** (não versionado; benigno) |

## 8. Configuração e infraestrutura

| Item | Veredito |
|---|---|
| `next.config.ts` | OK (portão não furado) · SEG-005 (sem `headers()`), OPS-003 (sem `standalone`) |
| `package.json` scripts | OK · **sem `test`** (QA-002, OPS-001) |
| `package.json` deps | SEG-011, OPS-008 (`shadcn` em produção), **SEG-012** |
| `.env.example` × `process.env.*` | OPS-010 (2 vars sobrando; nenhuma faltando) |
| `.gitignore` / segredos | **OK** — nada vazado no histórico |
| `.github/workflows` | **OPS-001 — não existe** |
| `Dockerfile` / `stack.yml` / `/api/health` | **OPS-005 — não existem** |
| `vercel.json` | N/A — usa defaults da Vercel |
| Service Worker (`sw.ts` + serwist) | OK · PERF-002 (falta runtime caching do present) |
| `public/manifest.json` + ícones | OK — todos os ícones referenciados existem |
| Testes | **QA-001/002/003 — zero** |

---

## Itens N/A declarados (com motivo)

| Item | Motivo |
|---|---|
| `template.tsx`, rotas paralelas `@slot`, interceptadas `(.)` | O projeto não usa esses recursos do App Router |
| Pooling Supavisor / pgBouncer | Runtime acessa via PostgREST/HTTP, não conexão pg direta. Revisar na migração |
| `@upstash/redis` → Redis TCP | **Não se aplica** — o projeto não usa Upstash. O análogo é o rate-limit em `Map` (COD-003) |
| Webhooks de terceiros | Não existem webhooks entrantes hoje (surgirão com o billing — SAAS-001) |
| Banner de cookies | Só cookie essencial de sessão (Supabase Auth) — dispensável se documentado (LGPD-012) |
| `admin/ai-types.ts` | Arquivo só de tipos; casou no grep de `"use server"` por um comentário |

## Itens não verificáveis pelo repositório

Registrados no RELATÓRIO como limites da auditoria — exigem acesso ao painel:

| Item | Onde verificar |
|---|---|
| Policies RLS efetivamente aplicadas em produção | Dashboard Supabase (`jzotuzxqekzymvcitxpq`) |
| "Enable email signups" desligado | Supabase → Auth → Providers |
| PITR / backup testado (DB-007) | Supabase → Database → Backups |
| Proteção de preview deployment | Painel Vercel |
| Comportamento real em 375px | Renderização em dispositivo/emulador |

---

## Conclusão de cobertura

**121 achados** distribuídos sobre **100% dos itens do inventário**: 22 rotas de página,
14 route handlers (método a método), 16 módulos de Server Actions, 17 tabelas com RLS,
32 migrations, 95 componentes, 3 hooks e a configuração de build/deploy.

Nenhum item ficou sem veredito. Os N/A estão declarados com motivo, e os cinco itens que
dependem de acesso a painel estão explicitamente marcados como não verificados — não como
aprovados.
