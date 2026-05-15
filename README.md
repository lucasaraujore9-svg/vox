# VOX — Palestras e Sermões

PWA para pregadores, pastores e palestrantes. Ciclo completo: preparação → entrega → arquivo.
Cobre Sermão, Palestra, Aula e Curso, com frameworks homiléticos como guias dentro do editor.

## Stack

- **Next.js 16** — App Router + TypeScript estrito (`noUncheckedIndexedAccess`)
- **Supabase** — PostgreSQL + Auth + Storage (RLS em todas as tabelas)
- **Tailwind CSS 4** + shadcn/ui mapeado para tokens VOX
- **TipTap 2** — editor rico (extensão custom para versículos bíblicos)
- **next-pwa** — offline-first com IndexedDB (`idb`) + sync ao reconectar
- **OpenAI GPT-4o** — assistente opcional por usuário (`profile.ai_enabled`)
- **API.Bible** — proxy server-side com cache permanente de 30d
- **Vercel** — hospedagem alvo

## Setup local

```bash
# 1. Instale dependências (Node >= 20)
npm install

# 2. Configure variáveis de ambiente
cp .env.example .env.local
# Preencha: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY (opcional), BIBLE_API_KEY

# 3. Crie o projeto Supabase em supabase.com e rode as migrations
# Cole cada arquivo de supabase/migrations/*.sql na SQL Editor, em ordem 001 → 009.
# Ou use o Supabase CLI:
#   npx supabase link --project-ref <ref>
#   npx supabase db push

# 4. (Opcional) Gere os tipos reais do Supabase substituindo o stub:
#   npx supabase gen types typescript --project-id <id> > src/types/database.ts

# 5. (Opcional) Crie o bucket de Storage `sermon-slides` no Dashboard como PRIVATE
# (a migration 004 já cria o bucket + RLS policies via SQL)

# 6. Inicie o servidor
npm run dev
```

> **Sem Supabase configurado:** o app builda e roda; o Dashboard e o Banco caem
> automaticamente em dados mock. O middleware desativa proteção de rotas se as
> variáveis Supabase não estiverem definidas. Útil para validar UI antes do
> projeto estar provisionado.

## Scripts

```bash
npm run dev        # servidor de desenvolvimento (Turbopack)
npm run build      # compila e roda type-check
npm run start      # serve o build de produção
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## Rotas

| URL | Descrição |
|-----|-----------|
| `/` | Landing pública |
| `/templates` | Biblioteca de frameworks homiléticos (pública) |
| `/auth/login` · `/auth/register` | Auth Supabase |
| `/dashboard` | Painel — stats, recentes, série ativa |
| `/sermons` | Banco de conteúdo com busca FTS + filtros URL |
| `/sermons/new` | Wizard de criação (4 passos) |
| `/sermons/[id]` | Editor de esboço (TipTap) ou painel de slides |
| `/sermons/[id]/present` | Modo apresentação — esboço (teleprompter) ou slides |
| `/courses` · `/courses/[id]` | Lista e editor de cursos |
| `/study` · `/study/[moduleId]` | Trilhas de estudo guiado |
| `/series` | Séries de sermões |
| `/import` | Importação de manuscritos (.docx / texto) |
| `/settings` | Perfil, preferências, IA, blocos, conta |
| `/settings/blocks` | Configuração detalhada de cores dos blocos |

### Route Handlers

| Endpoint | Função |
|----------|--------|
| `POST /api/sermons/slides/upload?sermonId=…` | PDF → WebP via pdfjs + sharp |
| `POST /api/sermons/slides/google?sermonId=…` | Registra URL do Google Slides |
| `POST /api/sermons/slides/manual?sermonId=…` | Cria slide vazio |
| `POST /api/sermons/import` | .docx/.txt → blocos |
| `GET /api/sermons/export?sermonId=…&format=pdf\|docx\|txt` | Exportação |
| `GET /api/bible?version=…&reference=…` | Proxy API.Bible com cache 30d |
| `POST /api/ai/suggest` | Sugestão de estrutura (atrás de `ai_enabled` + rate limit) |

## Documentação completa

- 📋 **Spec por rota:** `docs/SPEC.md`
- 🏗️ **Arquitetura, schema SQL, fluxos:** `docs/references/architecture.md`
- 🎨 **Design system:** `docs/references/design-system.md` + `design-system/BRANDBOOK.md`
- 🔄 **Workflow:** `docs/references/workflow.md`
- 📌 **Issues:** `issues/README.md` (todas marcadas como concluídas no código)
- 🤖 **Guia do Claude Code:** `CLAUDE.md`
