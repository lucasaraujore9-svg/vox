-- Migration 022, planos de assinatura.
-- 'manuscrito' = plano sem IA (foco no essencial: editor, modelos, bíblia, apresentação)
-- 'concilio'   = plano com IA (assistente de exegese + sugestões no editor)
--
-- Quem já tinha ai_enabled=true é migrado automaticamente pro 'concilio'.

alter table public.profiles
  add column if not exists plan text not null default 'manuscrito'
    check (plan in ('manuscrito', 'concilio'));

comment on column public.profiles.plan is
  'Plano de assinatura. manuscrito = sem IA, concilio = com IA.';

-- Backfill: quem já tinha IA ativada vai pro concilio
update public.profiles
  set plan = 'concilio'
  where ai_enabled = true;

-- Garante coerência: quem está no manuscrito não tem ai_enabled=true
update public.profiles
  set ai_enabled = false
  where plan = 'manuscrito' and ai_enabled = true;

create index if not exists profiles_plan_idx on public.profiles(plan);
