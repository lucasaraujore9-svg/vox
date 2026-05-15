# Issue 002 — Editor de Sermão UI Proto

**Status:** [ ] PENDENTE
**Tipo:** proto
**Página:** /sermons/new, /sermons/[id]
**Depende de:** 023
**Prioridade:** P0

---

## O Que Fazer

Criar o protótipo visual do editor de sermões: seleção de framework e
editor de blocos com TipTap. Sem salvamento real — apenas a experiência visual.

## Componentes Envolvidos

- `src/app/(app)/sermons/new/page.tsx` — Página com 3 steps (mock)
- `src/components/sermon/FrameworkPicker.tsx` — Seleção de framework
- `src/components/editor/SermonEditor.tsx` — Editor principal
- `src/components/editor/SermonBlock.tsx` — Bloco individual editável
- `src/components/editor/BlockToolbar.tsx` — Toolbar do bloco

## Comportamentos (proto — apenas visual)

- **Step 1:** Grid de 6 cards de frameworks (Expositivo, Temático, Narrativo, Tópico, Textual, Livre)
  - Cada card: ícone, nome, descrição curta de 1 linha, exemplo de estrutura
  - Hover: borda destacada + seta de seleção
  - Seleção: card fica marcado
- **Step 2:** Formulário de metadados (título, referência bíblica, data, série, tags)
  - Campo de tags: input com chips
- **Step 3:** Editor de blocos
  - Blocos gerados pelo framework selecionado no Step 1
  - Cada bloco: título do tipo (ex: "INTRODUÇÃO") + área TipTap
  - Bloco pode ser minimizado/expandido
  - Handle de drag para reordenar (visual apenas, sem funcionalidade no proto)
  - Barra de formatação básica: negrito, itálico, lista, citação

## Critério de Aceite

- [ ] 6 cards de framework renderizando com nome + descrição + estrutura
- [ ] Seleção de framework marca card e habilita botão "Próximo"
- [ ] Formulário de metadados com todos os campos
- [ ] Editor abre com blocos pré-definidos pelo framework selecionado
- [ ] TipTap funcional em cada bloco (digitar, formatar texto)
- [ ] Barra de formatação básica funcionando
- [ ] Layout responsivo (mobile-friendly)

## Notas de Implementação

### Packages necessários
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install @tiptap/extension-placeholder
```

### Estrutura dos blocos por framework (mock)
```typescript
const FRAMEWORK_BLOCKS = {
  expositivo: [
    { type: 'contexto', title: 'Contexto Histórico' },
    { type: 'explicacao', title: 'Explicação do Texto' },
    { type: 'aplicacao', title: 'Aplicação Prática' },
    { type: 'conclusao', title: 'Conclusão' }
  ],
  tematico: [
    { type: 'introducao', title: 'Introdução' },
    { type: 'ponto', title: 'Ponto Principal 1' },
    { type: 'ponto', title: 'Ponto Principal 2' },
    { type: 'ponto', title: 'Ponto Principal 3' },
    { type: 'conclusao', title: 'Conclusão' }
  ],
  // ... outros frameworks
}
```

### FrameworkPicker — estrutura de dados
```typescript
const FRAMEWORKS = [
  {
    id: 'expositivo',
    name: 'Expositivo',
    description: 'Exposição versículo a versículo de uma passagem bíblica',
    structure: 'Contexto → Explicação → Aplicação → Conclusão',
    color: 'blue'
  },
  // ...
]
```

## Plano de Implementação

### Pré-requisitos
- Issue 023 concluída (Next.js + shadcn/ui configurados)
- `npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder`

### Passos

**1. Criar dados mock de frameworks**
Criar `src/lib/editor/frameworks.ts`:
- Exportar constante `FRAMEWORKS` com os 6 frameworks (id, name, description, structure, blocks)
- Exportar constante `FRAMEWORK_BLOCKS` com blocos padrão por framework

**2. Criar FrameworkPicker**
Criar `src/components/sermon/FrameworkPicker.tsx`:
- Props: `selected: string | null`, `onSelect: (id: string) => void`
- Grid 2×3 de cards com hover e estado selecionado (ring colorido)
- Cada card: nome + descrição + sequência de blocos em texto pequeno

**3. Criar BlockToolbar**
Criar `src/components/editor/BlockToolbar.tsx`:
- Props: `editor: Editor | null`
- Botões: Negrito, Itálico, Lista não-ordenada, Lista ordenada, Blockquote
- Usa `editor.chain().focus()` para aplicar formatação

**4. Criar SermonBlock**
Criar `src/components/editor/SermonBlock.tsx`:
- Props: `block: { type, title }`, `isCollapsed?: boolean`
- Header clicável que toggle `isCollapsed` (useState local)
- Instancia TipTap com `StarterKit` + `Placeholder`
- Mostra `<BlockToolbar>` acima da área de edição

**5. Criar SermonEditor**
Criar `src/components/editor/SermonEditor.tsx`:
- Props: `framework: string`
- Gera lista de blocos a partir de `FRAMEWORK_BLOCKS[framework]`
- Renderiza um `<SermonBlock>` por bloco
- Handle de drag visual (ícone, sem @dnd-kit no proto)

**6. Criar página /sermons/new com stepper**
Criar `src/app/(app)/sermons/new/page.tsx`:
- `"use client"` — estado local para step atual (1/2/3) e framework selecionado
- Step 1: `<FrameworkPicker>` + botão "Próximo" habilitado só se framework selecionado
- Step 2: formulário com `Input` (título, ref bíblica, data) + campo de tags com chips simples
- Step 3: `<SermonEditor framework={selectedFramework} />`

### Como Verificar
- Acessar `/sermons/new`: 6 cards de framework aparecem
- Selecionar "Expositivo" → botão "Próximo" habilita → Step 2 mostra formulário
- Step 3: 4 blocos do framework expositivo aparecem, cada um com TipTap funcional
- Digitar e formatar texto (negrito, lista) funciona dentro de cada bloco
