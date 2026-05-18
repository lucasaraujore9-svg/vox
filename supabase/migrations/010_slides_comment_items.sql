-- Migration 010, comment_items em slides
-- Cada slide passa a ter um manuscrito estruturado (sessions + items),
-- na mesma forma de sermons.content. O campo `comment` (text) fica como fallback
-- legado e pode ser usado em paralelo até o reorder completo.

alter table public.slides
  add column if not exists comment_items jsonb not null default '[]'::jsonb;

comment on column public.slides.comment_items is
  'Manuscrito estruturado do comentário do slide: { sessions: SessionNode[] }. Mesma forma de sermons.content.';
