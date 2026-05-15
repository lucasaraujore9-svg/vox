# Issue 003 — Banco de Sermões UI Proto

**Status:** [ ] PENDENTE
**Tipo:** proto
**Página:** /sermons
**Depende de:** 023, 001
**Prioridade:** P0

---

## O Que Fazer

Criar o protótipo visual do banco de sermões: listagem em grid, filtros,
busca e ações por card. Dados mockados.

## Componentes Envolvidos

- `src/app/(app)/sermons/page.tsx` — Página do banco (mock)
- `src/components/sermon/SermonGrid.tsx` — Grid de cards
- `src/components/sermon/SermonCard.tsx` — Card individual (reusar da issue 001)
- `src/components/sermon/SermonFilters.tsx` — Painel de filtros
- `src/components/shared/ConfirmDialog.tsx` — Modal de confirmação de exclusão

## Comportamentos (proto — apenas visual)

- Header da página: título "Meus Sermões" + contador + botão "Novo Sermão"
- Campo de busca no topo (visual, sem funcionalidade de busca real)
- Painel de filtros lateral (colapsável no mobile):
  - Filtro por framework (checkboxes)
  - Filtro por livro bíblico (select)
  - Filtro por status (rascunho / pronto)
  - Filtro por série (select)
  - Ordenação: mais recente / mais antigo / A-Z
- Grid de SermonCards (2 colunas desktop, 1 coluna mobile)
- Hover no card: revelar ações (Editar, Apresentar, Duplicar, Excluir)
- Clique em Excluir: abre ConfirmDialog com texto de confirmação
- Estado vazio: ilustração + texto "Nenhum sermão ainda. Crie o primeiro!"
- Estado de loading: Skeleton cards (3 linhas)

## Critério de Aceite

- [ ] Grid de sermões mockados (ao menos 12 para testar layout)
- [ ] Filtros renderizando com opções corretas
- [ ] Hover no card revela ações (Editar, Apresentar, Duplicar, Excluir)
- [ ] ConfirmDialog abre ao clicar em Excluir
- [ ] Estado vazio renderiza corretamente
- [ ] Skeleton de loading renderiza corretamente
- [ ] Responsivo: 2 colunas desktop, 1 coluna mobile
- [ ] Filtros colapsam em drawer no mobile

## Notas de Implementação

- Usar os 12 mocks criados na issue 001 (ou expandir para 12 itens)
- SermonCard já criado na issue 001 — não duplicar, reusar
- Filtros: usar shadcn `Checkbox`, `Select`, `Sheet` para drawer mobile
- ConfirmDialog: shadcn `AlertDialog`
- Skeleton: shadcn `Skeleton`
- Hover actions: `opacity-0 group-hover:opacity-100` com `group` no card

## Plano de Implementação

### Pré-requisitos
- Issue 023 concluída (shadcn/ui disponível)
- Issue 001 concluída (`SermonCard` já existe — não recriar)

### Passos

**1. Expandir mocks para 12 sermões**
Editar `src/app/(app)/dashboard/page.tsx` (ou extrair para `src/lib/mocks/sermons.ts`):
- Exportar `MOCK_SERMONS` com 12 itens variando framework, status e tags

**2. Criar SermonGrid**
Criar `src/components/sermon/SermonGrid.tsx`:
- Props: `sermons: MockSermon[]`, `onDelete: (id: string) => void`
- Grid `grid-cols-1 md:grid-cols-2 gap-4`
- Cada `<SermonCard>` envolvido em `<div className="group relative">`
- Overlay de ações no hover: Editar (link), Apresentar (link), Duplicar, Excluir (abre dialog)

**3. Criar ConfirmDialog**
Criar `src/components/shared/ConfirmDialog.tsx`:
- Props: `open`, `onOpenChange`, `onConfirm`, `title`, `description`
- Usa shadcn `AlertDialog` — botão destrutivo para confirmar

**4. Criar SermonFilters**
Criar `src/components/sermon/SermonFilters.tsx`:
- Filtros inline (desktop) + Sheet (mobile)
- Checkboxes para framework (6 opções), `Select` para livro/série/status, radio para ordenação
- `onFilterChange` props — no proto, apenas visual (sem lógica real)
- Botão "Limpar filtros"

**5. Criar página /sermons**
Criar `src/app/(app)/sermons/page.tsx`:
- `"use client"` — estado local: `deleteTarget`, `showSkeleton` (toggle manual para testar)
- Header: "Meus Sermões" + contador + botão "Novo Sermão"
- `<Input placeholder="Buscar...">` no topo (visual)
- Layout: filtros à esquerda (lg+) + `<SermonGrid>` à direita
- Estado vazio: mensagem "Nenhum sermão ainda. Crie o primeiro!" com botão
- Skeleton: 6 `<Skeleton className="h-32 w-full rounded-lg">` em grid

### Como Verificar
- `/sermons` mostra grid de 12 cards com dados variados
- Hover num card revela 4 ações com transição de opacidade
- Clicar Excluir abre AlertDialog; confirmar fecha o dialog
- Redimensionar para mobile: filtros somem, Sheet aparece ao clicar filtros
