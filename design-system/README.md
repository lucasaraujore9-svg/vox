# VOX, Design System

> **Para desenvolvedores:** Leia `../docs/references/design-system.md` antes de usar estes arquivos.
> Este diretório é a fonte da verdade visual do VOX.

## Como usar

### 1. Ver a demo ao vivo
Abra `VOX.html` no browser. Contém as 4 telas principais:
Dashboard, Editor, Banco de Sermões e Modo Apresentação.

### 2. Tokens CSS
Importe `colors_and_type.css` como **primeiro stylesheet** em qualquer novo arquivo.
Nunca invente cores ou tamanhos de tipo fora deste arquivo.

### 3. Componentes de referência
- `vox/primitives.jsx`, VoxIcon, VoxMark, FrameworkBadge, Status, Kbd
- `vox/styles.css`, classes CSS primitivas (.btn, .card, .input, .badge)
- `vox/data.js`, dados dos frameworks, block types e sermões mock

### 4. Preview do design system
Abra os arquivos em `preview/` individualmente no browser para ver cada seção:
- `colors-*.html`, paletas
- `type-*.html`, escala tipográfica
- `spacing-*.html`, espaçamento, raios, sombras
- `components-*.html`, componentes individuais

## Arquivos

```
colors_and_type.css    ← IMPORTAR PRIMEIRO em qualquer stylesheet
BRANDBOOK.md           ← brandbook completo (voz, tom, filosofia)
VOX.html               ← demo ao vivo das 4 telas
SKILL.md               ← manifest da skill de design
assets/
  vox-logo.svg         ← logo light
  vox-logo-dark.svg    ← logo dark (Modo Apresentação)
  vox-mark.svg         ← símbolo isolado
preview/               ← cards HTML do design system
vox/                   ← source da UI kit
  styles.css           ← globals e primitivas CSS
  primitives.jsx       ← componentes React reutilizáveis
  data.js              ← frameworks, blocos, sermões mock
  app.jsx              ← tela Dashboard
  editor.jsx           ← tela Editor
  library.jsx          ← tela Banco de Sermões
  new-sermon.jsx       ← tela Seleção de Framework
  presentation.jsx     ← tela Modo Apresentação
  sidebar.jsx          ← AppSidebar
  tweaks-panel.jsx     ← painel de ajustes
```
