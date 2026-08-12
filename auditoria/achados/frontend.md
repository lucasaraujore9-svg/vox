# Auditoria — Frontend (FE)
_Data: 2026-08-12 · Referência: .claude/skills/auditoria-saas/references/06-frontend-ux.md · Itens do inventário cobertos: 22/22 páginas + 4 layouts + navegação + formulários + componentes-chave_

## Resumo
- Itens verificados: 22 páginas, 4 layouts, 2 componentes de navegação, formulários (auth + 5 Settings + wizard sermons/new), tabelas admin, editor, present (chooser/control/slides/sessions), BiblePalette, PWA/SW.
- Achados: **P0=0 · P1=1 · P2=4 · P3=3** · Nota do domínio: **6.5/10**
- Pontos fortes confirmados: build/tsc/eslint limpos (Fase 0); LoginForm/RegisterForm com `useFormStatus` (anti duplo-submit), `autoComplete` e `aria-invalid`; wizard `sermons/new` e todos os `Settings*Form` com `useTransition` + `disabled={pending}` (sem duplo-submit); dashboard e `/sermons` com try/catch defensivo + empty state; BiblePalette usa cmdk (`CommandDialog`, ARIA/foco/teclado corretos); PWA (manifest + @serwist/next + `/offline`) configurado; sem `#000`, sem `Inter`, sem palavras banidas; em-dash correto em refs bíblicas do wizard.

---

## Achados

### [FE-001] App sem nenhum error/not-found/loading/global-error boundary → tela branca em falha de backend e 404 sem marca
- **Severidade:** P1
- **Status:** Aberto
- **Local:** projeto inteiro (0 arquivos `error.tsx`/`not-found.tsx`/`loading.tsx`/`global-error.tsx`, confirmado na Fase 0). Páginas que buscam dados SEM `try/catch` e estouram sem boundary:
  - `src/app/(app)/settings/page.tsx:34-59` (`loadProfile` chama `supabase.auth.getUser()` + `.from("profiles")` sem try/catch)
  - `src/app/(app)/notes/page.tsx:21-23` (`await listNotes(...)` sem try/catch)
  - `src/app/(app)/admin/users/page.tsx:16` (`await listUsers()` sem try/catch)
  - `src/app/(app)/admin/interests/page.tsx:23` (`await listInterests(filter)` sem try/catch)
  - `src/app/(app)/sermons/[id]/page.tsx:76-105` (após o `notFound()` da linha 42, os `await` de versions/engagements/slides/profile/exegeses não têm try/catch)
  - `src/app/(app)/sermons/[id]/present/page.tsx:51` (`await listSlidesForSermon(...)` sem try/catch; `getSermon` em `:38` já tem `.catch`)
- **Evidência:** `find src -name error.tsx -o -name not-found.tsx -o -name global-error.tsx -o -name loading.tsx` retorna vazio. Em `settings/page.tsx` há tratamento de `!profile` (card amigável), mas uma exceção lançada por `getUser()`/query **passa por cima** desse card. Sem `error.tsx`/`global-error.tsx`, o Next cai no fallback embutido: em produção renderiza a página de erro genérica ("Application error: a server-side exception has occurred") — tela sem estilo, sem marca VOX, sem recuperação. O mesmo vale para 404 (ver FE-002): sem `not-found.tsx`, aparece o "404 | This page could not be found" padrão do Next, off-brand.
- **Impacto:** Qualquer instabilidade transitória do Supabase (timeout, RLS negando, rede) em Configurações, Notas, Admin, na 2ª metade do editor de sermão ou no modo Apresentar derruba a página para tela branca de erro do Next, sem instrução nem retorno — violando o guardrail "sem tela branca". Usuário fica preso e sem contexto.
- **Correção:**
  1. Criar `src/app/global-error.tsx` (client, com `<html><body>`) com marca VOX, mensagem "Algo saiu do lugar" e botão `reset()`.
  2. Criar `src/app/(app)/error.tsx` (`"use client"`, props `{ error, reset }`) cobrindo a área autenticada, com card VOX (`vox-h2` + `vox-body`), botão "Tentar de novo" (`onClick={reset}`) e link `/dashboard`.
  3. Criar `src/app/not-found.tsx` e `src/app/(app)/not-found.tsx` com layout VOX (`--vox-bg`/`--vox-ink`), "Página não encontrada" e link `/dashboard`.
  4. Criar `loading.tsx` (skeleton) ao menos em `src/app/(app)/sermons/`, `notes/`, `admin/users/` e `settings/` (rotas com `await` de dados).
  5. Opcional: envolver os `await` pós-`notFound()` de `sermons/[id]/page.tsx` e `present/page.tsx:51` em try/catch que degrade para vazio.
- **Verificação:** Com Supabase configurado, simular falha (revogar temporariamente a anon key) e abrir `/settings`, `/notes`, `/admin/users`: deve aparecer o `error.tsx` VOX com retry, não a tela branca. Acessar `/xyz` deve renderizar `not-found.tsx` VOX. `npx tsc --noEmit` e `npm run build` verdes.

### [FE-002] Link quebrado para `/settings/frameworks` na página de Ajuda (404 garantido)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `src/app/(app)/help/page.tsx:138`
- **Evidência:** `<Link href="/settings/frameworks" ...>Configurações → Modelos</Link>`. A pasta `src/app/(app)/settings/` contém apenas `page.tsx` e `blocks/` — **não existe** `settings/frameworks`. Os "Modelos" vivem numa aba dentro de `/settings` (`settings/page.tsx:99` `<TabsTrigger value="frameworks">`), sem rota própria.
- **Impacto:** Usuário clica em "Modelos" na Ajuda e cai num 404 (hoje o 404 cru do Next — ver FE-001). Quebra a confiança na tela de Ajuda.
- **Correção:** Em `help/page.tsx:138` trocar `href="/settings/frameworks"` por `href="/settings"`. Se quiser deep-link, ler `?tab=frameworks` em `settings/page.tsx` (estado das Tabs a partir de `searchParams`) e apontar para `/settings?tab=frameworks`.
- **Verificação:** Clicar em "Configurações → Modelos" na `/help` e confirmar que abre `/settings` sem 404. `grep -rn "/settings/frameworks" src/` retorna vazio.

### [FE-003] "Cursos" e "Estudo" na navegação principal levam a telas 100% mock (dados fictícios); `/courses/new` cai no editor mock
- **Severidade:** P2
- **Status:** Aberto
- **Local:**
  - `src/app/(app)/courses/page.tsx:10-27` (`MOCK_COURSES` hardcoded)
  - `src/app/(app)/courses/[id]/page.tsx:15-20` (`MOCK_LESSONS`, título fixo "Provérbios para a vida cotidiana")
  - `src/app/(app)/study/page.tsx:9-47` (`MOCK_MODULES` hardcoded)
  - `src/app/(app)/study/[moduleId]/page.tsx` (proto, "Sessão 3 de 6" fixa em `:18`)
  - `src/components/shared/AppSidebar.tsx:41-42` e `src/components/shared/MobileNav.tsx:37-38` (itens "Cursos"/"Estudo")
  - `src/app/(app)/courses/page.tsx:47` `<Link href="/courses/new">` → casa com `courses/[id]` (`id="new"`) → editor mock ("ID: new"), não 404
- **Evidência:** Cursos e Estudo renderizam listas hardcoded independentemente do usuário/banco. Existem tabelas reais (`006_courses`, `007_course_lessons`, `008_study`) mas as telas não as consultam. "Novo curso" aponta para `/courses/new`, que renderiza `CourseEditorPage` com conteúdo fixo de Provérbios.
- **Impacto:** Usuário navega por itens de 1º nível do menu e vê conteúdo falso ("Provérbios para a vida cotidiana", "Hermenêutica para pregadores") que não é dele e não pode editar; "Novo curso" abre editor que não cria nada. Mata a confiança e polui a navegação com áreas não funcionais.
- **Correção (escolher uma):**
  1. **Ocultar até haver behavior:** remover/esconder atrás de flag os itens `Cursos`/`Estudo` de `AppSidebar.tsx:41-42` e `MobileNav.tsx:37-38`; ou
  2. **Conectar aos dados reais:** trocar `MOCK_*` por queries (Server Component + `createClient()` + tabelas `courses`/`course_lessons`/`study_modules`), com empty state, e criar rota `courses/new` explícita (ou Server Action de criação) em vez do match `[id]="new"`.
- **Verificação:** Como usuário novo, `/courses` e `/study` mostram empty state ou o item some do menu — nunca "Provérbios". `grep -rn "MOCK_COURSES\|MOCK_MODULES\|MOCK_LESSONS" src/app` reflete a decisão.

### [FE-004] `lucide-react` importado direto em 14 componentes custom; primitivo `VoxIcon` do design system nunca foi portado
- **Severidade:** P2
- **Status:** Aberto
- **Local:** imports diretos de `lucide-react` fora de `components/ui/` (shadcn):
  `src/components/shared/AppSidebar.tsx:12-24`, `src/components/shared/MobileNav.tsx:9-20`,
  `src/components/admin/AdminUsersTable.tsx:20`, `src/components/bible/BibleSidePanel.tsx`,
  `src/components/bible/BibleVerseLine.tsx`, `src/components/editor/BubbleToolbar.tsx`,
  `src/components/editor/SlashCommandMenu.tsx`, `src/components/notes/NotesWorkspace.tsx`,
  `src/components/present/PresentThemeToggle.tsx`, `src/components/sermon/EngagementsSection.tsx`,
  `src/components/sermon/SeriesTreeView.tsx`, `src/components/sermon/SermonActionsMenu.tsx`,
  `src/components/sermon/SermonFiltersAside.tsx`, `src/components/slides/SlidesPanel.tsx`.
- **Evidência:** `grep -rln "lucide-react" src/` = 21 arquivos (7 são shadcn `ui/*`, uso interno padrão; 14 são componentes de aplicação). Não existe `VoxIcon` em `src/` (`find src -iname "*voxicon*"` vazio), apesar de `design-system/vox/primitives.jsx` e do CLAUDE.md exigirem `<VoxIcon name="..." />` e proibirem importar Lucide/Hero Icons.
- **Impacto:** Violação sistemática de regra de design "inegociável". Iconografia foge da linguagem stroke SVG do VOX; acoplamento a dependência externa; inconsistência visual e risco de "look genérico" contrário à postura editorial da marca.
- **Correção:** Portar `design-system/vox/primitives.jsx` → `src/components/brand/VoxIcon.tsx` (tipado pelos nomes do DS). Substituir, nos 14 componentes de aplicação, os imports de `lucide-react` por `<VoxIcon name="..." />` equivalentes (adicionar ícones faltantes ao `VoxIcon`). Definir como escopo se `components/ui/*` (shadcn) também será convertido.
- **Verificação:** `grep -rln "lucide-react" src/components` sem os 14 arquivos de aplicação; revisão visual mantendo os glifos via `VoxIcon`.

### [FE-005] Emoji e glifos-símbolo usados como ícone na UI (viola "nunca emoji")
- **Severidade:** P3
- **Status:** Aberto
- **Local:**
  - `src/components/bible/ReferenceHint.tsx:62` — `<span aria-hidden>📖</span>` (emoji livro)
  - `src/components/present/PresentSessions.tsx:432` — `{stageDark ? "☀" : "☾"}` (sol/lua no toggle de tema)
  - `src/components/present/PresentSessions.tsx:442` — `{isFullscreen ? "⤡" : "⛶"}` (glifos de tela cheia)
- **Evidência:** Regra "Nunca emoji em UI, só `<VoxIcon name="..." />`". O 📖 é emoji renderizado (mesmo `aria-hidden`, é visível). ☀/☾/⛶/⤡ são dingbats Unicode que em várias plataformas caem no fallback emoji colorido, quebrando a linguagem stroke.
- **Impacto:** Inconsistência visual e quebra da anti-personalidade "AI-flashy/gamificada"; renderização imprevisível entre SO/navegadores. Baixo impacto funcional.
- **Correção:** Trocar 📖 por `VoxIcon name="book"`; ☀/☾ por ícones sol/lua e ⛶/⤡ por ícones de fullscreen do `VoxIcon` (adicionar nomes se faltarem). Manter os `aria-label` já presentes nos botões.
- **Verificação:** `grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" src/components` sem ocorrências em conteúdo renderizado.

### [FE-006] AppHeader usa `<a href>` puro em vez de `<Link>` para navegação interna (recarrega a página inteira)
- **Severidade:** P3
- **Status:** Aberto
- **Local:** `src/components/shared/AppHeader.tsx:91,94,97,106,109,112` (`<a href="/settings">`, `/settings/blocks`, `/help`, `/admin/users`, `/admin/interests`, `/admin/ai`)
- **Evidência:** Dentro de `DropdownMenuItem asChild` são usados `<a href="...">` nativos, não `next/link`. O resto do app usa `<Link>`.
- **Impacto:** Cada item do menu do avatar dispara navegação full-page (reload): estado de cliente descartado, refetch total, transição mais lenta e piscar de tela. Inconsistente com o resto da navegação.
- **Correção:** Importar `Link from "next/link"` em `AppHeader.tsx` e trocar os 6 `<a href="...">` por `<Link href="...">` (mantendo `asChild`).
- **Verificação:** Navegar pelo menu do avatar sem reload full-page. `grep -n "<a href" src/components/shared/AppHeader.tsx` vazio.

### [FE-007] SlashCommandMenu: menu custom sem semântica ARIA (não anunciado a leitores de tela)
- **Severidade:** P3
- **Status:** Aberto
- **Local:** `src/components/editor/SlashCommandMenu.tsx:277-315`
- **Evidência:** Menu montado via `createPortal` como `<div><ul><li><button>` sem `role="menu"/"listbox"`, sem `aria-activedescendant`, sem `aria-selected` no item ativo, e sem mover/prender foco (estado ativo só visual, classe `bg-accent`). A navegação por teclado existe (`:252-273`, ArrowUp/Down/Enter/Escape) via `window.addEventListener("keydown", ..., true)`, mas nada é exposto à árvore de acessibilidade.
- **Impacto:** Leitores de tela não percebem que o menu abriu nem qual item está ativo ao digitar "/". O listener global em fase de captura pode competir com outros handlers. Impacto restrito a AT.
- **Correção:** `role="menu"`/`listbox` no container, `role="menuitem"`/`option` + `aria-selected={idx===activeIdx}` + `id` nos itens, `aria-activedescendant` para o ativo, `aria-label` ("Comandos do editor"). Escopar o keydown ao editor/menu em vez de `window`. Garantir foco visível.
- **Verificação:** Abrir com "/", navegar com setas via VoiceOver/NVDA e confirmar anúncio de menu + item ativo; DOM com `role`/`aria-activedescendant`.

---

## Cobertura

### Rotas / páginas (22/22)
| Rota | Veredito |
|---|---|
| `/` (landing) `(public)/page.tsx` | OK — âncoras `#`, `aria-label="VOX"`, split layout; sem `#000`/Inter |
| `/templates` | OK — links `/sermons/new?framework=…` válidos |
| `/auth/login` | OK — LoginForm: `useFormStatus` disabled, `autoComplete`, `aria-invalid`, `noValidate`, erro visível |
| `/auth/register` | OK — RegisterForm (form de interesse): validação por campo, estado enviando, sucesso, `autoComplete` |
| `/dashboard` | OK — `loadData` try/catch → empty state; hero left-aligned |
| `/sermons` | OK — try/catch, empty state, filtros por URL |
| `/sermons/new` | OK — wizard client com `useTransition`, `disabled={pending}`, Alert de erro, sem duplo-submit; placeholder de ref com em-dash correto (`:203`) |
| `/sermons/[id]` | **FE-001** — `await` pós-notFound sem try/catch; `notFound()` presente para id inválido |
| `/sermons/[id]/present` | **FE-001** — `listSlidesForSermon` `:51` sem try/catch; `notFound()`/`.catch` em `:36,:38,:39` OK |
| `/series` | OK — `redirect("/sermons?view=grouped")` |
| `/courses` | **FE-003** — mock |
| `/courses/[id]` | **FE-003** — mock (`/courses/new` cai aqui) |
| `/study` | **FE-003** — mock |
| `/study/[moduleId]` | **FE-003** — proto/mock |
| `/notes` | **FE-001** — `listNotes` sem try/catch |
| `/bible` | OK (parcial) — 1 try; navegação por query `?book&chapter&version` consistente; empty/erro internos = pendência menor |
| `/import` | OK — client com try; link `/api/sermons/import/template` existe |
| `/help` | **FE-002** — link `/settings/frameworks` quebrado |
| `/settings` | **FE-001** — `loadProfile` sem try/catch (card `!profile` não cobre exceção). Forms internos OK |
| `/settings/blocks` | OK (parcial) — breadcrumb `/settings`; conteúdo interno = pendência menor |
| `/admin/users` | **FE-001** — `listUsers` sem try/catch; tabela com empty state e `overflow-x-auto` |
| `/admin/users/[id]` | OK — `notFound()` em `:42` |
| `/admin/ai` | OK (parcial) — guarda `isAdmin` + redirect; empty/erro internos = pendência menor |
| `/admin/interests` | **FE-001** — `listInterests` sem try/catch; tabs por query |
| `/offline` | OK — fallback estático do SW |

### Navegação / links
- Cruzamento de todos os `href`/`Link`/`router.push` do `src/` contra as rotas do inventário.
- **Único link 404 real:** `/settings/frameworks` (FE-002).
- `/courses/new` **não** é 404 (casa com `courses/[id]`), mas leva a tela mock (FE-003).
- Itens de menu (AppSidebar/MobileNav/AppHeader) apontam para rotas existentes; "Cursos"/"Estudo" são mock (FE-003); AppHeader usa `<a>` em vez de `<Link>` (FE-006).

### Formulários (todos verificados)
- LoginForm / RegisterForm: OK — `useFormStatus`, disabled no submit, `aria-invalid`, `autoComplete`, erro do servidor refletido.
- `sermons/new` (wizard): OK — `useTransition`, botões `disabled={pending}`, Alert de erro, sem duplo-submit.
- `SettingsProfileForm` (`:97` `disabled={pending||!dirty}`), `SettingsPreferencesForm` (`:83`), `SettingsPlanForm` (`:150/159/193`), `SettingsPasswordForm` (`:83` gated em newPassword+confirm; `autoComplete="new-password"`), `SettingsDeleteAccount` (`:92` exige digitar "excluir"; `autoComplete="off"`): OK — todos com estado pending e confirmação onde destrutivo.
- Dialogs de sermon (Delete/PermanentDelete): confirmação via dialog dedicado + toast. AdminUsersTable usa `confirm()` nativo + toast (funciona; consistência menor, não bloqueante).

### Acessibilidade
- Botões só-ícone com `aria-label`: bem coberto (SessionCard ↑↓✕; PresentSessions/PresentSlides; AdminUsersTable "Ações"; toggles de menu). 48 ocorrências de `aria-label`.
- **BiblePalette:** OK — usa cmdk `CommandDialog` (`role=dialog/combobox/listbox/option`, `autoFocus` no input, teclado nativo).
- **PresenterControl:** OK — sem `hidden md:*` escondendo função essencial; sem larguras fixas problemáticas (`min-w-0`).
- **FE-007** (SlashCommandMenu sem roles ARIA).

### Design System (grep)
- `#000`/`#000000`/`rgb(0,0,0)` em conteúdo: nenhum (só `rgba(0,0,0,…)` em sombras de slide e `bg-black/5–10` em overlays shadcn — aceitável). OK.
- Fonte `Inter`: nenhuma (Fraunces/Geist/Geist Mono via `next/font`). OK.
- Palavras banidas (Elevate/Seamless/Transform/Unlock/Empower/Magic/AI-powered): nenhuma. OK.
- Emoji/glifos-ícone: **FE-005**. `lucide-react` direto: **FE-004**.

### Responsivo / mobile
- AdminUsersTable / AdminAIUsageTable: tabela larga em wrapper `overflow-x-auto` com `min-w-[860px]` → scroll horizontal (padrão aceitável para tabela de dados).
- PresenterControl / modo Apresentar: sem esconder função no mobile. Modo "Apresentador" (duas janelas via popup/BroadcastChannel) é inerentemente desktop — no mobile o modo "Simples" (slide fullscreen) atende.
- **Pendência (verificação visual a 375px, não redutível a grep):** editor (`SermonEditor`/`SessionCard`) e `/sermons/[id]/present` em viewport de 375px — checar overflow e alvos de toque ≥44px. Não foram encontradas larguras fixas ou `hidden md:*` que escondam função essencial nesses componentes por grep.

### PWA
- `public/manifest.json` referencia `/logo/png/vox-app-icon-{192,512,1024}.png` — todos existem. Favicons de `layout.tsx` (`/logo/png/vox-favicon-*.png`) existem. OK.
- Service Worker: `@serwist/next` em `next.config.ts` (`swSrc: src/app/sw.ts`, `disable` em dev), `sw.ts` com precache + fallback `/offline`, registrado via `ServiceWorkerRegister` no `layout.tsx`. `/offline` existe. OK.
- Observação menor (não-achado): `public/icons/README.md` é placeholder obsoleto e não referenciado; pode ser removido.

### Pendências nomeadas (não redutíveis a análise estática nesta passada)
- Empty/error states internos de `/bible`, `/settings/blocks`, `/admin/ai` (páginas OK no fluxo principal; estados de borda internos não inspecionados linha a linha).
- Verificação visual de responsividade a 375px do editor e do modo Apresentar (requer navegador/DevTools).
