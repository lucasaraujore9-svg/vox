-- Migration 017, Arquivamento de sermões
-- `archived_at` é uma camada separada da lixeira (`deleted_at`):
--   - archived_at != null: visível em /sermons?view=arquivo, restaurável, com opção
--     de "apagar permanentemente" (DELETE definitivo).
--   - deleted_at != null: lixeira (soft delete, RLS esconde via política em 003).
-- A política de SELECT existente exige `deleted_at is null`, então arquivados
-- continuam visíveis pelo dono via filtro de aplicação.

alter table public.sermons
  add column if not exists archived_at timestamptz;

create index if not exists sermons_archived_at_idx
  on public.sermons (archived_at)
  where archived_at is not null;
