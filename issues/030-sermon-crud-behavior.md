# Issue 030, CRUD de Sermões

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /sermons, /sermons/new, /sermons/[id]
**Depende de:** 020, 021, 001, 002, 003
**Prioridade:** P0

---

## O Que Fazer

Conectar os protótipos de editor e banco de sermões aos dados reais do Supabase.
Implementar criação, leitura, atualização e exclusão (soft delete) de sermões.

## Componentes Envolvidos

- `src/app/(app)/sermons/page.tsx`, Carrega sermões reais via Server Component
- `src/app/(app)/sermons/new/page.tsx`, Criação real com salvamento
- `src/app/(app)/sermons/[id]/page.tsx`, Edição real com auto-save
- `src/lib/supabase/actions/sermons.ts`, Server Actions de CRUD
- `src/hooks/useAutoSave.ts`, Auto-save com debounce de 3s
- `src/hooks/useOfflineSync.ts`, Sync offline/online

## Comportamentos

### Criar sermão
- Formulário do step 2 (metadados) valida com Zod antes de salvar
- Ao salvar: cria registro em `sermons` + redireciona para `/sermons/[id]`
- `user_id` preenchido automaticamente via sessão do Supabase

### Editar sermão
- Página `/sermons/[id]` carrega sermão via Server Component (verificando `user_id`)
- Mudanças no editor disparam auto-save com debounce de 3 segundos
- Auto-save: online → Supabase direto; offline → IndexedDB (pendente)
- Indicador visual de status: "Salvo" / "Salvando..." / "Salvo localmente"

### Listar sermões
- Server Component busca sermões do usuário autenticado
- Ordena por `created_at DESC` por padrão
- Paginação: 12 sermões por página (ou cursor-based)

### Excluir sermão
- Soft delete: preenche `deleted_at` com timestamp atual
- Query de listagem sempre filtra `deleted_at IS NULL`
- Após exclusão: remove da lista via optimistic update

### Duplicar sermão
- Cria cópia com título "Cópia de [título original]"
- Copia todos os campos exceto `id`, `created_at`, `updated_at`, `preached_at`

## Critério de Aceite

- [ ] Criar sermão salva no Supabase e redireciona para editor
- [ ] Editor carrega conteúdo real do sermão
- [ ] Auto-save funciona (indicador muda: "Salvando..." → "Salvo")
- [ ] Auto-save offline salva no IndexedDB
- [ ] Sync: ao reconectar, pendentes são enviados para Supabase
- [ ] Listagem mostra apenas sermões do usuário autenticado
- [ ] Soft delete remove da listagem imediatamente (optimistic)
- [ ] Duplicar cria cópia com título correto
- [ ] Acesso a sermão de outro usuário retorna 404

## Notas de Implementação

### Server Action de criação
```typescript
// src/lib/supabase/actions/sermons.ts
"use server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

const createSermonSchema = z.object({
  title: z.string().min(1).max(200),
  framework: z.enum(['expositivo','tematico','narrativo','topico','textual','livre']),
  bible_ref: z.string().optional(),
  bible_book: z.string().optional(),
  series_id: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  content: z.array(z.unknown()).default([])
})

export async function createSermon(data: unknown) {
  const parsed = createSermonSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: "Não autenticado" } }

  const { data: sermon, error } = await supabase
    .from('sermons')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single()

  if (error) return { error: { message: error.message } }
  redirect(`/sermons/${sermon.id}`)
}
```

### Auto-save hook
```typescript
// src/hooks/useAutoSave.ts
// Debounce de 3s → tenta Supabase → fallback IndexedDB se offline
```

### Segurança
- Sempre verificar `user_id = auth.uid()`, RLS garante no banco,
  mas validar também na Server Action para feedback imediato
- Nunca expor `deleted_at`, sempre filtrar no select

## Plano de Implementação

### Pré-requisitos
- Issues 020 e 021 concluídas (schema + auth funcionando)
- Issues 001, 002, 003 concluídas (protótipos existem para conectar)

### Passos

**1. Criar Server Actions de CRUD**
Criar `src/lib/supabase/actions/sermons.ts`:
- `createSermon(data)`: valida com `createSermonSchema` (Zod) → insert → redirect `/sermons/[id]`
- `updateSermon(id, data)`: valida parcialmente → update onde `id = id AND user_id = auth_user`
- `deleteSermon(id)`: soft delete → `update set deleted_at = now()`
- `duplicateSermon(id)`: select → insert com `title = 'Cópia de ...'`, sem `preached_at`

**2. Criar hook useAutoSave**
Criar `src/hooks/useAutoSave.ts`:
- Recebe `sermonId` e `content` (dependência de mudança)
- `useEffect` com `setTimeout(3000)` → ao disparar: tenta `updateSermon`, fallback `savePending` (IndexedDB)
- Retorna `saveStatus: 'idle' | 'saving' | 'saved' | 'local'`

**3. Atualizar página /sermons (listagem real)**
Editar `src/app/(app)/sermons/page.tsx`:
- Converter para Server Component
- `createClient()` do server → buscar sermões com `deleted_at IS NULL ORDER BY created_at DESC LIMIT 12`
- Passar dados reais para `<SermonGrid>` (substituir mocks)

**4. Atualizar página /sermons/new (criação real)**
Editar `src/app/(app)/sermons/new/page.tsx`:
- Step 2: formulário com React Hook Form + Zod → chamar `createSermon` no submit
- Loading state durante submit; erro inline se falhar

**5. Criar página /sermons/[id] (edição real)**
Criar `src/app/(app)/sermons/[id]/page.tsx`:
- Server Component: busca sermão por `id` verificando `user_id` → `notFound()` se não for do usuário
- Passa dados para `<SermonEditor>` (client component)
- `<SermonEditor>` usa `useAutoSave` para salvar mudanças automaticamente
- Indicador de status: badge com `saveStatus` do hook

**6. Conectar ações de exclusão e duplicação**
Editar `src/components/sermon/SermonGrid.tsx`:
- `onDelete`: chama `deleteSermon` via Server Action + optimistic removal do estado local
- `onDuplicate`: chama `duplicateSermon` → revalida lista via `revalidatePath('/sermons')`

### Como Verificar
- Criar sermão: preencher formulário, salvar → aparece em `/sermons` com dados corretos
- Editar sermão: digitar no editor, aguardar 3s → indicador muda para "Salvo"
- Excluir: confirmar dialog → card some da lista imediatamente
- Tentar acessar `/sermons/[id-de-outro-user]` → 404
- Desconectar Wi-Fi, editar sermão → "Salvo localmente"; reconectar → sync automático
