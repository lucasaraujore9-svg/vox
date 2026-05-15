-- Migration 009 — block_color_preferences
-- Issue 026 · cores configuráveis por tipo de bloco, por usuário.
-- Defaults vivem em src/lib/blocks/colors.ts; persistência aqui é override.

create table if not exists public.block_color_preferences (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  block_type text not null,
  color      text not null,
  created_at timestamptz not null default now(),
  unique (user_id, block_type)
);

alter table public.block_color_preferences enable row level security;

drop policy if exists "Block colors owner" on public.block_color_preferences;
create policy "Block colors owner" on public.block_color_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists block_colors_user_idx on public.block_color_preferences(user_id);
