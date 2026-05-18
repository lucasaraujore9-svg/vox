-- Migration 008, study modules + sessions
-- Issue 026 · trilhas de estudo guiado (seed pelo sistema) + progresso por usuário

create table if not exists public.study_modules (
  id              uuid default gen_random_uuid() primary key,
  title           text not null,
  description     text,
  category        text check (category in (
    'homilética','hermenêutica','teologia','comunicação','liderança','discipulado'
  )),
  estimated_hours numeric(4,1),
  session_count   int not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- Módulos são públicos para leitura (qualquer usuário autenticado lista trilhas)
alter table public.study_modules enable row level security;

drop policy if exists "Anyone reads active modules" on public.study_modules;
create policy "Anyone reads active modules" on public.study_modules
  for select using (is_active = true);

-- Apenas service role pode escrever (seed)
drop policy if exists "Service role writes modules" on public.study_modules;
create policy "Service role writes modules" on public.study_modules
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.study_sessions (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  module_id       uuid references public.study_modules(id) on delete cascade not null,
  notes_content   jsonb not null default '[]'::jsonb,
  current_session int not null default 1,
  progress        numeric(5,2) not null default 0
                  check (progress >= 0 and progress <= 100),
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, module_id)
);

alter table public.study_sessions enable row level security;

drop policy if exists "Study session owner full" on public.study_sessions;
create policy "Study session owner full" on public.study_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists study_sessions_user_idx on public.study_sessions(user_id);

drop trigger if exists study_sessions_set_updated_at on public.study_sessions;
create trigger study_sessions_set_updated_at
  before update on public.study_sessions
  for each row execute procedure public.set_updated_at();

-- Seed inicial de módulos de estudo guiado
insert into public.study_modules (title, description, category, estimated_hours, session_count)
values
  (
    'Fundamentos da Pregação Expositiva',
    'Como ler um texto bíblico e construir um sermão fiel à sua intenção original.',
    'homilética',
    8.0,
    6
  ),
  (
    'Hermenêutica para Pregadores',
    'Princípios de interpretação aplicados ao púlpito moderno.',
    'hermenêutica',
    10.0,
    8
  ),
  (
    'Voz e Presença no Púlpito',
    'Comunicação não-verbal, ritmo, pausas e gestão de energia em pregações longas.',
    'comunicação',
    6.0,
    5
  ),
  (
    'Liderança Pastoral em Crises',
    'Como conduzir a congregação em momentos de luto, conflito e mudança.',
    'liderança',
    7.5,
    6
  ),
  (
    'Discipulado um a um',
    'Frameworks práticos para acompanhar discípulos individuais ao longo do tempo.',
    'discipulado',
    5.0,
    4
  )
on conflict do nothing;
