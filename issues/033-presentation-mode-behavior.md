# Issue 033 — Modo Apresentação Funcional

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /sermons/[id]/present
**Depende de:** 030, 004
**Prioridade:** P1

---

## O Que Fazer

Conectar o protótipo do modo de apresentação aos dados reais do sermão e
implementar as APIs do browser: Fullscreen, Wake Lock e navegação por teclado.

## Componentes Envolvidos

- `src/app/(app)/sermons/[id]/present/page.tsx` — Carrega dados reais
- `src/components/present/PresentationMode.tsx` — Lógica real
- `src/hooks/useWakeLock.ts` — Hook para Wake Lock API
- `src/hooks/useFullscreen.ts` — Hook para Fullscreen API
- `src/hooks/useKeyboardNav.ts` — Hook para navegação por teclado

## Comportamentos

### Carregamento
- Server Component carrega o sermão via Supabase (verificando user_id)
- Conteúdo dos blocos (TipTap JSON) é renderizado como HTML estático (sem TipTap)
- Renderização estática: mais leve e sem toolbars no modo apresentação

### Fullscreen
- Ao entrar na página: solicita fullscreen automaticamente
- Se usuário recusar fullscreen: continua normalmente sem fullscreen
- Ao sair: restaura view normal

### Wake Lock
- Ativa Screen Wake Lock ao entrar no modo apresentação
- Evita que a tela do celular desligue durante a pregação
- Libera ao sair da página ou ao perder foco

### Navegação
- Teclado: → ou espaço = próximo bloco; ← = bloco anterior
- Toque (mobile): swipe esquerda = próximo; swipe direita = anterior
- Botões na barra de controles (já do proto)
- Ao chegar no último bloco: botão ▶ desabilita

### Conteúdo offline
- Bloco usa conteúdo já carregado (Server Component) — funciona offline após carregado

## Critério de Aceite

- [ ] Sermão real carregado e renderizado em modo apresentação
- [ ] Fullscreen solicita automaticamente (e aceita recusa graciosamente)
- [ ] Wake Lock ativo durante apresentação (verificar que tela não dorme)
- [ ] Navegação por teclado: → ← e espaço funcionam
- [ ] Swipe mobile funciona para trocar bloco
- [ ] Botão Sair → volta para `/sermons/[id]` e libera Wake Lock + Fullscreen
- [ ] Acesso a sermão de outro usuário retorna 404
- [ ] Conteúdo TipTap JSON renderizado corretamente como HTML

## Notas de Implementação

### Renderização de TipTap JSON como HTML estático
```typescript
// Usar @tiptap/html para converter JSON → HTML sem instanciar o editor
import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'

const html = generateHTML(block.content, [StarterKit])
// Renderizar com dangerouslySetInnerHTML (conteúdo é do próprio usuário, seguro)
```

### Wake Lock Hook
```typescript
// src/hooks/useWakeLock.ts
export function useWakeLock() {
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null
    async function request() {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen')
      }
    }
    request()
    return () => { wakeLock?.release() }
  }, [])
}
```

### Swipe mobile
```bash
npm install @use-gesture/react
```

### Atenção
- Wake Lock é liberado automaticamente quando a aba fica em background
- Reativar Wake Lock no `visibilitychange` event
- Fullscreen API pode ser bloqueada em alguns contextos (iframe)

## Plano de Implementação

### Pré-requisitos
- Issue 030 concluída (sermão carregável pelo Supabase)
- Issue 004 concluída (proto do modo apresentação com UI funcional)
- `npm install @use-gesture/react`

### Passos

**1. Criar hook useWakeLock**
Criar `src/hooks/useWakeLock.ts`:
- Implementar conforme código das Notas
- Adicionar listener em `document.addEventListener('visibilitychange', ...)` para reativar quando aba volta ao foco

**2. Criar hook useFullscreen**
Criar `src/hooks/useFullscreen.ts`:
- `requestFullscreen()` no elemento raiz via `elementRef.current?.requestFullscreen()`
- Tratar erro (recusa do usuário) com `try/catch` silencioso
- `exitFullscreen()` em `document.exitFullscreen()`
- Retornar `{ isFullscreen, request, exit }`

**3. Criar hook useKeyboardNav**
Criar `src/hooks/useKeyboardNav.ts`:
- Props: `onNext: () => void`, `onPrev: () => void`
- `useEffect` com `keydown` listener: `ArrowRight`/`Space` → `onNext`, `ArrowLeft` → `onPrev`
- Cleanup do listener no return do effect

**4. Atualizar página de apresentação (dados reais)**
Editar `src/app/(app)/sermons/[id]/present/page.tsx`:
- Server Component: buscar sermão via Supabase verificando `user_id` → `notFound()` se inválido
- Converter `sermon.content` (array de blocos) para HTML via `generateHTML` do `@tiptap/html`
- Passar blocos pré-renderizados como `{ id, title, html }[]` para `<PresentationMode>`

**5. Atualizar PresentationMode com hooks reais**
Editar `src/components/present/PresentationMode.tsx`:
- Substituir mocks por `blocks` prop recebida da página
- Usar `useWakeLock()`, `useFullscreen()`, `useKeyboardNav(onNext, onPrev)`
- Swipe: `useGesture` do `@use-gesture/react` → `onSwipeLeft → onNext`, `onSwipeRight → onPrev`
- Bloco atual renderiza com `dangerouslySetInnerHTML={{ __html: block.html }}`
- Botão Sair: chama `exit()` do useFullscreen + `router.push(\`/sermons/${id}\`)`

### Como Verificar
- Abrir `/sermons/[id]/present` num sermão real: conteúdo renderiza (não lorem ipsum)
- Teclar → ou Espaço: próximo bloco; ← volta
- No mobile: swipe esquerda avança, direita volta
- Verificar DevTools → Application → Wake Locks: sentinela ativa durante apresentação
- Fechar aba ou clicar Sair: Wake Lock liberado
