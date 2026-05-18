# Issue 039, Modo Apresentação de Slides: Behavior

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /sermons/[id]/present (tipo apresentação)
**Depende de:** 038, 033
**Prioridade:** P1

---

## O Que Fazer

Implementar o `PresentModeSlides`, tela de apresentação para sermões do tipo `'apresentação'`.
Layout split-screen: slide em tela cheia à esquerda + painel de comentários do apresentador à direita.

## Componentes Envolvidos

- `src/app/(app)/sermons/[id]/present/page.tsx`, bifurca por `sermon.type`
- `src/components/present/PresentModeSlides.tsx`, novo componente
- `src/components/present/PresentModeEsboco.tsx`, existente (tipo esboço, inalterado)

## Comportamentos

### Bifurcação por tipo
```typescript
// page.tsx
if (sermon.type === 'apresentação') {
  return <PresentModeSlides sermon={sermon} slides={slides} />
}
return <PresentModeEsboco sermon={sermon} blocks={sermon.content} />
```

### Layout PresentModeSlides

**Modo normal (split-screen)**
```
┌──────────────────────────────┬─────────────────────┐
│                              │  Slide 3 de 12      │
│    [SLIDE ATUAL, 16:9]      │                     │
│                              │  Comentários:       │
│                              │  ─────────────      │
│                              │  Texto do           │
│                              │  apresentador aqui  │
│                              │  em fonte grande    │
│                              │  e legível          │
│                              │                     │
│                              │  [← Ant]  [Próx →] │
└──────────────────────────────┴─────────────────────┘
```

- Background: `--vox-stage-bg` (`#0B0F0D`), modo escuro total
- Painel esquerdo: slide 16:9 centralizado, máx largura `calc(100vw - 420px)`
- Painel direito (400px fixo): comentários do apresentador
  - Fonte: Fraunces 600, tamanho configurável (28–48px)
  - Cor: `--vox-parchment` claro, alta legibilidade
  - Scroll automático se comentário for longo

**Fonte do slide**
- `slides_source = 'upload'` → `<img src={slide.image_url} />` (WebP do Storage)
- `slides_source = 'google_slides'` → `<iframe>` do Google Slides embed com slide ativo
  - URL: `{slides_url}/embed?slide={slideNumber}`

### Navegação
- **Teclado:** `ArrowRight` / `Space` avança, `ArrowLeft` volta, `Escape` sai
- **Touch:** swipe horizontal (direita avança, esquerda volta)
- **Botões:** "← Anterior" e "Próximo →" no painel direito
- Slide counter: "3 / 12" Geist Mono, atualiza em tempo real

### Slide sem comentário
- Exibe placeholder: "Sem notas para este slide", Muted, centralizado
- Não exibe erro, apenas ausência elegante

### Modo Tela Cheia (slide only)
- Botão de toggle no canto: alterna entre split-screen e slide fullscreen
- No fullscreen: `<img>` ocupa 100vw × 100vh (object-fit: contain)
- Painel de comentários some (voltando com movimento de mouse ou tecla `C`)

### Barra de controle inferior (apareça no hover)
```
[← Ant]  [Slide 3/12]  [Próx →]   |   [⊡ Tela cheia]  [Aa Fonte +/-]  [✕ Sair]
```
- Fundo semitransparente dark, fade-in no hover
- "Sair" redireciona para `/sermons/{id}`

### Pré-carregamento de slides
- Ao entrar no modo apresentação, pré-carrega as imagens dos próximos 2 slides
- `<link rel="preload" as="image" href={nextSlide.image_url} />`
- Evita flash durante navegação

## Critério de Aceite

- [ ] `/sermons/[id]/present` bifurca corretamente por `sermon.type`
- [ ] Split-screen: imagem do slide esquerda + comentário direita
- [ ] Google Slides exibe via iframe com slide ativo
- [ ] Navegação por teclado funcional (← → Space Escape)
- [ ] Slide counter atualizado em tempo real
- [ ] Slides sem comentário exibem placeholder
- [ ] Toggle fullscreen (slide only)
- [ ] Barra de controle aparece/some no hover
- [ ] Pré-carregamento dos próximos 2 slides
- [ ] Touch/swipe funcional em mobile/tablet
- [ ] Background `--vox-stage-bg` em toda a tela

## Notas de Implementação

```typescript
// src/components/present/PresentModeSlides.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'

interface PresentModeSlidesProps {
  sermon: Sermon
  slides: Slide[]
}

export function PresentModeSlides({ sermon, slides }: PresentModeSlidesProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(32) // px

  const currentSlide = slides[currentIndex]
  const totalSlides = slides.length

  const goNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, totalSlides - 1))
  }, [totalSlides])

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => Math.max(prev - 1, 0))
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'Escape') window.location.href = `/sermons/${sermon.id}`
      if (e.key === 'f' || e.key === 'F') setIsFullscreen(prev => !prev)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, sermon.id])

  // Google Slides embed URL
  function getGoogleEmbedUrl(slidesUrl: string, slideIndex: number): string {
    const baseUrl = slidesUrl.replace(/\/edit.*$/, '')
    return `${baseUrl}/embed?slide=id.p${slideIndex + 1}`
  }

  return (
    <div className="fixed inset-0" style={{ background: 'var(--vox-stage-bg)' }}>
      {/* Split-screen layout */}
      {/* ... */}
    </div>
  )
}
```

### Google Slides Iframe
```tsx
<iframe
  src={getGoogleEmbedUrl(sermon.slides_url!, currentIndex)}
  className="w-full h-full border-0"
  allow="autoplay"
  title={`Slide ${currentIndex + 1}`}
/>
```

### Preload
```tsx
{slides[currentIndex + 1] && (
  <link rel="preload" as="image" href={slides[currentIndex + 1].image_url!} />
)}
{slides[currentIndex + 2] && (
  <link rel="preload" as="image" href={slides[currentIndex + 2].image_url!} />
)}
```

## Plano de Implementação

### Pré-requisitos
- Issue 038 concluída (slides no Supabase com `image_url`)
- Issue 033 concluída (modo apresentação básico, `PresentModeEsboco` existe)

### Passos

**1. Bifurcar /sermons/[id]/present por type**
Editar `src/app/(app)/sermons/[id]/present/page.tsx` (Server Component):
- Buscar `sermon` + `slides` do Supabase (server-side)
- `if (sermon.type === 'apresentação') return <PresentModeSlides sermon={sermon} slides={slides} />`
- `else return <PresentModeEsboco sermon={sermon} blocks={sermon.content} />`

**2. Criar PresentModeSlides**
Criar `src/components/present/PresentModeSlides.tsx` (`"use client"`):
- Estado: `currentIndex`, `isFullscreen`, `fontSize`
- Layout: `fixed inset-0 flex` com background `--vox-stage-bg`
- Painel esquerdo `flex-1`: `<img>` ou `<iframe>` do slide atual (lógica por `slides_source`)
- Painel direito `w-[400px]`: counter, comentário (placeholder "Sem notas"), botões nav
- `useEffect` para keyboard events (← → Space Escape F)
- Preload: `<link rel="preload">` para próximos 2 slides

**3. Controle de fonte ajustável**
- `fontSize` em state (padrão 32px), range 28–48
- Botões Aa+/Aa- no painel direito: `setFontSize(prev => Math.min/max(...))`
- Aplicar via `style={{fontSize}}` no texto do comentário

**4. Barra de controle inferior (hover)**
- `<div>` fixo na base, `opacity-0 hover:opacity-100 transition-opacity`
- Botões: Anterior, "Slide N/M", Próximo, toggle fullscreen, Aa, Sair
- Sair: `router.push(\`/sermons/\${sermon.id}\`)`

**5. Toggle fullscreen e touch**
- Fullscreen: `<img>` expande para `fixed inset-0 object-contain`; painel direito some
- Touch: `onTouchStart`/`onTouchEnd` para detectar swipe horizontal (delta > 50px)

### Como Verificar
- `/sermons/{id}/present` com tipo "apresentação": exibe PresentModeSlides (não teleprompter)
- `/sermons/{id}/present` com tipo "esboço": exibe PresentModeEsboco inalterado
- Teclado: ← → avançam slides; Escape volta para editor
- Slide sem comentário: placeholder "Sem notas" exibido sem erro
- Preload: Network tab mostra próximas imagens sendo carregadas preventivamente
