# Issue 008 — Seletor de Tipo de Conteúdo (Sermão / Palestra / Aula) UI Proto

**Status:** [ ] PENDENTE
**Tipo:** proto
**Página:** /sermons/new (Step 0 — antes do TypePicker)
**Depende de:** 023
**Prioridade:** P0

---

## O Que Fazer

Criar o protótipo visual do Step 0 do wizard de criação: escolha do **tipo de conteúdo**
antes de escolher entre esboço ou apresentação.

Esta tela antecede o TypePicker (006) e o FrameworkPicker (005).

## Componentes Envolvidos

- `src/components/sermon/ContentTypePicker.tsx` — novo componente
- `src/app/(app)/sermons/new/page.tsx` — adicionar Step 0

## Comportamentos (proto — apenas visual)

### Layout
- Três cards em linha (desktop) / empilhados (mobile)
- Menor que os cards do TypePicker — mais compactos, mais opções

**Card Sermão:**
- Ícone `feather` (manuscrito)
- Título: "Sermão" Fraunces 600 18px
- Descrição: "Pregação em culto, celebração ou vigília."
- Badge "Pregação" Forest

**Card Palestra:**
- Ícone `present` (microfone/palco)
- Título: "Palestra" Fraunces 600 18px
- Descrição: "Comunicação em evento, conferência ou retiro."
- Badge "Evento" Teal

**Card Aula:**
- Ícone `book` (livro aberto)
- Título: "Aula" Fraunces 600 18px
- Descrição: "Ensino em célula, escola bíblica ou grupo de estudo."
- Badge "Ensino" Slate

### Estados
- Default: borda whisper
- Selecionado: borda Forest Deep 2px + forest-soft tint + checkmark canto superior direito
- Hover: sombra card-hover

### Botão "Continuar"
- Desabilitado até seleção
- Forest Deep após seleção

## Critério de Aceite

- [ ] 3 cards renderizando com ícone, título, descrição, badge
- [ ] Seleção muda estado visual (borda + tint + check)
- [ ] Apenas um card selecionável por vez
- [ ] Botão "Continuar" desabilitado sem seleção
- [ ] Responsivo: linha no desktop, empilhado no mobile
- [ ] Acessível: role="radio", aria-checked, keyboard navigation

## Notas de Implementação

```typescript
// src/components/sermon/ContentTypePicker.tsx
type ContentType = 'sermão' | 'palestra' | 'aula'

interface ContentTypePickerProps {
  value: ContentType | null
  onChange: (type: ContentType) => void
}
```

- Este picker vem ANTES do TypePicker (esboço vs apresentação)
- Wizard completo: Step 0 (content_type) → Step 1 (type) → Step 2A/2B
- Reaproveitar estilos dos cards do TypePicker (006)

## Plano de Implementação

### Pré-requisitos
- Issue 023 concluída (ambiente configurado)
- Issue 006 concluída (padrão visual de cards reutilizável)

### Passos

**1. Criar ContentTypePicker**
Criar `src/components/sermon/ContentTypePicker.tsx` (`"use client"`):
- Tipo `ContentType = 'sermão' | 'palestra' | 'aula'`
- Array de metadados: `{ type, icon, title, description, badge, badgeColor }`
- Três cards `role="radio"`, `aria-checked`, navegável por teclado
- Cards menores que TypePicker: `max-w-[280px]` cada
- Badge colorido por tipo: Forest / Teal / Slate
- Selecionado: mesma borda Forest Deep 2px + tint + checkmark da issue 006

**2. Adicionar Step 0 na página do wizard**
Editar `src/app/(app)/sermons/new/page.tsx`:
- Adicionar `step === '0'` renderiza `ContentTypePicker`
- Breadcrumb de progresso atualizado para "Passo 1 de 3"
- Estado `contentType` em `useState` local
- Botão Continuar avança para `step=1` (TypePicker)

**3. Passar contentType adiante no wizard**
- `useSearchParams` para ler/escrever `content_type` na URL entre steps
- Valor disponível para Steps 1 e 2 via query param (`?step=1&content_type=palestra`)

### Como Verificar
- Acessar `/sermons/new`: ver Step 0 com 3 cards
- Selecionar cada card: borda + tint + check ativo; botão Continuar habilitado
- Continuar avança para Step 1 (TypePicker) mantendo `content_type` na URL
- Keyboard navigation funciona entre os 3 cards
- Layout em linha no desktop, empilhado no mobile
