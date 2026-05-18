# Issue 007, Painel de Slides (Apresentação) UI Proto

**Status:** [ ] PENDENTE
**Tipo:** proto
**Página:** /sermons/new (Step 2B e 3B), /sermons/[id] (tipo apresentação)
**Depende de:** 023, 006
**Prioridade:** P0

---

## O Que Fazer

Criar o protótipo visual completo do painel de slides para o tipo "Apresentação":
escolha de fonte (upload/Google Slides/manual), lista de slides com miniaturas
e editor de comentário por slide.

## Componentes Envolvidos

- `src/components/slides/SlidesPanel.tsx`, painel principal (dois painéis)
- `src/components/slides/SlidesList.tsx`, lista lateral de miniaturas
- `src/components/slides/SlideComment.tsx`, área de comentário do slide selecionado
- `src/components/slides/SlidesUpload.tsx`, zona de upload (drag-and-drop)
- `src/components/slides/GoogleSlidesInput.tsx`, campo de URL

## Comportamentos (proto, dados mockados)

### Step 2B, Escolha da fonte (tela dentro do /sermons/new)

Três opções em radio cards compactos (menores que os cards de tipo):

**Opção 1: Upload de arquivo**
- Ícone upload + texto "PDF ou PPT/PPTX"
- Sublabel "Máx. 50MB"

**Opção 2: Google Slides**
- Ícone link + texto "Google Slides"
- Sublabel "Cole o link da apresentação"

**Opção 3: Começar em branco**
- Ícone plus + texto "Sem slides ainda"
- Sublabel "Adicione slides manualmente depois"

### Step 3B, Painel principal de slides

**Layout dois painéis:**

**Painel esquerdo (280px fixo), Lista de slides:**
- Background Linen (`--vox-surface-elev`)
- Header: "Slides" eyebrow + contador "3 slides" Geist Mono 12px Muted
- Lista vertical com scroll:
  - Cada item: miniatura 240×135px (aspect ratio 16:9), borda 1.5px whisper
  - Número do slide: Geist Mono 11px no canto inferior esquerdo da miniatura
  - Ícone de comentário (preenchido em Forest Deep se há comentário, outline se vazio)
  - Estado selecionado: borda Forest Deep 2px + leve sombra
  - Hover: sombra card-hover
- Botão "+ Adicionar slide" ghost, base da lista

**Painel direito (flex 1), Comentário do slide:**
- Header: "Slide [N]" Fraunces 600 20px + badge com número total
- Miniatura do slide grande (16:9, máx 640px de largura, centralizada)
- Divisor whisper
- Label: "Comentários do apresentador" eyebrow
- Hint: "Estas notas ficam visíveis apenas para você no Modo Apresentação"
- Textarea com TipTap básico: formatação mínima (negrito, itálico, lista)
- Word count Geist Mono 11px Muted no canto inferior direito
- Auto-save indicator "salvo há 5s" Geist Mono 11px Muted

**Estado de upload (dropzone):**
- Área pontilhada grande, 2px dashed whisper-strong, 16px radius
- Ícone upload central + "Arraste o PDF ou PPT aqui" Geist 15px Slate
- "ou clique para selecionar" ghost link abaixo
- Formatos aceitos e limite listados embaixo Muted 12px
- Estado de drag-over: borda Forest Deep + forest-tint background

**Estado Google Slides:**
- Input URL full-width com label "Link do Google Slides"
- Hint: "A apresentação deve estar pública ou com compartilhamento ativo"
- Preview embed mockado (placeholder)

## Critério de Aceite

- [ ] 3 opções de fonte renderizando como radio cards
- [ ] Seleção de fonte muda visual (borda + check)
- [ ] Painel dois-colunas renderizando (lista esquerda + comentário direita)
- [ ] Lista de 5 slides mock com miniaturas (usar picsum.photos como placeholder)
- [ ] Seleção de slide na lista muda o painel direito
- [ ] Ícone de comentário muda conforme slide tem/não tem comentário (mock)
- [ ] Textarea do comentário funciona (TipTap básico)
- [ ] Dropzone renderiza com hover state
- [ ] Responsivo: painéis empilham no mobile (lista fica horizontal scroll em cima)

## Notas de Implementação

```typescript
// src/components/slides/SlidesPanel.tsx
interface Slide {
  id: string
  order: number
  image_url: string | null
  comment: string
}

interface SlidesPanelProps {
  slides: Slide[]
  selectedSlideId: string | null
  onSelectSlide: (id: string) => void
  onUpdateComment: (id: string, comment: string) => void
  onAddSlide: () => void
  onReorder: (from: number, to: number) => void
}
```

- Miniaturas mock: `https://picsum.photos/seed/slide{N}/640/360`
- Reordenação visual: usar `@dnd-kit/sortable` (mesmo do editor de blocos)
- Lista esquerda: `overflow-y: auto`, altura = `calc(100vh - header)`
- Mobile: lista muda para scroll horizontal de chips de slide

## Plano de Implementação

### Pré-requisitos
- Issue 023 concluída (ambiente configurado)
- Issue 006 concluída (estilo de cards reutilizável)
- `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

### Passos

**1. Definir tipos e mocks**
Criar `src/components/slides/types.ts`:
- Interface `Slide` (id, order, image_url, comment)
- Constante `MOCK_SLIDES` (5 itens, imagens `picsum.photos/seed/slideN/640/360`)

**2. Criar SlidesUpload**
Criar `src/components/slides/SlidesUpload.tsx` (`"use client"`):
- Dropzone com `onDragOver`/`onDrop` e `<input type="file" hidden>`
- Estado `isDragging` → borda Forest Deep + forest-tint no drag-over
- Sublabel de formatos e limite

**3. Criar SlidesList**
Criar `src/components/slides/SlidesList.tsx` (`"use client"`):
- Lista vertical com `SortableContext` (@dnd-kit) e drag handle (6 pontos SVG)
- Miniatura `<img>` 240×135, número Geist Mono 11px, ícone comentário cheio/vazio por prop
- Selecionado: `border-[#166534] border-2 shadow-sm`
- Botão "+ Adicionar slide" ghost no fim

**4. Criar SlideComment**
Criar `src/components/slides/SlideComment.tsx` (`"use client"`):
- Header "Slide N" Fraunces 600 20px + badge total
- `<img>` 16:9 máx 640px centralizada
- `<textarea>` placeholder de TipTap, word count Geist Mono 11px Muted
- "salvo há 5s" mockado

**5. Criar SlidesPanel (orquestrador)**
Criar `src/components/slides/SlidesPanel.tsx` (`"use client"`):
- Três radio cards compactos: Upload / Google Slides / Em branco
- `DndContext` wrappando `SlidesList`
- Layout: `<aside style={{width:280}}>` + `<main className="flex-1">`
- Mobile: `flex-col`, lista em `overflow-x-auto flex-row`

**6. Integrar no wizard de /sermons/new**
Editar `src/app/(app)/sermons/new/page.tsx`:
- Renderizar `SlidesPanel` no Step 2B (`type === 'apresentação'`)

### Como Verificar
- Step 2B exibe 3 radio cards de fonte com seleção visual
- Painel dois-colunas: clicar em slide mock troca painel direito
- Dropzone muda cor de borda ao arrastar sobre ela
- Ícone de comentário difere entre slides com/sem comentário (mock)
- Drag handle visível; reordenação funciona visualmente
