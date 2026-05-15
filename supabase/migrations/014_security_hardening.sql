-- Migration 014 — security hardening
-- Responde aos advisors WARN do Supabase:
--  - function_search_path_mutable: trava search_path em funções restantes
--  - anon/authenticated_security_definer_function_executable: revoga EXECUTE
--    de triggers internos que não devem ser chamados via REST
--
-- Triggers continuam funcionando: a permissão pra TRIGGER bypassa o EXECUTE público.

alter function public.set_updated_at() set search_path = public;
alter function public.refresh_sermon_preached_at() set search_path = public;

-- Triggers internos — sem motivo pra serem RPC públicos
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.protect_role_column() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;
revoke execute on function public.refresh_sermon_preached_at() from anon, authenticated;

-- current_user_is_admin: anon não tem auth.uid(), então sempre retorna false —
-- revogar evita superficie de ataque desnecessária. Mantém pra authenticated
-- (usada por policies internas; mas as policies chamam direto, não via RPC).
revoke execute on function public.current_user_is_admin() from anon;
