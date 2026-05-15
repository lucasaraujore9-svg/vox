# Issue 051 — OpenAI API Integration

**Status:** [ ] PENDENTE
**Tipo:** integration
**Página:** global (lib)
**Depende de:** 020
**Prioridade:** P1

---

## O Que Fazer

Configurar o cliente OpenAI e implementar o wrapper de chamadas para o
módulo de IA opcional do VOX.

## Componentes Envolvidos

- `src/lib/ai/client.ts` — OpenAI client singleton
- `src/lib/ai/prompts.ts` — Prompts por framework homilético
- `src/lib/ai/types.ts` — Tipos de input/output da IA
- `src/app/api/ai/suggest/route.ts` — Route Handler (implementado na 035)

## Comportamentos

- Cliente OpenAI inicializado com API key do ambiente
- Função `suggestSermonStructure(framework, topic, existingBlocks)` → retorna array de blocos sugeridos
- Prompts específicos por framework (6 frameworks)
- Resposta sempre em JSON válido (response_format: json_object)
- Timeout de 30s na chamada
- Retry automático em caso de erro de rate limit (1 retry com backoff)

## Critério de Aceite

- [ ] OpenAI API key no `.env.local` e funcionando
- [ ] `suggestSermonStructure` retorna array de blocos válidos
- [ ] Prompts para todos os 6 frameworks implementados
- [ ] Resposta em JSON estruturado (tipado com Zod)
- [ ] Timeout de 30s aplicado
- [ ] Retry em rate limit (429) funciona
- [ ] Erro tipado retornado quando API falha

## Notas de Implementação

### Package
```bash
npm install openai
```

### Client singleton
```typescript
// src/lib/ai/client.ts
import OpenAI from 'openai'

let client: OpenAI | null = null

export function getOpenAIClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000,
      maxRetries: 1
    })
  }
  return client
}
```

### Schema de output (Zod)
```typescript
// src/lib/ai/types.ts
import { z } from 'zod'

export const AIBlockSchema = z.object({
  type: z.string(),
  title: z.string(),
  content: z.string()
})

export const AISuggestionSchema = z.object({
  blocks: z.array(AIBlockSchema)
})

export type AISuggestion = z.infer<typeof AISuggestionSchema>
```

### Custo estimado (GPT-4o)
- ~$0.005 por sugestão (input ~500 tokens + output ~300 tokens)
- Com 10 req/hora/usuário e 100 usuários ativos: ~$5/hora → monitorar

### Alternativa de custo menor
- Se custo for problema: usar `gpt-4o-mini` para sugestões de estrutura
- Reservar `gpt-4o` para sugestões de conteúdo detalhado (futuro)

## Plano de Implementação

### Pré-requisitos
- Conta OpenAI com API key criada e créditos disponíveis
- `OPENAI_API_KEY` no `.env.local`
- `npm install openai zod` (zod já deve estar instalado)

### Passos

**1. Criar tipos de input/output**
Criar `src/lib/ai/types.ts`:
- `AIBlockSchema` e `AISuggestionSchema` conforme código das Notas
- Exportar `AIBlock` e `AISuggestion` (tipos inferidos)
- Adicionar `AIRequestSchema`: `z.object({ framework: z.enum([...6 frameworks...]), topic: z.string().min(1).max(500), existingBlocks: z.array(z.unknown()).optional() })`

**2. Criar client singleton**
Criar `src/lib/ai/client.ts`:
- Implementar `getOpenAIClient()` conforme código das Notas
- `timeout: 30000`, `maxRetries: 1` (retry automático em 429)
- Adicionar guard: se `!process.env.OPENAI_API_KEY`, lançar erro descritivo em dev

**3. Criar prompts por framework**
Criar `src/lib/ai/prompts.ts`:
- `buildPrompt(framework, topic, existingBlocks)` conforme código da issue 035
- Implementar `frameworkDescriptions` para todos os 6 frameworks
- Manter prompts concisos: system prompt fixo (função pastoral) + user prompt variável

**4. Criar função principal de sugestão**
Adicionar `suggestSermonStructure` em `src/lib/ai/client.ts` (ou arquivo separado `src/lib/ai/suggest.ts`):
- Chamar `getOpenAIClient().chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, ... })`
- Parsear resposta com `AISuggestionSchema.parse(JSON.parse(content))`
- Se parse falhar: lançar `AIParseError` com a resposta bruta para debugging
- Retornar `AISuggestion`

**5. Adicionar variáveis ao .env.example**
Editar `.env.example`:
- `OPENAI_API_KEY=sk-...`

### Como Verificar
- Criar teste manual em `src/lib/ai/suggest.test.ts` (ou testar via Route Handler):
  - Chamar `suggestSermonStructure('expositivo', 'Amor incondicional - João 3:16', [])`
  - Verificar que retorna `{ blocks: [...] }` com ao menos 2 blocos
  - Verificar que cada bloco tem `type`, `title` e `content` como strings
- Timeout: usar conexão lenta ou mock para verificar que 30s é respeitado
- Com `OPENAI_API_KEY` inválida: erro descritivo aparece nos logs do servidor
