-- Migration 005, content_type + sermon type + slides_source
-- Issue 025 · expande sermons para Sermão / Palestra / Aula e Esboço / Apresentação

alter table public.sermons
  add column if not exists type text not null default 'esboço'
    check (type in ('esboço','apresentação'));

alter table public.sermons
  add column if not exists content_type text not null default 'sermão'
    check (content_type in ('sermão','palestra','aula'));

alter table public.sermons
  add column if not exists slides_source text
    check (slides_source in ('upload','google_slides','manual'));

alter table public.sermons
  add column if not exists slides_url text;

create index if not exists sermons_type_idx on public.sermons(type);
create index if not exists sermons_content_type_idx on public.sermons(content_type);

-- Recria o search_vector incluindo o content_type para busca facetada
alter table public.sermons drop column if exists search_vector;
alter table public.sermons
  add column search_vector tsvector
    generated always as (
      to_tsvector(
        'portuguese',
        coalesce(title, '') || ' ' || coalesce(bible_ref, '') || ' ' ||
        coalesce(bible_book, '') || ' ' || coalesce(content_type, '')
      )
    ) stored;

create index if not exists sermons_search_idx on public.sermons using gin(search_vector);
