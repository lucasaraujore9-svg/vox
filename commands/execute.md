# /execute, Implementar Issue

## O que este comando faz
Implementa a issue seguindo o plano aprovado. Só use após `/plan` ter sido aprovado.

## Pré-condições obrigatórias
- [ ] `/plan` foi executado e aprovado pelo usuário
- [ ] Dependências da issue estão completas
- [ ] `.env.local` está configurado

## Protocolo de execução

1. **Releia** o plano aprovado
2. **Implemente** na ordem: tipos → lib → componentes → página → testes manuais
3. **Padrões obrigatórios:**
   - Server Components por padrão, `"use client"` só quando necessário (interatividade, hooks)
   - Tipagem estrita, nunca `any`
   - Zod para validação de inputs
   - Tratamento de erro em todas as operações de banco
   - Loading states em operações assíncronas
   - **Design:** usar tokens de `--vox-*` de `design-system/colors_and_type.css`
   - **Ícones:** sempre de `design-system/vox/primitives.jsx` (VoxIcon), nunca Lucide/Hero
   - **Fontes:** Fraunces (display), Geist (UI), Geist Mono (mono), via `next/font`
   - **Nunca:** `#000000`, Inter, emoji, 3 cards iguais em linha
4. **Ao finalizar cada arquivo:** verifique contra o critério de aceite da issue
5. **Marque** cada critério de aceite como concluído

## Padrão de Server Action

```typescript
"use server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const schema = z.object({ ... })

export async function minhaAction(data: unknown) {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const supabase = await createClient()
  const { data: result, error } = await supabase.from("tabela").insert(parsed.data)
  if (error) return { error: error.message }

  return { data: result }
}
```

## Padrão de componente com dados

```typescript
// page.tsx, Server Component
import { createClient } from "@/lib/supabase/server"

export default async function MinhaPage() {
  const supabase = await createClient()
  const { data } = await supabase.from("tabela").select("*")
  return <MeuComponente data={data} />
}
```

## Após implementar
- Use `/review` para revisar contra a issue
- Se tudo ok: marque a issue como `[x] CONCLUÍDA` no topo do arquivo
- Use `/next` para saber qual issue trabalhar depois
