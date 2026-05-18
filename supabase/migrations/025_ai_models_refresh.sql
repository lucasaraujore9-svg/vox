-- Migration 025, atualiza a tabela de modelos OpenAI.
--
-- Estado em mai/2026:
--   - GPT-5.5 e GPT-5.5 Pro (flagship)
--   - GPT-5.4 / 5.4 mini / 5.4 nano (geração intermediária)
--   - GPT-5 / 5-mini (legacy mas estável)
--   - GPT-4.1 / 4.1-mini / 4.1-nano (long-context, 1M)
--   - o3 / o3-pro / o4-mini (reasoning)
--   - gpt-4o-mini (legacy barato)
--
-- gpt-4o (full) e gpt-4-turbo foram removidos (legacy/depreciados).
-- Modelo ativo padrão: gpt-5.4-mini (sweet spot pra exegese: qualidade +
-- custo razoável).
--
-- Update no singleton (id=1) já criado pela migration 024.

update public.ai_settings
set
  active_model = 'gpt-5.4-mini',
  model_prices = jsonb_build_object(
    'gpt-5.5',         jsonb_build_object('input', 5,    'output', 30),
    'gpt-5.5-pro',     jsonb_build_object('input', 30,   'output', 180),
    'gpt-5.4',         jsonb_build_object('input', 2.5,  'output', 15),
    'gpt-5.4-mini',    jsonb_build_object('input', 0.75, 'output', 4.5),
    'gpt-5.4-nano',    jsonb_build_object('input', 0.2,  'output', 1.25),
    'gpt-5',           jsonb_build_object('input', 1.25, 'output', 10),
    'gpt-5-mini',      jsonb_build_object('input', 0.25, 'output', 2),
    'gpt-4.1',         jsonb_build_object('input', 2,    'output', 8),
    'gpt-4.1-mini',    jsonb_build_object('input', 0.4,  'output', 1.6),
    'gpt-4.1-nano',    jsonb_build_object('input', 0.1,  'output', 0.4),
    'gpt-4o-mini',     jsonb_build_object('input', 0.15, 'output', 0.6),
    'o3',              jsonb_build_object('input', 2,    'output', 8),
    'o3-pro',          jsonb_build_object('input', 20,   'output', 80),
    'o4-mini',         jsonb_build_object('input', 1.1,  'output', 4.4)
  )
where id = 1;

-- Também atualiza o DEFAULT da coluna pra refletir o seed novo em fresh installs.
alter table public.ai_settings
  alter column active_model set default 'gpt-5.4-mini';

alter table public.ai_settings
  alter column model_prices set default jsonb_build_object(
    'gpt-5.5',         jsonb_build_object('input', 5,    'output', 30),
    'gpt-5.5-pro',     jsonb_build_object('input', 30,   'output', 180),
    'gpt-5.4',         jsonb_build_object('input', 2.5,  'output', 15),
    'gpt-5.4-mini',    jsonb_build_object('input', 0.75, 'output', 4.5),
    'gpt-5.4-nano',    jsonb_build_object('input', 0.2,  'output', 1.25),
    'gpt-5',           jsonb_build_object('input', 1.25, 'output', 10),
    'gpt-5-mini',      jsonb_build_object('input', 0.25, 'output', 2),
    'gpt-4.1',         jsonb_build_object('input', 2,    'output', 8),
    'gpt-4.1-mini',    jsonb_build_object('input', 0.4,  'output', 1.6),
    'gpt-4.1-nano',    jsonb_build_object('input', 0.1,  'output', 0.4),
    'gpt-4o-mini',     jsonb_build_object('input', 0.15, 'output', 0.6),
    'o3',              jsonb_build_object('input', 2,    'output', 8),
    'o3-pro',          jsonb_build_object('input', 20,   'output', 80),
    'o4-mini',         jsonb_build_object('input', 1.1,  'output', 4.4)
  );
