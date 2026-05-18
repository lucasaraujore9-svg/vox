-- Migration 018, Notas
-- Inbox de rascunhos pastorais, separado dos sermões. Cada nota pode ser
-- "promovida" para um sermão folha em branco depois (action no app).
-- archived_at e deleted_at espelham o padrão usado em sermons.

create table if not exists public.notes (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  title       text not null default 'Nova nota',
  content     text not null default '',
  pinned      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  archived_at timestamptz,
  deleted_at  timestamptz
);

alter table public.notes enable row level security;

drop policy if exists "Notes owner reads" on public.notes;
create policy "Notes owner reads" on public.notes
  for select using (auth.uid() = user_id and deleted_at is null);

drop policy if exists "Notes owner inserts" on public.notes;
create policy "Notes owner inserts" on public.notes
  for insert with check (auth.uid() = user_id);

drop policy if exists "Notes owner updates" on public.notes;
create policy "Notes owner updates" on public.notes
  for update using (auth.uid() = user_id);

drop policy if exists "Notes owner deletes" on public.notes;
create policy "Notes owner deletes" on public.notes
  for delete using (auth.uid() = user_id);

create index if not exists notes_user_id_idx on public.notes(user_id);
create index if not exists notes_updated_at_idx on public.notes(updated_at desc);
create index if not exists notes_archived_at_idx on public.notes(archived_at)
  where archived_at is not null;
create index if not exists notes_pinned_idx on public.notes(pinned) where pinned;

-- Atualização automática de updated_at (função criada em 001_profiles.sql)
drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row execute procedure public.set_updated_at();
