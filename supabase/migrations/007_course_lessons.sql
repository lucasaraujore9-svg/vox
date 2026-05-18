-- Migration 007, course_lessons
-- Issue 025 · linka aulas (sermons content_type='aula') aos cursos com ordem

create table if not exists public.course_lessons (
  id         uuid default gen_random_uuid() primary key,
  course_id  uuid references public.courses(id) on delete cascade not null,
  sermon_id  uuid references public.sermons(id) on delete cascade not null,
  "order"    int not null,
  created_at timestamptz not null default now(),
  unique (course_id, sermon_id)
);

alter table public.course_lessons enable row level security;

drop policy if exists "Course lessons access" on public.course_lessons;
create policy "Course lessons access" on public.course_lessons
  for all using (
    exists (
      select 1 from public.courses
      where courses.id = course_lessons.course_id
        and courses.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.courses
      where courses.id = course_lessons.course_id
        and courses.user_id = auth.uid()
    )
  );

create index if not exists course_lessons_course_order_idx
  on public.course_lessons(course_id, "order");
