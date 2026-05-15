# VOX — Prompts Google Stitch (Design System + Telas)

> Use estes prompts diretamente no Google Stitch para gerar as telas do VOX.
> Copie o bloco do prompt desejado e cole no campo de geração do Stitch.
> Comece sempre pelo PROMPT 0 (Design System) antes de gerar as telas.

---

## Identidade Visual VOX

**Filosofia:** "Um diário pastoral bem encadernado com a usabilidade de um app moderno."
Não é uma ferramenta de produtividade genérica — é uma ferramenta de ministério.
Deve transmitir confiança, cuidado e foco espiritual sem ser kitsch religioso.

**Dials calibrados:**
- Criatividade: 7/10
- Densidade: 5/10
- Variância: 7/10
- Motion Intent: 5/10

---

## PROMPT 0 — Design System (Gerar Primeiro)

> **Use este prompt para criar o design system base no Stitch antes das telas.**

```
A comprehensive design system for VOX, a PWA for pastors and preachers — a premium pastoral journaling and sermon preparation tool. The visual language should feel like a well-bound leather journal meets modern editorial software. Trustworthy, focused, and ministerial without religious clichés.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Mobile-first progressive web app
- Theme: Light with warm undertones, dark mode in Presentation Mode only
- Background: Parchment Canvas (#F9F7F4) — warm off-white, like quality paper
- Surface: Pure White (#FFFFFF) — cards and containers
- Surface Elevated: Linen (#FEFCF9) — elevated surfaces
- Primary Accent: Forest Deep (#166534) — pastoral green, growth, life
- Primary Hover: Forest Mid (#15803D) — slightly brighter on interaction
- Secondary Accent: Scripture Gold (#B45309) — authority, wisdom, warmth
- Text Primary: Charcoal Ink (#18181B) — Zinc-950, never pure black
- Text Secondary: Slate Prose (#4B5563) — body text, descriptions
- Text Tertiary: Muted Sage (#9CA3AF) — captions, metadata
- Border: Whisper (#E2E8F080) — rgba(226,232,240,0.5)
- Destructive: Deep Rose (#E11D48)
- Success: Emerald (#10B981)
- Font Display: "Fraunces" — for hero headings, sermon titles, editorial moments
- Font UI: "Geist" — for all UI elements, body text, navigation
- Font Mono: "Geist Mono" — timestamps, word counts, metadata
- Roundness: 12px for cards, 8px for inputs/buttons, 4px for badges
- Shadows: Warm diffuse shadows with green undertone, 0 4px 24px rgba(22,101,52,0.06)
- Spacing: 4px base grid, generous whitespace

**COMPONENT LIBRARY:**
1. **Primary Button:** Forest Deep fill (#166534), white text, Geist 500 14px, 8px radius, 44px min-height, scale(0.98) active
2. **Secondary Button:** White fill, Forest Deep border 1.5px, Forest Deep text, same specs
3. **Ghost Button:** Transparent, Slate Prose text, Forest Deep hover state
4. **Sermon Card:** White surface, 12px radius, whisper border, warm shadow, 24px padding — shows: title (Fraunces 600 18px), bible ref (Geist Mono 12px Scripture Gold), framework badge, date, tags row, hover actions (Edit, Present, More)
5. **Framework Badge:** Tiny colored pill per framework — Forest=Expositivo, Teal=Textual, Violet=Narrativo, Amber=Temático, Rose=Tópico, Slate=Livre
6. **Input Field:** White fill, 1.5px Whisper border, 8px radius, 16px Geist body, Forest Deep focus ring 2px offset, label above in Geist 500 12px uppercase tracked
7. **Block Editor:** Left sidebar with block type indicator (Forest Deep left border 3px), full-width textarea area, block title in Geist 500 11px uppercase tracked Steel
8. **Navigation Sidebar:** 240px wide, Linen background, Forest Deep active indicator, Fraunces logo mark
9. **Stats Card:** White surface, large number in Fraunces 700 36px Forest Deep, label in Geist 400 13px Slate

**CONSTRAINTS:**
- No emojis anywhere
- No Inter font — use Geist for UI, Fraunces for editorial/display only
- No pure black (#000000) — use Charcoal Ink (#18181B)
- No AI purple or neon accents
- No 3-equal-card feature grids
- No centered hero sections
- No overlapping text over images
- No fabricated data or metrics
- No cliché religious imagery (crosses, doves, rays of light)
- No "Elevate", "Seamless", "Transform", "Next-Gen" copy
- Responsive: single column below 768px
- Touch targets minimum 44px
```

---

## PROMPT 1 — Landing Page

```
Landing page for VOX, a pastoral sermon preparation PWA for pastors and preachers. The page must feel like a premium publishing tool, not a religious app store product. Think: the craft of Notion meets the gravitas of a leather-bound study Bible. Target: Brazilian evangelical pastors who prepare 40+ sermons per year and currently use Word or paper notebooks.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Light with warm parchment undertones
- Background: Parchment Canvas (#F9F7F4)
- Surface: Pure White (#FFFFFF)
- Primary Accent: Forest Deep (#166534)
- Secondary Accent: Scripture Gold (#B45309)
- Text Primary: Charcoal Ink (#18181B)
- Text Secondary: Slate Prose (#4B5563)
- Text Tertiary: Muted Sage (#9CA3AF)
- Border: Whisper (#E2E8F080)
- Font Display: "Fraunces" — hero headings only, weight 700, optical-size large
- Font UI: "Geist" — all other text
- Font Mono: "Geist Mono" — labels, metadata
- Roundness: 12px cards, 8px buttons
- Shadows: Warm diffuse, rgba(22,101,52,0.06)

**PAGE STRUCTURE:**
1. **Navigation Bar:** Sticky top, white fill with subtle bottom border, Forest Deep "VOX" wordmark in Fraunces 600 left-aligned, navigation links center (Geist 400 14px: Recursos / Frameworks / Preços), "Entrar" ghost button + "Começar grátis" Forest Deep primary button right — 48px height
2. **Hero Section — Asymmetric Split Layout:** Left 55% — large editorial block with Fraunces display headline spanning 3 lines: "Seu ministério, preparado com mais intenção." (clamp 3rem to 4.5rem, Charcoal Ink), subtitle in Geist 400 18px Slate Prose max-width 480px: "VOX é onde sermões nascem. Do texto bíblico à entrega — um ciclo completo para pregadores sérios.", then two CTAs in row: Primary "Começar grátis" + Ghost "Ver como funciona". Right 45% — editorial screenshot of the sermon editor interface floating with warm shadow, no overlap with left text
3. **Social Proof Strip:** Single row, Linen background, Geist Mono 12px, 3 data points with organic numbers: "[N] sermões preparados" / "[N] pregadores ativos" / "[N]min economizados por semana" — use placeholder brackets, NOT fabricated numbers
4. **Feature Showcase — Bento Grid Asymmetric:** Section title in Fraunces 600 32px left-aligned "Feito para quem prega de verdade." — then bento grid: 1 large card (60% width) showing the editor with framework blocks, 2 smaller stacked cards (40%) showing the sermon bank and presentation mode — each card has a 3px Forest Deep top border, white fill, 24px padding
5. **Frameworks Section — Horizontal Scroll Cards:** Section title "6 frameworks homiléticos prontos para usar" + subtitle. Below: horizontal scrollable row of 6 framework cards — each shows framework name in Fraunces 600 20px, colored badge, structure diagram as text flow (arrow connectors), "Usar este framework →" ghost link
6. **Testimonial Section — Single Large Quote:** Dark Parchment background (#F0EDE8), single testimonial taking full width — pastor name + church, large Fraunces italic quotation mark decorative, quote text in Fraunces 400 24px Charcoal Ink italic, attribution in Geist Mono 12px Muted Sage
7. **Presentation Mode Preview:** Full-width dark section (#18181B) showing the teleprompter mode in action — white large text on dark, control bar at bottom — label above in Geist 500 12px uppercase Forest Deep "MODO APRESENTAÇÃO"
8. **Pricing Section:** Clean 2-column layout (Free / Pro) — NOT 3 columns. Simple card with features list, price in Fraunces 700, CTA button
9. **Footer:** Simple 4-column, Linen background, VOX wordmark + tagline, nav links, legal

**CONSTRAINTS:**
- No emojis
- No Inter font
- No pure black
- Hero must be asymmetric split, NOT centered
- No 3-equal-feature-card layout
- No religious clip art or cliché imagery
- No fabricated data — use [placeholder] format
- No "Revolucione", "Transforme", "Eleve" copy
- Responsive: single column below 768px
```

---

## PROMPT 2 — Dashboard

```
Main dashboard for VOX, a pastoral sermon management PWA. The dashboard is the pastor's "ministerial command center" — he checks it multiple times per week to manage his sermon pipeline. Must feel organized and calm, not busy. Think: a well-organized study desk, not a BI dashboard.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web app, Desktop-first with mobile drawer
- Theme: Light, Parchment warmth
- Background: Parchment Canvas (#F9F7F4)
- Surface: Pure White (#FFFFFF)
- Sidebar: Linen (#FEFCF9) with Whisper right border
- Primary Accent: Forest Deep (#166534)
- Secondary Accent: Scripture Gold (#B45309)
- Text Primary: Charcoal Ink (#18181B)
- Text Secondary: Slate Prose (#4B5563)
- Text Tertiary: Muted Sage (#9CA3AF)
- Border: Whisper (#E2E8F080)
- Font Display: "Fraunces" — page titles, large numbers
- Font UI: "Geist" — all UI text
- Font Mono: "Geist Mono" — numbers, dates, metadata
- Roundness: 12px cards, 8px buttons/inputs
- Shadows: Warm diffuse rgba(22,101,52,0.06)

**PAGE STRUCTURE:**
1. **Left Sidebar (240px fixed):** Linen fill, Whisper right border — top: "VOX" wordmark Fraunces 600 18px Forest Deep — navigation items with Forest Deep active left indicator 3px: Dashboard / Sermões / Frameworks / Importar / Configurações — bottom: user avatar + name (Geist 500 14px) + small "Sair" ghost link — no icons, text-only navigation
2. **Top Header:** White fill, title of current section Fraunces 600 24px left, right: "Novo Sermão" Forest Deep primary button
3. **Stats Row (3 cards):** Three equal-width but visually differentiated stat cards — NOT identical generic cards. Card 1 (Forest Deep left border): large number Fraunces 700 48px Forest Deep + label Geist 400 13px Slate Prose "Sermões no arquivo". Card 2 (Scripture Gold left border): last sermon title truncated + date Geist Mono 12px. Card 3 (neutral): current series name if any, or "Nenhuma série" Muted Sage
4. **Recent Sermons Section:** Section header "Sermões recentes" Geist 600 16px + "Ver todos →" Forest Deep link right — then vertical list (NOT grid) of 5 recent sermon rows: each row has forest-green sermon framework badge left, title Geist 500 15px, bible ref Geist Mono 12px Scripture Gold, date right Geist Mono 12px Muted Sage, on hover: row gets Parchment background + quick actions appear (Editar / Apresentar)
5. **Quick Start Panel (right column, 280px):** White card, title "Começar agora" Geist 600 14px, 3 action items with subtle border-top dividers: "Novo sermão" / "Importar sermão" / "Ver frameworks" — each as a clean row with Forest Deep right arrow
6. **Empty State (if no sermons):** Centered illustration (geometric/abstract, NOT religious clip art) + Fraunces 400 20px "Nenhum sermão ainda." + Geist 400 15px Slate Prose subtitle + "Criar primeiro sermão" Forest Deep button

**CONSTRAINTS:**
- No emojis or icons unless essential
- No Inter font
- No pure black
- Sidebar text-only navigation (no icon-only)
- Recent sermons as LIST rows, not grid cards
- No fabricated sermon titles — use [Título do sermão] brackets
- Responsive: sidebar becomes top hamburger drawer on mobile
- Stats cards use left border differentiation, not icon boxes
```

---

## PROMPT 3 — Seleção de Framework (Step 1 do novo sermão)

```
Framework selection screen for VOX sermon editor. This is Step 1 of creating a new sermon — the pastor chooses a homiletic framework that will structure their sermon. The screen must feel like choosing a fine writing instrument, not selecting a template. Premium, considered, editorial.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web app
- Theme: Light, warm
- Background: Parchment Canvas (#F9F7F4)
- Surface: Pure White (#FFFFFF)
- Primary Accent: Forest Deep (#166534)
- Secondary Accent: Scripture Gold (#B45309)
- Text Primary: Charcoal Ink (#18181B)
- Text Secondary: Slate Prose (#4B5563)
- Text Tertiary: Muted Sage (#9CA3AF)
- Font Display: "Fraunces"
- Font UI: "Geist"
- Font Mono: "Geist Mono"
- Roundness: 12px cards, 8px buttons
- Shadows: Warm diffuse

**PAGE STRUCTURE:**
1. **Minimal Header:** Progress breadcrumb "Novo sermão / Escolher framework" Geist Mono 12px Muted Sage, "×" close button right
2. **Step Title:** Fraunces 600 32px "Qual estrutura você vai usar?" + Geist 400 16px Slate Prose subtitle "Cada framework é um caminho diferente para o mesmo destino: uma mensagem que transforma."
3. **Framework Grid (2 columns asymmetric bento):** 6 framework cards in bento layout — NOT 3×2 equal grid. Large card spanning full left column for "Expositivo" (most common), 3 smaller cards right column, then bottom row 2 cards — each card: framework name Fraunces 600 20px, colored badge pill top-right, description Geist 400 13px Slate Prose 2 lines max, structure flow shown as text with thin arrow connectors (e.g., "Contexto → Explicação → Aplicação → Conclusão"), selected state: Forest Deep border 2px + subtle green tint background
4. **Framework Color System:** Expositivo: Forest Deep (#166534) / Temático: Amber (#B45309) / Narrativo: Violet (#7C3AED, muted — NOT neon) / Tópico: Rose (#E11D48, muted) / Textual: Teal (#0F766E) / Livre: Slate (#71717A)
5. **Bottom Action Bar:** Fixed bottom, white fill, whisper top border — left: "← Voltar" ghost, right: "Próximo: Informações →" Forest Deep primary button (disabled until framework selected)

**CONSTRAINTS:**
- No emojis
- No Inter font
- No 3×2 equal grid — use bento asymmetric layout
- No decorative religious symbols
- Framework structure shown as text flow arrows, not icons
- Selected state: border + tint, not heavy background change
- Mobile: single column stack of all 6 cards
```

---

## PROMPT 4 — Editor de Sermão

```
The core sermon editor for VOX — this is where pastors spend most of their time. The editor uses a block-based system where each section (Introduction, Development, Conclusion, etc.) is an individual editable block. Must feel like a focused writing environment — closer to iA Writer than Google Docs. Calm, distraction-free, but with just enough structure to guide the pastor.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web app, 3-column layout: sidebar nav + editor content + metadata panel
- Theme: Light with warm undertones
- Background: Parchment Canvas (#F9F7F4)
- Surface: Pure White (#FFFFFF)
- Editor Background: Pure White (#FFFFFF) — the writing area is clean
- Primary Accent: Forest Deep (#166534)
- Secondary Accent: Scripture Gold (#B45309)
- Text Primary: Charcoal Ink (#18181B)
- Text Secondary: Slate Prose (#4B5563)
- Text Tertiary: Muted Sage (#9CA3AF)
- Font Display: "Fraunces" — sermon title only
- Font UI: "Geist" — navigation, labels, metadata
- Font Editor: "Geist" 17px leading 1.8 — body text of the sermon
- Font Mono: "Geist Mono" — word count, timestamps, block labels
- Roundness: 12px cards, 8px inputs
- Shadows: Minimal in editor — only on floating toolbar

**PAGE STRUCTURE:**
1. **Left Sidebar (240px):** Same as dashboard — collapsed state shows just VOX logo mark
2. **Editor Top Bar:** Left: sermon title inline editable in Fraunces 600 20px (click to edit), framework badge, auto-save status "Salvo às 14:23" Geist Mono 11px Muted Sage — Right: word count Geist Mono 12px + "Apresentar" Forest Deep outline button + "✦ Assistente" Scripture Gold ghost button (AI, subtle)
3. **Editor Toolbar (sticky below top bar):** Minimal floating toolbar — Bold / Italic / Underline / Unordered List / Ordered List / Quote / Bible Verse (📖 replaced by a leaf icon or "Bíblia" text) — all ghost icon buttons, Forest Deep active state
4. **Block Editor Area (main column, 680px max-width centered):** Generous padding 48px sides. Blocks stacked vertically with 24px gap between them. Each block: left border 3px Forest Deep, white surface, 20px rounded corners, 24px padding — block label Geist Mono 11px uppercase Forest Deep tracked "INTRODUÇÃO" — textarea below Geist 17px Charcoal Ink leading 1.8 — placeholder text in Muted Sage italic — drag handle on left (hidden until hover) — on block hover: faint action row appears (minimize / add block below / delete)
5. **Bible Verse Block (special):** Inside editor, scripture citations styled differently — left border 2px Scripture Gold, light gold tint background, verse text in Geist italic Charcoal Ink, reference below Geist Mono 12px Scripture Gold
6. **Right Metadata Panel (280px):** Collapsible — sections with subtle dividers: "Detalhes" (bible reference input, date preached, series selector, status badge), "Tags" (chip input), "Exportar" (PDF / DOCX ghost buttons)
7. **Add Block Button:** Between blocks on hover — "+ Adicionar bloco" Forest Deep ghost button centered, shows block type picker on click

**CONSTRAINTS:**
- No emojis — replace emoji icons with text labels or Lucide-style line icons
- No Inter font
- No heavy shadows in editor — the writing space must be calm
- AI Assistant button should be subtle (Scripture Gold ghost), never dominant
- Drag handles invisible until hover
- Metadata panel collapsible to give full writing width
- Mobile: single column, metadata panel becomes bottom sheet
- Editor line length max 680px, never full-width
```

---

## PROMPT 5 — Banco de Sermões

```
The sermon archive/bank for VOX — the pastor's personal library of all sermons. This is where he searches, filters, and retrieves past sermons. Must feel like a well-organized personal library catalog, not a generic list view. Clean, searchable, professional.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web app
- Theme: Light, warm
- Background: Parchment Canvas (#F9F7F4)
- Surface: Pure White (#FFFFFF)
- Primary Accent: Forest Deep (#166534)
- Secondary Accent: Scripture Gold (#B45309)
- Text Primary: Charcoal Ink (#18181B)
- Text Secondary: Slate Prose (#4B5563)
- Text Tertiary: Muted Sage (#9CA3AF)
- Font Display: "Fraunces"
- Font UI: "Geist"
- Font Mono: "Geist Mono"
- Roundness: 12px cards, 8px inputs
- Shadows: Warm diffuse

**PAGE STRUCTURE:**
1. **Page Header:** "Meus Sermões" Fraunces 600 28px + "[N] sermões" Geist Mono 14px Muted Sage right — "Novo Sermão" Forest Deep button far right
2. **Search + Filters Bar:** Prominent search input full-width Parchment background, 12px radius, Forest Deep focus ring — below in single row: framework filter chips (all / expositivo / temático / narrativo / tópico / textual / livre), status toggle (todos / rascunho / pronto), sort dropdown right
3. **Sermons Grid (2 columns, not 3):** Each sermon card: White surface, 12px radius, warm shadow, 20px padding — top row: framework badge colored pill left + status badge right (rascunho=Amber, pronto=Forest Deep) — title Fraunces 500 18px Charcoal Ink — bible reference Geist Mono 13px Scripture Gold below title — date + series name Geist 12px Muted Sage — tags row (small gray pills) — bottom border-top divider: action row appears on hover: "Editar" / "Apresentar" / "···" (more: Duplicar, Excluir)
4. **Filter Sidebar (collapsed by default, 240px):** Opens from left as overlay panel on "Filtros" click — filter groups: Livro bíblico (select) / Série (select) / Data (date range) / Ordenar por — "Aplicar filtros" Forest Deep button bottom + "Limpar" ghost
5. **Empty State:** When no results — centered, illustrated with a simple geometric book/page SVG (NOT religious) — Fraunces 400 22px "Nenhum sermão encontrado." — Geist 400 14px Slate Prose "Tente outros filtros ou crie um novo sermão." — "Criar sermão" Forest Deep button
6. **Skeleton Loading:** Cards with shimmer animation, same layout as real cards

**CONSTRAINTS:**
- No emojis
- No Inter font
- No 3-column grid — use 2 columns
- Sermon cards: Fraunces for title, Geist Mono for reference/date
- Action buttons hidden until card hover
- Mobile: single column, filters become bottom sheet
- No fabricated sermon titles — use placeholder text in brackets
```

---

## PROMPT 6 — Modo Apresentação (Teleprompter)

```
The presentation/teleprompter mode for VOX — this screen is shown during the actual sermon delivery. The pastor reads from it while preaching. Must be EXTREMELY focused and legible: dark background, large white text, zero distractions, minimal control bar at bottom. Think: a premium autocue system meets an e-reader in night mode. This is the most critical screen to get right.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web app, FULLSCREEN — no sidebar, no header
- Theme: DARK — this is the only dark screen in the entire app
- Background: Deep Charcoal (#0F0F0F) — near-black, NOT pure black
- Block Background: Off-Black (#1A1A1A) — slightly lighter than bg for card separation
- Text Primary: Warm Off-White (#F5F0E8) — warm tone, easier on eyes than pure white
- Text Secondary: Pale Sage (#A8B5A0) — block labels, metadata
- Primary Accent: Forest Light (#4ADE80) — used sparingly for active indicator only
- Scripture Highlight: Scripture Gold (#D4A017) — for bible verse blocks
- Font Presentation: "Fraunces" — the sermon body text in large display size
- Font UI: "Geist" — control bar only
- Font Mono: "Geist Mono" — block indicator, progress
- Roundness: 8px for control bar elements only
- Shadows: None — flat dark surface

**PAGE STRUCTURE:**
1. **Block Indicator (top, minimal):** Very subtle — small text centered top: "Desenvolvimento  2 / 4" in Geist Mono 13px Pale Sage — that's all. Nothing else at top.
2. **Content Area (main, takes 90% of screen):** Large centered content — block title label Geist 500 12px uppercase Pale Sage tracked "DESENVOLVIMENTO" — sermon text below in Fraunces 400 32px (medium), 40px (large), 48px (very large) — warm off-white — line height 1.7 — max-width 800px centered — generous vertical padding 80px — if block has bible verse: verse text in Fraunces italic, left border 2px Scripture Gold, slightly indented
3. **Control Bar (bottom, fixed, always visible):** 72px height, Off-Black fill (#1A1A1A), very subtle top border — content centered: navigation cluster left [◀ ANTERIOR] [▶ PRÓXIMO] in Geist 500 14px Warm Off-White ghost — font size cluster center [A−] [A+] showing current: "32px" Geist Mono 13px — theme toggle right [☾/☀] — then [✕ SAIR] Pale Sage ghost far right — all controls minimum 44px touch target
4. **Progress Bar:** Ultra-thin 2px bar at very top of screen, Forest Light (#4ADE80) fills from 0 to 100% as pastor advances through blocks — very subtle

**CONSTRAINTS:**
- No sidebar, no navigation, NO elements except content + control bar
- No emojis
- Background MUST be #0F0F0F, NOT #000000
- Text MUST be warm off-white (#F5F0E8), NOT pure white
- Font size minimum 32px for sermon body
- Control bar always visible, never auto-hides (pastor needs access while preaching)
- Progress bar 2px maximum — not intrusive
- Mobile: same layout, control bar buttons larger for thumb reach
- This screen must be the most readable screen in the entire app
```

---

## PROMPT 7 — Login e Cadastro

```
Authentication screens for VOX — clean, minimal, premium. The login/register experience should feel like entering a trusted space, not a conversion funnel. Calm, warm, welcoming. Split-screen desktop layout with editorial left panel.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop split + Mobile full-screen
- Theme: Light, warm parchment
- Background Right Panel: Parchment Canvas (#F9F7F4)
- Background Left Panel: Forest Deep (#166534) — rich green editorial panel
- Surface: Pure White (#FFFFFF) — form card
- Primary Accent: Forest Deep (#166534)
- Secondary Accent: Scripture Gold (#B45309)
- Text Primary: Charcoal Ink (#18181B)
- Text Secondary: Slate Prose (#4B5563)
- Left Panel Text: Warm Off-White (#F5F0E8)
- Font Display: "Fraunces" — left panel headline + VOX wordmark
- Font UI: "Geist" — form labels, inputs, buttons
- Roundness: 12px form card, 8px inputs/buttons
- Shadows: Warm diffuse on form card

**LOGIN PAGE STRUCTURE:**
1. **Left Editorial Panel (45% desktop, hidden mobile):** Forest Deep (#166534) background — centered vertically — "VOX" wordmark Fraunces 700 48px Warm Off-White — tagline Fraunces 400 italic 22px "Seu ministério, preparado com intenção." — below: abstract geometric decoration (simple circles or lines in Forest Mid, NOT religious icons) — bottom: small quote Geist 400 14px Pale Sage italic with attribution
2. **Right Form Panel (55% desktop, 100% mobile):** Parchment Canvas background — centered form card White fill, 40px padding, 16px radius, warm shadow — "Entrar no VOX" Fraunces 600 24px Charcoal Ink — Email input (label above, Geist 500 12px uppercase tracked) — Senha input (label + show/hide toggle right inside input) — "Esqueci minha senha" Geist 400 13px Forest Deep link right-aligned — "Entrar" Forest Deep full-width button 48px — divider or spacing — "Ainda não tem conta? Cadastre-se" Geist 400 14px Slate + Forest Deep link — error state: Alert component Deep Rose subtle fill above form
3. **Loading State:** Button shows "Entrando..." + Geist Mono text, disabled state

**REGISTER PAGE STRUCTURE:**
1. Same left panel as login
2. Right form: "Criar sua conta" Fraunces 600 24px — Nome completo input — Email input — Denominação/organização input (optional badge on label) — Senha input with strength indicator (3 segments: red/amber/green) — Confirmar senha — Checkbox "Li e aceito os termos de uso" (Geist 400 13px + Forest Deep link) — "Criar conta" Forest Deep full-width button — "Já tenho conta" link

**CONSTRAINTS:**
- No emojis
- No Inter font
- Left panel MUST be Forest Deep filled, not image/illustration
- No "Bem-vindo de volta!", "Olá!" or any greeting copy — just direct functional labels
- Error messages inline, not browser alerts
- Mobile: single column, left panel becomes compact top banner with VOX wordmark only
- Password strength indicator: segments (NOT bar), 3 states only
```

---

## PROMPT 8 — Configurações

```
Settings page for VOX — profile, preferences, Bible translation default, and the AI module toggle. Clean, organized, no complexity. Think: a well-structured preference panel, not a feature showcase.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web app
- Theme: Light, warm
- Background: Parchment Canvas (#F9F7F4)
- Surface: Pure White (#FFFFFF)
- Primary Accent: Forest Deep (#166534)
- Secondary Accent: Scripture Gold (#B45309)
- Text Primary: Charcoal Ink (#18181B)
- Text Secondary: Slate Prose (#4B5563)
- Text Tertiary: Muted Sage (#9CA3AF)
- Font Display: "Fraunces"
- Font UI: "Geist"
- Font Mono: "Geist Mono"
- Roundness: 12px cards, 8px inputs
- Shadows: Warm diffuse

**PAGE STRUCTURE:**
1. **Page Title:** "Configurações" Fraunces 600 28px
2. **Settings Layout:** Left nav (200px) + Right content (fluid) — left nav: section links "Perfil / Preferências / Bíblia / Assistente IA / Conta" Geist 400 14px with Forest Deep active indicator — content area: one section at a time
3. **Perfil Section:** White card 12px radius — Avatar upload (circular 80px, dashed border Forest Deep on hover, "Alterar foto" label below) — Name input — Email input (disabled, Muted Sage) — Denomination/organization input optional — "Salvar alterações" Forest Deep button bottom
4. **Preferências Section:** White card — "Tema da interface" toggle group: Claro / Escuro / Sistema (3-option pill toggle) — "Idioma" select (PT-BR selected)
5. **Bíblia Section:** White card — "Tradução padrão" explanation Geist 400 13px Slate — Translation options as radio cards (not dropdown): each shows abbreviation bold + full name — ARC / NVI / NVT / NTLH — selected: Forest Deep border + subtle fill
6. **Assistente IA Section:** White card, special treatment — Toggle row: "Assistente de IA" label Geist 600 15px + sublabel Geist 400 13px Slate "Use IA para sugerir estruturas para seus sermões" — toggle switch Forest Deep when on — when OFF: explanation Geist 400 13px Muted Sage "Ative para usar o assistente no editor de sermões." — when ON: success callout Forest Deep subtle tint "Assistente ativo. Acesse pelo editor com o botão Assistente." — Privacy note Geist 400 12px Muted Sage "Seus sermões não são armazenados permanentemente pela IA."
7. **Conta Section:** Danger zone — "Alterar senha" ghost button — thin separator — "Excluir conta" Destructive ghost button — confirmation: requires typing email before confirming

**CONSTRAINTS:**
- No emojis
- No Inter font  
- AI section must be clearly optional and have privacy explanation
- Danger zone (delete account) visually separated with extra whitespace
- No decorative illustrations — purely functional
- Mobile: left nav becomes horizontal tab bar at top
```

---

## PROMPT 9 — Mobile: Dashboard (375px)

```
Mobile version of the VOX dashboard for a 375px viewport. This is what the pastor sees on his phone when checking his sermon bank on the go. Must be perfectly usable with one thumb. Navigation via bottom tab bar.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Mobile web, 375px viewport
- Theme: Light, warm
- Background: Parchment Canvas (#F9F7F4)
- Surface: Pure White (#FFFFFF)
- Primary Accent: Forest Deep (#166534)
- Secondary Accent: Scripture Gold (#B45309)
- Text Primary: Charcoal Ink (#18181B)
- Text Secondary: Slate Prose (#4B5563)
- Font Display: "Fraunces"
- Font UI: "Geist"
- Font Mono: "Geist Mono"
- Roundness: 12px cards, 8px buttons
- Shadows: Warm diffuse

**PAGE STRUCTURE:**
1. **Top Bar:** White fill, sticky — "VOX" wordmark Fraunces 600 18px centered — no hamburger — just wordmark + notification bell ghost right
2. **Content Area:** Single column, 16px side padding
3. **Greeting Row:** "Bom dia, [Nome]" Fraunces 400 22px — "domingo, 14 mai" Geist Mono 12px Muted Sage
4. **Stats Row (horizontal scroll, 2.5 cards visible):** Horizontally scrollable compact stat cards 140px wide each — word count, sermon count, last preached — subtle right fade to hint scrollability
5. **Section Header:** "Sermões recentes" Geist 600 15px + "Ver todos →" Forest Deep small link right
6. **Sermon List (full-width cards):** Each card White fill 12px radius 16px padding: framework badge + title Geist 500 15px + bible ref Geist Mono 12px Scripture Gold + date Geist Mono 11px Muted Sage — tap: navigate to editor
7. **FAB (Floating Action Button):** "+" Forest Deep fill, 56px circle, fixed bottom-right 20px from edge and 80px from bottom
8. **Bottom Tab Bar:** Fixed bottom, white fill, whisper top border — 5 tabs: Início / Sermões / Novo / Importar / Perfil — "Novo" tab special: Forest Deep pill background, white icon, elevated — each tab: icon-free, text-only labels Geist 400 11px

**CONSTRAINTS:**
- No sidebar — bottom tab bar only
- All touch targets minimum 44px
- Font minimum 15px for reading content
- FAB for primary action (new sermon)
- Horizontal scroll for stats only — no other horizontal scroll
- No icons if text fits — use text labels for navigation
- Single column ONLY — no side-by-side elements
```

---

## Ordem de Geração Recomendada no Stitch

Execute nesta sequência para manter consistência:

1. **PROMPT 0** — Design System (gera o sistema de referência)
2. **PROMPT 1** — Landing Page (define a identidade pública)
3. **PROMPT 7** — Login/Cadastro (cria a entrada)
4. **PROMPT 2** — Dashboard (define o painel principal)
5. **PROMPT 3** — Seleção de Framework (Step 1 do editor)
6. **PROMPT 4** — Editor de Sermão (core do produto)
7. **PROMPT 5** — Banco de Sermões (biblioteca)
8. **PROMPT 6** — Modo Apresentação (entrega)
9. **PROMPT 8** — Configurações
10. **PROMPT 9** — Mobile Dashboard

## Após Gerar Cada Tela no Stitch

1. Baixe o HTML e screenshot para `.stitch/designs/`
2. Copie os tokens de cor/tipografia para `docs/references/design-system.md`
3. Use o comando `/edit_screens` para ajustes finos
4. Valide contra o checklist anti-slop abaixo

## Checklist Anti-Slop VOX

Antes de aceitar qualquer tela:
- [ ] Fraunces apenas em títulos e momentos editoriais — Geist no resto
- [ ] Nenhuma fonte Inter
- [ ] Nenhum preto puro (#000000) — sempre Charcoal Ink (#18181B)
- [ ] Apenas 1 cor de acento por contexto (Forest Deep OU Scripture Gold)
- [ ] Nenhuma grid 3×3 de features
- [ ] Hero sempre assimétrico (split ou left-aligned)
- [ ] Nenhum emoji
- [ ] Dados reais entre colchetes [placeholder], nunca inventados
- [ ] Copy sem "Transforme", "Revolucione", "Eleve", "Poderoso"
- [ ] Modo apresentação: fundo #0F0F0F, texto #F5F0E8 (NUNCA puro branco/preto)
- [ ] Responsivo testado em 375px e 1440px
