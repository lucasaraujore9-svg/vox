# Issue 013 — Séries de Sermões UI Proto

**Status:** [ ] PENDENTE
**Tipo:** proto
**Página:** /sermons (filtro), /sermons/[id] (selector de série), /series (gestão)
**Depende de:** 023, 003
**Prioridade:** P1

---

## O Que Fazer

Criar o protótipo visual do gerenciamento de séries: listagem, criação,
e associação de sermões a uma série. A tabela `series` já existe no schema.

## Componentes Envolvidos

- `src/app/(app)/series/page.tsx` — listagem de séries
- `src/components/series/SeriesCard.tsx` — card de série com sermões vinculados
- `src/components/series/SeriesForm.tsx` — modal/sheet de criação/edição
- `src/components/sermon/SeriesSelector.tsx` — select de série no editor de sermão

## Comportamentos (proto — dados mockados)

### Página /series
- Header: "Minhas Séries" Fraunces 600 + contador + botão "+ Nova Série"
- Grid de SeriesCards (2 col desktop, 1 col mobile)
- Estado vazio: "Nenhuma série ainda. Agrupe seus sermões em séries temáticas."

### SeriesCard
- Título da série: Fraunces 600 18px
- Descrição (2 linhas truncadas): Geist 14px Slate
- Mini-lista de sermões vinculados: até 3 títulos + "e mais N" Muted
- Footer: "X sermões" Geist Mono 11px + data de criação
- Hover: revelar ações (Editar, Excluir)

### SeriesForm (modal)
- Input: título da série (obrigatório)
- Textarea: descrição (opcional)
- Botões: "Cancelar" (ghost) + "Salvar" (Forest Deep)

### SeriesSelector (no editor de sermão)
- Select com opções: "Sem série" + lista de séries do usuário
- Inline na página de metadados do sermão
- Botão "+ Nova série" dentro do dropdown (abre SeriesForm inline)

### Mock data
```typescript
const MOCK_SERIES = [
  { id: 's1', title: 'Série Romanos', description: 'Estudo expositivo da carta de Paulo aos Romanos', sermonCount: 12 },
  { id: 's2', title: 'Família segundo a Bíblia', description: 'Série temática sobre valores familiares', sermonCount: 5 },
  { id: 's3', title: 'Salmos de Davi', description: null, sermonCount: 8 },
]
```

## Critério de Aceite

- [ ] Grid de SeriesCards com 3 mocks renderizando
- [ ] SeriesForm abre ao clicar "+ Nova Série" (modal shadcn Dialog)
- [ ] SeriesSelector renderiza no editor com opções mock
- [ ] "+ Nova série" no selector abre SeriesForm
- [ ] Hover no card revela ações (Editar, Excluir)
- [ ] Responsivo: 2 col desktop, 1 col mobile

## Plano de Implementação

### Pré-requisitos
- Issue 023 concluída (Next.js setup, shadcn/ui disponível)
- Issue 003 concluída (SermonCard como referência de estilo)

### Passos

**1. Criar SeriesCard**
Criar `src/components/series/SeriesCard.tsx`:
- Props: `series: { id, title, description, sermonCount }`
- Layout: título Fraunces + descrição truncada + lista de sermões + footer
- Hover: `group` no card + `opacity-0 group-hover:opacity-100` nas ações

**2. Criar SeriesForm**
Criar `src/components/series/SeriesForm.tsx`:
- shadcn `Dialog` + `Input` + `Textarea` + `Button`
- Props: `open`, `onClose`, `initialData?` (para edição)
- Estado local: `title`, `description`

**3. Criar SeriesSelector**
Criar `src/components/sermon/SeriesSelector.tsx`:
- shadcn `Select` com opções mock
- Item especial "+ Nova série" que abre `SeriesForm` inline

**4. Criar página /series**
Criar `src/app/(app)/series/page.tsx`:
- Grid 2 col desktop / 1 col mobile com `MOCK_SERIES`
- Botão "+ Nova Série" abre `SeriesForm`

**5. Adicionar link na sidebar**
Editar `src/components/shared/AppSidebar.tsx`:
- Adicionar link "Séries" entre "Sermões" e "Estudo"

### Como Verificar
- `/series` renderiza grid de 3 cards mock sem erros
- "+ Nova Série" abre modal com formulário
- SeriesSelector aparece no editor e lista séries mock
- Mobile: cards empilhados, formulário ocupa tela cheia
