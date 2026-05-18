# Issue 012, Configuração de Cores dos Blocos UI Proto

**Status:** [ ] PENDENTE
**Tipo:** proto
**Página:** /settings/blocks
**Depende de:** 023
**Prioridade:** P2

---

## O Que Fazer

Criar o protótipo visual da página de configuração de cores dos blocos visuais.
O usuário define a paleta personalizada que será aplicada em todo o sistema
(editor de esboço, comentários de slides, notas de estudo).

## Componentes Envolvidos

- `src/components/blocks/BlockColorPicker.tsx`, seletor de cor por bloco
- `src/app/(app)/settings/blocks/page.tsx`, página de configuração

## Layout

### Header
- Breadcrumb: "Configurações / Blocos"
- Título: "Cores dos Blocos" Fraunces 600 24px
- Subtitle: "Personalize as cores de cada tipo de bloco. São usadas no editor, nos slides e no estudo." Geist 14px Muted

### Visualização ao vivo (preview)
- Label eyebrow: "Visualização"
- Mini-esboço com um bloco de cada tipo renderizado com as cores atuais
- Atualiza em tempo real conforme o usuário troca cores
- Background Linen, exatamente como apareceria no editor

### Lista de tipos de bloco

Para cada tipo:
```
[Barra colorida] [Nome do bloco]          [Cor atual hex] [● Color picker] [↺ Resetar]
```
- Nome: Geist 14px
- Cor hex: Geist Mono 12px Muted (`#B45309`)
- Color picker: `<input type="color">` customizado (aparece ao clicar na barra)
- Botão ↺: restaura o default do sistema (aparece só se foi modificado)

**Blocos listados (na ordem do editor):**
1. Texto Bíblico
2. Proposição
3. Introdução
4. Contexto
5. Ponto Principal
6. Subponto
7. Ilustração
8. Aplicação
9. Citação
10. Pergunta retórica
11. Transição
12. Conclusão
13. Oração
14. Notas pessoais

### Ações globais (rodapé fixo)
- "Restaurar padrões", outline, restaura todas as cores para os defaults
- "Salvar", Forest Deep, salva as preferências

### Aviso de consistência
- Hint acima das ações: "Estas cores são aplicadas em todos os seus conteúdos, sermões, palestras, aulas e notas de estudo."

## Critério de Aceite

- [ ] Lista com todos os 14 tipos de bloco
- [ ] Barra de cor à esquerda de cada item
- [ ] Input de cor clicável (abre color picker nativo)
- [ ] Preview ao vivo atualiza conforme seleção
- [ ] Botão ↺ aparece nos blocos modificados
- [ ] Botão "Restaurar padrões" reseta tudo (no proto: só visual)
- [ ] Botão "Salvar" (no proto: sem funcionalidade)
- [ ] Responsivo: lista funcional no mobile

## Notas de Implementação

```typescript
// Default colors (source of truth, deve vir de um arquivo de constantes)
// src/lib/blocks/defaults.ts
export const BLOCK_COLOR_DEFAULTS: Record<string, string> = {
  'Texto Bíblico':     '#B45309',
  'Proposição':        '#166534',
  'Introdução':        '#475569',
  'Contexto':          '#64748b',
  'Ponto Principal':   '#166534',
  'Subponto':          '#15803d',
  'Ilustração':        '#7c3aed',
  'Aplicação':         '#0d7c7c',
  'Citação':           '#d97706',
  'Pergunta retórica': '#9333ea',
  'Transição':         '#e2e8f0',
  'Conclusão':         '#18181b',
  'Oração':            '#166534',
  'Notas pessoais':    '#9ca3af',
}
```

```typescript
// Estado local no proto
const [colors, setColors] = useState<Record<string, string>>(BLOCK_COLOR_DEFAULTS)

function updateColor(blockType: string, color: string) {
  setColors(prev => ({ ...prev, [blockType]: color }))
}

function isModified(blockType: string): boolean {
  return colors[blockType] !== BLOCK_COLOR_DEFAULTS[blockType]
}
```

- Color picker: `<input type="color">` com `appearance: none` + wrapper estilizado
- Preview em tempo real: usar `style={{ borderLeftColor: colors[type] }}`
- O arquivo `src/lib/blocks/defaults.ts` é o contrato que todos os outros componentes importam

## Plano de Implementação

### Pré-requisitos
- Issue 023 concluída (ambiente configurado)

### Passos

**1. Criar arquivo de defaults**
Criar `src/lib/blocks/defaults.ts`:
- Exportar `BLOCK_COLOR_DEFAULTS: Record<string, string>` com os 14 tipos e cores conforme spec
- Este arquivo é o contrato importado por todo o sistema, não inlinar valores em componentes

**2. Criar BlockColorPicker**
Criar `src/components/blocks/BlockColorPicker.tsx` (`"use client"`):
- Props: `blockType: string`, `color: string`, `isModified: boolean`, `onChange`, `onReset`
- Layout: `[Barra colorida] [Nome] [Hex Geist Mono] [<input type="color">] [↺ se modificado]`
- `<input type="color">` com `className="sr-only"` + `<div>` clicável estilizado como swatch
- Ícone ↺ SVG stroke, visível apenas quando `isModified === true`

**3. Criar página /settings/blocks**
Criar `src/app/(app)/settings/blocks/page.tsx` (`"use client"`):
- `useState<Record<string, string>>(BLOCK_COLOR_DEFAULTS)` para `colors`
- `isModified(type)`: compara com defaults
- Preview ao vivo: mini-esboço com `<div>` por tipo, `style={{ borderLeftColor: colors[type], backgroundColor: colors[type] + '1A' }}`
- Lista dos 14 `BlockColorPicker` em ordem da spec
- Rodapé fixo: "Restaurar padrões" (outline) + "Salvar" (Forest Deep, no proto sem ação)
- Hint de consistência acima das ações

**4. Responsividade**
- Lista de blocos: `flex-col` em mobile sem alteração; preview colapsa abaixo da lista

### Como Verificar
- Acessar `/settings/blocks`: ver 14 linhas com swatch, nome, hex e picker
- Trocar cor de um bloco: preview ao vivo atualiza barra e tint imediatamente
- Ícone ↺ aparece apenas nos blocos modificados
- Clicar ↺: bloco volta ao default e ícone some
- "Restaurar padrões": todos os blocos voltam aos defaults simultaneamente
