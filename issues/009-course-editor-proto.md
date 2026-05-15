# Issue 009 — Curso: Editor UI Proto

**Status:** [ ] PENDENTE
**Tipo:** proto
**Página:** /courses/new, /courses/[id]
**Depende de:** 023
**Prioridade:** P1

---

## O Que Fazer

Criar o protótipo visual do editor de cursos: estrutura curricular (ementa, objetivos,
carga horária) + lista de aulas vinculadas.

## Componentes Envolvidos

- `src/components/course/CourseEditor.tsx` — formulário de metadados do curso
- `src/components/course/LessonList.tsx` — lista de aulas vinculadas (drag-and-drop)
- `src/app/(app)/courses/new/page.tsx` — página de criação
- `src/app/(app)/courses/[id]/page.tsx` — página de edição

## Layout

### Cabeçalho do Curso
- Campo título: Fraunces 600 28px, inline edit (click para editar)
- Badge status: "Rascunho" / "Pronto" / "Publicado"
- Botões: "Salvar" (Forest Deep) + "Publicar" (outline)

### Seção Estrutura Curricular (painel principal, 2/3 da largura)

**Ementa:**
- Label eyebrow "Ementa"
- Textarea com placeholder: "Descrição geral do curso, público-alvo e metodologia."
- Geist 14px, border whisper, radius 8px

**Objetivos de Aprendizagem:**
- Label eyebrow "Objetivos"
- Lista editável de bullets:
  - Cada item: input inline com botão "×" para remover
  - Botão "+ Adicionar objetivo" ghost abaixo da lista
- Máx. sugerido: 8 objetivos

**Carga Horária:**
- Label eyebrow "Carga Horária"
- Input numérico + "horas" em linha (ex: `[  24  ] horas`)
- Geist Mono para o número

### Painel Lateral (1/3 da largura) — Aulas

**Header:** "Aulas" eyebrow + contador "0 aulas · 0h"

**Lista de aulas (drag-and-drop):**
- Cada item:
  - Handle de drag (6 pontos)
  - Número da ordem: Geist Mono 11px Muted
  - Título da aula: Geist 14px
  - Badge content_type: "Aula" Slate
  - Duração estimada: Geist Mono 11px Muted
  - Ícone remover (×)
- Estado vazio: "Nenhuma aula ainda" + hint

**Botão "+ Vincular aula":**
- Abre modal/sheet para buscar e vincular aulas existentes
- (Proto: botão visível, modal não implementado)

## Critério de Aceite

- [ ] Formulário de ementa renderizando
- [ ] Lista de objetivos editável (add/remove)
- [ ] Input de carga horária
- [ ] Painel lateral com lista de aulas (mock com 3 aulas)
- [ ] Drag handle visível nas aulas
- [ ] Botão "+ Vincular aula" visível
- [ ] Responsivo: painéis empilham no mobile
- [ ] Inline title edit funcional (click → input)

## Notas de Implementação

```typescript
// src/components/course/CourseEditor.tsx
interface CourseEditorProps {
  course: {
    id: string
    title: string
    ementa: string
    objectives: string[]
    hours: number
    status: 'rascunho' | 'pronto' | 'publicado'
  }
  lessons: Array<{
    id: string
    title: string
    durationMin: number
  }>
}
```

- Lista de objetivos: `useState<string[]>` + map de inputs
- Carga horária calculada automaticamente como soma das durações das aulas (sugerida)
- Drag-and-drop da lista: `@dnd-kit/sortable`

## Plano de Implementação

### Pré-requisitos
- Issue 023 concluída (ambiente configurado)
- `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` (se ainda não instalado)

### Passos

**1. Criar LessonList**
Criar `src/components/course/LessonList.tsx` (`"use client"`):
- Mock com 3 aulas: `[{id, title, durationMin}]`
- `DndContext` + `SortableContext` do @dnd-kit/sortable
- Cada item: drag handle (6 pontos) + número Geist Mono + título + badge "Aula" Slate + duração Geist Mono + botão "×"
- Estado vazio: texto "Nenhuma aula ainda" + hint
- Botão "+ Vincular aula" ghost no final (sem funcionalidade no proto)

**2. Criar CourseEditor**
Criar `src/components/course/CourseEditor.tsx` (`"use client"`):
- `useState` para `title`, `ementa`, `objectives: string[]`, `hours: number`, `status`
- Título inline edit: `<span onClick>` → `<input>` ao clicar; blur salva
- Badge status: "Rascunho" / "Pronto" / "Publicado"
- Textarea ementa com placeholder e border whisper
- Lista de objetivos: `objectives.map()` → inputs inline + botão "×" por item + "+ Adicionar objetivo"
- Input numérico de carga horária: `[number] horas`, Geist Mono no número
- Layout: `grid grid-cols-3 gap-6` — main (col-span-2) + aside (col-span-1)

**3. Criar páginas de curso**
Criar `src/app/(app)/courses/new/page.tsx` e `src/app/(app)/courses/[id]/page.tsx`:
- Ambas renderizam `<CourseEditor>` com dados mock

### Como Verificar
- Acessar `/courses/new`: ver editor completo com todos os campos
- Clicar no título: vira input editável; blur restaura span
- Adicionar/remover objetivo: lista atualiza
- Drag handle nas aulas: reordenação visual funciona
- Layout responsivo: empilha em mobile
