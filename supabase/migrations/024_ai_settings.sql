-- Migration 024, configuração global da IA.
-- Tabela singleton (linha única id=1) que o super admin edita pra escolher
-- o modelo padrão e os preços por modelo. Os preços ficam em JSON pra
-- facilitar adicionar/remover modelos sem migration nova.

create table if not exists public.ai_settings (
  id              smallint primary key default 1 check (id = 1),
  active_model    text not null default 'gpt-4o',
  /**
   * Tabela de preços por modelo em USD por 1M de tokens.
   * Formato: { "gpt-4o": { "input": 2.5, "output": 10 }, ... }
   * Usado pra calcular cost_usd em exegeses no momento da geração.
   */
  model_prices    jsonb not null default jsonb_build_object(
    'gpt-4o',        jsonb_build_object('input', 2.5,  'output', 10),
    'gpt-4o-mini',   jsonb_build_object('input', 0.15, 'output', 0.6),
    'gpt-4-turbo',   jsonb_build_object('input', 10,   'output', 30),
    'gpt-4.1',       jsonb_build_object('input', 2,    'output', 8),
    'gpt-4.1-mini',  jsonb_build_object('input', 0.4,  'output', 1.6)
  ),
  /** Limite mensal de gasto por usuário em USD. 0 = sem limite. */
  monthly_user_cap_usd numeric(10, 2) not null default 5,
  updated_by      uuid references auth.users(id),
  updated_at      timestamptz not null default now()
);

comment on table public.ai_settings is
  'Configuração singleton da IA. Apenas super admin edita.';

-- Insere a linha inicial (vai falhar silenciosamente se já existir)
insert into public.ai_settings (id) values (1) on conflict (id) do nothing;

alter table public.ai_settings enable row level security;

-- Qualquer usuário autenticado lê (precisa pra checar quota / modelo ativo)
drop policy if exists "All authed read ai_settings" on public.ai_settings;
create policy "All authed read ai_settings" on public.ai_settings
  for select using (auth.uid() is not null);

-- Apenas admin atualiza
drop policy if exists "Admins update ai_settings" on public.ai_settings;
create policy "Admins update ai_settings" on public.ai_settings
  for update using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- updated_at automático
drop trigger if exists ai_settings_set_updated_at on public.ai_settings;
create trigger ai_settings_set_updated_at
  before update on public.ai_settings
  for each row execute procedure public.set_updated_at();
