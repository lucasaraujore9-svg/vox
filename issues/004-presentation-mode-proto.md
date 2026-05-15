# Issue 004 — Modo Apresentação UI Proto

**Status:** [ ] PENDENTE
**Tipo:** proto
**Página:** /sermons/[id]/present
**Depende de:** 023, 002
**Prioridade:** P1

---

## O Que Fazer

Criar o protótipo visual do modo de apresentação (teleprompter).
Foco em legibilidade, controles e experiência de pregação.

## Componentes Envolvidos

- `src/app/(app)/sermons/[id]/present/page.tsx` — Página de apresentação
- `src/components/present/PresentationMode.tsx` — Componente principal
- `src/components/present/PresentationControls.tsx` — Barra de controles
- `src/components/present/PresentationBlock.tsx` — Bloco de conteúdo no modo apresentação

## Comportamentos (proto — dados mockados)

- **Layout:** Fullscreen, sem sidebar, sem header padrão
- **Conteúdo:** Texto do sermão em fonte grande, centralizado verticalmente
- **Indicador de bloco:** "Desenvolvimento 2/4" no topo (discreto)
- **Barra de controles inferior (sempre visível):**
  - Botão ◀ (bloco anterior)
  - Botão ▶ (próximo bloco)
  - Separador
  - Botão A- (diminuir fonte)
  - Botão A+ (aumentar fonte)
  - Separador
  - Toggle de modo noturno (☾/☀)
  - Separador
  - Botão "Sair" (X)
- **Modo noturno:** fundo escuro (#0f0f0f), texto claro (#f5f5f5)
- **3 tamanhos de fonte:** médio (24px), grande (32px), muito grande (42px)
- Navegação por teclado: ← → para blocos (visual, sem keydown no proto)
- Transição suave ao trocar de bloco

## Critério de Aceite

- [ ] Layout fullscreen sem sidebar
- [ ] Texto do bloco atual renderizando em fonte grande
- [ ] Indicador de bloco no topo
- [ ] Barra de controles sempre visível na base
- [ ] Toggle modo noturno funciona visualmente
- [ ] Botões A- e A+ alteram tamanho do texto (3 tamanhos)
- [ ] Botões ◀ ▶ trocam o bloco exibido (com mocks)
- [ ] Botão Sair navega para `/sermons/[id]`
- [ ] Responsivo no mobile (barra de controles acessível com polegar)

## Notas de Implementação

- Usar `useState` local para: bloco atual, tamanho fonte, modo noturno
- Mock do sermão: 4 blocos com texto de parágrafo real (não lorem ipsum)
- Fonte do modo apresentação: `--font-editor` do design system (placeholder)
- Animação de troca de bloco: `transition-opacity` + `transition-transform` suave
- A barra de controles deve usar `position: fixed; bottom: 0` com blur de fundo
- Testar que a barra não bloqueia o texto no mobile
- Wake Lock API e Fullscreen API são da issue 033 (behavior) — não implementar aqui

## Plano de Implementação

### Pré-requisitos
- Issue 023 concluída (Next.js configurado)
- Issue 002 concluída (conceito de blocos estabelecido)

### Passos

**1. Criar mock do sermão de apresentação**
Criar `src/lib/mocks/presentation.ts`:
- 4 blocos com texto real em português (introdução, ponto 1, ponto 2, conclusão)
- Cada bloco: `{ id, title, content: string }` (string simples no proto)

**2. Criar PresentationBlock**
Criar `src/components/present/PresentationBlock.tsx`:
- Props: `content: string`, `fontSize: number`
- Texto centralizado, `font-size` dinâmico via style inline, `leading-relaxed`
- `transition-opacity duration-300` para troca suave

**3. Criar PresentationControls**
Criar `src/components/present/PresentationControls.tsx`:
- Props: `onPrev`, `onNext`, `onFontDecrease`, `onFontIncrease`, `onToggleDark`, `isDark`, `onExit`
- `fixed bottom-0 w-full` com `backdrop-blur-md bg-black/30`
- Botões com ícones SVG (sem Lucide — conforme design system)
- Indicador de bloco: `"Contexto 1/4"` via prop `currentLabel`

**4. Criar PresentationMode**
Criar `src/components/present/PresentationMode.tsx`:
- `"use client"` — useState: `currentIndex`, `fontSize` (24/32/42), `isDark`
- Renderiza bloco atual com `<PresentationBlock>`
- Gerencia transição: ao trocar index, brevemente `opacity-0` depois `opacity-100`
- Renderiza `<PresentationControls>` com callbacks

**5. Criar página sem layout de app**
Criar `src/app/(app)/sermons/[id]/present/page.tsx`:
- Importa mock e renderiza `<PresentationMode>`
- Layout: `min-h-screen` com fundo controlado pelo estado do componente
- Não renderiza `<AppSidebar>` nem `<AppHeader>` (página fora do layout padrão, ou com layout próprio)

### Como Verificar
- Acessar `/sermons/qualquer-id/present`: tela cheia sem sidebar, texto grande
- Clicar ▶/◀: texto troca com transição de opacidade
- A-/A+: tamanho do texto muda entre 24/32/42px
- Toggle noturno: fundo escurece e texto clareia
- Clicar X: navega para `/sermons/[id]`
- No mobile (375px): barra de controles acessível sem bloquear conteúdo
