-- Migration 004 — slides + storage policies
-- Issue 024 · slides relacionados a sermons type='apresentação'

create table if not exists public.slides (
  id           uuid default gen_random_uuid() primary key,
  sermon_id    uuid references public.sermons(id) on delete cascade not null,
  "order"      int not null,
  image_url    text,          -- URL pública (upload) ou null para Google Slides
  storage_path text,          -- path interno no bucket para deleção
  comment      text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.slides enable row level security;

drop policy if exists "Slide owner full access" on public.slides;
create policy "Slide owner full access" on public.slides
  for all using (
    exists (
      select 1 from public.sermons
      where sermons.id = slides.sermon_id
        and sermons.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.sermons
      where sermons.id = slides.sermon_id
        and sermons.user_id = auth.uid()
    )
  );

create index if not exists slides_sermon_order_idx on public.slides(sermon_id, "order");

drop trigger if exists slides_set_updated_at on public.slides;
create trigger slides_set_updated_at
  before update on public.slides
  for each row execute procedure public.set_updated_at();

-- Storage: bucket sermon-slides (rodar no Dashboard ou via supabase storage CLI)
-- Comentado pois Storage buckets normalmente não vão em migrations,
-- mas as policies sim. Crie o bucket "sermon-slides" como PRIVATE no Dashboard primeiro.

insert into storage.buckets (id, name, public)
values ('sermon-slides', 'sermon-slides', false)
on conflict (id) do nothing;

-- Policy: usuário acessa apenas pastas com seu uid no primeiro nível do path
drop policy if exists "Slides bucket select" on storage.objects;
create policy "Slides bucket select" on storage.objects
  for select using (
    bucket_id = 'sermon-slides'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Slides bucket insert" on storage.objects;
create policy "Slides bucket insert" on storage.objects
  for insert with check (
    bucket_id = 'sermon-slides'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Slides bucket update" on storage.objects;
create policy "Slides bucket update" on storage.objects
  for update using (
    bucket_id = 'sermon-slides'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Slides bucket delete" on storage.objects;
create policy "Slides bucket delete" on storage.objects
  for delete using (
    bucket_id = 'sermon-slides'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
