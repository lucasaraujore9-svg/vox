# Issue 005 — Auth Pages UI Proto

**Status:** [ ] PENDENTE
**Tipo:** proto
**Página:** /auth/login, /auth/register
**Depende de:** 023
**Prioridade:** P0

---

## O Que Fazer

Criar o protótipo visual das páginas de login e cadastro.
Formulários visuais sem funcionalidade real de autenticação.

## Componentes Envolvidos

- `src/app/(auth)/layout.tsx` — Layout de auth (sem sidebar, centrado)
- `src/app/(auth)/login/page.tsx` — Página de login
- `src/app/(auth)/register/page.tsx` — Página de cadastro

## Comportamentos (proto — apenas visual)

### Layout de Auth
- Fundo com gradiente suave ou imagem lateral
- Card central com logo VOX + formulário
- Responsivo: fullscreen no mobile, card centralizado no desktop

### Login
- Logo + tagline
- Input de email
- Input de senha (com toggle mostrar/ocultar)
- Checkbox "Lembrar-me"
- Botão "Entrar" com loading state (visual)
- Link "Esqueci minha senha"
- Separador
- Link "Ainda não tem conta? Cadastre-se"
- Estado de erro: banner de erro inline acima do formulário

### Cadastro
- Logo + tagline
- Input de nome completo
- Input de email
- Input de denominação/organização (opcional)
- Input de senha (com toggle + indicador de força)
- Input de confirmar senha
- Checkbox "Aceito os termos de uso"
- Botão "Criar conta" com loading state (visual)
- Link "Já tem conta? Entrar"

## Critério de Aceite

- [ ] Layout de auth centrado no desktop, fullscreen no mobile
- [ ] Formulário de login com todos os campos
- [ ] Toggle de senha (mostrar/ocultar) funcionando
- [ ] Estado de erro visual renderizando no login
- [ ] Formulário de cadastro com todos os campos
- [ ] Indicador de força de senha (fraca/média/forte)
- [ ] Links de navegação entre login e cadastro funcionam
- [ ] Responsivo em 375px mobile

## Notas de Implementação

- Usar shadcn `Input`, `Label`, `Button`, `Checkbox`
- Indicador de força de senha: calculado por comprimento e caracteres especiais
- Logo VOX: placeholder de texto estilizado (logo real virá do design system)
- Estado de loading: `Button` com `disabled` + spinner (Lucide `Loader2`)
- Estado de erro: usar shadcn `Alert` com variante `destructive`

## Plano de Implementação

### Pré-requisitos
- Issue 023 concluída (shadcn/ui + Tailwind configurados)

### Passos

**1. Criar layout de auth**
Criar `src/app/(auth)/layout.tsx`:
- Sem sidebar; `min-h-screen flex items-center justify-center`
- Fundo: `bg-[--vox-bg]` com gradiente radial sutil
- Coluna esquerda decorativa oculta no mobile (lg+): citação pastoral em Fraunces
- Coluna direita: slot `{children}` com card centralizado

**2. Criar página de login**
Criar `src/app/(auth)/login/page.tsx`:
- `"use client"` — useState: `showPassword`, `isLoading`, `hasError`
- Logo VOX (texto estilizado em Fraunces, --vox-forest)
- `<Alert variant="destructive">` condicional para erro (toggle por botão no proto)
- Campos: email, senha com botão olho (toggle `showPassword`)
- Checkbox "Lembrar-me" + link "Esqueci minha senha"
- Botão "Entrar": ao clicar, `isLoading = true` por 1.5s (simula loading) depois `hasError = true`
- Link para `/auth/register`

**3. Criar componente PasswordStrength**
Criar `src/components/auth/PasswordStrength.tsx`:
- Props: `password: string`
- Calcula força: fraca (<6), média (6-10 ou só letras), forte (10+ com especiais)
- 3 barras coloridas (vermelho/amarelo/verde) + label

**4. Criar página de cadastro**
Criar `src/app/(auth)/register/page.tsx`:
- `"use client"` — useState: `showPassword`, `showConfirm`, `isLoading`, `password`
- Campos: nome, email, denominação (optional), senha + `<PasswordStrength>`, confirmar senha
- Checkbox "Aceito os termos de uso"
- Botão "Criar conta" com loading state visual (Loader2 icon + disabled)
- Link para `/auth/login`

### Como Verificar
- `/auth/login`: card centralizado no desktop; fullscreen no mobile 375px
- Toggle do olho mostra/oculta senha
- Clicar "Entrar": botão fica disabled com spinner por ~1.5s, depois mostra erro
- `/auth/register`: indicador de força de senha muda ao digitar
- Links entre login ↔ cadastro navegam corretamente
