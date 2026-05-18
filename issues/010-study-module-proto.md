# Issue 010, Estudo Guiado UI Proto

**Status:** [ ] PENDENTE
**Tipo:** proto
**Página:** /study, /study/[moduleId]
**Depende de:** 023
**Prioridade:** P1

---

## O Que Fazer

Criar o protótipo visual completo do módulo de Estudo Guiado:
tela de trilhas disponíveis + interface de sessão de estudo + geração de output.

## Componentes Envolvidos

- `src/components/study/StudyModuleCard.tsx`, card de módulo disponível
- `src/components/study/StudySession.tsx`, interface da sessão ativa
- `src/components/study/StudyNotes.tsx`, editor de notas (blocos visuais)
- `src/components/study/StudyProgress.tsx`, progresso no módulo
- `src/components/study/StudyOutputPicker.tsx`, modal "Gerar conteúdo"
- `src/app/(app)/study/page.tsx`, tela de trilhas
- `src/app/(app)/study/[moduleId]/page.tsx`, sessão ativa

---

## Página /study, Trilhas disponíveis

### Header
- Título: "Estudo Guiado" Fraunces 600 28px
- Subtitle: "Módulos validados para formação pastoral" Geist 14px Muted

### Filtro de categoria (tabs ou chips):
`Todos · Homilética · Hermenêutica · Teologia · Comunicação · Liderança · Discipulado`

### Grid de módulos (bento assimétrico, não 3 iguais em linha)
Cada `StudyModuleCard`:
- Badge de categoria (cor por categoria)
- Título: Fraunces 600 18px
- Descrição: Geist 14px Slate (2 linhas, truncado)
- Footer: `X sessões · Y horas estimadas` Geist Mono 11px Muted
- Botão: "Começar" (Forest Deep) se não iniciado / "Continuar" (outline) se em progresso
- Barra de progresso (whisper → Forest) se em andamento

**Módulos mock (6 cards):**
1. Homilética Essencial, 8 sessões · 12h
2. Hermenêutica Bíblica, 6 sessões · 9h
3. Teologia Sistemática Básica, 10 sessões · 15h
4. Comunicação e Oratória, 5 sessões · 7h
5. Liderança Pastoral, 6 sessões · 8h
6. Formação de Discípulos, 8 sessões · 10h

---

## Página /study/[moduleId], Sessão Ativa

### Layout split-screen

**Painel esquerdo (280px fixo), Índice do módulo:**
- Header: nome do módulo eyebrow + progresso "Sessão 3 de 8"
- Barra de progresso Forest
- Lista vertical de sessões:
  - Cada item: número + título da sessão
  - Estado: ✓ concluída (Forest) / → atual (bold) / ○ pendente (Muted)
- Botão "Gerar conteúdo", Forest Deep, base do painel (aparece ao completar 80%+)

**Painel direito (flex 1), Conteúdo da sessão:**
- Header: "Sessão 3, [Título]" Fraunces 600 22px
- Corpo da sessão: texto guiado (Geist 15px, line-height 1.7, máx 680px)
  - Pode conter: perguntas de reflexão, textos bíblicos, exercícios
- Divisor whisper
- **Área de notas** (label: "Minhas notas"):
  - Editor de blocos visuais (mesmo sistema do editor de sermões)
  - Blocos disponíveis: Texto Bíblico, Citação, Notas pessoais, Pergunta retórica, Aplicação
  - Placeholder: "Registre suas reflexões, insights e aplicações…"
- Botão "Concluir sessão →" Forest Deep (base da área de notas)

### Modal "Gerar conteúdo" (StudyOutputPicker)
Aparece ao clicar "Gerar conteúdo":
- Título: "Transformar estudo em conteúdo"
- Descrição: "Escolha o formato. Suas notas serão usadas como base."
- 4 opções em grid 2×2:
  - Sermão / Palestra / Aula / Curso
- Botão "Gerar", cria o rascunho e redireciona para o editor

---

## Critério de Aceite

- [ ] Grid de módulos com 6 cards mock renderizando
- [ ] Filtro de categoria funcional (só visual, sem lógica)
- [ ] Barra de progresso visível nos cards em andamento
- [ ] Layout split-screen da sessão ativa
- [ ] Índice com estados (concluída / atual / pendente)
- [ ] Editor de blocos visuais nas notas
- [ ] Botão "Gerar conteúdo" visível (sem funcionalidade no proto)
- [ ] Modal StudyOutputPicker renderizando com 4 opções
- [ ] Responsivo: painéis empilham no mobile

## Notas de Implementação

```typescript
// Módulos mock para o proto
const MOCK_MODULES = [
  { id: 'm1', title: 'Homilética Essencial', category: 'homilética',
    sessions: 8, hours: 12, progress: 0.375 }, // sessão 3 de 8
  // ...
]

// Sessão mock
const MOCK_SESSION = {
  number: 3,
  title: 'A Proposição Central',
  content: '...texto guiado...', // HTML ou markdown
  notes: [] // blocos visuais
}
```

- As notas reutilizam o `BlockEditor` (components/blocks/BlockEditor.tsx)
- O modal de output usa `shadcn/ui Dialog`
- Ao completar uma sessão no proto: marca como concluída + avança para próxima

## Plano de Implementação

### Pré-requisitos
- Issue 023 concluída (shadcn/ui disponível)

### Passos

**1. Criar mocks e constantes**
Criar `src/lib/study/mocks.ts`:
- `MOCK_MODULES` (6 módulos conforme spec, com `progress` variado)
- `MOCK_SESSION` (sessão 3, título, conteúdo HTML/markdown, notas vazias)

**2. Criar StudyModuleCard**
Criar `src/components/study/StudyModuleCard.tsx` (Server Component):
- Badge de categoria colorido, título Fraunces, descrição 2 linhas truncada
- Footer: sessões · horas estimadas, Geist Mono 11px Muted
- Barra de progresso `<div>` whisper → Forest
- Botão "Começar" (Forest) ou "Continuar" (outline) por estado do mock

**3. Criar página /study**
Criar `src/app/(app)/study/page.tsx` (Server Component):
- Chips de filtro por categoria (estado client em `StudyCategoryFilter`)
- Grid bento assimétrico: `grid-cols-3`, primeiro card `col-span-2` (destaque)
- `StudyModuleCard` × 6

**4. Criar StudySession e StudyNotes**
Criar `src/components/study/StudySession.tsx` (`"use client"`):
- Layout split: aside 280px (índice) + main flex-1 (conteúdo)
- Índice: lista de sessões com estados ✓ / → / ○ por mock
- Conteúdo: markdown renderizado, `<StudyNotes>` abaixo, botão "Concluir sessão →"
- Botão "Gerar conteúdo" no base do aside (visível quando progress ≥ 80% no mock)

Criar `src/components/study/StudyNotes.tsx` (`"use client"`):
- `BlockEditor` reutilizado de `components/blocks/BlockEditor.tsx`
- Placeholder: "Registre suas reflexões…"

**5. Criar StudyOutputPicker**
Criar `src/components/study/StudyOutputPicker.tsx` (`"use client"`):
- `shadcn/ui Dialog` com grid 2×2: Sermão / Palestra / Aula / Curso
- Botão "Gerar" (sem funcionalidade no proto)

**6. Criar página /study/[moduleId]**
Criar `src/app/(app)/study/[moduleId]/page.tsx`:
- Server Component, passa `MOCK_SESSION` para `StudySession`

### Como Verificar
- `/study`: 6 cards no grid, filtros de categoria mudam exibição visualmente
- Barra de progresso visível nos cards em andamento
- `/study/m1`: split-screen com índice e conteúdo da sessão
- Clicar "Concluir sessão": marca item do índice como ✓
- Botão "Gerar conteúdo" abre modal com 4 opções
