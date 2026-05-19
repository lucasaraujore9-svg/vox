-- Migration 029, ajusta o trigger protect_is_active_column.
--
-- Bug encontrado em revisão: o trigger criado pela migration 027 chama
-- public.current_user_is_admin(), que internamente consulta auth.uid().
-- Quando a action setUserActiveAction roda via createServiceClient (chave
-- service_role), auth.uid() retorna null, current_user_is_admin() retorna
-- false e o trigger BLOQUEIA o próprio fluxo de admin.
--
-- Correção: permitir explicitamente o role service_role (também postgres
-- e supabase_admin pra cobertura de operações administrativas internas).

create or replace function public.protect_is_active_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_active is distinct from old.is_active
     and not public.current_user_is_admin()
     and current_user not in ('service_role', 'postgres', 'supabase_admin') then
    raise exception 'Apenas admins podem alterar o status da conta';
  end if;
  return new;
end;
$$;
