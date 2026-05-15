-- Migration 012 — sermon_engagements
-- Linha por pregação real (um sermão pode ser pregado N vezes em locais diferentes).
-- Substitui o uso de sermons.preached_at como fonte da verdade — esse campo passa a
-- ser cache da DATA da última pregação (atualizado por trigger).

create table if not exists public.sermon_engagements (
  id            uuid default gen_random_uuid() primary key,
  sermon_id     uuid references public.sermons(id) on delete cascade not null,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  preached_at   date not null,
  location      text,
  audience_size int check (audience_size >= 0),
  /** 1–5 estrelas pra avaliação subjetiva do pastor */
  rating        int check (rating between 1 and 5),
  feedback      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.sermon_engagements enable row level security;

drop policy if exists "Sermon engagement owner" on public.sermon_engagements;
create policy "Sermon engagement owner" on public.sermon_engagements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists sermon_engagements_sermon_idx
  on public.sermon_engagements(sermon_id, preached_at desc);

drop trigger if exists engagements_set_updated_at on public.sermon_engagements;
create trigger engagements_set_updated_at
  before update on public.sermon_engagements
  for each row execute procedure public.set_updated_at();

-- Trigger: ao criar/atualizar engagement, atualiza sermons.preached_at pro mais recente
create or replace function public.refresh_sermon_preached_at()
returns trigger language plpgsql as $$
declare
  last_date date;
begin
  select max(preached_at) into last_date
  from public.sermon_engagements
  where sermon_id = coalesce(new.sermon_id, old.sermon_id);

  update public.sermons
  set preached_at = last_date
  where id = coalesce(new.sermon_id, old.sermon_id);

  return coalesce(new, old);
end;
$$;

drop trigger if exists engagements_refresh_sermon on public.sermon_engagements;
create trigger engagements_refresh_sermon
  after insert or update or delete on public.sermon_engagements
  for each row execute procedure public.refresh_sermon_preached_at();
