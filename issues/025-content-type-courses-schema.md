# Issue 025, Schema: content_type + Cursos

**Status:** [ ] PENDENTE
**Tipo:** infra
**Página:** global
**Depende de:** 020
**Prioridade:** P1

---

## O Que Fazer

Adicionar o campo `content_type` à tabela `sermons` e criar as tabelas `courses`
e `course_lessons` com RLS adequada.

## Componentes Envolvidos

- `supabase/migrations/006_content_type.sql`, campo content_type em sermons
- `supabase/migrations/007_courses.sql`, tabelas courses + course_lessons
- `src/types/database.ts`, regenerar após migrations

## SQL

### Migration 006, content_type em sermons

```sql
-- supabase/migrations/006_content_type.sql
alter table public.sermons
  add column content_type text not null default 'sermão'
    check (content_type in ('sermão', 'palestra', 'aula'));
```

### Migration 007, courses + course_lessons

```sql
-- supabase/migrations/007_courses.sql
create table public.courses (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles on delete cascade,
  title       text not null default 'Novo Curso',
  ementa      text,
  objectives  text[] default '{}',
  hours       numeric(5,1),
  status      text not null default 'rascunho'
    check (status in ('rascunho', 'pronto', 'publicado')),
  tags        text[] default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  deleted_at  timestamptz
);

alter table public.courses enable row level security;
create policy "Usuário gerencia próprios cursos"
  on courses for all using (auth.uid() = user_id);

create index courses_user_id_idx on courses(user_id);
create index courses_created_at_idx on courses(created_at desc);

-- Full-text search em cursos
alter table public.courses
  add column search_vector tsvector
    generated always as (
      to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(ementa, ''))
    ) stored;

create index courses_search_idx on courses using gin(search_vector);

-- Aulas vinculadas a um curso
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
    exists (
      select 1 from public.courses
      where courses.id = course_lessons.course_id
        and courses.user_id = auth.uid()
    )
  );

create index course_lessons_order_idx on course_lessons(course_id, "order");
```

## Critério de Aceite

- [ ] Migration 006 aplicada sem erro
- [ ] Migration 007 aplicada sem erro
- [ ] RLS em `courses`: usuário só acessa seus cursos
- [ ] RLS em `course_lessons`: usuário só acessa aulas dos seus cursos
- [ ] `sermon_id` em `course_lessons` só pode referenciar aulas (`content_type = 'aula'`), validar no app, não no DB
- [ ] Tipos gerados atualizados (`npx supabase gen types`)

## Notas

- `course_lessons.sermon_id` referencia a tabela `sermons`, o app deve garantir que só aulas (`content_type = 'aula'`) sejam vinculadas
- Soft delete em `courses`: `deleted_at`, não deletar fisicamente
- `hours` pode ser preenchida manualmente ou calculada como soma das durações das aulas

## Plano de Implementação

### Pré-requisitos
- Issue 020 concluída (schema base aplicado, `profiles` e `sermons` existem)

### Passos

**1. Criar e aplicar migration 006**
Criar `supabase/migrations/006_content_type.sql`:
- `ALTER TABLE sermons ADD COLUMN content_type text NOT NULL DEFAULT 'sermão' CHECK (...)`
- Executar: `npx supabase migration up` ou `npx supabase db push`

**2. Criar e aplicar migration 007**
Criar `supabase/migrations/007_courses.sql`:
- Tabela `courses` com soft delete (`deleted_at`), FTS (`search_vector`), RLS
- Tabela `course_lessons` com `UNIQUE(course_id, sermon_id)`, RLS via subquery em `courses`
- Índices de performance conforme spec
- Executar migration

**3. Regenerar tipos TypeScript**
- `npx supabase gen types typescript --local > src/types/database.ts`
- Verificar que `Database['public']['Tables']['courses']` e `course_lessons` aparecem

**4. Smoke test de RLS**
- Via Supabase Studio: testar INSERT/SELECT em `courses` com usuário autenticado vs não autenticado
- Verificar que política impede acesso cross-user

### Como Verificar
- `SELECT * FROM sermons LIMIT 1` retorna coluna `content_type` com valor `'sermão'`
- INSERT em `courses` com `user_id` válido: sucesso; sem user_id ou user_id errado: bloqueado por RLS
- INSERT em `course_lessons` com `course_id` de outro usuário: bloqueado por RLS
- `src/types/database.ts` contém tipos para `courses` e `course_lessons`
