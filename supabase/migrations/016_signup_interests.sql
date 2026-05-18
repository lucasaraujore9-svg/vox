-- Migration 016, signup_interests
-- Como o sistema é fechado (signup desligado), quem tentar se cadastrar tem
-- o interesse registrado aqui. Super admin acompanha pela aba /settings.

create table if not exists public.signup_interests (
  id           uuid default gen_random_uuid() primary key,
  email        text not null,
  name         text,
  denomination text,
  message      text,
  status       text not null default 'pending'
               check (status in ('pending', 'invited', 'rejected', 'spam')),
  /** Endereço IP (opcional) pra detectar abuso de formulário */
  source_ip    text,
  /** User-agent (opcional) */
  source_ua    text,
  created_at   timestamptz not null default now(),
  invited_at   timestamptz,
  notes        text
);

create index if not exists signup_interests_status_idx
  on public.signup_interests(status, created_at desc);

alter table public.signup_interests enable row level security;

-- Anyone (incluindo anon não-logado) pode inserir um interesse.
-- O Server Action chama via service_role mas deixamos a policy aberta
-- pro caso de futuras integrações públicas (form embed, etc).
drop policy if exists "Anyone submits interest" on public.signup_interests;
create policy "Anyone submits interest" on public.signup_interests
  for insert with check (true);

-- Apenas admin/super_admin enxerga interesses
drop policy if exists "Admins read interests" on public.signup_interests;
create policy "Admins read interests" on public.signup_interests
  for select using (public.current_user_is_admin());

-- Admin pode mudar status (invited / rejected / spam) + notas
drop policy if exists "Admins update interests" on public.signup_interests;
create policy "Admins update interests" on public.signup_interests
  for update using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "Admins delete interests" on public.signup_interests;
create policy "Admins delete interests" on public.signup_interests
  for delete using (public.current_user_is_admin());
