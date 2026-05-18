# Issue 023, Setup Next.js 15 + Estrutura Base

**Status:** [ ] PENDENTE
**Tipo:** infra
**Página:** global
**Depende de:** nenhuma
**Prioridade:** P0

---

## O Que Fazer

Criar o projeto Next.js 15 com App Router, configurar Tailwind 4, shadcn/ui,
fontes, layout raiz e estrutura de pastas conforme `docs/references/architecture.md`.

## Componentes Envolvidos

- `package.json`, Dependências do projeto
- `next.config.ts`, Configuração do Next.js
- `tailwind.config.ts`, Configuração do Tailwind
- `src/app/layout.tsx`, Root layout (providers, fontes, metadata)
- `src/app/globals.css`, Design tokens + reset
- `src/components/ui/`, shadcn/ui instalado
- `src/lib/utils/cn.ts`, Helper clsx + twMerge

## Comportamentos

- Next.js 15 com App Router e TypeScript strict
- Tailwind CSS 4 configurado com design tokens em CSS variables
- shadcn/ui inicializado com tema padrão (será substituído pelo design system)
- Fontes configuradas via `next/font`
- Metadata base configurada (title, description, manifest PWA)
- Estrutura de pastas conforme `docs/references/architecture.md` criada

## Critério de Aceite

- [ ] `npm run dev` roda sem erros
- [ ] `npm run build` compila sem erros
- [ ] TypeScript strict mode ativado (sem erros de tipo)
- [ ] Tailwind funcionando (classe de teste renderiza corretamente)
- [ ] shadcn/ui instalado (`npx shadcn@latest init`)
- [ ] Ao menos: Button, Card, Input, Label, Dialog, Toast adicionados via shadcn
- [ ] Root layout com metadata correta
- [ ] Grupos de rotas criados: `(public)`, `(auth)`, `(app)`
- [ ] Estrutura de pastas `src/` conforme architecture.md

## Notas de Implementação

### Criação do projeto
```bash
npx create-next-app@latest vox-app \
  --typescript --tailwind --eslint \
  --app --src-dir --import-alias "@/*"
```

### shadcn/ui init
```bash
npx shadcn@latest init
# Escolher: Default style, CSS variables: sim
```

### Componentes shadcn para instalar no MVP
```bash
npx shadcn@latest add button card input label dialog
npx shadcn@latest add toast dropdown-menu badge separator
npx shadcn@latest add avatar skeleton sheet tabs
```

### Root layout metadata
```typescript
export const metadata: Metadata = {
  title: { default: 'VOX', template: '%s | VOX' },
  description: 'Ferramenta pastoral para preparação e arquivo de sermões',
  manifest: '/manifest.json',
  themeColor: 'TODO: cor primária',
  viewport: { width: 'device-width', initialScale: 1 }
}
```

### TypeScript strict
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Fontes, Design System definido (usar exatamente estas)
```typescript
// src/app/layout.tsx
import { Fraunces, Geist, Geist_Mono } from 'next/font/google'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--vox-font-display',
  display: 'swap',
  axes: ['opsz'],  // optical size axis, importante para Fraunces
})

const geist = Geist({
  subsets: ['latin'],
  variable: '--vox-font-ui',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--vox-font-mono',
  display: 'swap',
})

// No <html> do layout: className={`${fraunces.variable} ${geist.variable} ${geistMono.variable}`}
```

### globals.css, importar tokens do design system
```css
/* PRIMEIRO: importar os tokens do design system VOX */
@import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap");

/* Copiar TODO o conteúdo de design-system/colors_and_type.css aqui */
/* OU usar @import '../../../design-system/colors_and_type.css' */

@layer base {
  :root {
    /* Mapear tokens VOX para shadcn/ui */
    --background:          var(--vox-bg);
    --foreground:          var(--vox-ink);
    --card:                var(--vox-surface);
    --card-foreground:     var(--vox-ink);
    --primary:             var(--vox-forest);
    --primary-foreground:  #ffffff;
    --secondary:           var(--vox-surface-deep);
    --secondary-foreground: var(--vox-prose);
    --muted:               var(--vox-surface-deep);
    --muted-foreground:    var(--vox-muted);
    --accent:              var(--vox-forest-soft);
    --accent-foreground:   var(--vox-forest);
    --destructive:         var(--vox-destructive);
    --border:              var(--vox-whisper);
    --input:               var(--vox-whisper-strong);
    --ring:                var(--vox-forest);
    --radius:              var(--vox-r-card);
  }
}

/* Paper grain (muito sutil, não remover) */
body {
  background-image:
    radial-gradient(ellipse at top, rgba(180,140,60,0.025), transparent 60%),
    radial-gradient(ellipse at bottom right, rgba(22,101,52,0.018), transparent 55%);
}
```

## Plano de Implementação

### Pré-requisitos
- Node.js >= 20, npm >= 10 instalados
- Sem dependências de outras issues

### Passos

**1. Criar o projeto Next.js**
Executar no diretório pai:
```bash
npx create-next-app@latest vox-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```
- Habilitar TypeScript strict + `noUncheckedIndexedAccess` no `tsconfig.json`

**2. Inicializar shadcn/ui e instalar componentes**
```bash
npx shadcn@latest init
npx shadcn@latest add button card input label dialog toast dropdown-menu badge separator avatar skeleton sheet tabs alert checkbox select
```

**3. Configurar fontes no root layout**
Editar `src/app/layout.tsx`:
- Importar `Fraunces`, `Geist`, `Geist_Mono` via `next/font/google` com variáveis CSS conforme Notas
- Aplicar variáveis no `<html className="...">`
- Adicionar `metadata` conforme Notas (title template, description, manifest)

**4. Configurar globals.css com design tokens**
Editar `src/app/globals.css`:
- Copiar conteúdo de `design-system/colors_and_type.css` (tokens VOX)
- Adicionar mapeamento `--background: var(--vox-bg)` etc. para shadcn/ui
- Manter `body { background-image: ... }` para paper grain

**5. Criar estrutura de pastas**
```bash
mkdir -p src/app/{(public),(auth)/login,(auth)/register,(app)/dashboard,(app)/sermons,(app)/import,(app)/settings}
mkdir -p src/components/{ui,editor,sermon,shared,present,auth}
mkdir -p src/lib/{supabase,ai,bible,offline,utils,editor,mocks}
mkdir -p src/hooks src/stores src/types
```

**6. Criar helper cn**
Criar `src/lib/utils/cn.ts`:
- `import { clsx } from 'clsx'; import { twMerge } from 'tailwind-merge'`
- `export function cn(...inputs) { return twMerge(clsx(inputs)) }`

**7. Criar layouts de grupo vazios**
- `src/app/(public)/layout.tsx`, pass-through
- `src/app/(auth)/layout.tsx`, placeholder (será preenchido na issue 005)
- `src/app/(app)/layout.tsx`, placeholder (será preenchido na issue 001)

### Como Verificar
- `npm run dev` → sem erros, acessar `http://localhost:3000`
- `npm run build` → compila sem erros de tipo
- DevTools: verificar que fontes Fraunces e Geist carregam
- Inspecionar `<html>`: variáveis `--vox-bg`, `--vox-forest` presentes no `:root`
