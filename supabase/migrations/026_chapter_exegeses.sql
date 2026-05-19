-- Migration 026, restruturação da exegese em duas tabelas:
--
--   chapter_exegeses  catálogo GLOBAL de exegeses, único por capítulo+versão.
--                     A exegese acadêmica de Romanos 5 é a mesma pra qualquer
--                     pastor, então faz sentido um cache compartilhado: paga
--                     IA 1x, todos os usuários usam.
--
--   sermon_exegeses   associação N-N entre sermão e exegese. Garante que cada
--                     exegese gerada/consultada no contexto de um sermão fique
--                     vinculada permanentemente à aba Exegese daquele sermão.
--
-- A tabela exegeses (migration 023) está vazia em prod, então não há perda
-- na migração. Dropamos.

drop table if exists public.exegeses;

-- === chapter_exegeses ===

create table if not exists public.chapter_exegeses (
  id              uuid default gen_random_uuid() primary key,
  book_abbrev     text not null,
  book_name       text not null,
  chapter         integer not null check (chapter >= 1 and chapter <= 200),
  version         text not null
                  check (version in ('ARC', 'ARA', 'NVI', 'NAA', 'NVT')),
  /**
   * Conteúdo estruturado da exegese em 14 seções fixas:
   * pericope, contexto, genero, literario_estrutural, gramatical_sintatico,
   * lexical, historico_cultural, intertextualidade, teologico,
   * historia_interpretacao, sintese, principios_atemporais, aplicacao,
   * metadados.
   * Formato e schema controlados pelo prompt e por response_format=json_schema.
   */
  content         jsonb not null,
  model           text not null,
  tokens_in       integer not null default 0,
  tokens_out      integer not null default 0,
  cost_usd        numeric(12, 6) not null default 0,
  /** Usuário que requisitou a geração da primeira vez (auditoria). */
  generated_by    uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (book_abbrev, chapter, version)
);

comment on table public.chapter_exegeses is
  'Catálogo global de exegeses bíblicas por capítulo. Compartilhado entre usuários.';

create index if not exists chapter_exegeses_lookup_idx
  on public.chapter_exegeses(book_abbrev, chapter, version);
create index if not exists chapter_exegeses_recent_idx
  on public.chapter_exegeses(created_at desc);

alter table public.chapter_exegeses enable row level security;

-- Qualquer autenticado lê o catálogo (cache compartilhado)
drop policy if exists "Authed read chapter_exegeses" on public.chapter_exegeses;
create policy "Authed read chapter_exegeses" on public.chapter_exegeses
  for select using (auth.uid() is not null);

-- Apenas service_role escreve (server actions usam createClient regular,
-- mas a action validou plano antes; outra opção seria policy mais aberta).
-- Pra simplicidade, deixo escrita aberta a authed também.
drop policy if exists "Authed insert chapter_exegeses" on public.chapter_exegeses;
create policy "Authed insert chapter_exegeses" on public.chapter_exegeses
  for insert with check (auth.uid() is not null);

-- Admin atualiza (regenerar, etc.)
drop policy if exists "Admins update chapter_exegeses" on public.chapter_exegeses;
create policy "Admins update chapter_exegeses" on public.chapter_exegeses
  for update using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop trigger if exists chapter_exegeses_set_updated_at on public.chapter_exegeses;
create trigger chapter_exegeses_set_updated_at
  before update on public.chapter_exegeses
  for each row execute procedure public.set_updated_at();

-- === sermon_exegeses ===

create table if not exists public.sermon_exegeses (
  sermon_id     uuid not null references public.sermons(id) on delete cascade,
  exegesis_id  uuid not null references public.chapter_exegeses(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (sermon_id, exegesis_id)
);

comment on table public.sermon_exegeses is
  'Vincula exegeses do catálogo global aos sermões dos usuários (N-N).';

create index if not exists sermon_exegeses_user_idx
  on public.sermon_exegeses(user_id, created_at desc);

alter table public.sermon_exegeses enable row level security;

-- Dono do sermão vê seus vínculos
drop policy if exists "Owner reads sermon_exegeses" on public.sermon_exegeses;
create policy "Owner reads sermon_exegeses" on public.sermon_exegeses
  for select using (auth.uid() = user_id);

drop policy if exists "Owner inserts sermon_exegeses" on public.sermon_exegeses;
create policy "Owner inserts sermon_exegeses" on public.sermon_exegeses
  for insert with check (auth.uid() = user_id);

drop policy if exists "Owner deletes sermon_exegeses" on public.sermon_exegeses;
create policy "Owner deletes sermon_exegeses" on public.sermon_exegeses
  for delete using (auth.uid() = user_id);

-- Admin enxerga tudo (relatório de uso)
drop policy if exists "Admins read sermon_exegeses" on public.sermon_exegeses;
create policy "Admins read sermon_exegeses" on public.sermon_exegeses
  for select using (public.current_user_is_admin());
