-- Migration 002, series
-- Issue 020 · agrupamento de sermões em séries (ex: "Romanos 5, A Justificação pela Fé")

create table if not exists public.series (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  title       text not null,
  description text,
  created_at  timestamptz not null default now()
);

alter table public.series enable row level security;

drop policy if exists "Series owner full access" on public.series;
create policy "Series owner full access" on public.series
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists series_user_id_idx on public.series(user_id);
