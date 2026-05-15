# Issue 032 — Busca e Filtros no Banco de Sermões

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /sermons
**Depende de:** 030, 003
**Prioridade:** P1

---

## O Que Fazer

Implementar busca full-text e filtros combinados na página do banco de sermões.

## Componentes Envolvidos

- `src/app/(app)/sermons/page.tsx` — Aceita searchParams para filtros
- `src/components/sermon/SermonFilters.tsx` — Filtros com estado real
- `src/lib/supabase/queries/sermons.ts` — Queries com filtros dinâmicos

## Comportamentos

- **Busca textual:** usa `search_vector` (tsvector gerado) do Supabase
  - Busca em: título + referência bíblica
  - Debounce de 300ms antes de submeter
  - URL atualiza com `?q=termo` (sem recarregar a página)
- **Filtros:**
  - Framework: checkbox (múltiplos)
  - Livro bíblico: select (ARC, NVI, etc.)
  - Status: rascunho / pronto
  - Série: select com séries do usuário
  - Ordenação: mais recente / mais antigo / A-Z
- **Comportamento combinado:** todos os filtros se acumulam (AND)
- **URL state:** filtros refletidos na URL como query params
- **Limpeza:** botão "Limpar filtros" reseta todos

## Critério de Aceite

- [ ] Busca textual retorna resultados relevantes (full-text search PT)
- [ ] Filtro por framework funciona (múltipla seleção)
- [ ] Filtro por status funciona
- [ ] Ordenação funciona (3 opções)
- [ ] Filtros combinados funcionam (AND)
- [ ] URL reflete os filtros ativos
- [ ] Botão "Limpar filtros" funciona
- [ ] Estado vazio quando nenhum resultado
- [ ] Performance: resultado em < 500ms para banco de até 500 sermões

## Notas de Implementação

### Query com filtros dinâmicos
```typescript
// src/lib/supabase/queries/sermons.ts
export async function getSermons(
  supabase: SupabaseClient,
  userId: string,
  filters: {
    q?: string
    framework?: string[]
    status?: string
    seriesId?: string
    orderBy?: 'created_at_desc' | 'created_at_asc' | 'title_asc'
  }
) {
  let query = supabase
    .from('sermons')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (filters.q) {
    query = query.textSearch('search_vector', filters.q, { config: 'portuguese' })
  }
  if (filters.framework?.length) {
    query = query.in('framework', filters.framework)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  const orderMap = {
    created_at_desc: { column: 'created_at', ascending: false },
    created_at_asc: { column: 'created_at', ascending: true },
    title_asc: { column: 'title', ascending: true }
  }
  const order = orderMap[filters.orderBy ?? 'created_at_desc']
  query = query.order(order.column, { ascending: order.ascending })

  return query.range(0, 11)  // 12 por página
}
```

### URL state com searchParams
- Usar `useRouter` + `useSearchParams` para atualizar URL sem reload
- Página é Server Component — recebe `searchParams` como prop e faz query server-side

## Plano de Implementação

### Pré-requisitos
- Issue 030 concluída (CRUD e listagem real funcionando)
- Issue 003 concluída (`SermonFilters` existe com UI)
- Index GIN em `search_vector` criado na migration 003 (issue 020)

### Passos

**1. Criar query helper com filtros dinâmicos**
Criar `src/lib/supabase/queries/sermons.ts`:
- Exportar `getSermons(supabase, userId, filters)` conforme código das Notas
- Adicionar filtro de `series_id` quando fornecido
- Tipagem via `Database['public']['Tables']['sermons']['Row'][]`

**2. Atualizar página /sermons para receber searchParams**
Editar `src/app/(app)/sermons/page.tsx`:
- Prop `searchParams: Promise<{ q?: string; framework?: string; status?: string; order?: string }>` (Next.js 15)
- Await `searchParams` → parsear valores → chamar `getSermons` com filtros
- `framework` pode ser multi-value: parsear com `searchParams.getAll('framework')`

**3. Atualizar SermonFilters com URL state real**
Editar `src/components/sermon/SermonFilters.tsx`:
- `"use client"` — usar `useSearchParams` e `useRouter`
- Cada mudança de filtro: construir nova URL com `URLSearchParams` → `router.push(newUrl, { scroll: false })`
- Debounce de 300ms no campo de busca antes de atualizar URL
- Botão "Limpar filtros": `router.push('/sermons')`
- Buscar séries do usuário via fetch client-side (ou passar como prop do Server Component)

**4. Buscar séries para o filtro**
Editar `src/app/(app)/sermons/page.tsx`:
- Paralelizar com `Promise.all`: `getSermons(...)` + `getSeries(supabase, userId)`
- Passar `series` como prop para `<SermonFilters>`

**5. Adicionar estado vazio**
Editar `src/components/sermon/SermonGrid.tsx`:
- Se `sermons.length === 0` e há filtros ativos: "Nenhum resultado para esses filtros"
- Se `sermons.length === 0` sem filtros: "Nenhum sermão ainda. Crie o primeiro!"

### Como Verificar
- Digitar "graça" no campo de busca → URL muda para `?q=graça` → resultado filtra em < 500ms
- Marcar checkbox "Expositivo" → URL acumula `?framework=expositivo` → lista filtra
- Combinar busca + framework + status: todos os filtros aplicados simultaneamente (AND)
- "Limpar filtros" → URL limpa → todos os sermões reaparecem
- Recarregar página com filtros na URL → filtros mantidos e aplicados (Server Component)
