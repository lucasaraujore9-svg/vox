# VOX — Arquitetura Técnica

---

## Visão de Produto

VOX é uma **plataforma de comunicação pastoral e educacional** — não apenas um editor de sermões.
Cobre o ciclo: preparação → entrega → arquivo, para qualquer formato de conteúdo.

### Tipos de Conteúdo

| Tipo | Descrição | Formatos disponíveis |
|------|-----------|----------------------|
| **Sermão** | Pregação em culto/celebração | Esboço, Slides, Ambos |
| **Palestra** | Comunicação em evento/conferência | Esboço, Slides, Ambos |
| **Aula** | Ensino em célula/escola bíblica | Esboço, Slides, Ambos |
| **Curso** | Container de aulas com estrutura curricular | — (gerencia aulas) |

Sermão, Palestra e Aula compartilham a mesma tabela `sermons` com discriminador `content_type`.
Curso é uma entidade separada com ementa, objetivos e carga horária.

### Modos de Apresentação

| Modo | Descrição | Para quem |
|------|-----------|-----------|
| **Teleprompter** | Esboço em tela escura, blocos rolando | Pregação sem slides |
| **Simples** | Slide fullscreen, sem UI | Projetado na tela da igreja |
| **Apresentador** | Janela 1: slide / Janela 2: painel de controle + próximo slide + comentários em blocos | Pastor no púlpito com monitor |

### Sistema de Blocos Visuais (núcleo do editor)

Cada tipo de bloco tem uma **cor configurável por usuário** (com defaults do sistema).
Os blocos são usados em: editor de esboço, comentários de slides, notas de estudo guiado.

| Bloco | Default color | Contexto |
|-------|---------------|---------|
| Texto Bíblico | `#B45309` (Gold) | Passagens e citações bíblicas |
| Proposição | `#166534` (Forest) | Tese central do conteúdo |
| Ponto Principal | `#166534` (Forest) | Estrutura do argumento |
| Subponto | `#15803d` (Forest mid) | Desdobramento |
| Introdução | `#475569` (Slate) | Abertura |
| Contexto | `#64748b` (Slate light) | Background histórico/literário |
| Ilustração | `#7c3aed` (Violeta) | História, analogia, exemplo |
| Aplicação | `#0d7c7c` (Teal) | Prática para a audiência |
| Citação | `#d97706` (Âmbar) | Voz externa, quote |
| Pergunta retórica | `#9333ea` (Roxo) | Engajamento |
| Transição | `#e2e8f0` (Whisper) | Conectivo entre pontos |
| Conclusão | `#18181b` (Ink) | Encerramento e chamado |
| Oração | `#166534` (Forest, 60%) | Momento sacro |
| Notas pessoais | `#9ca3af` (Muted) | Só visível para o pregador |

---

## Stack e Justificativas

| Tecnologia | Versão | Justificativa |
|-----------|--------|---------------|
| Next.js | 15 (App Router) | Server Components nativos, excelente para PWA, deploy fácil na Vercel |
| TypeScript | 5+ | Tipagem estrita — crítico para manter qualidade com IA gerando código |
| Tailwind CSS | 4 | Utility-first, integração nativa com shadcn/ui |
| shadcn/ui | latest | Componentes acessíveis, customizáveis, sem lock-in |
| Supabase | latest | PostgreSQL gerenciado + Auth + Realtime + Storage em um lugar |
| Supabase JS | 2 | Client oficial com tipagem gerada |
| next-pwa | latest | PWA com Service Worker e cache offline para Next.js |
| Zod | 3 | Validação de schemas em runtime + inferência TypeScript |
| React Hook Form | 7 | Forms performáticos sem re-render desnecessário |
| TipTap | 2 | Editor rico extensível — base do editor de sermões |
| OpenAI SDK | 4 | Módulo de IA opcional |

---

## Estrutura de Pastas Detalhada

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (providers, fonts)
│   ├── globals.css                   # Design tokens + Tailwind base
│   ├── (public)/                     # Grupo público (sem auth)
│   │   ├── page.tsx                  # Landing page /
│   │   └── templates/
│   │       └── page.tsx              # /templates
│   ├── (auth)/                       # Grupo de autenticação
│   │   ├── layout.tsx                # Layout de auth (sem sidebar)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (app)/                        # Grupo protegido
│   │   ├── layout.tsx                # Layout com sidebar + header
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── sermons/
│   │   │   ├── page.tsx              # /sermons — banco (sermões + palestras + aulas)
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # /sermons/new — wizard de criação
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # /sermons/[id] — editor
│   │   │       └── present/
│   │   │           └── page.tsx      # /sermons/[id]/present — bifurca por type
│   │   ├── courses/
│   │   │   ├── page.tsx              # /courses — lista de cursos
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # /courses/new — criar curso
│   │   │   └── [id]/
│   │   │       └── page.tsx          # /courses/[id] — editor do curso
│   │   ├── study/
│   │   │   ├── page.tsx              # /study — trilhas disponíveis
│   │   │   └── [moduleId]/
│   │   │       └── page.tsx          # /study/[moduleId] — sessão de estudo
│   │   ├── import/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       └── blocks/
│   │           └── page.tsx          # /settings/blocks — configurar cores dos blocos
│   └── api/
│       ├── sermons/
│       │   └── export/
│       │       └── route.ts          # Exportação PDF/DOCX
│       ├── bible/
│       │   └── route.ts              # Proxy para API.Bible
│       └── ai/
│           └── suggest/
│               └── route.ts          # Assistente de IA
│
├── components/
│   ├── ui/                           # shadcn/ui (não editar manualmente)
│   ├── editor/
│   │   ├── SermonEditor.tsx          # Componente principal do editor (esboço)
│   │   ├── SermonBlock.tsx           # Bloco individual
│   │   ├── BlockToolbar.tsx          # Toolbar do bloco
│   │   ├── BibleSearch.tsx           # Busca de versículos inline
│   │   └── AIAssistant.tsx           # Painel de IA (condicional)
│   ├── slides/
│   │   ├── SlidesPanel.tsx           # Painel de slides (apresentação)
│   │   ├── SlidesList.tsx            # Lista de miniaturas de slides
│   │   ├── SlideComment.tsx          # Editor de comentário por slide (usa BlockEditor)
│   │   ├── SlidesUpload.tsx          # Upload PDF/PPT
│   │   └── GoogleSlidesInput.tsx     # Campo de URL Google Slides
│   ├── sermon/
│   │   ├── ContentCard.tsx           # Card na listagem (mostra content_type + tipo como badge)
│   │   ├── ContentFilters.tsx        # Filtros do banco (type, content_type, framework)
│   │   ├── ContentGrid.tsx           # Grid/lista de conteúdos
│   │   ├── ContentTypePicker.tsx     # Seleção de content_type (Sermão/Palestra/Aula)
│   │   ├── TypePicker.tsx            # Seleção de formato (Esboço vs Apresentação)
│   │   └── FrameworkPicker.tsx       # Seleção de framework (só esboço)
│   ├── course/
│   │   ├── CourseCard.tsx            # Card de curso na listagem
│   │   ├── CourseEditor.tsx          # Editor de ementa + objetivos + carga horária
│   │   ├── LessonList.tsx            # Lista de aulas vinculadas ao curso (drag-and-drop)
│   │   └── LessonPicker.tsx          # Modal para vincular aulas existentes ao curso
│   ├── study/
│   │   ├── StudyModuleCard.tsx       # Card de módulo de estudo disponível
│   │   ├── StudySession.tsx          # Interface da sessão de estudo ativa
│   │   ├── StudyNotes.tsx            # Editor de notas (usa BlockEditor — mesmos blocos)
│   │   ├── StudyProgress.tsx         # Barra de progresso do módulo
│   │   └── StudyOutputPicker.tsx     # "Gerar conteúdo" — escolha de tipo de output
│   ├── blocks/
│   │   ├── BlockEditor.tsx           # Editor de blocos visuais (usado em editor, slides, estudo)
│   │   ├── BlockItem.tsx             # Bloco individual com barra colorida
│   │   ├── BlockToolbar.tsx          # Toolbar de tipo de bloco
│   │   └── BlockColorPicker.tsx      # Configuração de cor por tipo de bloco
│   ├── present/
│   │   ├── PresentModeEsboco.tsx     # Teleprompter para esboço
│   │   ├── PresentModeSlides.tsx     # Slide fullscreen simples (audiência)
│   │   └── PresentModePresenter.tsx  # Modo apresentador: slide + painel de controle
│   └── shared/
│       ├── AppSidebar.tsx
│       ├── AppHeader.tsx
│       ├── UserAvatar.tsx
│       └── ConfirmDialog.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client (singleton)
│   │   ├── server.ts                 # Server client (cookies)
│   │   └── middleware.ts             # Supabase middleware helper
│   ├── ai/
│   │   ├── client.ts                 # OpenAI client
│   │   └── prompts.ts                # Prompts por framework
│   ├── bible/
│   │   ├── client.ts                 # API.Bible wrapper
│   │   └── versions.ts               # Traduções disponíveis
│   ├── offline/
│   │   └── sync.ts                   # Lógica de sync IndexedDB → Supabase
│   └── utils/
│       ├── cn.ts                     # clsx + twMerge
│       └── format.ts                 # Formatadores de data, texto
│
├── hooks/
│   ├── useSermon.ts                  # CRUD de sermão/palestra/aula com otimistic updates
│   ├── useSlides.ts                  # CRUD de slides + upload
│   ├── useCourse.ts                  # CRUD de curso + gestão de aulas vinculadas
│   ├── useStudy.ts                   # Progresso de estudo + notas + geração de output
│   ├── useBlockColors.ts             # Cores dos blocos (lê preferências + aplica defaults)
│   ├── useAutoSave.ts                # Auto-save com debounce
│   ├── useOfflineSync.ts             # Detecta online/offline, dispara sync
│   └── useAI.ts                      # Hook para módulo de IA
│
├── stores/
│   └── editorStore.ts                # Estado do editor (Zustand)
│
└── types/
    ├── database.ts                   # Tipos gerados pelo Supabase CLI
    ├── sermon.ts                     # Tipos de sermão e blocos
    └── api.ts                        # Tipos das APIs externas
```

---

## Schema do Banco (Supabase / PostgreSQL)

### Migrations — executar em ordem

```sql
-- 001_profiles.sql
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  name        text not null,
  denomination text,
  avatar_url  text,
  ai_enabled  boolean default false,
  bible_version text default 'ARC',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Usuário vê próprio perfil"
  on profiles for all using (auth.uid() = id);

-- Trigger para criar perfil após signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 002_series.sql
create table public.series (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles on delete cascade,
  title       text not null,
  description text,
  created_at  timestamptz default now()
);

alter table public.series enable row level security;
create policy "Usuário gerencia próprias séries"
  on series for all using (auth.uid() = user_id);

-- 003_sermons.sql
create table public.sermons (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles on delete cascade,
  title       text not null default 'Novo Sermão',
  framework   text not null default 'livre',
  bible_ref   text,
  bible_book  text,
  status      text not null default 'rascunho' check (status in ('rascunho', 'pronto')),
  series_id   uuid references public.series on delete set null,
  tags        text[] default '{}',
  content     jsonb default '[]',
  word_count  int default 0,
  preached_at date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  deleted_at  timestamptz  -- soft delete
);

alter table public.sermons enable row level security;
create policy "Usuário gerencia próprios sermões"
  on sermons for all using (auth.uid() = user_id);

-- Full-text search
alter table public.sermons
  add column search_vector tsvector
    generated always as (
      to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(bible_ref, ''))
    ) stored;

create index sermons_search_idx on sermons using gin(search_vector);
create index sermons_user_id_idx on sermons(user_id);
create index sermons_created_at_idx on sermons(created_at desc);

-- 004_slides.sql
-- Só usada quando sermons.type = 'apresentação'
create table public.slides (
  id            uuid default gen_random_uuid() primary key,
  sermon_id     uuid references public.sermons on delete cascade not null,
  "order"       int not null,
  image_url     text,         -- URL pública do Supabase Storage
  storage_path  text,         -- path interno (para deleção do arquivo)
  comment       text default '',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.slides enable row level security;
create policy "Usuário gerencia próprios slides"
  on slides for all
  using (
    exists (
      select 1 from public.sermons
      where sermons.id = slides.sermon_id
        and sermons.user_id = auth.uid()
    )
  );

create index slides_sermon_order_idx on slides(sermon_id, "order");

-- 005_sermons_type.sql
-- Adicionar campo type + content_type à tabela sermons
alter table public.sermons
  add column type text not null default 'esboço'
    check (type in ('esboço', 'apresentação'));

alter table public.sermons
  add column content_type text not null default 'sermão'
    check (content_type in ('sermão', 'palestra', 'aula'));

alter table public.sermons
  add column slides_source text
    check (slides_source in ('upload', 'google_slides', 'manual'));

alter table public.sermons
  add column slides_url text;  -- Google Slides URL

-- 006_courses.sql
create table public.courses (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles on delete cascade,
  title         text not null default 'Novo Curso',
  ementa        text,                           -- sumário/descrição geral
  objectives    text[] default '{}',            -- array de objetivos de aprendizagem
  hours         numeric(5,1),                   -- carga horária total
  status        text not null default 'rascunho'
    check (status in ('rascunho', 'pronto', 'publicado')),
  tags          text[] default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  deleted_at    timestamptz                     -- soft delete
);

alter table public.courses enable row level security;
create policy "Usuário gerencia próprios cursos"
  on courses for all using (auth.uid() = user_id);

create index courses_user_id_idx on courses(user_id);

-- Aulas vinculadas ao curso (content_type = 'aula' em sermons)
create table public.course_lessons (
  id          uuid default gen_random_uuid() primary key,
  course_id   uuid references public.courses on delete cascade not null,
  sermon_id   uuid references public.sermons on delete cascade not null,
  "order"     int not null,
  created_at  timestamptz default now(),
  unique (course_id, sermon_id)
);

alter table public.course_lessons enable row level security;
create policy "Usuário gerencia aulas do curso"
  on course_lessons for all
  using (
    exists (select 1 from public.courses where courses.id = course_lessons.course_id
      and courses.user_id = auth.uid())
  );

create index course_lessons_course_order_idx on course_lessons(course_id, "order");

-- 007_study.sql
-- Módulos de estudo (seed pelo sistema, não por usuário)
create table public.study_modules (
  id               uuid default gen_random_uuid() primary key,
  title            text not null,
  description      text,
  category         text check (category in (
    'homilética', 'hermenêutica', 'teologia', 'comunicação', 'liderança', 'discipulado'
  )),
  estimated_hours  numeric(4,1),
  session_count    int default 0,          -- quantas sessões/aulas tem o módulo
  is_active        boolean default true,
  created_at       timestamptz default now()
);

-- Progresso e notas do usuário em cada módulo
create table public.study_sessions (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.profiles on delete cascade,
  module_id       uuid references public.study_modules on delete cascade,
  notes_content   jsonb default '[]',      -- blocos visuais (mesma estrutura de sermons.content)
  current_session int default 1,           -- sessão atual dentro do módulo
  progress        numeric(3,0) default 0,  -- 0–100%
  completed_at    timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (user_id, module_id)              -- um progresso por usuário por módulo
);

alter table public.study_sessions enable row level security;
create policy "Usuário gerencia próprias sessões de estudo"
  on study_sessions for all using (auth.uid() = user_id);

-- 008_block_colors.sql
-- Cores configuráveis dos blocos por usuário
create table public.block_color_preferences (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles on delete cascade,
  block_type  text not null,   -- ex: 'Texto Bíblico', 'Ilustração', etc.
  color       text not null,   -- hex, ex: '#B45309'
  created_at  timestamptz default now(),
  unique (user_id, block_type)
);

alter table public.block_color_preferences enable row level security;
create policy "Usuário gerencia próprias cores"
  on block_color_preferences for all using (auth.uid() = user_id);
```

---

## Supabase Storage — Slides

### Bucket: `sermon-slides`

```
sermon-slides/        (bucket público com RLS)
└── {user_id}/
    └── {sermon_id}/
        ├── slide-001.webp
        ├── slide-002.webp
        └── slide-003.webp
```

### RLS do bucket
```sql
-- Política de Storage: usuário acessa apenas seus próprios arquivos
create policy "Usuário gerencia seus slides"
  on storage.objects for all
  using (
    bucket_id = 'sermon-slides'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

### Fluxo de upload de PDF/PPT
```
Cliente → POST /api/sermons/slides/upload
        → Route Handler recebe o arquivo (FormData)
        → Converte PDF → imagens WebP (1280×720) usando sharp ou pdf2pic
        → Faz upload de cada imagem para Supabase Storage
        → Cria registros na tabela `slides` com image_url + storage_path
        → Retorna array de slides criados
```

### Packages para conversão
```bash
npm install sharp      # redimensionamento e conversão de imagens
npm install pdf-to-img # PDF → imagens (usa pdfjs-dist)
# Para PPT/PPTX: LibreOffice via spawn em ambiente server (ou serviço externo)
```

### Google Slides
- Armazena apenas a URL em `sermons.slides_url`
- Exibe via `<iframe src="{url}/embed?slide=1">` no modo apresentação
- Thumbnails: `https://docs.google.com/presentation/d/{id}/export/png?pageid=p{N}`
- Sem processamento server-side — depende do link ser público

---

## Padrão de Autenticação

### Middleware (`src/middleware.ts`)
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Rotas públicas — não proteger
  const publicPaths = ['/', '/auth/login', '/auth/register', '/templates']
  if (publicPaths.some(p => request.nextUrl.pathname === p)) {
    return NextResponse.next()
  }

  // Verificar sessão
  const { supabase, response } = createSupabaseMiddlewareClient(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}
```

---

## Estratégia PWA + Offline

### Camadas de persistência

1. **Supabase** (source of truth) — dados no PostgreSQL
2. **IndexedDB** (cache offline) — espelho local dos sermões em edição
3. **Service Worker** (next-pwa) — cache de assets e navegação offline

### Fluxo de sync

```
Online:  Editor → auto-save → Supabase → IndexedDB (atualiza cache)
Offline: Editor → auto-save → IndexedDB (pendente)
         Ao reconectar → sync worker detecta → envia pendentes para Supabase
         Conflict resolution: last-write-wins (simples para MVP)
```

### Configuração next-pwa (`next.config.ts`)
```typescript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
      handler: 'NetworkFirst',
      options: { cacheName: 'supabase-cache', expiration: { maxAgeSeconds: 86400 } }
    }
  ]
})
```

---

## Módulo de IA (opcional por usuário)

### Guard pattern — verificar flag antes de qualquer renderização

```typescript
// Server Component
const { data: profile } = await supabase.from('profiles').select('ai_enabled').single()

if (!profile?.ai_enabled) {
  return null  // Não renderiza nada relacionado a IA
}
```

### API Route (`/api/ai/suggest`)
- Recebe: framework selecionado + tema/texto bíblico + blocos existentes
- Chama: OpenAI GPT-4o com prompt específico por framework
- Retorna: sugestão de estrutura de blocos em JSON
- Rate limit: 10 requisições/hora por usuário (Supabase Edge Function ou middleware)

---

## Integração API.Bible

### Endpoint proxy (`/api/bible`)
- Proxy para esconder a API key do cliente
- Cache de 24h para versículos (imutáveis)
- Traduções suportadas no MVP: ARC, NVI, NVT, NTLH

---

## Geração de Tipos Supabase

```bash
# Após criar/alterar tabelas, regenere os tipos:
npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/types/database.ts
```

---

## Performance e Segurança

- **RLS (Row Level Security)** ativado em todas as tabelas — cada usuário só acessa seus dados
- **Service Role Key** apenas em Route Handlers server-side, nunca no cliente
- **Content Security Policy** configurado no `next.config.ts`
- **Imagens:** Next.js Image component com domínios permitidos configurados
- **Dados de IA:** nunca logar conteúdo de sermões nos servidores de IA além do necessário
