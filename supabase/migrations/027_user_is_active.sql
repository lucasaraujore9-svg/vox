-- Migration 027, ativação/desativação de usuários.
-- Admin pode desativar uma conta sem apagar dados. Usuário desativado:
--   1. não consegue logar (loginAction checa is_active e devolve erro amigável)
--   2. tem sessão ativa invalidada na próxima request (middleware checa)
-- Reversível: basta reativar.

alter table public.profiles
  add column if not exists is_active boolean not null default true;

comment on column public.profiles.is_active is
  'Conta ativa? false bloqueia login e força logout em sessões abertas. Só admin altera.';

create index if not exists profiles_is_active_idx
  on public.profiles(is_active)
  where is_active = false;

-- Trigger: apenas admin pode mudar is_active.
-- (admins escapam porque current_user_is_admin retorna true)
create or replace function public.protect_is_active_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_active is distinct from old.is_active and not public.current_user_is_admin() then
    raise exception 'Apenas admins podem alterar o status da conta';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_is_active on public.profiles;
create trigger profiles_protect_is_active
  before update on public.profiles
  for each row execute function public.protect_is_active_column();

-- Hardening: a função é só trigger, não deve ser chamável via PostgREST.
-- Mesmo padrão da migration 015.
revoke execute on function public.protect_is_active_column() from public;
revoke execute on function public.protect_is_active_column() from anon;
revoke execute on function public.protect_is_active_column() from authenticated;
