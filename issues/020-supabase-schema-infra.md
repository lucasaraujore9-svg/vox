# Issue 020, Setup Supabase + Schema de DB

**Status:** [ ] PENDENTE
**Tipo:** infra
**Página:** global
**Depende de:** nenhuma
**Prioridade:** P0

---

## O Que Fazer

Configurar o projeto Supabase e executar as migrations iniciais que criam todas as tabelas
necessárias para o MVP do VOX.

## Componentes Envolvidos

- `src/lib/supabase/client.ts`, Browser client (singleton)
- `src/lib/supabase/server.ts`, Server client (cookies/SSR)
- `src/middleware.ts`, Supabase session middleware
- `src/types/database.ts`, Tipos gerados pelo Supabase CLI
- `supabase/migrations/`, Arquivos de migration SQL

## Comportamentos

- Tabela `profiles` criada com RLS ativado
- Tabela `series` criada com RLS ativado
- Tabela `sermons` criada com RLS ativado e full-text search
- Trigger automático para criar perfil após signup
- Row Level Security: cada usuário acessa apenas seus próprios dados
- Tipos TypeScript gerados via `supabase gen types`

## Critério de Aceite

- [ ] Projeto Supabase criado e URL/keys no `.env.local`
- [ ] Migration `001_profiles.sql` executada com sucesso
- [ ] Migration `002_series.sql` executada com sucesso
- [ ] Migration `003_sermons.sql` executada com sucesso
- [ ] RLS ativado e policies criadas nas 3 tabelas
- [ ] Trigger `on_auth_user_created` funcionando
- [ ] `src/types/database.ts` gerado com os tipos corretos
- [ ] `src/lib/supabase/client.ts` exporta o browser client
- [ ] `src/lib/supabase/server.ts` exporta o server client com cookies
- [ ] `src/middleware.ts` configurado para refresh de sessão

## Notas de Implementação

- Seguir exatamente o schema em `docs/references/architecture.md`
- O campo `content` de `sermons` é `jsonb`, array de blocos estruturados
- Full-text search em português: `to_tsvector('portuguese', ...)`
- Usar `@supabase/ssr` (não `@supabase/auth-helpers-nextjs`, deprecated)
- Service Role Key: NUNCA expor no cliente, apenas em Route Handlers server-side

### Packages necessários
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Estrutura dos clients

```typescript
// src/lib/supabase/client.ts, browser
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// src/lib/supabase/server.ts, server (async, usa cookies)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, ... } }
  )
}
```

## Plano de Implementação

### Pré-requisitos
- Conta criada em supabase.com + projeto novo criado
- `npm install @supabase/supabase-js @supabase/ssr`
- `npm install -g supabase` (CLI para gen types)

### Passos

**1. Configurar variáveis de ambiente**
Editar `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**2. Criar migration de profiles**
Criar `supabase/migrations/001_profiles.sql`:
- Tabela `profiles`: `id uuid references auth.users`, `full_name`, `denomination`, `ai_enabled bool default false`, `bible_version text default 'ARC'`
- `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY`
- Policy: `USING (auth.uid() = id)` para SELECT/INSERT/UPDATE
- Trigger: `CREATE FUNCTION handle_new_user()` + `CREATE TRIGGER on_auth_user_created`

**3. Criar migration de series**
Criar `supabase/migrations/002_series.sql`:
- Tabela `series`: `id uuid`, `user_id uuid references profiles`, `name`, `description`, `created_at`
- RLS: policy `user_id = auth.uid()` para todas as operações

**4. Criar migration de sermons**
Criar `supabase/migrations/003_sermons.sql`:
- Tabela `sermons`: `id`, `user_id`, `title`, `framework`, `bible_ref`, `bible_book`, `series_id`, `status`, `tags text[]`, `content jsonb default '[]'`, `word_count int`, `preached_at`, `deleted_at`, `search_vector tsvector`, `created_at`, `updated_at`
- Index GIN em `search_vector`
- Trigger de atualização: `to_tsvector('portuguese', title || ' ' || coalesce(bible_ref,''))`
- RLS: policy `user_id = auth.uid()` + filtrar `deleted_at IS NULL` nas policies de SELECT

**5. Criar clients Supabase**
Criar `src/lib/supabase/client.ts` e `src/lib/supabase/server.ts` conforme código nas Notas

**6. Gerar tipos TypeScript**
Executar: `supabase gen types typescript --project-id <id> > src/types/database.ts`

**7. Configurar middleware**
Criar `src/middleware.ts`:
- Atualizar sessão Supabase via `@supabase/ssr` em cada request
- Não fazer redirect aqui (apenas refresh de token), proteção de rotas é na issue 021

### Como Verificar
- Abrir Supabase Dashboard → Tables: profiles, series, sermons existem com colunas corretas
- Criar um usuário de teste → registro dispara trigger → linha em `profiles` criada automaticamente
- `src/types/database.ts` existe e tem tipos `Database['public']['Tables']['sermons']['Row']`
