-- Migration 028, exegese parte sempre dos originais.
--
-- A exegese acadêmica deve ser feita a partir do hebraico/aramaico/grego,
-- não da tradução PT. A versão das traduções PT (ARC, NVI, etc.) era usada
-- como chave de cache, mas isso era um equívoco: a análise de Romanos 5 é
-- a mesma independente de qual tradução o pregador usa pra ler.
--
-- Mudanças:
--   1. Aceitar 'ORIGINAL' como versão (nova chave canônica de cache)
--   2. Migrar exegeses existentes pra 'ORIGINAL' (deduplica caso múltiplas
--      versões existam pro mesmo capítulo)
--   3. Trocar o DEFAULT da coluna pra 'ORIGINAL'

alter table public.chapter_exegeses
  drop constraint if exists chapter_exegeses_version_check;

alter table public.chapter_exegeses
  add constraint chapter_exegeses_version_check
  check (version in ('ORIGINAL', 'ARC', 'ARA', 'NVI', 'NAA', 'NVT'));

alter table public.chapter_exegeses
  alter column version set default 'ORIGINAL';
