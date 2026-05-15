# Issue 031 — Editor com Frameworks Homiléticos

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /sermons/new, /sermons/[id]
**Depende de:** 030, 002
**Prioridade:** P0

---

## O Que Fazer

Implementar a lógica completa do editor de blocos com frameworks homiléticos:
geração automática de blocos por framework, edição rich text, reordenação e
sincronização com o campo `content` (JSONB) no Supabase.

## Componentes Envolvidos

- `src/components/editor/SermonEditor.tsx` — Editor principal (comportamento real)
- `src/components/editor/SermonBlock.tsx` — Bloco com TipTap real
- `src/lib/editor/frameworks.ts` — Definição e geração de blocos por framework
- `src/stores/editorStore.ts` — Estado do editor (Zustand)
- `src/types/sermon.ts` — Tipos de Bloco e Sermão

## Comportamentos

### Geração de blocos por framework
- Selecionar framework → gera array de blocos padrão com `type`, `title`, `content: ""`
- Usuário pode adicionar bloco extra (tipo livre)
- Usuário pode remover bloco (com confirmação se tiver conteúdo)
- Usuário pode reordenar blocos via drag-and-drop

### Editor de bloco (TipTap)
- Formatação básica: negrito, itálico, sublinhado, lista não-ordenada, lista ordenada
- Citação bíblica: extensão customizada para inserir versículo como blockquote especial
- Placeholder por tipo de bloco (ex: "Contexte o texto bíblico aqui...")
- Contagem de palavras por bloco e total do sermão

### Sincronização com Supabase
- Conteúdo serializado como JSON (formato TipTap) salvo em `sermons.content`
- Word count calculado e salvo em `sermons.word_count`
- Estrutura de bloco:
```typescript
interface SermonBlock {
  id: string
  type: 'contexto' | 'explicacao' | 'aplicacao' | 'conclusao' |
        'introducao' | 'ponto' | 'setup' | 'conflito' | 'climax' |
        'resolucao' | 'ilustracao' | 'versiculo' | 'livre'
  title: string
  content: JSONContent  // TipTap JSON
  order: number
}
```

## Critério de Aceite

- [ ] Cada framework gera os blocos corretos com tipos e títulos certos
- [ ] TipTap funcional em cada bloco (formatação básica)
- [ ] Placeholder correto por tipo de bloco
- [ ] Adicionar bloco livre funciona
- [ ] Remover bloco com confirmação funciona
- [ ] Reordenar blocos (drag) atualiza `order` dos blocos
- [ ] Conteúdo serializado corretamente como TipTap JSON
- [ ] Word count atualiza em tempo real
- [ ] Blocos salvos no campo `content` (JSONB) do Supabase via auto-save

## Notas de Implementação

### Packages
```bash
npm install @tiptap/extension-drag-drop-paste
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Definição de frameworks
```typescript
// src/lib/editor/frameworks.ts
export const FRAMEWORKS = {
  expositivo: {
    name: 'Expositivo',
    blocks: [
      { type: 'contexto', title: 'Contexto Histórico', placeholder: 'Contextualize o texto bíblico...' },
      { type: 'explicacao', title: 'Explicação do Texto', placeholder: 'Explique versículo a versículo...' },
      { type: 'aplicacao', title: 'Aplicação Prática', placeholder: 'Como isso se aplica hoje...' },
      { type: 'conclusao', title: 'Conclusão', placeholder: 'Sintetize e convide à decisão...' }
    ]
  },
  // ...
}
```

### Zustand store
```typescript
// src/stores/editorStore.ts
interface EditorStore {
  blocks: SermonBlock[]
  isDirty: boolean
  lastSaved: Date | null
  setBlocks: (blocks: SermonBlock[]) => void
  updateBlock: (id: string, content: JSONContent) => void
  reorderBlocks: (fromIndex: number, toIndex: number) => void
  addBlock: (type: string) => void
  removeBlock: (id: string) => void
  markSaved: () => void
}
```

### Serialização
- Salvar como array JSON no campo `content` do Supabase
- Deserializar ao carregar o sermão existente
- Validar estrutura dos blocos ao salvar (Zod)

## Plano de Implementação

### Pré-requisitos
- Issue 030 concluída (auto-save e CRUD funcionando)
- Issue 002 concluída (proto do editor existe)
- `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities zustand`

### Passos

**1. Definir tipos e frameworks**
Criar `src/types/sermon.ts` com interface `SermonBlock` conforme spec
Completar `src/lib/editor/frameworks.ts`:
- Adicionar todos os 6 frameworks com blocos, placeholders e `generateBlocks(framework)` que retorna `SermonBlock[]` com UUIDs

**2. Criar Zustand store do editor**
Criar `src/stores/editorStore.ts`:
- Estado: `blocks`, `isDirty`, `lastSaved`
- Actions: `setBlocks`, `updateBlock`, `reorderBlocks`, `addBlock`, `removeBlock`, `markSaved`
- `reorderBlocks` recalcula `order` de todos os blocos após move

**3. Atualizar SermonBlock com TipTap real**
Editar `src/components/editor/SermonBlock.tsx`:
- Instanciar `useEditor` com `StarterKit`, `Placeholder` (por tipo), `Underline`
- `onUpdate`: chamar `editorStore.updateBlock(id, editor.getJSON())`
- Exibir word count do bloco: `editor.storage.characterCount?.words()` ou calcular manualmente
- `DraggableItem` wrapper via `@dnd-kit/sortable` com `useSortable`

**4. Atualizar SermonEditor com DnD**
Editar `src/components/editor/SermonEditor.tsx`:
- Envolver lista de blocos com `<DndContext>` + `<SortableContext>`
- `onDragEnd`: chamar `editorStore.reorderBlocks(from, to)`
- Botão "Adicionar bloco" → `addBlock('livre')`
- Word count total: somar palavras de todos os blocos

**5. Conectar store ao auto-save**
Editar `src/hooks/useAutoSave.ts`:
- Observar `editorStore.isDirty`; quando true e após debounce de 3s → chamar `updateSermon`
- Serializar `blocks` array (já em formato TipTap JSON) + calcular `word_count` total
- Chamar `markSaved()` após sucesso

**6. Carregar conteúdo existente no editor**
Editar `src/app/(app)/sermons/[id]/page.tsx`:
- Após buscar sermão do Supabase, passar `sermon.content` para `<SermonEditor>`
- No editor: `useEffect` que chama `setBlocks(parsedContent)` quando sermão carrega

### Como Verificar
- Selecionar framework expositivo → 4 blocos gerados com tipos e placeholders corretos
- Digitar em cada bloco; após 3s indicador muda para "Salvo"; recarregar → conteúdo persiste
- Arrastar bloco via handle → ordem muda e persiste no banco
- Word count total atualiza em tempo real conforme o usuário digita
