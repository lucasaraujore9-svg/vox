-- Migration 001, profiles
-- Issue 020 · cria tabela profiles + RLS + trigger de auto-criação após signup
-- Schema canônico: docs/references/architecture.md

create table if not exists public.profiles (
  id              uuid references auth.users on delete cascade primary key,
  name            text not null default '',
  denomination    text,
  avatar_url      text,
  ai_enabled      boolean not null default false,
  bible_version   text not null default 'ARC',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Usuário só vê/atualiza o próprio perfil
drop policy if exists "Profile owner reads" on public.profiles;
create policy "Profile owner reads" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Profile owner inserts" on public.profiles;
create policy "Profile owner inserts" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Profile owner updates" on public.profiles;
create policy "Profile owner updates" on public.profiles
  for update using (auth.uid() = id);

-- Trigger: cria linha em profiles automaticamente após signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
