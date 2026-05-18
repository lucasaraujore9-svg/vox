-- Migration 023, tabela exegeses.
-- Cada exegese é uma análise estruturada de um trecho bíblico gerada por IA.
-- Vinculada opcionalmente a um sermão pra montar a sidebar de estudo.

create table if not exists public.exegeses (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  sermon_id   uuid references public.sermons(id) on delete set null,
  passage     text not null,
  version     text not null default 'ARC'
              check (version in ('ARC', 'ARA', 'NVI', 'NAA', 'NVT')),
  content     text not null,
  model       text not null,
  tokens_in   integer not null default 0,
  tokens_out  integer not null default 0,
  /** Custo calculado e armazenado em USD com 6 casas (1 milionésimo de dólar). */
  cost_usd    numeric(12, 6) not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.exegeses is
  'Exegeses bíblicas geradas por IA, opcionalmente associadas a um sermão.';

create index if not exists exegeses_user_created_idx
  on public.exegeses(user_id, created_at desc);
create index if not exists exegeses_sermon_idx
  on public.exegeses(sermon_id) where sermon_id is not null;

alter table public.exegeses enable row level security;

-- Dono lê o que é seu
drop policy if exists "Exegesis owner reads" on public.exegeses;
create policy "Exegesis owner reads" on public.exegeses
  for select using (auth.uid() = user_id);

-- Dono insere com seu próprio user_id
drop policy if exists "Exegesis owner inserts" on public.exegeses;
create policy "Exegesis owner inserts" on public.exegeses
  for insert with check (auth.uid() = user_id);

-- Dono atualiza e deleta o que é seu
drop policy if exists "Exegesis owner updates" on public.exegeses;
create policy "Exegesis owner updates" on public.exegeses
  for update using (auth.uid() = user_id);

drop policy if exists "Exegesis owner deletes" on public.exegeses;
create policy "Exegesis owner deletes" on public.exegeses
  for delete using (auth.uid() = user_id);

-- Admin vê tudo pra relatório de uso
drop policy if exists "Admins read exegeses" on public.exegeses;
create policy "Admins read exegeses" on public.exegeses
  for select using (public.current_user_is_admin());

-- updated_at automático
drop trigger if exists exegeses_set_updated_at on public.exegeses;
create trigger exegeses_set_updated_at
  before update on public.exegeses
  for each row execute procedure public.set_updated_at();
