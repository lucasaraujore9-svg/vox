-- Migration 011 — sermon_versions
-- Toda vez que o pastor "Salva versão" um snapshot é gravado aqui.
-- Permite ver versões antigas e restaurar.

create table if not exists public.sermon_versions (
  id          uuid default gen_random_uuid() primary key,
  sermon_id   uuid references public.sermons(id) on delete cascade not null,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  /** Snapshot dos campos editáveis */
  title       text not null,
  framework   text,
  bible_ref   text,
  content     jsonb not null default '[]'::jsonb,
  word_count  int not null default 0,
  /** Nota opcional do autor sobre o que mudou nessa versão */
  note        text,
  created_at  timestamptz not null default now()
);

alter table public.sermon_versions enable row level security;

drop policy if exists "Sermon version owner" on public.sermon_versions;
create policy "Sermon version owner" on public.sermon_versions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists sermon_versions_sermon_idx
  on public.sermon_versions(sermon_id, created_at desc);
