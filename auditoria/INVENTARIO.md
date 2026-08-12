# INVENTÁRIO — VOX (Fase 0)

> Base de cobertura da auditoria. Gerado por varredura do repositório.
> Commit base: `2cdb419` · branch `main` · árvore limpa.

## Contagens

| Categoria | Qtd |
|---|---:|
| Arquivos `.ts`/`.tsx` em `src/` | 202 |
| Rotas de página (`page.tsx`) | 22 |
| Layouts (`layout.tsx`) | 4 |
| Route handlers (`route.ts`) | 14 |
| `error.tsx` / `loading.tsx` / `not-found.tsx` / `global-error.tsx` | **0** |
| Arquivos com `"use server"` | 16 |
| Arquivos em `src/lib` | 57 |
| Exports em `lib/` + `hooks/` | 196 |
| Componentes em `src/components` | 95 |
| Hooks | 3 |
| Migrations SQL | 32 |
| Testes automatizados | **0** |

---

## 1. Rotas

### 1.1 Público — `src/app/(public)/`
| Rota | Arquivo |
|---|---|
| `/` (landing) | `src/app/(public)/page.tsx` |
| `/templates` | `src/app/(public)/templates/page.tsx` |
| layout | `src/app/(public)/layout.tsx` |

### 1.2 Auth — `src/app/auth/`
| Rota | Arquivo |
|---|---|
| `/auth/login` | `src/app/auth/login/page.tsx` |
| `/auth/register` | `src/app/auth/register/page.tsx` |
| layout | `src/app/auth/layout.tsx` |

### 1.3 App autenticado — `src/app/(app)/`
| Rota | Arquivo |
|---|---|
| `/dashboard` | `src/app/(app)/dashboard/page.tsx` |
| `/sermons` | `src/app/(app)/sermons/page.tsx` |
| `/sermons/new` | `src/app/(app)/sermons/new/page.tsx` |
| `/sermons/[id]` | `src/app/(app)/sermons/[id]/page.tsx` |
| `/sermons/[id]/present` | `src/app/(app)/sermons/[id]/present/page.tsx` |
| `/series` | `src/app/(app)/series/page.tsx` |
| `/courses` | `src/app/(app)/courses/page.tsx` |
| `/courses/[id]` | `src/app/(app)/courses/[id]/page.tsx` |
| `/study` | `src/app/(app)/study/page.tsx` |
| `/study/[moduleId]` | `src/app/(app)/study/[moduleId]/page.tsx` |
| `/notes` | `src/app/(app)/notes/page.tsx` |
| `/bible` | `src/app/(app)/bible/page.tsx` |
| `/import` | `src/app/(app)/import/page.tsx` |
| `/help` | `src/app/(app)/help/page.tsx` |
| `/settings` | `src/app/(app)/settings/page.tsx` |
| `/settings/blocks` | `src/app/(app)/settings/blocks/page.tsx` |
| `/admin/users` | `src/app/(app)/admin/users/page.tsx` |
| `/admin/users/[id]` | `src/app/(app)/admin/users/[id]/page.tsx` |
| `/admin/ai` | `src/app/(app)/admin/ai/page.tsx` |
| `/admin/interests` | `src/app/(app)/admin/interests/page.tsx` |
| layout | `src/app/(app)/layout.tsx` |

### 1.4 Outras
| Rota | Arquivo |
|---|---|
| root layout | `src/app/layout.tsx` |
| `/offline` | `src/app/offline/page.tsx` |
| middleware | `src/middleware.ts` (59 linhas) |

---

## 2. Route handlers (`src/app/api/`)

| Rota | Métodos | Config |
|---|---|---|
| `/api/ai/suggest` | POST | nodejs · force-dynamic · maxDuration 30 |
| `/api/bible` | GET | nodejs |
| `/api/bible/books` | GET | nodejs |
| `/api/bible/chapter` | GET | nodejs |
| `/api/bible/random` | GET | nodejs |
| `/api/bible/search` | GET | nodejs |
| `/api/series-and-courses` | GET | — (sem config) |
| `/api/sermons/export` | GET | nodejs · force-dynamic |
| `/api/sermons/import` | POST | nodejs · force-dynamic · maxDuration 30 |
| `/api/sermons/import/template` | *(nenhum método exportado detectado por grep)* | nodejs |
| `/api/sermons/slides/[slideId]` | DELETE, PUT | nodejs · force-dynamic · maxDuration 60 |
| `/api/sermons/slides/google` | POST | nodejs · force-dynamic |
| `/api/sermons/slides/manual` | POST | nodejs · force-dynamic |
| `/api/sermons/slides/upload` | POST | nodejs · force-dynamic · maxDuration 300 |

---

## 3. Módulos com Server Actions (`"use server"`)

`src/lib/admin/ai-queries.ts` · `admin/ai-types.ts` · `admin/ai.ts` · `admin/users.ts` ·
`blocks/colors.ts` · `courses/actions.ts` · `exegesis/actions.ts` · `interests/actions.ts` ·
`notes/actions.ts` · `profile/actions.ts` · `series/actions.ts` · `sermons/actions.ts` ·
`sermons/engagements.ts` · `sermons/versions.ts` · `study/actions.ts` · `supabase/actions.ts`

## 4. Módulos `lib/` por área

- **admin:** ai-queries, ai-types, ai, queries, users
- **ai:** client, prompts, prompts/exegesis
- **bible:** books, client, parser, versions
- **blocks:** colors
- **courses:** actions
- **editor:** bibleExtension, html
- **exegesis:** actions, inject-text, normalize, queries
- **frameworks:** hints
- **import:** parser, template
- **interests:** actions
- **mocks:** blocks, content-types, engagements, frameworks, sermons, slides, versions
- **notes:** actions, queries
- **offline:** db, sync
- **presenter:** channel, theme
- **profile:** actions
- **series:** actions, tree
- **sermons:** actions, engagements, export-html, export-tokens, preaching-principles, queries, sessions, slide-sources, slides, terminology, versions
- **study:** actions
- **supabase:** actions, client, middleware, server
- **utils**

## 5. Hooks
`useAutoSave` · `useBibleReference` · `useOfflineSync`

## 6. Componentes (95)
`admin/` (8) · `auth/` (2) · `bible/` (7) · `blocks/` (1) · `brand/` (2) · `editor/` (8) ·
`notes/` (1) · `present/` (11) · `sermon/` (21) · `settings/` (5) · `shared/` (7) ·
`slides/` (1) · `ui/` (24, shadcn)

## 7. Migrations (32)
001_profiles · 002_series · 003_sermons · 004_slides · 005_sermons_type · 006_courses ·
007_course_lessons · 008_study · 009_block_colors · 010_slides_comment_items ·
011_sermon_versions · 012_sermon_engagements · 013_user_roles · 014_security_hardening ·
015_revoke_public_execute · 016_signup_interests · 017_archive_sermons · 018_notes ·
019_fix_soft_delete_rls · 020_series_parent · 021_signup_interests_phone · 022_plans ·
023_exegeses · 024_ai_settings · 025_ai_models_refresh · 026_chapter_exegeses ·
027_user_is_active · 028_exegesis_original_version · 029_protect_is_active_service_role ·
030_exegesis_partial_status · 031_rename_role_pastor_to_usuario · 032_concilio_auto_enables_ai

## 8. Portão Zero-Erro — baseline

| Etapa | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ 0 erros |
| `npx eslint .` | ✅ 0 erros |
| `npm run build` | (em execução) |
| testes | ⚠️ **não existem** — sem script `test`, sem runner |
