-- Migration 003, sermons (base)
-- Issue 020 · tabela compartilhada por sermão/palestra/aula (content_type vem em 005)
-- Full-text search em português · soft delete · jsonb content de blocos.

create table if not exists public.sermons (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  title       text not null default 'Novo Sermão',
  framework   text not null default 'livre'
              check (framework in ('expositivo','textual','narrativo','tematico','topico','livre')),
  bible_ref   text,
  bible_book  text,
  status      text not null default 'rascunho'
              check (status in ('rascunho','pronto')),
  series_id   uuid references public.series(id) on delete set null,
  tags        text[] not null default '{}',
  content     jsonb not null default '[]'::jsonb,
  word_count  int not null default 0,
  preached_at date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz  -- soft delete
);

alter table public.sermons enable row level security;

-- Usuário só lê seus sermões não-deletados (soft delete)
drop policy if exists "Sermon owner reads" on public.sermons;
create policy "Sermon owner reads" on public.sermons
  for select using (auth.uid() = user_id and deleted_at is null);

drop policy if exists "Sermon owner inserts" on public.sermons;
create policy "Sermon owner inserts" on public.sermons
  for insert with check (auth.uid() = user_id);

drop policy if exists "Sermon owner updates" on public.sermons;
create policy "Sermon owner updates" on public.sermons
  for update using (auth.uid() = user_id);

drop policy if exists "Sermon owner deletes" on public.sermons;
create policy "Sermon owner deletes" on public.sermons
  for delete using (auth.uid() = user_id);

-- Full-text search em português
alter table public.sermons
  drop column if exists search_vector;

alter table public.sermons
  add column search_vector tsvector
    generated always as (
      to_tsvector(
        'portuguese',
        coalesce(title, '') || ' ' || coalesce(bible_ref, '') || ' ' || coalesce(bible_book, '')
      )
    ) stored;

create index if not exists sermons_search_idx on public.sermons using gin(search_vector);
create index if not exists sermons_user_id_idx on public.sermons(user_id);
create index if not exists sermons_created_at_idx on public.sermons(created_at desc);
create index if not exists sermons_deleted_at_idx on public.sermons(deleted_at)
  where deleted_at is null;

-- Atualização automática de updated_at (função criada em 001_profiles.sql)
drop trigger if exists sermons_set_updated_at on public.sermons;
create trigger sermons_set_updated_at
  before update on public.sermons
  for each row execute procedure public.set_updated_at();
