# Issue 044 — Cores dos Blocos: Behavior (Configuração e Aplicação)

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /settings/blocks + todo o sistema de blocos
**Depende de:** 012, 026
**Prioridade:** P2

---

## O Que Fazer

Implementar a configuração de cores dos blocos pelo usuário e a aplicação dessas
cores em todo o sistema: editor de esboço, comentários de slides e notas de estudo.

## Comportamentos

### Carregamento de cores (useBlockColors)
```
1. Busca preferências do usuário: SELECT * FROM block_color_preferences WHERE user_id = ?
2. Merge com defaults: para cada tipo de bloco, usa a preferência se existir, senão usa o default
3. Disponibiliza as cores via React Context (BlockColorsContext)
```

O hook `useBlockColors` retorna as cores resolvidas e é consumido por:
- `BlockItem.tsx` — aplica a cor na barra lateral esquerda
- `BlockColorPicker.tsx` — exibe cores atuais + permite editar
- `StudyNotes.tsx` — mesmas cores nas notas de estudo

### Salvar preferência de cor
```typescript
// Ao usuário trocar uma cor:
await supabase.from('block_color_preferences')
  .upsert({ user_id, block_type, color }, { onConflict: 'user_id,block_type' })
```
- Otimistic update: cor muda imediatamente na UI, confirma com Supabase
- Se erro: reverte e exibe toast de erro

### Restaurar cor padrão (individual)
```typescript
await supabase.from('block_color_preferences')
  .delete()
  .eq('user_id', user_id)
  .eq('block_type', block_type)
```
- Remove a preferência — sistema volta a usar o default

### Restaurar todos os padrões
```typescript
await supabase.from('block_color_preferences')
  .delete()
  .eq('user_id', user_id)
```
- Remove todas as preferências do usuário
- Confirmação: "Isso vai redefinir todas as cores para o padrão. Continuar?"

### Preview ao vivo na página /settings/blocks
- `BlockColorsContext` atualiza em tempo real
- Mini-preview mostra blocos com as cores atuais antes de salvar
- Botão "Salvar" faz `upsert` de todas as preferências modificadas em batch

### Aplicação no editor de blocos
- `BlockItem` lê `useBlockColors()` → aplica `borderLeftColor` e `backgroundColor` (tint)
- Tint = hex com 10% de opacidade: `hex + '1A'` (notation hex de 8 dígitos)
- Não precisa de re-render do editor — apenas CSS custom property atualizada

### CSS Custom Properties (approach recomendado)
```typescript
// Ao carregar as cores, injetar no :root:
function applyColorsToRoot(colors: Record<string, string>) {
  const root = document.documentElement
  Object.entries(colors).forEach(([blockType, color]) => {
    const key = `--block-${blockType.toLowerCase().replace(/\s+/g, '-')}`
    root.style.setProperty(key, color)
    root.style.setProperty(`${key}-tint`, `${color}1A`)
  })
}
```

```css
/* BlockItem.tsx — usa as CSS custom properties */
.block-item[data-type="Texto Bíblico"] {
  border-left-color: var(--block-texto-bíblico);
  background-color: var(--block-texto-bíblico-tint);
}
```

## Critério de Aceite

- [ ] `useBlockColors` retorna cores merged (preferências + defaults)
- [ ] Cores aplicadas via CSS custom properties no `:root`
- [ ] BlockItem usa as custom properties (muda automaticamente ao trocar cor)
- [ ] Salvar preferência individual: upsert + otimistic update
- [ ] Restaurar cor individual: delete
- [ ] Restaurar todos: delete all com confirmação
- [ ] Preview ao vivo na página /settings/blocks
- [ ] Cores disponíveis nas notas de estudo e nos comentários de slides
- [ ] Cores persistidas entre sessões (não resetam ao reload)

## Notas de Implementação

```typescript
// src/hooks/useBlockColors.ts
import { BLOCK_COLOR_DEFAULTS } from '@/lib/blocks/defaults'

export function useBlockColors() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('block_color_preferences')
      .select('block_type, color')
      .eq('user_id', user!.id)
      .then(({ data }) => {
        const prefs: Record<string, string> = {}
        data?.forEach(p => { prefs[p.block_type] = p.color })
        setPreferences(prefs)
        setLoading(false)
      })
  }, [user?.id])

  // Merge: preferência do usuário sobrescreve o default
  const resolvedColors = useMemo(() =>
    Object.fromEntries(
      Object.keys(BLOCK_COLOR_DEFAULTS).map(type => [
        type,
        preferences[type] ?? BLOCK_COLOR_DEFAULTS[type]
      ])
    ),
  [preferences])

  // Injeta no :root quando as cores mudam
  useEffect(() => {
    applyColorsToRoot(resolvedColors)
  }, [resolvedColors])

  return { colors: resolvedColors, loading, updateColor, resetColor, resetAll }
}
```

### Context
```typescript
// src/contexts/BlockColorsContext.tsx
export const BlockColorsContext = createContext<ReturnType<typeof useBlockColors> | null>(null)

// Wrapper no layout da área autenticada:
<BlockColorsProvider>
  {children}
</BlockColorsProvider>
```

## Plano de Implementação

### Pré-requisitos
- Issue 012 concluída (BlockColorPicker visual + defaults.ts pronto)
- Issue 026 concluída (tabela `block_color_preferences` existe)

### Passos

**1. Implementar useBlockColors**
Criar `src/hooks/useBlockColors.ts` (`"use client"`):
- Buscar `block_color_preferences` do usuário ao montar
- Merge com `BLOCK_COLOR_DEFAULTS`: preferência sobrescreve default
- `updateColor(blockType, color)`: optimistic update + `upsert` no Supabase; rollback em erro
- `resetColor(blockType)`: DELETE WHERE `block_type = ?` + restaurar default no state
- `resetAll()`: DELETE WHERE `user_id = ?` após confirmação + restaurar todos os defaults
- `applyColorsToRoot(resolvedColors)` no `useEffect`: injeta CSS custom properties no `:root`

**2. Criar BlockColorsContext**
Criar `src/contexts/BlockColorsContext.tsx` (`"use client"`):
- Context com `ReturnType<typeof useBlockColors>`
- `BlockColorsProvider` wrappa o layout da área autenticada

**3. Adicionar provider ao layout autenticado**
Editar `src/app/(app)/layout.tsx`:
- `<BlockColorsProvider>{children}</BlockColorsProvider>`

**4. Aplicar cores no BlockItem**
Editar `src/components/blocks/BlockItem.tsx`:
- Remover cores hardcoded
- Usar `var(--block-{slug})` para `borderLeftColor` e `var(--block-{slug}-tint)` para `backgroundColor`
- Slug: `blockType.toLowerCase().replace(/\s+/g, '-')` (ex: `texto-bíblico`)

**5. Conectar BlockColorPicker ao behavior**
Editar `src/components/blocks/BlockColorPicker.tsx`:
- Receber `updateColor` e `resetColor` do context via `useContext(BlockColorsContext)`
- `onChange` → `updateColor()` com optimistic update
- `onReset` → `resetColor()` com confirmação inline

**6. Conectar página /settings/blocks**
Editar `src/app/(app)/settings/blocks/page.tsx`:
- Substituir useState local por `useContext(BlockColorsContext)`
- "Restaurar padrões" → `resetAll()` com `confirm()` ou `Dialog` de confirmação
- "Salvar" → fazer `upsert` batch de todos os blocos modificados de uma vez

### Como Verificar
- Trocar cor em /settings/blocks: editor de sermão reflete a nova cor em tempo real (sem reload)
- Recarregar a página: cores persistidas (vêm do Supabase, não do estado local)
- Resetar cor individual: bloco volta ao default, ícone ↺ some
- Restaurar todos: confirmação aparece; após confirmar, todas as cores voltam ao padrão
- Notas de estudo e comentários de slides também usam as cores personalizadas
