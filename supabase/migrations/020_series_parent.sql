-- Migration 020, series.parent_id
-- Permite organizar séries em pastas e subpastas (auto-relacionamento).
-- on delete set null: apagar uma pasta-pai não apaga as filhas, só as solta
-- no nível raiz, evitando perda de conteúdo por engano.

alter table public.series
  add column if not exists parent_id uuid references public.series(id) on delete set null;

create index if not exists series_parent_id_idx on public.series(parent_id);

comment on column public.series.parent_id is
  'Série pai (FK auto-referencial). NULL = série no nível raiz. Permite árvore de pastas/subpastas.';
