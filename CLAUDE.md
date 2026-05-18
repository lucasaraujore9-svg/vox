# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Estado atual do repositório

O app Next.js já está inicializado e **todas as 32 issues do MVP estão marcadas como
concluídas no código** (`issues/README.md`). `npm run build` passa limpo. O que ainda
não roda em runtime é o backend, depende do usuário provisionar o projeto Supabase
real, popular `.env.local` e rodar as migrations em `supabase/migrations/`.

Comportamento defensivo: o Dashboard, o Banco e o middleware verificam
`NEXT_PUBLIC_SUPABASE_URL` antes de chamar o Supabase. Sem credenciais, caem em
mocks (e o middleware deixa de proteger rotas). Útil para validar UI antes do backend.

```
.
├── src/
│   ├── app/                     ← App Router (rotas em /, auth/, (app), api/)
│   ├── components/              ← ui (shadcn), editor, sermon, slides, present, shared, blocks, auth
│   ├── lib/
│   │   ├── supabase/            ← clients + server actions de auth
│   │   ├── sermons/             ← actions + queries
│   │   ├── series/ courses/ study/ profile/ blocks/  ← actions por feature
│   │   ├── bible/               ← client API.Bible
│   │   ├── ai/                  ← OpenAI client + prompts por framework
│   │   ├── editor/              ← bibleExtension (TipTap)
│   │   ├── import/              ← parser .docx / texto
│   │   ├── offline/             ← IndexedDB (db.ts) + sync.ts
│   │   └── mocks/               ← frameworks, blocks, sermons (fallback UI)
│   ├── hooks/                   ← useOfflineSync, useAutoSave
│   ├── stores/ types/
│   └── middleware.ts            ← proteção de rotas + refresh sessão
├── supabase/migrations/         ← 001 → 009 (rodar em ordem na SQL Editor)
├── public/manifest.json         ← PWA manifest (icons TODO em public/icons/)
├── design-system/               ← fonte da verdade visual (CSS, JSX, HTML)
├── docs/                        ← SPEC + architecture + design-system + workflow
├── issues/                      ← 32 issues, todas [x] CONCLUÍDAS
└── commands/                    ← /plan /execute /review etc.
```

## Próximos passos para destravar runtime

1. **Supabase:** crie projeto em supabase.com → cole `NEXT_PUBLIC_SUPABASE_URL`
   e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `.env.local` → rode as migrations em ordem
   (`supabase db push` ou cole no SQL Editor).
2. **Tipos:** substitua `src/types/database.ts` (stub manual) pelo output de
   `npx supabase gen types typescript --project-id <id>`.
3. **Bucket Storage:** a migration 004 cria `sermon-slides` via SQL; confirme no Dashboard
   que ficou como PRIVATE com RLS habilitado.
4. **API keys opcionais:** `OPENAI_API_KEY` para o módulo de IA (controlado por
   `profile.ai_enabled`) e `BIBLE_API_KEY` para o proxy `/api/bible`.
5. **Ícones PWA:** gerar `public/icons/icon-192.png` e `icon-512.png` a partir do
   `design-system/assets/vox-mark.svg`.

## Sabotagens conhecidas (gaps deixados de propósito)

- **Service Worker:** o `manifest.json` está pronto mas o SW não, `next-pwa` ainda não
  suporta Next 16 estável. Migrar para `@serwist/next` quando o sw for prioridade.
- **`@supabase/ssr` types:** o stub em `src/types/database.ts` cobre os campos usados
  mas não inclui `Relationships` reais. Substituir pelo output do `gen types`
  resolve qualquer inferência fraca remanescente.
- **PPT/PPTX:** o upload aceita só PDF. Para PPT, o usuário precisa exportar como PDF
  no PowerPoint/Keynote antes (anotado na UI). Conversão server-side ficou em
  issue 063 (expansão futura).

---

## O Produto

**VOX** é uma PWA para pregadores, pastores e palestrantes que cobre o ciclo completo
de um conteúdo pastoral: **preparação → entrega → arquivo**.

O diferencial central são os **frameworks homiléticos de comunicação** como templates
guiados dentro do editor, não é um editor de texto genérico, é uma ferramenta pastoral.

### Escopo expandido (importante, não trate como "app de sermões")

O produto cobre Sermão, Palestra **e** Aula, mais Cursos e Estudo Guiado. Toda decisão
de UI/API precisa considerar essas dimensões, elas vivem majoritariamente na mesma
tabela `sermons` com discriminadores:

| Dimensão | Valores | Onde |
|---|---|---|
| `content_type` | `sermão` · `palestra` · `aula` | coluna em `sermons` |
| `type` (formato) | `esboço` · `apresentação` | coluna em `sermons` |
| Entidade separada | `courses` + `course_lessons` (linka aulas) | tabela própria |
| Entidade separada | `study_modules` + `study_sessions` (estudo guiado, notas em blocos) | tabela própria |

**Modos de apresentação:** Teleprompter (esboço), Simples (slide fullscreen sem UI,
para projeção), Apresentador (duas janelas, slide para audiência + painel de controle
com próximo slide e comentários para o pastor).

**Sistema de blocos visuais (núcleo do editor):** cada tipo de bloco tem cor configurável
por usuário (`block_color_preferences`), aplicada no editor de esboço, em comentários de
slides e em notas de estudo guiado. Tipos e defaults em `docs/references/architecture.md`.

### IA é opcional por usuário
Tudo relacionado a IA precisa checar `profile.ai_enabled` **antes** de renderizar/expor
qualquer UI ou rota. Default na criação de perfil: `false`.

---

## Stack alvo

Definida em `docs/references/architecture.md`. Resumo:

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript estrito) |
| Estilização | Tailwind CSS 4 + shadcn/ui |
| Banco / Auth / Storage | Supabase (PostgreSQL, **RLS em todas as tabelas**) |
| PWA / Offline | next-pwa + Service Worker + IndexedDB |
| Editor rico | TipTap 2 |
| Forms / Validação | React Hook Form + Zod |
| Estado global (raro) | Zustand, preferir Server State |
| IA (opcional) | OpenAI GPT-4o atrás de `profile.ai_enabled` + Route Handler `/api/ai/suggest` |
| Bíblia | API.Bible atrás de Route Handler proxy `/api/bible` |
| Hospedagem | Vercel |

Variáveis esperadas: ver `.env.example` (Supabase URL/anon/service role, OpenAI, API.Bible,
PWA flag). `.env.local` **nunca** é commitado.

---

## Workflow de desenvolvimento (não pule fases)

Loop oficial: **SPEC → BREAK → PLAN → EXECUTE → REVIEW → NEXT**. Detalhes em
`docs/references/workflow.md`.

Para começar qualquer trabalho:

1. `/status`, ver concluído/pendente
2. `/next`, escolher próxima issue por impacto e dependências
3. `/plan <issue>`, produzir plano e **aguardar aprovação explícita do usuário**
4. `/execute`, implementar seguindo o plano
5. `/review <issue>`, validar contra critérios de aceite
6. Marcar a issue como `[x] CONCLUÍDA` em `issues/README.md`

### Convenção de issues (em `issues/README.md`)

| Faixa | Tipo | O que cobre |
|---|---|---|
| 001–019 | `proto` | UI sem dados reais |
| 020–029 | `infra` | Supabase, auth, PWA, Next.js setup |
| 030–049 | `behavior` | Conectar UI a dados reais |
| 050–059 | `integration` | APIs externas (API.Bible, OpenAI) |
| 060+ | `expansion` | Pós-MVP |

**Regra de prioridade:** infra (020+) antes de behavior (030+). Protos podem rodar em
paralelo com infra.

### Slash commands (definidos em `commands/*.md`)

| Comando | Função |
|---|---|
| `/setup` | Configura ambiente local pela primeira vez |
| `/plan <issue>` | Lê issue + docs e produz plano de implementação |
| `/execute` | Implementa o plano aprovado |
| `/status` | Lista issues concluídas/pendentes |
| `/next` | Sugere próxima issue por impacto e dependências |
| `/review <issue>` | Valida implementação contra critérios de aceite |

---

## Regras de código inegociáveis

1. **Server Components por padrão**, `"use client"` só com justificativa explícita
2. **Nunca `any`** no TypeScript, use os tipos gerados em `src/types/database.ts`
   (`npx supabase gen types typescript --project-id ... > src/types/database.ts`)
3. **Sempre Zod** para validar dados antes de salvar no banco
4. **Sempre cheque `profile.ai_enabled`** antes de renderizar QUALQUER UI de IA
5. **RLS ativo em todas as tabelas**, usuário só acessa seus próprios dados;
   `SUPABASE_SERVICE_ROLE_KEY` só em Route Handlers, **nunca** no cliente
6. **Auto-save com offline-first**, escrever em IndexedDB e sincronizar com Supabase;
   conflict resolution é last-write-wins no MVP (ver `architecture.md`)
7. **Fetch de dados** sempre em Server Components ou Route Handlers, nunca cliente

### Convenções de arquivos
- Componentes: `PascalCase`, um por arquivo, em `src/components/`
- Páginas e utilitários: `kebab-case`
- Variáveis de ambiente: `process.env.NEXT_PUBLIC_*` (público) ou `process.env.*` (servidor)
- Estrutura completa de pastas e schema SQL: ver `docs/references/architecture.md`

### Convenção de commit
```
feat(sermons): adicionar CRUD de sermões
fix(editor): corrigir auto-save offline
infra(supabase): adicionar migration de profiles
style(cards): ajustar layout mobile
docs(spec): atualizar spec da apresentação
```

---

## Design System, leia antes de criar qualquer UI

**Fonte da verdade:**
- `design-system/colors_and_type.css`, todos os tokens CSS (importar primeiro)
- `design-system/BRANDBOOK.md`, voz, tom, filosofia visual
- `design-system/vox/primitives.jsx`, componentes de referência (`VoxIcon`, `VoxMark`,
  `FrameworkBadge`, `Status`, `Kbd`)
- `design-system/VOX.html`, abrir no browser para ver as 4 telas de referência ao vivo

Resumo navegável em `docs/references/design-system.md`.

**Postura da marca:** companheiro silencioso do púlpito. Editorial, ministerial, durável.
**Anti-personalidade:** motivacional, gamificado, AI-flashy, comercial.

### Tokens nucleares (nunca inventar fora)

| Elemento | Token | Valor |
|---|---|---|
| Background | `--vox-bg` | `#F9F7F4` (Parchment Canvas) |
| Texto | `--vox-ink` | `#18181B` (Charcoal, **nunca** `#000`) |
| Acento primário | `--vox-forest` | `#166534` (Forest Deep) |
| Acento bíblico | `--vox-gold` | `#B45309` (Scripture Gold, só refs bíblicas) |
| Stage (apresentação) | `--vox-stage-bg` | `#0B0F0D` |
| Display | `--vox-font-display` | Fraunces |
| UI | `--vox-font-ui` | Geist |
| Mono | `--vox-font-mono` | Geist Mono (timestamps, refs, word count) |

Cores fechadas por framework (Expositivo · Textual · Narrativo · Temático · Tópico · Livre)
em `design-system.md`. **Não adicionar novas cores.** Use apenas como ancoragens cromáticas
pequenas (badges, dots), nunca como flood fill.

### Regras inegociáveis de design

1. Nunca `#000000`, sempre `--vox-ink`
2. Nunca `Inter`, Fraunces (display) ou Geist (UI)
3. Nunca emoji em UI, só `<VoxIcon name="..." />` (não importar Lucide/Hero Icons)
4. Nunca 3 cards iguais em linha, bento grid assimétrico
5. Nunca hero centralizado, split-screen ou left-aligned
6. Nunca imagens religiosas clichê (cruzes, pombas, raios de luz)
7. Nunca AI-purple neon, violeta só como cor do framework Narrativo, em badge
8. Sombras com undertone verde (`rgba(22,101,52,...)`), nunca cinza frio/glass
9. Referências bíblicas com em-dash: `Romanos 5:1,11` (nunca hífen simples)
10. Máximo 1 cor de acento por contexto, Forest **ou** Gold

### Voz e copy

- **Casing:** Title Case para títulos de tela; **sentence case** para labels e botões
- **Pronome:** `você` (formal-warm), nunca `tu`. Português PT-BR.
- **Palavras banidas:** Elevate · Seamless · Transform · Next-gen · Unlock · Empower ·
  Magic · AI-powered
- Exemplos de tom: "Novo sermão" (não "Criar Novo Sermão Agora"); "salvo há 12 segundos"
  (não "✓ Saved!"); "Manuscrito" (não "Doc")

---

## Onde olhar para cada coisa

| Pergunta | Arquivo |
|---|---|
| O que cada rota deve fazer? | `docs/SPEC.md` |
| Schema SQL, RLS, pastas, fluxos de auth/IA/Bible/Slides | `docs/references/architecture.md` |
| Tokens, tipografia, regras de design | `docs/references/design-system.md` + `design-system/BRANDBOOK.md` |
| Workflow, formato de issue, critério de "concluída" | `docs/references/workflow.md` |
| Próxima issue a trabalhar | `issues/README.md` |
| Detalhe de uma issue | `issues/NNN-*.md` |
| Componentes JSX de referência + dados mock | `design-system/vox/` |
| Telas de referência ao vivo | abrir `design-system/VOX.html` no browser |
| Variáveis de ambiente esperadas | `.env.example` |

---

## Anti-padrões a evitar

- Implementar sem ler a issue + `docs/SPEC.md` + seção relevante de `architecture.md`
- Renderizar UI de IA sem checar `profile.ai_enabled`
- Tratar `sermons` como só "sermões", esquecer Palestra/Aula via `content_type`
- Usar o mesmo fluxo de Present para `type = 'esboço'` e `type = 'apresentação'`
  (são modos visualmente diferentes, ver SPEC seção `/sermons/[id]/present`)
- Importar ícones de Lucide/Hero Icons em vez de estender `VoxIcon`
- Cair em `Inter` ou `#000` por hábito
- Criar componente novo quando `design-system/vox/primitives.jsx` já tem o equivalente
- Usar Zustand para algo que poderia ser Server State
- Expor `SUPABASE_SERVICE_ROLE_KEY` no cliente
