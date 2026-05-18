---
name: vox-design
description: Use this skill to generate well-branded interfaces and assets for VOX, a pastoral journaling and sermon preparation PWA. VOX's voice is quiet, editorial, and ministerial, leather-journal-meets-modern-editorial-software. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

# VOX Design Skill

VOX is a Progressive Web App for pastors and preachers, a premium tool for pastoral journaling and sermon preparation. The brand sits at the intersection of a well-bound leather journal and modern editorial software.

## Before designing anything

1. **Read `README.md`** at the root for the full brand book, voice, surfaces, shadow philosophy, framework taxonomy.
2. **Import `colors_and_type.css`** in any new artifact. It defines every token. Never invent colors or type sizes outside it.
3. **Avoid the banned list:** no emoji, no pure black, no AI purple, no neon, no religious clichés (crosses, doves, rays), no marketing words ("Elevate / Seamless / Transform / Next-gen / Unlock / Magic / AI-powered").

## Key facts to honor

| Aspect           | Rule                                                             |
|------------------|------------------------------------------------------------------|
| Page background  | Parchment Canvas `#F9F7F4`, warm off-white, never gray          |
| Primary accent   | Forest Deep `#166534`, pastoral green                           |
| Secondary accent | Scripture Gold `#B45309`, bible refs only, never flood fill     |
| Display type     | Fraunces 400–700, `ss01` alternates, tight tracking              |
| UI type          | Geist                                                            |
| Mono type        | Geist Mono, bible refs, timestamps, counters                    |
| Card radius      | 12px                                                             |
| Input/button     | 8px radius, 1.5px borders, min 40px tall (44 for touch)          |
| Shadows          | Warm with forest undertone (`rgba(22,101,52,…)`), not glassy     |
| Voice            | Sentence case. Você (formal-warm). Quiet. Specific.              |
| Frameworks       | Six homiletical types each with a closed-set accent color        |

## Where things live

```
README.md                 , brand book + content fundamentals
colors_and_type.css       , drop-in design tokens
assets/                   , logo SVGs (light, dark, mark)
preview/                  , design system cards rendered in the DS tab
ui_kits/vox/README.md     , UI kit manifest
VOX.html                  , live four-screen prototype
vox/                      , source code for the prototype
```

## When the user invokes this skill

If the user invokes this skill without other guidance, ask them what they want to build (a new pastoral feature mock? a marketing page? a deck for elders? a settings screen?). Then ask 4–10 questions per the design process before producing visuals.

Always lift real components from `vox/primitives.jsx`, `vox/sidebar.jsx`, etc. before writing new ones. The icon set is in `vox/primitives.jsx`, extend it rather than importing a third-party icon library.

When producing static artifacts (mocks, slides, throwaway prototypes), copy the asset files into the new project rather than referencing them. When producing production code, read the rules here to act as an expert designer for the VOX brand.
