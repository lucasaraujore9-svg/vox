# Issue 026 — Schema: Estudo Guiado + Cores dos Blocos

**Status:** [ ] PENDENTE
**Tipo:** infra
**Página:** global
**Depende de:** 020
**Prioridade:** P1

---

## O Que Fazer

Criar as tabelas de estudo guiado (`study_modules`, `study_sessions`) e de
preferências de cores dos blocos (`block_color_preferences`). Fazer seed inicial
dos módulos de estudo disponíveis.

## Componentes Envolvidos

- `supabase/migrations/008_study.sql` — tabelas de estudo
- `supabase/migrations/009_block_colors.sql` — preferências de cores
- `supabase/seed/study_modules.sql` — seed dos módulos iniciais
- `src/types/database.ts` — regenerar após migrations

## SQL

### Migration 008 — study_modules + study_sessions

```sql
-- supabase/migrations/008_study.sql

-- Módulos de estudo (gerenciados pelo sistema, não pelo usuário)
create table public.study_modules (
  id               uuid default gen_random_uuid() primary key,
  title            text not null,
  description      text,
  category         text check (category in (
    'homilética', 'hermenêutica', 'teologia',
    'comunicação', 'liderança', 'discipulado'
  )),
  estimated_hours  numeric(4,1),
  session_count    int not null default 0,
  is_active        boolean default true,
  sort_order       int default 0,
  created_at       timestamptz default now()
);

-- Acesso público de leitura (qualquer usuário autenticado pode ver os módulos)
alter table public.study_modules enable row level security;
create policy "Qualquer usuário autenticado lê módulos"
  on study_modules for select
  using (auth.role() = 'authenticated' and is_active = true);

-- Progresso e notas do usuário em cada módulo
create table public.study_sessions (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references public.profiles on delete cascade,
  module_id        uuid references public.study_modules on delete cascade,
  notes_content    jsonb default '[]',  -- blocos visuais (mesma estrutura de sermons.content)
  current_session  int not null default 1,
  progress         numeric(3,0) not null default 0 check (progress between 0 and 100),
  completed_at     timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique (user_id, module_id)
);

alter table public.study_sessions enable row level security;
create policy "Usuário gerencia próprias sessões"
  on study_sessions for all using (auth.uid() = user_id);

create index study_sessions_user_idx on study_sessions(user_id);
create index study_sessions_module_idx on study_sessions(module_id);
```

### Migration 009 — block_color_preferences

```sql
-- supabase/migrations/009_block_colors.sql
create table public.block_color_preferences (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles on delete cascade,
  block_type  text not null,
  color       text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),  -- hex válido
  created_at  timestamptz default now(),
  unique (user_id, block_type)
);

alter table public.block_color_preferences enable row level security;
create policy "Usuário gerencia próprias cores"
  on block_color_preferences for all using (auth.uid() = user_id);

create index block_colors_user_idx on block_color_preferences(user_id);
```

### Seed — Módulos de Estudo Iniciais

```sql
-- supabase/seed/study_modules.sql
insert into public.study_modules (title, description, category, estimated_hours, session_count, sort_order) values
  ('Homilética Essencial',
   'Fundamentos da pregação expositiva, temática e narrativa. Do texto à proclamação.',
   'homilética', 12.0, 8, 1),

  ('Hermenêutica Bíblica',
   'Princípios para interpretar as Escrituras com fidelidade ao texto e ao contexto.',
   'hermenêutica', 9.0, 6, 2),

  ('Teologia Sistemática Básica',
   'Os grandes temas da fé cristã: Deus, Cristo, Espírito, Igreja, Salvação, Escatologia.',
   'teologia', 15.0, 10, 3),

  ('Comunicação e Oratória',
   'Técnicas de comunicação para pregadores: voz, postura, narrativa e conexão com a audiência.',
   'comunicação', 7.0, 5, 4),

  ('Liderança Pastoral',
   'Fundamentos de liderança serva, gestão de equipes e saúde da comunidade.',
   'liderança', 8.0, 6, 5),

  ('Formação de Discípulos',
   'Metodologias e modelos bíblicos para discipulado intencional e multiplicação.',
   'discipulado', 10.0, 8, 6);
```

## Critério de Aceite

- [ ] Migration 008 aplicada sem erro
- [ ] Migration 009 aplicada sem erro
- [ ] RLS: estudo_modules legível por qualquer autenticado, só admins escrevem
- [ ] RLS: study_sessions acessível só pelo próprio usuário
- [ ] Seed executado — 6 módulos disponíveis
- [ ] `block_color_preferences`: check constraint valida formato hex
- [ ] Tipos gerados atualizados

## Notas

- `study_modules` é seed do sistema — não há interface admin no MVP para criar módulos
- `study_sessions.notes_content` usa JSONB com a mesma estrutura de blocos de `sermons.content`
- Futuramente, `study_modules` pode ter `sessions_content` (JSONB com o conteúdo de cada sessão)
  — no MVP, o conteúdo das sessões pode ser hardcoded no front como constantes TypeScript
- `block_color_preferences` armazena apenas as cores **modificadas** — o sistema busca o default
  para blocos não presentes na tabela (lógica no `useBlockColors` hook)

## Plano de Implementação

### Pré-requisitos
- Issue 020 concluída (`profiles` existe como referência de FK)

### Passos

**1. Criar e aplicar migration 008**
Criar `supabase/migrations/008_study.sql`:
- Tabela `study_modules` (acesso público de leitura por autenticados)
- Tabela `study_sessions` (UNIQUE `user_id, module_id`; JSONB `notes_content`)
- Índices e RLS conforme spec
- Executar migration

**2. Criar e aplicar migration 009**
Criar `supabase/migrations/009_block_colors.sql`:
- Tabela `block_color_preferences` com CHECK `color ~ '^#[0-9A-Fa-f]{6}$'`
- UNIQUE `(user_id, block_type)` para permitir upsert
- RLS por `auth.uid()`
- Executar migration

**3. Executar seed de módulos**
Criar `supabase/seed/study_modules.sql` com os 6 módulos conforme spec:
- Executar: `npx supabase db seed` ou aplicar via `psql`/Studio manualmente

**4. Regenerar tipos TypeScript**
- `npx supabase gen types typescript --local > src/types/database.ts`
- Confirmar `study_modules`, `study_sessions`, `block_color_preferences` presentes

**5. Smoke test**
- Via Studio: confirmar 6 linhas em `study_modules`
- Testar RLS: `study_sessions` invisível entre usuários distintos
- Testar CHECK: INSERT em `block_color_preferences` com `color = '#ZZZZZZ'` deve falhar

### Como Verificar
- `SELECT count(*) FROM study_modules` retorna 6
- INSERT em `study_sessions` com `user_id` válido: sucesso; SELECT com outro user_id: 0 linhas
- INSERT em `block_color_preferences` com cor inválida: erro de constraint
- `src/types/database.ts` atualizado com os 3 novos tipos
