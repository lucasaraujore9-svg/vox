-- Migration 013, papéis de usuário (pastor / admin / super_admin)
-- Modelo de acesso fechado: signup público desligado no Auth do Supabase.
-- Apenas admin/super_admin criam novos usuários via API admin (service_role).

alter table public.profiles
  add column if not exists role text not null default 'pastor'
    check (role in ('pastor', 'admin', 'super_admin'));

create index if not exists profiles_role_idx on public.profiles(role);

-- Função helper pra checar se o usuário atual é admin (qualquer nível).
create or replace function public.current_user_is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'super_admin')
  );
$$;

-- Admins enxergam todos os perfis (pra UI de gestão de usuários).
drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles" on public.profiles
  for select using (public.current_user_is_admin());

-- Admins podem atualizar qualquer perfil (incluindo role).
drop policy if exists "Admins update any profile" on public.profiles;
create policy "Admins update any profile" on public.profiles
  for update using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- Trigger: usuário comum não pode mudar o próprio role.
-- (admins escapam porque current_user_is_admin retorna true)
create or replace function public.protect_role_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.current_user_is_admin() then
    raise exception 'Apenas admins podem alterar o papel do usuário';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_role_column();
