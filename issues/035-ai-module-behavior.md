# Issue 035 — Módulo de IA (Opcional por Usuário)

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /sermons/[id], /settings
**Depende de:** 030, 031, 051
**Prioridade:** P1

---

## O Que Fazer

Implementar o assistente de IA para estruturação de sermões.
O módulo é completamente opcional — ativado/desativado em `/settings`.

## Componentes Envolvidos

- `src/components/editor/AIAssistant.tsx` — Painel lateral de IA
- `src/app/api/ai/suggest/route.ts` — Route Handler para OpenAI
- `src/lib/ai/prompts.ts` — Prompts por framework homilético
- `src/hooks/useAI.ts` — Hook de estado e chamadas de IA
- `src/app/(app)/settings/page.tsx` — Toggle de ativação

## Comportamentos

### Guard de ativação
- `profile.ai_enabled = false` → nenhum elemento de IA visível em lugar algum
- `profile.ai_enabled = true` → botão "Assistente IA" aparece no editor

### Fluxo de uso
1. Usuário abre editor de um sermão
2. Botão "✨ Assistente" visível na barra do editor (se IA ativa)
3. Clique: abre painel lateral de IA
4. Painel mostra: campo de tema/texto bíblico + botão "Sugerir estrutura"
5. IA recebe: framework do sermão + tema + blocos existentes
6. IA retorna: sugestão de estrutura em JSON (array de blocos)
7. Usuário pode: aceitar todos / aceitar individualmente / ignorar
8. Aceitar bloco: insere no editor (não substitui — adiciona como novo bloco)

### Settings
- Toggle on/off em `/settings` → atualiza `profile.ai_enabled`
- Explicação clara: "O assistente usa IA para sugerir estruturas. Seu conteúdo
  não é armazenado permanentemente pela IA."

## Critério de Aceite

- [ ] Toggle em `/settings` ativa/desativa corretamente e persiste
- [ ] Botão "Assistente" invisível se `ai_enabled = false`
- [ ] Painel de IA abre/fecha corretamente
- [ ] Chamada à API de IA retorna sugestão válida
- [ ] Sugestão renderizada como cards com preview do conteúdo sugerido
- [ ] "Aceitar bloco" insere bloco no editor na posição correta
- [ ] Loading state durante chamada à IA
- [ ] Erro tratado (ex: API key inválida, rate limit)
- [ ] Rate limit: máximo 10 chamadas por hora por usuário

## Notas de Implementação

### Route Handler
```typescript
// src/app/api/ai/suggest/route.ts
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  // 1. Verificar autenticação
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  // 2. Verificar flag ai_enabled
  const { data: profile } = await supabase
    .from('profiles').select('ai_enabled').eq('id', user.id).single()
  if (!profile?.ai_enabled) {
    return Response.json({ error: 'Módulo de IA não ativado' }, { status: 403 })
  }

  // 3. Verificar rate limit (TODO: implementar com Supabase ou Upstash)

  const { framework, topic, existingBlocks } = await request.json()
  const prompt = buildPrompt(framework, topic, existingBlocks)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  })

  return Response.json({ suggestion: completion.choices[0].message.content })
}
```

### Prompts por framework
```typescript
// src/lib/ai/prompts.ts
export function buildPrompt(framework: string, topic: string, blocks: unknown[]) {
  const frameworkDescriptions = {
    expositivo: 'Sermão expositivo: Contexto Histórico → Explicação do Texto → Aplicação → Conclusão',
    // ...
  }

  return `Você é um assistente pastoral especializado em homilética.
Framework selecionado: ${frameworkDescriptions[framework]}
Tema/Texto bíblico: ${topic}
Blocos existentes: ${JSON.stringify(blocks)}

Gere uma sugestão de estrutura para este sermão em JSON com o formato:
{ "blocks": [{ "type": string, "title": string, "content": string }] }

Escreva em português brasileiro. Seja específico mas não prolixo.
O conteúdo deve servir como ponto de partida, não sermão completo.`
}
```

## Plano de Implementação

### Pré-requisitos
- Issue 031 concluída (editor com Zustand store e blocos funcionais)
- Issue 051 concluída (cliente OpenAI configurado)
- `profile.ai_enabled` coluna existente no schema (issue 020)

### Passos

**1. Completar prompts por framework**
Editar `src/lib/ai/prompts.ts`:
- Adicionar descrições para todos os 6 frameworks em `frameworkDescriptions`
- Exportar `buildPrompt(framework, topic, blocks)` conforme código das Notas

**2. Criar Route Handler de sugestão**
Criar `src/app/api/ai/suggest/route.ts`:
- Implementar conforme código das Notas
- Rate limit: usar tabela `ai_usage` no Supabase (coluna `calls_this_hour`, `hour_start`)
  ou abordagem simples: incrementar contador em `profiles.ai_calls_today` e verificar < 10
- Parsear resposta da IA com `AISuggestionSchema.parse(JSON.parse(content))` (Zod, da issue 051)
- Retornar `{ blocks: AIBlock[] }` tipado

**3. Criar hook useAI**
Criar `src/hooks/useAI.ts`:
- `"use client"` — estado: `isOpen`, `isLoading`, `suggestion: AIBlock[] | null`, `error`
- `suggest(framework, topic, existingBlocks)`: POST `/api/ai/suggest` → atualizar `suggestion`
- `acceptBlock(block)`: chama `editorStore.addBlock` com conteúdo convertido para TipTap JSON
- `acceptAll()`: aceitar todos os blocos em sequência

**4. Criar AIAssistant**
Criar `src/components/editor/AIAssistant.tsx`:
- Sheet lateral (shadcn) controlado por `isOpen` do `useAI`
- Campo textarea para tema/texto bíblico
- Botão "Sugerir estrutura" → chama `suggest()`
- Loading: spinner + "Consultando IA..."
- Resultado: lista de cards com preview do `block.content` (primeiros 100 chars) + botão "Aceitar"
- Botão "Aceitar todos" no rodapé do sheet

**5. Integrar no editor (com guard)**
Editar `src/components/editor/SermonEditor.tsx`:
- Receber prop `aiEnabled: boolean`
- Se `aiEnabled`: renderizar botão "Assistente IA" na barra + `<AIAssistant>`
- Se `!aiEnabled`: nada de IA aparece (nem botão)

**6. Criar página /settings com toggle**
Criar `src/app/(app)/settings/page.tsx`:
- Server Component: carregar `profile.ai_enabled`
- Seção "Módulo de IA": `<Switch>` com descrição de privacidade
- Server Action `toggleAI(enabled: boolean)`: `update profiles set ai_enabled = $1`

### Como Verificar
- Com `ai_enabled = false`: acessar editor → botão "Assistente" não aparece
- Ativar em `/settings` → voltar ao editor → botão aparece
- Abrir assistente, digitar tema, clicar "Sugerir" → loader → cards com sugestões aparecem
- "Aceitar" num bloco → bloco inserido no editor abaixo dos existentes
- Fazer 11 chamadas na mesma hora → 11ª retorna erro de rate limit
