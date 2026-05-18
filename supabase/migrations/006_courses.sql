-- Migration 006, courses
-- Issue 025 · cursos = container de aulas com ementa, objetivos e carga horária

create table if not exists public.courses (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  title       text not null default 'Novo Curso',
  ementa      text,
  objectives  text[] not null default '{}',
  hours       numeric(5,1),
  status      text not null default 'rascunho'
              check (status in ('rascunho','pronto','publicado')),
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

alter table public.courses enable row level security;

drop policy if exists "Course owner reads" on public.courses;
create policy "Course owner reads" on public.courses
  for select using (auth.uid() = user_id and deleted_at is null);

drop policy if exists "Course owner writes" on public.courses;
create policy "Course owner writes" on public.courses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists courses_user_id_idx on public.courses(user_id);
create index if not exists courses_deleted_at_idx on public.courses(deleted_at)
  where deleted_at is null;

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
  before update on public.courses
  for each row execute procedure public.set_updated_at();
