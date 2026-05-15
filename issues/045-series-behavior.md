# Issue 045 — Séries de Sermões: Behavior (CRUD Completo)

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /series, /sermons/[id]
**Depende de:** 013, 020, 030
**Prioridade:** P1

---

## O Que Fazer

Conectar o protótipo de séries (013) ao Supabase: CRUD completo de séries,
associação de sermões a uma série, e filtro por série no banco de sermões.

## Componentes Envolvidos

- `src/app/(app)/series/page.tsx` — Server Component com dados reais
- `src/lib/supabase/actions/series.ts` — Server Actions de CRUD
- `src/hooks/useSeries.ts` — hook client-side para mutations
- `src/components/sermon/SeriesSelector.tsx` — conectado ao Supabase

## Comportamentos

### Listar séries
- Server Component: `SELECT * FROM series WHERE user_id = ? ORDER BY created_at DESC`
- Para cada série: contar sermões vinculados (`SELECT COUNT(*) FROM sermons WHERE series_id = ?`)
- Exibir total de sermões e título de até 3 sermões no card

### Criar série
- Server Action: `INSERT INTO series (user_id, title, description) RETURNING id`
- Validação Zod: `title` obrigatório (1-100 chars), `description` opcional (max 500)
- Feedback imediato: optimistic update na lista + toast de confirmação

### Editar série
- Mesma Server Action de criação com `id` presente → `UPDATE series SET ...`
- SeriesForm abre pré-preenchido com dados existentes

### Excluir série
- `UPDATE series SET deleted_at = NOW()` (soft delete — NÃO deletar fisicamente)
- Sermões vinculados: `UPDATE sermons SET series_id = NULL WHERE series_id = ?`
- Confirmação via `ConfirmDialog` antes de executar
- Optimistic update: remove da lista imediatamente

### Associar sermão a uma série
- `SeriesSelector` no editor: ao selecionar série → `UPDATE sermons SET series_id = ? WHERE id = ?`
- "Sem série": `UPDATE sermons SET series_id = NULL`
- "+ Nova série": abre `SeriesForm` inline dentro do dropdown, após salvar seleciona automaticamente a nova série

### Filtro por série no banco de sermões
- `SermonFilters` já tem campo de série — conectar ao query real
- `SELECT * FROM sermons WHERE series_id = ? AND user_id = ? AND deleted_at IS NULL`

## Critério de Aceite

- [ ] CRUD completo de séries (criar, editar, listar, soft delete)
- [ ] Validação Zod com mensagens de erro em português
- [ ] Associar sermão a série salva no banco
- [ ] Desassociar sermão (séries_id = NULL) funciona
- [ ] "+ Nova série" no selector cria e seleciona automaticamente
- [ ] Excluir série desvincula sermões (não deleta os sermões)
- [ ] Filtro por série no banco de sermões funciona
- [ ] Soft delete: série não aparece mais mas sermões continuam intactos

## Plano de Implementação

### Pré-requisitos
- Issue 013 concluída (SeriesCard, SeriesForm, SeriesSelector visuais prontos)
- Issue 020 concluída (tabela `series` existe com RLS)
- Issue 030 concluída (CRUD básico de sermões funciona)

### Passos

**1. Criar Server Actions de séries**
Criar `src/lib/supabase/actions/series.ts` (`"use server"`):
- `createSeries(data)` → INSERT + revalidatePath('/series')
- `updateSeries(id, data)` → UPDATE
- `deleteSeries(id)` → soft delete + desvincula sermões
- Validação Zod: `{ title: z.string().min(1).max(100), description: z.string().max(500).optional() }`

**2. Conectar página /series**
Editar `src/app/(app)/series/page.tsx` (Server Component):
- Buscar séries com contagem de sermões via JOIN
- Passar dados reais para `SeriesCard`

**3. Conectar SeriesForm ao Server Action**
Editar `src/components/series/SeriesForm.tsx`:
- `action={createSeries}` / `action={updateSeries}` (React useFormState)
- Loading state no botão "Salvar"
- Toast de sucesso/erro após ação

**4. Conectar SeriesSelector ao Supabase**
Editar `src/components/sermon/SeriesSelector.tsx` (`"use client"`):
- `useEffect` → busca séries do usuário via `supabase.from('series').select()`
- onChange → Server Action `updateSermonSeries(sermonId, seriesId | null)`
- "+ Nova série" → abre SeriesForm → após save, recarrega lista + seleciona nova

**5. Conectar filtro no banco de sermões**
Editar `src/lib/supabase/queries/sermons.ts`:
- Adicionar `series_id` ao filtro dinâmico (issue 032)

### Como Verificar
- Criar série: aparece na lista imediatamente
- Editar série: dados persistidos após reload
- Excluir série: some da lista; sermões ainda existem sem série vinculada
- Associar sermão: `sermon.series_id` atualizado no Supabase Studio
- Filtrar banco por série: exibe apenas sermões daquela série
