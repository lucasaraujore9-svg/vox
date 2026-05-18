# Issue 050, API.Bible Integration

**Status:** [ ] PENDENTE
**Tipo:** integration
**Página:** global (lib)
**Depende de:** 020
**Prioridade:** P1

---

## O Que Fazer

Criar o wrapper completo para a API.Bible: autenticação, busca por referência,
busca por texto, suporte a traduções e tratamento de erros.

## Componentes Envolvidos

- `src/lib/bible/client.ts`, Wrapper da API.Bible
- `src/lib/bible/versions.ts`, Mapeamento de traduções e IDs
- `src/lib/bible/types.ts`, Tipos TypeScript da API
- `src/app/api/bible/route.ts`, Route Handler proxy

## Comportamentos

- Criar conta em api.scripture.api.bible e obter API key
- Mapear IDs das traduções disponíveis (ARC, NVI, NVT, NTLH)
- Implementar busca por referência (ex: "João 3:16")
- Implementar busca por texto (full-text na tradução)
- Cache de resposta: versículos são imutáveis, cache permanente
- Tratamento de rate limit (API.Bible limita requisições por dia)

## Critério de Aceite

- [ ] Conta criada na API.Bible e API key no `.env.local`
- [ ] IDs de todas as traduções disponíveis mapeados em `versions.ts`
- [ ] `getVerseByReference('João 3:16', 'NVI')` retorna versículo correto
- [ ] `searchVerses('amor de Deus', 'ARC')` retorna versículos relevantes
- [ ] Cache funcionando (segunda chamada idêntica não faz request HTTP)
- [ ] Erro claro quando referência não encontrada
- [ ] Erro claro quando tradução não disponível
- [ ] Route Handler proxy funcionando em `/api/bible`

## Notas de Implementação

### API.Bible docs
- https://scripture.api.bible/
- Endpoint de passagem: `GET /v1/bibles/{bibleId}/passages/{passageId}`
- Endpoint de busca: `GET /v1/bibles/{bibleId}/search?query={query}`

### Wrapper
```typescript
// src/lib/bible/client.ts
const BASE_URL = process.env.BIBLE_API_URL!
const API_KEY = process.env.BIBLE_API_KEY!

export async function getVerse(reference: string, versionId: string) {
  const url = `${BASE_URL}/bibles/${versionId}/passages/${encodeRef(reference)}`
  const response = await fetch(url, {
    headers: { 'api-key': API_KEY },
    next: { revalidate: false }  // cache permanente
  })
  if (!response.ok) throw new Error(`Versículo não encontrado: ${reference}`)
  return response.json()
}
```

### Atenção importante
- A API.Bible tem plano gratuito limitado (~5000 requisições/mês)
- Algumas traduções brasileiras populares (NVI, NVT) podem não estar disponíveis
  na API pública, verificar antes de prometer ao usuário
- Alternativa se NVI/NVT não disponíveis: ARC (domínio público) + NTLH
- Documentar quais traduções estão efetivamente disponíveis após testes

## Plano de Implementação

### Pré-requisitos
- Conta criada em https://scripture.api.bible → API key obtida
- `BIBLE_API_KEY` e `BIBLE_API_URL=https://api.scripture.api.bible/v1` no `.env.local`
- Issue 020 concluída (estrutura de pastas `src/lib/` existe)

### Passos

**1. Criar tipos da API**
Criar `src/lib/bible/types.ts`:
- `interface BiblePassage { id: string; orgId: string; content: string; reference: string; ... }`
- `interface BibleSearchResult { query: string; passages: BiblePassage[]; verses: { id: string; orgId: string; text: string; reference: string }[] }`

**2. Mapear versões disponíveis**
Criar `src/lib/bible/versions.ts`:
- Acessar `GET /v1/bibles?language=por` com a API key para listar bíblias em português
- Preencher `BIBLE_VERSIONS` com IDs reais obtidos da API
- Marcar traduções indisponíveis como `available: false` e não exibi-las na UI

**3. Criar wrapper client (server-only)**
Criar `src/lib/bible/client.ts`:
- `encodeRef(reference)`: converter "João 3:16" para format da API (ex: `JHN.3.16`)
 , usar mapeamento de livros PT → abreviatura API.Bible
- `getVerse(reference, versionId)`: conforme código das Notas com `next: { revalidate: false }`
- `searchVerses(query, versionId)`: `GET /bibles/{id}/search?query={query}&limit=10`
- Ambas as funções lançam erros tipados: `BibleNotFoundError`, `BibleAPIError`

**4. Adicionar variáveis ao .env.example**
Editar `.env.example`:
- `BIBLE_API_KEY=` e `BIBLE_API_URL=https://api.scripture.api.bible/v1`

**5. Criar Route Handler proxy**
Criar `src/app/api/bible/route.ts`:
- GET: receber `ref` e `version` como searchParams
- Validar que `version` existe em `BIBLE_VERSIONS` e `available: true`
- Chamar `getVerse` ou `searchVerses` dependendo do param `mode=passage|search`
- Retornar `{ text: string, reference: string, version: string }` normalizado
- Erros: 404 (não encontrado), 400 (tradução inválida), 503 (API Bible down)

### Como Verificar
- `curl "http://localhost:3000/api/bible?ref=João+3:16&version=ARC"` retorna JSON com texto do versículo
- Segunda chamada idêntica: verificar no Network tab que não sai request HTTP (cache hit)
- `curl "http://localhost:3000/api/bible?ref=João+3:16&version=INVALIDA"` retorna 400
- `curl "http://localhost:3000/api/bible?mode=search&query=amor+de+Deus&version=ARC"` retorna lista de versículos
