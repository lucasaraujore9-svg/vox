-- Migration 019, corrige RLS pra permitir soft delete via UPDATE
--
-- Problema: a SELECT policy `(auth.uid() = user_id AND deleted_at IS NULL)`
-- combinada com o supabase-js (que usa `Prefer: return=representation`) faz
-- com que UPDATEs que setam `deleted_at = now()` retornem o erro
-- "new row violates row-level security policy", o PostgREST verifica a row
-- retornada contra a SELECT policy e a row "nova" não passa mais.
--
-- Solução: remove o filtro `deleted_at IS NULL` da SELECT policy. O filtro
-- de "não-deletado" continua sendo aplicado na camada de aplicação (todas
-- as queries em src/lib/sermons/queries.ts e src/lib/notes/queries.ts já
-- usam `.is("deleted_at", null)`).

drop policy if exists "Sermon owner reads" on public.sermons;
create policy "Sermon owner reads" on public.sermons
  for select using (auth.uid() = user_id);

drop policy if exists "Notes owner reads" on public.notes;
create policy "Notes owner reads" on public.notes
  for select using (auth.uid() = user_id);
