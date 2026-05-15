# VOX — Design System

> **Fonte da verdade:** `design-system/colors_and_type.css` — importe este arquivo como
> o PRIMEIRO stylesheet em qualquer novo componente ou artifact.
>
> **Brandbook completo:** `design-system/BRANDBOOK.md`
> **Demo ao vivo:** `design-system/VOX.html` (abrir no browser)
> **Componentes React:** `design-system/vox/primitives.jsx`

---

## Essência da Marca

**Postura:** VOX é um companheiro silencioso do púlpito. Honra o ofício da pregação
removendo fricção do manuscrito. Nada na marca deve parecer comercial, gamificado,
marketing evangélico, ou AI-flashy.

**Referência visual:** A gravidade de um diário de couro impresso em Garamond —
com a responsividade de um software de escrita contemporâneo.

**Personalidade:** Ministerial, quieto, editorial, cuidadoso, durável.
**Anti-personalidade:** Não motivacional, não "next-gen", não gamificado, não AI-purple.

---

## Arquivo de Design System

```
design-system/
├── BRANDBOOK.md              ← brandbook completo (voz, superfícies, filosofia)
├── colors_and_type.css       ← TODOS os tokens CSS (importar primeiro)
├── VOX.html                  ← demo ao vivo das 4 telas principais
├── assets/
│   ├── vox-logo.svg          ← logo light (fundo claro)
│   ├── vox-logo-dark.svg     ← logo dark (fundo escuro / Modo Apresentação)
│   └── vox-mark.svg          ← símbolo isolado
├── preview/                  ← cartões HTML do design system (abrir individualmente)
│   ├── colors-*.html
│   ├── type-*.html
│   ├── spacing-*.html
│   └── components-*.html
└── vox/                      ← source da UI kit (componentes React)
    ├── styles.css            ← globals + primitivas CSS
    ├── primitives.jsx        ← VoxIcon, VoxMark, FrameworkBadge, Status, Kbd
    ├── sidebar.jsx           ← AppSidebar
    ├── data.js               ← FRAMEWORKS, BLOCK_TYPES, SERMONS mock data
    ├── app.jsx               ← Dashboard screen
    ├── editor.jsx            ← Editor screen
    ├── library.jsx           ← Sermon bank screen
    ├── new-sermon.jsx        ← Framework picker screen
    └── presentation.jsx      ← Presentation mode screen
```

---

## Paleta de Cores

### Superfícies (do mais claro ao mais escuro)

| Token CSS | Hex | Nome | Uso |
|-----------|-----|------|-----|
| `--vox-bg` | `#F9F7F4` | Parchment Canvas | Background da página |
| `--vox-surface` | `#FFFFFF` | Pure White | Cards |
| `--vox-surface-elev` | `#FEFCF9` | Linen | Sidebars, rails |
| `--vox-surface-deep` | `#F4F1EC` | Deep Parchment | Um tom abaixo do bg |
| `--vox-stage-bg` | `#0B0F0D` | Stage Dark | Modo Apresentação |

### Ink (texto)

| Token CSS | Hex | Nome | Uso |
|-----------|-----|------|-----|
| `--vox-ink` | `#18181B` | Charcoal | Texto primário. NUNCA preto puro. |
| `--vox-prose` | `#4B5563` | Slate Prose | Body, descrições |
| `--vox-muted` | `#9CA3AF` | Muted Sage | Captions, metadata |
| `--vox-whisper` | `rgba(226,232,240,0.7)` | — | Bordas hairline |
| `--vox-whisper-strong` | `rgba(180,188,200,0.65)` | — | Bordas fortes, divisores |

### Acentos Primários

| Token CSS | Hex | Nome | Uso |
|-----------|-----|------|-----|
| `--vox-forest` | `#166534` | Forest Deep | Botões, active state, acento principal |
| `--vox-forest-mid` | `#15803D` | Forest Mid | Hover |
| `--vox-forest-soft` | `rgba(22,101,52,0.08)` | — | Tint de hover em ghost |
| `--vox-forest-tint` | `rgba(22,101,52,0.14)` | — | Seleção de texto |

### Acento Secundário

| Token CSS | Hex | Nome | Uso |
|-----------|-----|------|-----|
| `--vox-gold` | `#B45309` | Scripture Gold | Referências bíblicas, autoridade |
| `--vox-gold-soft` | `rgba(180,83,9,0.10)` | — | Tint do gold |

### Cores de Framework (conjunto fechado — não adicionar novas)

| Framework | Token CSS | Hex | Uso |
|-----------|-----------|-----|-----|
| Expositivo | `--vox-fw-expositivo` | `#166534` | Forest Deep |
| Textual | `--vox-fw-textual` | `#0D7C7C` | Teal Sage |
| Narrativo | `--vox-fw-narrativo` | `#6D28D9` | Violet Vesper |
| Temático | `--vox-fw-tematico` | `#B45309` | Scripture Gold |
| Tópico | `--vox-fw-topico` | `#BE123C` | Deep Rose |
| Livre | `--vox-fw-livre` | `#475569` | Slate Quiet |

> As cores de framework só aparecem como ancoragens cromáticas pequenas (badges, dots,
> faixas na rail esquerda). **Nunca** use como flood fill atrás de conteúdo.

### Estado

| Token CSS | Hex | Uso |
|-----------|-----|-----|
| `--vox-destructive` | `#E11D48` | Deep Rose — erro, deletar |
| `--vox-success` | `#10B981` | Emerald — confirmação |
| `--vox-info` | `#0D7C7C` | Teal — informação |

---

## Tipografia

### Famílias

| Role | Token | Família | Uso |
|------|-------|---------|-----|
| Display | `--vox-font-display` | **Fraunces** | Headings editoriais, títulos de sermão, momentos de destaque |
| UI | `--vox-font-ui` | **Geist** | Toda UI, body copy, navegação |
| Mono | `--vox-font-mono` | **Geist Mono** | Timestamps, word count, referências bíblicas, metadata |

> Fraunces usa `font-feature-settings: "ss01", "ss02"` para os alternates editoriais.
> Tamanhos display com `letter-spacing: -0.01em` a `-0.015em`.

### Escala de Tipo

| Token | Tamanho | Uso |
|-------|---------|-----|
| `--vox-text-xs` | 11px | Meta, timestamps mono |
| `--vox-text-sm` | 12.5px | Body secundário, chips |
| `--vox-text-base` | 14px | UI body padrão |
| `--vox-text-md` | 15px | Body proeminente, parágrafo intro |
| `--vox-text-lg` | 17px | Título grande de input, scripture body |
| `--vox-text-xl` | 19px | Título de card, editor body em Fraunces |
| `--vox-text-2xl` | 22px | Título up-next |
| `--vox-text-3xl` | 26px | Título de step |
| `--vox-text-4xl` | 32px | Dashboard hero |
| `--vox-text-5xl` | 36px | Números de stat, stage block |

### Classes Semânticas (de `colors_and_type.css`)

```css
.vox-h1        /* Fraunces 600, 32px, -0.015em tracking */
.vox-h2        /* Fraunces 600, 26px, -0.01em tracking */
.vox-h3        /* Fraunces 600, 19px */
.vox-body      /* Geist 400, 15px, leading 1.55, Slate Prose */
.vox-eyebrow   /* Geist 500, 11px, 0.12em tracking, uppercase */
.vox-mono      /* Geist Mono, tnum feature */
.vox-scripture /* Fraunces italic, 17px, leading 1.7 */
.vox-ref       /* Geist Mono, Scripture Gold, 12.5px */
```

---

## Espaçamento (grid de 4px)

| Token | Valor |
|-------|-------|
| `--vox-space-1` | 4px |
| `--vox-space-2` | 8px |
| `--vox-space-3` | 12px |
| `--vox-space-4` | 16px |
| `--vox-space-5` | 20px |
| `--vox-space-6` | 24px |
| `--vox-space-7` | 28px |
| `--vox-space-8` | 32px |
| `--vox-space-10` | 40px |
| `--vox-space-12` | 48px |
| `--vox-space-16` | 64px |

**Padding de página:** 32–48px desktop.
**Padding de card:** 22–28px.
**Gap entre elementos dentro de card:** 14–18px.

---

## Bordas e Raios

| Token | Valor | Uso |
|-------|-------|-----|
| `--vox-r-badge` | 4px | Badges, micro-pills |
| `--vox-r-input` | 8px | Inputs, botões |
| `--vox-r-card` | 12px | Cards |
| `--vox-r-pill` | 999px | Filter chips, progress bars |

**Peso de borda:** 1.5px (não 1px) em inputs e botões proeminentes — dá autoridade de letterpress.
**Borda de card:** `1px solid var(--vox-whisper)` — whisper, não declaração.

---

## Sombras

Todas têm undertone verde — leia como "papel sobre madeira", não vidro flutuante.

| Token | Valor | Uso |
|-------|-------|-----|
| `--vox-shadow-card` | `0 1px 0 rgba(22,101,52,0.04), 0 4px 24px rgba(22,101,52,0.06)` | Card em repouso |
| `--vox-shadow-card-hover` | `0 2px 0 rgba(22,101,52,0.05), 0 12px 32px rgba(22,101,52,0.10)` | Card com hover |
| `--vox-shadow-overlay` | `0 24px 64px rgba(22,40,30,0.16), 0 2px 8px rgba(22,40,30,0.08)` | Modais, overlays |

---

## Componentes Primitivos

> **Fonte:** `design-system/vox/primitives.jsx`
> Sempre reutilize estes componentes. Não importe bibliotecas de ícones externas.

### `<VoxIcon name="..." />`

Ícones SVG stroke-based (24×24, 1.6px stroke, round caps). Nomes disponíveis:

`search` · `plus` · `book` · `draft` · `present` · `collection` · `calendar` · `settings` · `filter` · `sort` · `more` · `edit` · `play` · `check` · `arrow-right` · `arrow-left` · `chevron-down` · `chevron-right` · `x` · `sidebar` · `feather` · `circle` · `circle-fill` · `spark` · `bookmark` · `type` · `history`

> Adicione novos ícones ao mesmo arquivo. Nunca importe Lucide ou Hero Icons.

### `<VoxMark size={22} color="var(--ink)" />`

Wordmark "VOX" em Fraunces 600 com dot verde Forest Deep.

### `<FrameworkBadge framework="expositivo" size="md" />`

Badge colorido por framework. `size`: `"sm"` | `"md"`.

### `<Status status="drafting" />`

Badge de status. Valores: `"published"` (Pregado) | `"drafting"` (Em rascunho) | `"draft"` (Esboço).

### `<Kbd>⌘K</Kbd>`

Hint de atalho de teclado.

---

## Classes CSS Primitivas (de `design-system/vox/styles.css`)

```css
/* Botões */
.btn            /* base */
.btn-primary    /* Forest Deep fill */
.btn-secondary  /* outline Forest Deep */
.btn-ghost      /* transparente */
.btn-sm         /* 32px height */
.btn-lg         /* 48px height */
.btn-icon       /* 36px quadrado */

/* Tipografia */
.display        /* Fraunces, ss01/ss02 */
.mono           /* Geist Mono, tnum */
.eyebrow        /* 11px, 0.12em tracking, uppercase */
.eyebrow-tight  /* 10.5px, 0.14em */

/* Estrutura */
.card           /* White + whisper border + shadow-card */
.card-hover     /* shadow-card-hover + border-forest on hover */
.badge          /* forest-soft bg, forest text */
.input          /* White + 1.5px border + forest focus ring */
```

---

## Frameworks Homiléticos — Dados Completos

> **Fonte:** `design-system/vox/data.js` → `VOX_DATA.FRAMEWORKS`

| Framework | Tagline | Outline dos Blocos |
|-----------|---------|-------------------|
| **Expositivo** | Verso a verso, fiel ao texto | Texto Bíblico → Contexto → Ponto Principal → Subponto → Aplicação → Conclusão → Oração |
| **Textual** | Um texto, uma mensagem | Texto Bíblico → Introdução → Ponto Principal → Subponto → Subponto → Aplicação → Conclusão |
| **Narrativo** | História que prega | Texto Bíblico → Cenário → Tensão → Reviravolta → Ilustração → Aplicação → Conclusão |
| **Temático** | Tema bíblico, múltiplas vozes | Introdução → Texto Bíblico → Texto Bíblico → Ponto Principal → Pergunta retórica → Aplicação → Conclusão |
| **Tópico** | Vida real à luz da Palavra | Introdução → Pergunta retórica → Texto Bíblico → Ponto Principal → Ilustração → Aplicação → Conclusão |
| **Livre** | Estrutura aberta | Notas pessoais |

---

## Tipos de Bloco do Editor — Cores e Hints

> **Fonte:** `design-system/vox/data.js` → `VOX_DATA.BLOCK_TYPES`

| Tipo | Cor de acento | Hint para o usuário |
|------|---------------|---------------------|
| Texto Bíblico | Scripture Gold | Cole ou digite a passagem |
| Introdução | Forest Deep | Como o sermão começa |
| Contexto | Slate | Histórico, autor, audiência original |
| Ponto Principal | Forest Deep | A ideia central desta seção |
| Subponto | Forest Mid | Desdobramento do ponto principal |
| Ilustração | Gold | História/analogia que ilumina a verdade |
| Aplicação | Teal | O que esta verdade pede da congregação |
| Citação | Gold | Quote com atribuição |
| Pergunta retórica | Violet | Suspende o ouvinte, sem resposta imediata |
| Conclusão | Ink | Recapitulação e chamado |
| Oração | Slate | Encerramento ou comissionamento |
| Notas pessoais | Muted | Apenas para o pregador (invisível no Modo Apresentação) |

---

## Voz e Tom

| Faça | Não faça |
|------|----------|
| "Novo sermão" | "Criar Novo Sermão Agora" |
| "salvo há 12 segundos" | "✓ Saved!" |
| "Pronto para começar" | "You're all set!" |
| "Em rascunho · 2 manuscritos" | "🔥 2 drafts!" |
| "Manuscrito" | "Doc" / "Document" |

**Casing:** Title Case para títulos de tela. **Sentence case** para todos os labels, botões e campos.
**Pronomes:** `você` (formal-warm). Nunca `tu`.
**Referências bíblicas:** Em-dash para intervalos: `Romanos 5:1—11`. Nunca hífen simples.
**Abreviações de versões:** ACF, ARA, NVI, NAA.

**Palavras banidas:** `Elevate` · `Seamless` · `Transform` · `Next-gen` · `Unlock` · `Empower` · `Magic` · `AI-powered`

**Emoji:** Proibido em qualquer parte da UI.

---

## Regras Inegociáveis do Design

1. **Nunca preto puro** (`#000000`) — sempre `--vox-ink` (`#18181B`)
2. **Nunca branco puro como background** — sempre `--vox-bg` (`#F9F7F4`)
3. **Nunca AI-purple/violeta neon** — violet só como `--vox-fw-narrativo` (`#6D28D9`) em badges
4. **Nunca emoji** — iconografia stroke SVG apenas
5. **Nunca imagens religiosas clichê** — sem cruzes, pombas, raios de luz
6. **Nunca 3 cards iguais em linha** — usar bento grid assimétrico
7. **Nunca hero centralizado** — split-screen ou left-aligned
8. **Nunca Inter** — Fraunces (display) ou Geist (UI)
9. **Máximo 1 cor de acento por contexto** — Forest Deep OU Gold
10. **Sombras com undertone verde** — nunca sombras cinzas frias ou glass

---

## Importação no Projeto Next.js

### `src/app/globals.css`
```css
/* 1. Importar tokens do design system */
@import '../../../design-system/colors_and_type.css';
/* OU copiar o conteúdo de colors_and_type.css para cá */

/* 2. Definir CSS variables do shadcn/ui mapeadas para os tokens VOX */
@layer base {
  :root {
    --background:   var(--vox-bg);
    --foreground:   var(--vox-ink);
    --card:         var(--vox-surface);
    --primary:      var(--vox-forest);
    --primary-foreground: #ffffff;
    --muted:        var(--vox-surface-deep);
    --muted-foreground: var(--vox-muted);
    --border:       var(--vox-whisper);
    --ring:         var(--vox-forest);
    --radius:       var(--vox-r-card);
    --destructive:  var(--vox-destructive);
  }
}

/* 3. Background com grain de papel (muito sutil) */
body {
  background-image:
    radial-gradient(ellipse at top, rgba(180,140,60,0.025), transparent 60%),
    radial-gradient(ellipse at bottom right, rgba(22,101,52,0.018), transparent 55%);
}
```

### `next.config.ts` — fontes
```typescript
// src/app/layout.tsx
import { Fraunces, Geist, Geist_Mono } from 'next/font/google'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--vox-font-display',
  display: 'swap',
  axes: ['opsz'],  // optical size axis
})

const geist = Geist({
  subsets: ['latin'],
  variable: '--vox-font-ui',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--vox-font-mono',
  display: 'swap',
})
```

---

## Status

- [x] Tokens de cor definidos (`colors_and_type.css`)
- [x] Tipografia definida (Fraunces + Geist + Geist Mono)
- [x] Componentes primitivos implementados (`vox/primitives.jsx`)
- [x] Brandbook completo (`design-system/BRANDBOOK.md`)
- [x] Demo ao vivo das 4 telas principais (`design-system/VOX.html`)
- [x] Dados dos frameworks e blocos definidos (`vox/data.js`)
- [ ] Tokens importados no `globals.css` do Next.js (issue 023)
- [ ] Fontes configuradas via `next/font` (issue 023)
- [ ] shadcn/ui mapeado para tokens VOX (issue 023)
