# VOX, Design System & Brand Book

VOX is a Progressive Web App for pastors and preachers. It is a premium tool for pastoral journaling and sermon preparation. The brand inhabits the intersection between a well-bound leather journal and modern editorial software: trustworthy, focused, and ministerial, without religious clichés.

> **Posture.** VOX is a quiet companion to the pulpit. It honors the craft of preaching by removing friction from the manuscript itself. Nothing about the brand should feel commercial, gamified, evangelical-marketing, or AI-flashy. Imagine the gravitas of a leather-bound journal printed with Garamond, but with the responsiveness of contemporary writing software.

---

## Brand essence

- **Mission.** Help pastors prepare faithful sermons with calm focus and an instrument that respects the work.
- **Audience.** Pastors, preachers, seminarians, lay teachers. Mostly Portuguese-speaking (Brazil) in the current scope; the design system is language-agnostic.
- **Personality.** Ministerial, quiet, editorial, careful, durable. Never breezy, never preachy.
- **Anti-personality.** Not motivational, not "next-gen," not gamified, not modern-religious-startup, not AI-purple.

## Frameworks (the conceptual spine)

Sermon preparation in VOX is organized around six homiletical frameworks. Each framework has its own accent color used in badges, indicators, and outline rails throughout the product.

| Framework  | Color          | Posture                                   |
|------------|----------------|-------------------------------------------|
| Expositivo | Forest Deep    | Verse-by-verse, faithful to the text      |
| Textual    | Teal Sage      | One text, one message                     |
| Narrativo  | Violet Vesper  | Story that preaches                       |
| Temático   | Scripture Gold | A biblical theme, many voices             |
| Tópico     | Deep Rose      | Real life in light of the Word            |
| Livre      | Slate Quiet    | Free form, vigils, devotionals, words    |

The framework colors are a closed set; do not introduce new framework hues.

---

## CONTENT FUNDAMENTALS

### Voice & tone

- **Voice.** A literate pastor speaking to a colleague. Warm but not effusive. Specific. Measured.
- **Tone.** Quiet authority. We never raise our voice. Empty space is more pastoral than another button.
- **Pronouns.** Portuguese: prefer **você** (formal-warm), never **tu**. English: **you**, lowercase.
- **Casing.** Title Case for hero titles and screen names. **Sentence case** for all UI labels, buttons, and form fields ("Novo sermão", not "Novo Sermão").

### Copy patterns

| Do                                   | Don't                                    |
|--------------------------------------|------------------------------------------|
| "Novo sermão"                        | "Criar Novo Sermão Agora"                |
| "salvo há 12 segundos"               | "✓ Saved!"                                |
| "Pronto para começar"                | "You're all set!"                         |
| "Em rascunho · 2 manuscritos"        | "🔥 2 drafts!"                            |
| "Manuscrito"                         | "Doc" / "Document"                        |
| "Bom dia, Pr. Edmundo."              | "Hey Pastor!"                             |

### Specific words & phrases

- **Manuscrito** is preferred over "documento" or "arquivo" when referring to a sermon-in-progress.
- **Bloco** is the unit of writing inside the editor. Each block has a **tipo** (Introdução, Aplicação, etc).
- **Modo Apresentação** (capital M, capital A), the dark on-stage view used live.
- **Framework** is used in Portuguese as a loanword; no italics.
- **Pregar** / **pregado**, the verb of record. Past sermons are "pregados", not "publicados".

### Banned words

`Elevate` · `Seamless` · `Transform` · `Next-gen` · `Unlock` · `Empower` · `Magic` · `AI-powered` (call it what it is)

### Emoji policy

**No emoji. Ever.** Not in UI, not in microcopy, not in error states. Iconography uses stroke-based SVG.

### Bible references

- Use **typographic em-dashes** for verse ranges: `Romanos 5:1,11`, not `Romanos 5:1-11`.
- Versions are abbreviated: ACF (Almeida Corrigida Fiel), ARA, NVI, NAA.
- Reference text is set in **Geist Mono** in Scripture Gold.

---

## VISUAL FOUNDATIONS

### Color philosophy

VOX uses a warm, paper-forward palette. No pure white, no pure black, no AI purple, no neon. The palette is anchored by:

- **Parchment Canvas** as the page background (warm off-white).
- **Forest Deep** as the primary accent, a quiet, pastoral green that connotes growth and life without shouting.
- **Scripture Gold** as the secondary, used sparingly to mark authority (bible references, callouts).

Framework colors live alongside the core palette and only appear as small chromatic anchors (badges, dots, left-rail stripes). Never use a framework color as a flood fill behind body content.

See `colors_and_type.css` for tokens.

### Typography

| Role        | Family               | Use                                                  |
|-------------|----------------------|------------------------------------------------------|
| Display     | **Fraunces**         | Hero headings, sermon titles, editorial moments      |
| UI          | **Geist**            | All UI, body copy, navigation                        |
| Mono        | **Geist Mono**       | Timestamps, word counts, bible refs, metadata        |

Fraunces is set with `font-feature-settings: "ss01", "ss02"` for the editorial alternates. Display sizes use slightly tightened tracking (`letter-spacing: -0.01em` to `-0.015em`). Body copy is set with `text-wrap: pretty` and titles with `text-wrap: balance`.

**Eyebrow labels**, small, uppercase, tracked (`letter-spacing: 0.12em`), are how VOX marks sectional context. They appear above stat cards, sidebar groups, and in the editor outline.

### Spacing & rhythm

- 4px base grid; vertical rhythm is generous.
- Page horizontal padding: 32–48px desktop.
- Card padding: 22–28px.
- Element gaps within cards: 14–18px.
- A meaningful **hairline** is `1px solid var(--whisper)` (a translucent slate). A **strong divider** is `1px dashed var(--whisper-strong)` between micro-sections inside a card.

### Surfaces

Surfaces stack subtly:

1. **Parchment Canvas** (`#F9F7F4`), the page itself.
2. **Linen** (`#FEFCF9`), elevated rails (sidebar, right panels).
3. **Pure White** (`#FFFFFF`), cards.
4. A faint paper grain at the body level (two radial gradients in warm tones, < 3% opacity).

### Shadows

Shadows have a green undertone, they read as "paper resting on wood," not as floating glass.

- **Card resting**, `0 1px 0 rgba(22,101,52,0.04), 0 4px 24px rgba(22,101,52,0.06)`
- **Card hover**, `0 2px 0 rgba(22,101,52,0.05), 0 12px 32px rgba(22,101,52,0.10)`
- **Overlay**, `0 24px 64px rgba(22,40,30,0.16), 0 2px 8px rgba(22,40,30,0.08)`

### Corner radii

- 12px, cards
- 8px, inputs, buttons
- 4px, badges, micro-pills
- Never use fully rounded ("pill") corners except for filter chips and progress bars.

### Borders

- Border weight on inputs and prominent buttons is **1.5px** (not 1px). This is deliberate, it gives form fields the quiet authority of letterpress lines.
- Card borders use the translucent `--whisper` so the edge whispers instead of declaring.

### Hover & press

- Buttons: subtle background shift (Forest Deep → Forest Mid; ghost → forest-soft tint).
- Cards: shadow deepens, border tints toward forest, **no scale**.
- Press: `transform: scale(0.98)` on buttons only.
- Transitions: 100–200ms with `cubic-bezier(.2,.7,.2,1)` for non-pressed motion.

### Animation

Animation is restrained.

- Sidebar collapse/expand: 220ms.
- Hover states: 100–160ms.
- No bounces. No spring overshoot. No marquee. No skeumorphic page turns.
- Presentation Mode timer pulse is a single 1.4s `voxPulse` opacity easing, the only motion in the dark mode.

### Backgrounds & imagery

- The body carries two **very faint** radial gradients (warm gold from the top, forest from the bottom-right) to suggest paper warmth. Never a strong gradient.
- No full-bleed photography in the default product. No background imagery behind body copy.
- No religious clichés: no cross silhouettes, no doves, no rays of light, no stained-glass overlays.

### Layout rules

- The app is a **two-area shell**: sidebar (240px expanded, 64px collapsed) + main.
- The Editor is a **three-column** layout (outline / canvas / refs) that responsively collapses the rails below 1100px viewport.
- Single column below 768px.
- Maximum reading measure in the canvas is 720px.

### Iconography

VOX uses **hand-built stroke-based SVG icons** with the following specs:

- 24×24 viewBox
- 1.6px stroke width
- Round line caps, round line joins
- No filled icons except `circle-fill` used as a dot marker

Icons live as inline SVG inside `<VoxIcon name="…" />` (`vox/primitives.jsx`). The included set covers all current UI needs (search, plus, book, draft, present, calendar, settings, filter, sort, more, edit, play, check, chevron, sidebar, feather, spark, bookmark, type, history). Add new icons to the same file; do not import third-party icon libraries.

No emoji. No unicode ornaments (✦, ✶, ✷). No flag emoji.

### Transparency & blur

Used sparingly: only on hover overlays on cards and the Tweaks panel chrome. Backdrop blur of 6–24px with high saturation maintains the warmth of parchment underneath.

---

## Index

```
README.md                 , this file
colors_and_type.css       , design tokens (colors, type, radii, shadows)
SKILL.md                  , agent skill manifest
assets/                   , logo SVG, mark, brand assets
preview/                  , design system cards (auto-rendered in DS tab)
ui_kits/vox/              , full product UI kit (sermon prep PWA)
VOX.html                  , live demo of the UI kit
vox/                      , source for the demo (data, components, screens)
```

---

## Caveats

- Geist, Geist Mono, and Fraunces are loaded from Google Fonts. If the brand owner wishes to self-host, drop the WOFF2 files into `fonts/` and update `colors_and_type.css`.
- All sermon content in the demo is plausible placeholder material in Brazilian Portuguese. Real sermon titles, references, and outlines should be provided by the brand owner before ship.
- The framework taxonomy (Expositivo, Textual, Narrativo, Temático, Tópico, Livre) is a working draft. If the editorial team adopts a different homiletical taxonomy, update the framework colors and the templates in `vox/data.js`.
