# Issue 011 — Modo Apresentador (Duas Janelas) UI Proto

**Status:** [ ] PENDENTE
**Tipo:** proto
**Página:** /sermons/[id]/present (mode=presenter)
**Depende de:** 004, 007
**Prioridade:** P1

---

## O Que Fazer

Criar o protótipo visual do **Modo Apresentador** — a versão avançada do modo de apresentação,
inspirada no PowerPoint Presenter View: uma janela projetada na tela da audiência (slide fullscreen)
e uma janela de controle visível apenas para o apresentador.

## Componentes Envolvidos

- `src/components/present/PresentModePresenter.tsx` — painel de controle completo
- `src/app/(app)/sermons/[id]/present/page.tsx` — adicionar query param `?mode=presenter`

## Conceito

No proto, **simular as duas janelas dentro de uma só tela** (layout split):
- Metade esquerda = o que a audiência vê (slide fullscreen simulado)
- Metade direita = painel de controle do apresentador

Em produção, a janela da audiência abre em popup fullscreen (`window.open`) e o painel
de controle fica na tela principal do apresentador.

---

## Layout do Painel de Controle (direita)

**Background:** `--vox-stage-bg` (`#0B0F0D`) total — modo escuro

### Área 1 — Cabeçalho do controle
- Título do conteúdo: Geist 13px Muted
- Contador: "Slide 3 / 12" Geist Mono Forest
- Timer: "00:12:34" Geist Mono 20px (conta tempo de apresentação)

### Área 2 — Preview do próximo slide
- Label eyebrow Muted: "Próximo slide"
- Miniatura 16:9 com borda whisper-strong
- Título/número do próximo slide abaixo

### Área 3 — Comentários do slide atual (NÚCLEO)
- Label eyebrow Forest: "Notas do apresentador"
- Blocos visuais coloridos (mesma estrutura do editor de esboço):
  - Texto Bíblico, Aplicação, Ponto Principal, Ilustração, Notas pessoais, etc.
  - Exibição: read-only no modo apresentação (barra colorida esquerda + conteúdo)
  - Fonte maior: Geist 16px, line-height 1.6 para leitura rápida
- Scroll se o conteúdo ultrapassar a área

### Área 4 — Controles de navegação
- Botões grandes: `[← Slide Anterior]  [Próximo Slide →]`
- Geist 14px, borda whisper, padding generoso (toque fácil)
- Atalhos de teclado exibidos abaixo: "← → ou Espaço" Muted 11px

### Área 5 — Barra inferior
- `[⊡ Projetar fullscreen]` — abre janela da audiência
- `[Aa +/-]` — ajusta tamanho da fonte dos comentários
- `[✕ Encerrar]` — volta para o editor

---

## Janela da Audiência (esquerda no proto)

- Slide fullscreen simulado (aspect ratio 16:9)
- Background preto
- Sem nenhuma UI — apenas a imagem do slide
- Borda sutil para indicar "esta é a outra janela" no proto

---

## Critério de Aceite

- [ ] Layout split-screen simulando as duas janelas
- [ ] Painel de controle com timer funcional (incrementa no proto)
- [ ] Preview do próximo slide renderizando
- [ ] Comentários em blocos visuais (mock com 3 blocos coloridos)
- [ ] Botões de navegação renderizando
- [ ] Barra inferior com ações
- [ ] Background dark total em ambas as áreas
- [ ] Responsivo: no mobile, apenas o slide (sem painel — modo simples)

## Notas de Implementação

```typescript
// src/components/present/PresentModePresenter.tsx
'use client'
interface PresentModePresenterProps {
  slides: Slide[]
  currentIndex: number
  onNext: () => void
  onPrev: () => void
  onExit: () => void
  onOpenProjector: () => void // window.open fullscreen
}
```

### Abertura da janela de projeção (behavior, não proto)
```typescript
// Lógica de produção — documentar na issue de behavior (043):
const projector = window.open(
  `/sermons/${sermonId}/present?mode=projector`,
  'vox-projector',
  'fullscreen=yes'
)
// Canal de comunicação: BroadcastChannel API
const channel = new BroadcastChannel('vox-presenter')
channel.postMessage({ type: 'SLIDE_CHANGE', index: currentIndex })
```

### BroadcastChannel
- Janela de controle envia mensagens de navegação
- Janela projetada ouve e atualiza o slide
- Isso permite sincronização entre as duas janelas sem servidor

### Comentários como blocos
- Os comentários dos slides (tabela `slides.comment`) devem ser JSONB de blocos, não texto simples
- Isso é uma mudança em relação à issue 024 — atualizar o schema para `comment_blocks jsonb`

## Plano de Implementação

### Pré-requisitos
- Issue 004 concluída (modo apresentação básico existente)
- Issue 007 concluída (estrutura de slides e comentários visual)

### Passos

**1. Criar mocks de slides e blocos**
Em `src/components/present/mocks.ts`:
- Array de 12 slides mock com `image_url` (picsum) e `comment_blocks` (array de 3 blocos coloridos)
- Blocos mock: `[{type: 'Ponto Principal', content: '...'}, {type: 'Aplicação', ...}, ...]`

**2. Criar PresentModePresenter**
Criar `src/components/present/PresentModePresenter.tsx` (`"use client"`):
- Layout split: `w-1/2` esquerda (audiência simulada) + `w-1/2` direita (painel controle)
- Fundo: `style={{background: 'var(--vox-stage-bg)'}}` em ambos os lados
- Esquerda: `<img>` 16:9 do slide atual com borda sutil (`border border-white/10`)
- Direita: header com título + "Slide N/12", timer com `setInterval` de 1s, preview próximo slide, blocos de comentário read-only, botões nav, barra inferior

**3. Renderizar blocos de comentário (read-only)**
No painel direito:
- Mapear `comment_blocks` → `<div>` com barra colorida esquerda (`borderLeftColor: blockColor`)
- Conteúdo: Geist 16px, line-height 1.6
- Scroll se ultrapassar a área disponível

**4. Timer funcional**
- `useState<number>(0)` para segundos
- `useEffect` → `setInterval(1000)` que incrementa e formata `HH:MM:SS` com `Geist Mono 20px`
- Limpa interval no unmount

**5. Integrar na rota de apresentação**
Editar `src/app/(app)/sermons/[id]/present/page.tsx`:
- Ler `?mode=presenter` via `searchParams`
- Renderizar `<PresentModePresenter>` com slides mock

**6. Responsividade**
- Mobile (`< 768px`): ocultar painel direito, exibir apenas slide fullscreen

### Como Verificar
- Acessar `/sermons/[id]/present?mode=presenter`: ver layout split com fundo escuro
- Timer incrementa em tempo real
- Clicar "Próximo Slide →": slide esquerdo e preview direito avançam
- Blocos de comentário renderizados com cores e barra lateral
- Em viewport < 768px: apenas o slide visível
