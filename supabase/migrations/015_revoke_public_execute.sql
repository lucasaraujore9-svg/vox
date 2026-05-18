-- Migration 015, revoke EXECUTE de PUBLIC nas SECURITY DEFINER restantes
-- Postgres concede EXECUTE TO PUBLIC por padrão em CREATE FUNCTION.
-- Pra realmente fechar o acesso público de SECURITY DEFINER, revogamos de PUBLIC
-- (a revogação de anon/authenticated em 014 não era suficiente).

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.protect_role_column() from public;
revoke execute on function public.set_updated_at() from public;
revoke execute on function public.refresh_sermon_preached_at() from public;
revoke execute on function public.current_user_is_admin() from public;
