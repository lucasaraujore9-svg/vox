-- Migration 031, renomeia o papel 'pastor' para 'usuario'.
-- Mantém 'admin' e 'super_admin'. O termo "pastor" continua sendo usado como
-- copy do produto (a quem o VOX serve), mas o valor técnico do role passa a
-- ser neutro ('usuario'), porque o produto também atende palestrantes e
-- professores.
--
-- Estratégia:
--   1. dropa a CHECK constraint antiga
--   2. atualiza linhas existentes (pastor → usuario)
--   3. troca o default
--   4. adiciona a CHECK constraint nova
--
-- A função public.current_user_is_admin() não precisa mudar, ela só verifica
-- ('admin', 'super_admin'). O trigger protect_role_column também não precisa
-- mudar, ele compara new.role vs old.role independentemente do valor.

-- 1. Drop CHECK antiga (nome padrão do PG quando criada via `add column ... check (...)`).
alter table public.profiles
  drop constraint if exists profiles_role_check;

-- 2. Renomeia linhas existentes.
update public.profiles
  set role = 'usuario'
  where role = 'pastor';

-- 3. Troca o default.
alter table public.profiles
  alter column role set default 'usuario';

-- 4. Adiciona a CHECK nova com nome explícito.
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('usuario', 'admin', 'super_admin'));
