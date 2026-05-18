-- Migration 021, adiciona phone em signup_interests.
-- Capturado no formulário público pra contato via WhatsApp pelo admin.

alter table public.signup_interests
  add column if not exists phone text;

comment on column public.signup_interests.phone is
  'Telefone informado no formulário público, usado pra contato via WhatsApp pelo admin.';
