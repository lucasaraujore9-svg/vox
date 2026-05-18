# Issue 006, Seletor de Tipo (Esboço vs Apresentação) UI Proto

**Status:** [ ] PENDENTE
**Tipo:** proto
**Página:** /sermons/new (Step 1)
**Depende de:** 023
**Prioridade:** P0

---

## O Que Fazer

Criar o protótipo visual do Step 1 do fluxo de criação de sermão:
a tela de escolha entre **Esboço Guia** e **Apresentação**.

Esta tela antecede a seleção de framework (que agora é Step 2A) e
a configuração de slides (Step 2B).

## Componentes Envolvidos

- `src/app/(app)/sermons/new/page.tsx`, atualizar para incluir Step 0 (tipo)
- `src/components/sermon/TypePicker.tsx`, novo componente

## Comportamentos (proto, apenas visual)

- Dois cards grandes lado a lado (desktop) ou empilhados (mobile)
- **Card Esboço Guia:**
  - Ícone: `feather` (VoxIcon), metáfora de manuscrito
  - Título: "Esboço Guia" Fraunces 600 22px
  - Descrição Geist 400 14px Slate: "Escreva seu sermão por blocos, com estrutura definida por um framework homilético."
  - Badge badge "Para manuscritos" Slate
  - Visualização mini: 3 blocos empilhados com labels (Introdução / Ponto Principal / Conclusão)
- **Card Apresentação:**
  - Ícone: `present` (VoxIcon), metáfora de slides
  - Título: "Apresentação" Fraunces 600 22px
  - Descrição Geist 400 14px Slate: "Importe seus slides (PDF, PPT ou Google Slides) e adicione comentários para cada slide."
  - Badge "Para slides" Teal
  - Visualização mini: 3 miniaturas de slide empilhadas horizontalmente com ícone de comentário
- Seleção: borda Forest Deep 2px + tint forest-soft + checkmark no canto superior direito
- Botão "Continuar →", desabilitado até seleção, Forest Deep após seleção
- Progress breadcrumb no topo: passo 1 de N

## Critério de Aceite

- [ ] Dois cards renderizando com ícone, título, descrição, preview mini
- [ ] Seleção de card muda estado visual (borda + tint + check)
- [ ] Apenas um card pode ser selecionado por vez
- [ ] Botão "Continuar" desabilitado sem seleção, ativo com seleção
- [ ] Responsivo: lado a lado no desktop, empilhado no mobile
- [ ] Cards acessíveis (role="radio", keyboard navigation)

## Notas de Implementação

```typescript
// src/components/sermon/TypePicker.tsx
type SermonType = 'esboço' | 'apresentação'

interface TypePickerProps {
  value: SermonType | null
  onChange: (type: SermonType) => void
}
```

- Usar `VoxIcon` de `design-system/vox/primitives.jsx`
- Cards com `role="radio"` e `aria-checked` para acessibilidade
- Estado local com `useState<SermonType | null>(null)`
- A preview mini dos cards é decorativa, usar elementos CSS simples (divs com border)

## Plano de Implementação

### Pré-requisitos
- Issue 023 concluída (Next.js configurado, Tailwind + shadcn funcionando)

### Passos

**1. Criar constante de tipos**
Criar `src/lib/sermon/types.ts`:
- Exportar `SermonType = 'esboço' | 'apresentação'`
- Exportar metadados de cada tipo (ícone, título, descrição, badge, preview)

**2. Criar componente TypePicker**
Criar `src/components/sermon/TypePicker.tsx` (`"use client"`):
- `useState<SermonType | null>(null)` para seleção
- Dois cards com `role="radio"`, `aria-checked`, `tabIndex`, `onKeyDown` (Enter/Space)
- Preview mini: 3 `<div>` com border e label para Esboço; 3 `<div>` aspect-ratio 16/9 para Apresentação
- Borda `border-[#166534] border-2` + `bg-[#166534]/5` no card selecionado
- Checkmark SVG no canto superior direito (visível só quando selecionado)
- Botão "Continuar →" desabilitado (`disabled`, `opacity-50 cursor-not-allowed`) sem seleção

**3. Integrar na página de criação**
Editar `src/app/(app)/sermons/new/page.tsx`:
- Adicionar Step 1 com `TypePicker` e breadcrumb de progresso (step 1 de N)
- `onChange` captura o tipo; botão Continuar chama `onContinue(selectedType)`

**4. Responsividade**
- Desktop: `flex-row gap-6`; mobile: `flex-col`, via Tailwind `sm:flex-row`

### Como Verificar
- Acessar `/sermons/new`, ver dois cards renderizados
- Clicar em cada card: borda verde + tint + checkmark ativo; botão Continuar habilitado
- Navegar pelos cards via teclado (Tab + Space/Enter)
- Redimensionar janela: cards empilham em viewport < 640px
