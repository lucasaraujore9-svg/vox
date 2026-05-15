# Issue 021 — Autenticação Supabase Auth

**Status:** [ ] PENDENTE
**Tipo:** infra
**Página:** /auth/login, /auth/register, global
**Depende de:** 020
**Prioridade:** P0

---

## O Que Fazer

Implementar o fluxo completo de autenticação usando Supabase Auth:
login, cadastro, logout e proteção de rotas via middleware.

## Componentes Envolvidos

- `src/app/(auth)/layout.tsx` — Layout do grupo de auth
- `src/app/(auth)/login/page.tsx` — Página de login
- `src/app/(auth)/register/page.tsx` — Página de cadastro
- `src/app/(app)/layout.tsx` — Layout do grupo autenticado
- `src/middleware.ts` — Proteção de rotas
- `src/components/shared/AppHeader.tsx` — Botão de logout
- `src/lib/supabase/actions.ts` — Server Actions de auth

## Comportamentos

- Login com email + senha via Supabase Auth
- Cadastro cria conta no Supabase Auth + perfil em `profiles`
- Logout invalida sessão e redireciona para `/auth/login`
- Middleware protege todas as rotas do grupo `(app)/`
- Rotas públicas: `/`, `/auth/login`, `/auth/register`, `/templates`
- Usuário autenticado acessando `/auth/login` → redireciona para `/dashboard`
- Sessão persistida via cookies (SSR-compatible)

## Critério de Aceite

- [ ] Login com credenciais válidas redireciona para `/dashboard`
- [ ] Login com credenciais inválidas exibe erro inline (não alert)
- [ ] Cadastro cria conta + perfil em `profiles`
- [ ] Logout invalida sessão e redireciona para login
- [ ] Middleware bloqueia acesso a `(app)/` sem autenticação
- [ ] Usuário logado acessando `/auth/login` é redirecionado
- [ ] Loading state durante submit dos formulários
- [ ] Validação Zod: email válido, senha >= 8 chars, senhas iguais (registro)

## Notas de Implementação

- Usar Server Actions para submit dos formulários (não client-side fetch)
- Validação com Zod + React Hook Form
- Erro do Supabase → mensagem amigável em português (não expor mensagem técnica)
- Sessão gerenciada por cookies via `@supabase/ssr`

### Server Action de login
```typescript
"use server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres")
})

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password')
  })
  if (!parsed.success) return { error: parsed.error.flatten() }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: { message: "Email ou senha incorretos" } }

  redirect('/dashboard')
}
```

### Middleware
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_PATHS = ['/', '/auth/login', '/auth/register', '/templates']

export async function middleware(request: NextRequest) {
  if (PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
    return NextResponse.next()
  }
  // verificar sessão e redirecionar se necessário
}
```

## Plano de Implementação

### Pré-requisitos
- Issue 020 concluída (schema criado, clients disponíveis)
- Issue 005 concluída (páginas de auth com UI pronta)
- `npm install zod react-hook-form @hookform/resolvers`

### Passos

**1. Criar Server Actions de auth**
Criar `src/lib/supabase/actions.ts`:
- `loginAction(formData)`: valida com Zod → `signInWithPassword` → redirect `/dashboard`
- `registerAction(formData)`: valida (nome, email, senha, confirmação) → `signUp` → insert em `profiles` → redirect `/dashboard`
- `logoutAction()`: `supabase.auth.signOut()` → redirect `/auth/login`
- Erros Supabase mapeados para mensagens em português

**2. Atualizar middleware para proteção de rotas**
Editar `src/middleware.ts`:
- Rotas públicas passam direto: `['/', '/auth/login', '/auth/register', '/templates']`
- Para demais rotas: criar server client, checar `supabase.auth.getUser()`
- Sem sessão → redirect para `/auth/login?next={pathname}`
- Com sessão em `/auth/login` ou `/auth/register` → redirect para `/dashboard`
- Exportar `config.matcher` para incluir `/(app)/(.*)` e `/(auth)/(.*)`

**3. Conectar formulário de login**
Editar `src/app/(auth)/login/page.tsx`:
- Trocar mocks por React Hook Form + `loginAction` via `useFormState`/`useActionState`
- Exibir `<Alert>` com erro retornado pela action
- Loading state: `useFormStatus` no botão de submit

**4. Conectar formulário de cadastro**
Editar `src/app/(auth)/register/page.tsx`:
- React Hook Form com schema Zod (client-side preview) + `registerAction` no submit
- Validar que `password === confirmPassword` antes de enviar

**5. Adicionar botão de logout ao header**
Editar `src/components/shared/AppHeader.tsx`:
- DropdownMenu item "Sair" chama `logoutAction` via form action

### Como Verificar
- Login com usuário válido → redireciona para `/dashboard`
- Login com senha errada → mensagem "Email ou senha incorretos" aparece inline
- Tentar acessar `/dashboard` sem login → redireciona para `/auth/login`
- Usuário logado acessando `/auth/login` → redireciona para `/dashboard`
- Clicar "Sair" → sessão encerrada, redirect para login
