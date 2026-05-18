# Issue 043, Modo Apresentador: Behavior (Duas Janelas)

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /sermons/[id]/present?mode=presenter
**Depende de:** 011, 039
**Prioridade:** P1

---

## O Que Fazer

Implementar o Modo Apresentador funcional: abertura de janela de projeção fullscreen
sincronizada com o painel de controle via `BroadcastChannel`, com comentários de slides
renderizados como blocos visuais coloridos.

## Comportamentos

### Seleção de modo de apresentação
Ao clicar "Apresentar" em um conteúdo do tipo apresentação:
- Modal (ou tela) oferece duas opções:
  - "Modo Simples" → slide fullscreen, sem painel (issue 039)
  - "Modo Apresentador" → duas janelas: slide + painel de controle

### Abertura das duas janelas
Ao escolher Modo Apresentador:
1. Janela atual navega para `/sermons/[id]/present?mode=presenter` (painel de controle)
2. Sistema tenta abrir popup: `window.open('/sermons/[id]/present?mode=projector', 'vox-projector', 'fullscreen=yes')`
3. Se popup bloqueado (browser bloqueou): exibe instrução ao usuário + botão "Tentar novamente"
4. Janela de projeção exibe apenas o slide atual, sem UI
5. Sincronização via `BroadcastChannel('vox-presenter')`

### BroadcastChannel, protocolo de mensagens
```typescript
type PresenterMessage =
  | { type: 'SLIDE_CHANGE'; index: number }
  | { type: 'SLIDE_DATA'; slides: Slide[] }
  | { type: 'PRESENT_EXIT' }
```

**Painel de controle (sender):**
- Envia `SLIDE_CHANGE` ao navegar para outro slide
- Envia `SLIDE_DATA` ao carregar (para sincronizar a janela de projeção)
- Envia `PRESENT_EXIT` ao encerrar

**Janela de projeção (receiver):**
- Ouve `SLIDE_CHANGE` → atualiza a imagem exibida
- Ouve `SLIDE_DATA` → inicializa com os slides
- Ouve `PRESENT_EXIT` → fecha a janela (`window.close()`)

### Painel de controle, funcionalidades
- Timer: inicia ao abrir, conta tempo de apresentação (`setInterval` de 1s)
- Navegação: ← → e teclado (Space, Escape)
- Preview do próximo slide
- Comentários do slide atual em blocos visuais (read-only)
- Ajuste de fonte dos comentários (salvo em `localStorage`)

### Schema: comment_blocks em slides
**Atenção:** Esta issue depende de uma mudança no schema da tabela `slides`:

```sql
-- Alterar slides.comment (text) para slides.comment_blocks (jsonb)
alter table public.slides
  add column comment_blocks jsonb default '[]';

-- Migrar dados existentes (se houver)
update public.slides
  set comment_blocks = jsonb_build_array(
    jsonb_build_object('type', 'Notas pessoais', 'content', comment)
  )
  where comment != '';
```

Isso permite que os comentários de slides sejam blocos visuais coloridos,
não apenas texto simples.

### Fallback sem popup
Caso o usuário não consiga abrir o popup, exibir:
- Instruções visuais: "Conecte seu computador ao projetor"
- Modo alternativo: "Usar apenas tela cheia" (vai para modo simples)

## Critério de Aceite

- [ ] Modal de seleção de modo (simples vs apresentador)
- [ ] Abertura de popup de projeção com fallback se bloqueado
- [ ] BroadcastChannel sincronizando slides entre janelas
- [ ] Timer funcional no painel de controle
- [ ] Comentários renderizados como blocos visuais
- [ ] Ajuste de tamanho de fonte persistido (localStorage)
- [ ] Encerramento fecha a janela de projeção
- [ ] Schema `slides.comment_blocks` migrado

## Notas de Implementação

```typescript
// src/components/present/PresentModePresenter.tsx, channel setup
const channel = new BroadcastChannel('vox-presenter')

useEffect(() => {
  // Sincronizar ao abrir a janela de projeção
  channel.postMessage({ type: 'SLIDE_DATA', slides })
  return () => channel.close()
}, [])

function navigateTo(index: number) {
  setCurrentIndex(index)
  channel.postMessage({ type: 'SLIDE_CHANGE', index })
}

// src/app/(app)/sermons/[id]/present/page.tsx, janela de projeção
// Se mode=projector: renderiza apenas a imagem, ouve BroadcastChannel
if (searchParams.get('mode') === 'projector') {
  return <ProjectorView />
}
```

```typescript
// src/components/present/ProjectorView.tsx
'use client'
export function ProjectorView() {
  const [currentSlide, setCurrentSlide] = useState<Slide | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])

  useEffect(() => {
    const channel = new BroadcastChannel('vox-presenter')
    channel.onmessage = (e) => {
      if (e.data.type === 'SLIDE_DATA') setSlides(e.data.slides)
      if (e.data.type === 'SLIDE_CHANGE') setCurrentSlide(slides[e.data.index])
      if (e.data.type === 'PRESENT_EXIT') window.close()
    }
    return () => channel.close()
  }, [slides])

  return (
    <div style={{ background: '#000', width: '100vw', height: '100vh' }}>
      {currentSlide && <img src={currentSlide.image_url!} style={{ objectFit: 'contain', width: '100%', height: '100%' }} />}
    </div>
  )
}
```

## Plano de Implementação

### Pré-requisitos
- Issue 011 concluída (PresentModePresenter visual pronto)
- Issue 039 concluída (PresentModeSlides modo simples funcionando)
- Issue 038 concluída (slides com `comment_blocks` JSONB no banco)

### Passos

**1. Migrar comment para comment_blocks**
Criar `supabase/migrations/010_slides_comment_blocks.sql`:
- `ALTER TABLE slides ADD COLUMN comment_blocks jsonb DEFAULT '[]'`
- UPDATE de migração de dados existentes (text → bloco Notas pessoais)
- Aplicar migration e regenerar tipos

**2. Criar modal de seleção de modo**
Criar `src/components/present/PresentModeSelector.tsx` (`"use client"`):
- `shadcn/ui Dialog` aberto ao clicar "Apresentar" em sermão tipo apresentação
- Dois cards: "Modo Simples" e "Modo Apresentador"
- "Simples" → `router.push(.../present)`, "Apresentador" → `router.push(.../present?mode=presenter)`

**3. Criar ProjectorView**
Criar `src/components/present/ProjectorView.tsx` (`"use client"`):
- `useEffect` → `new BroadcastChannel('vox-presenter')`
- Ouvir `SLIDE_DATA`, `SLIDE_CHANGE`, `PRESENT_EXIT`
- Renderizar `<img>` fullscreen em fundo preto

**4. Conectar PresentModePresenter ao BroadcastChannel**
Editar `src/components/present/PresentModePresenter.tsx`:
- Ao montar: `channel.postMessage({ type: 'SLIDE_DATA', slides })`
- `navigateTo(index)` → `setCurrentIndex + channel.postMessage({ type: 'SLIDE_CHANGE', index })`
- Encerrar → `channel.postMessage({ type: 'PRESENT_EXIT' })` + `projectorWindow.close()`
- `localStorage` para `fontSize` (persistência entre sessões)

**5. Abertura do popup de projeção**
Em `PresentModePresenter`:
- `openProjector()` → `window.open(.../present?mode=projector, 'vox-projector', 'fullscreen=yes')`
- Se `null` retornado (bloqueado): exibir `<div>` com instruções + botão "Tentar novamente"

**6. Bifurcar rota por mode=projector**
Editar `src/app/(app)/sermons/[id]/present/page.tsx`:
- `if (searchParams.get('mode') === 'projector') return <ProjectorView />`
- `if (mode === 'presenter') return <PresentModePresenter slides={slides} />`

**7. Renderizar comment_blocks no painel**
Em `PresentModePresenter`:
- Mapear `currentSlide.comment_blocks` → `<BlockRenderer>` read-only com cores do sistema

### Como Verificar
- Clicar "Apresentar": modal de seleção abre
- Escolher "Modo Apresentador": popup de projeção abre
- Navegar slide no painel de controle: popup sincroniza imediatamente via BroadcastChannel
- Encerrar: popup fecha automaticamente
- `fontSize` persiste ao reabrir o painel (localStorage)
- comment_blocks renderizados com barras coloridas corretas
