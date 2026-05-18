# Issue 037, Seletor de Tipo: Behavior (Dados Reais)

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /sermons/new (Step 1)
**Depende de:** 006, 023, 020
**Prioridade:** P0

---

## O Que Fazer

Conectar o `TypePicker` (proto 006) ao Supabase, salvando o `type` escolhido
no sermão e roteando o usuário para o fluxo correto (Fluxo A: esboço / Fluxo B: slides).

## Componentes Envolvidos

- `src/app/(app)/sermons/new/page.tsx`, Server Component que cria o sermão e gerencia o wizard
- `src/components/sermon/TypePicker.tsx`, migrar de proto para behavior
- `src/hooks/useSermon.ts`, adicionar `createSermon(type)` com Supabase

## Comportamentos

### Criação do rascunho
1. Usuário chega em `/sermons/new` (autenticado)
2. Step 1: TypePicker renderiza os dois cards
3. Ao clicar em "Continuar":
   - Cria rascunho no Supabase: `INSERT INTO sermons (user_id, type, title) VALUES (...)`
   - Retorna o `id` do sermão criado
   - Redireciona para:
     - `type = 'esboço'` → Step 2A (FrameworkPicker), permanece em `/sermons/new?step=2&id={id}`
     - `type = 'apresentação'` → Step 2B (SlidesSourcePicker), permanece em `/sermons/new?step=2b&id={id}`

### Validação
- Não permite avançar sem selecionar tipo (botão desabilitado)
- Se o usuário recarregar a página com `?id={id}` e o rascunho já existe, não cria duplicata
- Busca o sermão existente e continua do ponto correto

### Roteamento pós-Step 1
```
type = 'esboço'     → /sermons/new?step=2&id={id}     → FrameworkPicker
type = 'apresentação' → /sermons/new?step=2b&id={id}  → SlidesSourcePicker (issue 038)
```

### Atualização do sermão existente
- Se o usuário navega para trás e muda o tipo:
  - Atualiza `sermons.type` no Supabase
  - Se havia slides criados e muda para 'esboço', exibe alerta: "Isso removerá os slides carregados"
  - Após confirmação: deleta registros de `slides` + arquivos no Storage

## Critério de Aceite

- [ ] Criar sermão com `type` salvo no Supabase
- [ ] Redirecionar para Step 2A (esboço) ou Step 2B (apresentação)
- [ ] Não criar duplicata se sermão já existe (retoma rascunho)
- [ ] Mudança de tipo com slides existentes exibe alerta de confirmação
- [ ] Loading state no botão "Continuar" durante a criação
- [ ] Erro de rede exibe toast com mensagem clara
- [ ] `sermon.type` reflete corretamente na listagem (`SermonCard` com badge correto)

## Notas de Implementação

```typescript
// src/hooks/useSermon.ts, adicionar:
async function createSermon(type: SermonType, userId: string) {
  const { data, error } = await supabase
    .from('sermons')
    .insert({ user_id: userId, type, title: 'Novo Sermão' })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}
```

### Estado do wizard
- Usar `useSearchParams` para ler `step` e `id` da URL
- Manter estado de tipo selecionado em `useState` local (sem Zustand)
- Após `createSermon()`, usar `router.push()` para navegar com o `id`

### Badge na listagem
- `SermonCard` já deve renderizar badge baseado em `sermon.type`:
  - `'esboço'` → badge "Esboço" (Slate)
  - `'apresentação'` → badge "Apresentação" (Teal)

## Plano de Implementação

### Pré-requisitos
- Issue 006 concluída (TypePicker visual pronto)
- Issue 020 concluída (Supabase configurado, tabela `sermons` existe)
- Issue 024 concluída (coluna `type` em `sermons` existe via migration 005)

### Passos

**1. Adicionar createSermon ao hook**
Editar `src/hooks/useSermon.ts` (ou criar se não existir):
- Função `createSermon(type, userId)` → `INSERT INTO sermons (user_id, type, title) RETURNING id`
- Função `updateSermonType(id, type)` → `UPDATE sermons SET type = $1`
- Função `getSermonById(id)` → `SELECT` por id + verificar `user_id === auth.uid()`

**2. Tornar TypePicker conectado**
Editar `src/components/sermon/TypePicker.tsx`:
- Adicionar `"use client"`
- Ao clicar "Continuar": chamar `createSermon()` (loading state no botão)
- Se `searchParams.get('id')` existe: chamar `getSermonById()` ao montar, pré-selecionar tipo
- Ao mudar tipo com slides existentes: verificar via `supabase.from('slides').select('id').eq('sermon_id', id)` → se resultado, exibir alerta de confirmação antes de `updateSermonType`
- Erro de rede: toast via shadcn/ui

**3. Gerenciar roteamento no wizard**
Editar `src/app/(app)/sermons/new/page.tsx`:
- Ler `step` e `id` via `useSearchParams`
- Após `createSermon()`: `router.push(\`/sermons/new?step=2&id=\${id}\`)` (esboço) ou `?step=2b&id=...` (apresentação)

**4. Badge no SermonCard**
Editar `src/components/sermon/SermonCard.tsx`:
- Adicionar badge condicional: `type === 'apresentação'` → badge Teal; `'esboço'` → Slate

### Como Verificar
- Selecionar tipo e clicar Continuar: sermão criado no Supabase (verificar via Studio)
- URL muda para `/sermons/new?step=2&id={uuid}` (esboço) ou `?step=2b` (apresentação)
- Recarregar a página com `?id={id}`: tipo pré-selecionado, sem criar duplicata
- Mudar tipo quando slides existem: alerta de confirmação aparece
- SermonCard na listagem exibe badge correto por tipo
