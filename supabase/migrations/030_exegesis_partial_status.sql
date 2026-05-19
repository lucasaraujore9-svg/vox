-- Migration 030, pipeline de geração em 5 grupos paralelos.
--
-- A geração agora dispara 5 chamadas paralelas, cada uma cobrindo um
-- subset das 14 seções. Cada chamada pode terminar/falhar de forma
-- independente, então salvamos status e marcamos falhas por grupo
-- pra a UI mostrar "em geração" / "falhou" por seção.
--
-- generation_status:
--   'partial'  — pelo menos uma chamada terminou, outras ainda em andamento
--                ou falharam. UI mostra "em geração" ou "falhou" por seção.
--   'complete' — todas as 5 chamadas tiveram sucesso.
--   'failed'   — todas as 5 falharam (raro; tratamos a nível de UX).
--
-- failed_groups: array das chamadas que falharam (subset de
--   ['texto', 'contexto', 'forma', 'background', 'sintese']) pra UI
--   oferecer botão de "tentar de novo só essa parte".

alter table public.chapter_exegeses
  add column if not exists generation_status text not null default 'complete'
    check (generation_status in ('partial', 'complete', 'failed'));

alter table public.chapter_exegeses
  add column if not exists failed_groups text[] not null default '{}';

comment on column public.chapter_exegeses.generation_status is
  'partial | complete | failed. Reflete se as 5 chamadas paralelas concluíram.';
comment on column public.chapter_exegeses.failed_groups is
  'Grupos que falharam: subset de [texto, contexto, forma, background, sintese].';

create index if not exists chapter_exegeses_status_idx
  on public.chapter_exegeses(generation_status)
  where generation_status != 'complete';
