# Issue 036, Integração de Versículos Bíblicos no Editor

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /sermons/new, /sermons/[id]
**Depende de:** 031, 050
**Prioridade:** P1

---

## O Que Fazer

Implementar busca e inserção de versículos bíblicos diretamente no editor,
com suporte a múltiplas traduções e inserção como bloco especial de versículo.

## Componentes Envolvidos

- `src/components/editor/BibleSearch.tsx`, Componente de busca (Popover)
- `src/app/api/bible/route.ts`, Proxy para API.Bible
- `src/lib/bible/client.ts`, Wrapper da API.Bible
- `src/lib/bible/versions.ts`, Traduções disponíveis e IDs da API

## Comportamentos

### Busca de versículo
- Botão "📖 Versículo" na toolbar do editor
- Clique: abre Popover com campo de busca
- Busca por referência (ex: "João 3:16") ou trecho de texto
- Selector de tradução (ARC, NVI, NVT, NTLH)
- Tradução padrão: `profile.bible_version` do usuário
- Resultados: mostra o versículo encontrado com referência
- "Inserir": adiciona como bloco especial `versiculo` no editor

### Bloco de versículo
- Tipo especial no TipTap (extension customizada)
- Visual diferenciado: blockquote com borda lateral colorida
- Mostra: texto do versículo + referência (ex: João 3:16 - NVI)
- Não editável diretamente (read-only, exceto a opção de remover)

### Modo apresentação
- Bloco de versículo renderizado com destaque visual diferente do texto comum

## Critério de Aceite

- [ ] Botão "Versículo" na toolbar abre busca
- [ ] Busca por referência retorna versículo correto
- [ ] Selector de tradução funciona (ARC, NVI, NVT, NTLH)
- [ ] Tradução padrão vem do perfil do usuário
- [ ] Versículo inserido como bloco especial no editor
- [ ] Bloco de versículo visualmente diferenciado
- [ ] Bloco de versículo salvo no `content` JSONB do sermão
- [ ] Cache de versículos (evitar chamadas repetidas à API)
- [ ] Erro tratado (versículo não encontrado, API indisponível)

## Notas de Implementação

### Traduções disponíveis na API.Bible
```typescript
// src/lib/bible/versions.ts
export const BIBLE_VERSIONS = {
  ARC: { id: 'TODO: ID da ARC na API.Bible', name: 'Almeida Revista e Corrigida' },
  NVI: { id: 'TODO: ID da NVI na API.Bible', name: 'Nova Versão Internacional' },
  NVT: { id: 'TODO: ID da NVT na API.Bible', name: 'Nova Versão Transformadora' },
  NTLH: { id: 'TODO: ID da NTLH na API.Bible', name: 'Nova Tradução na Linguagem de Hoje' }
}
// ATENÇÃO: Verificar disponibilidade e licenças de cada tradução na API.Bible
// Algumas traduções podem não estar disponíveis na API pública
```

### Proxy Route (esconde API key)
```typescript
// src/app/api/bible/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('ref')
  const version = searchParams.get('version') ?? 'ARC'

  const response = await fetch(
    `${process.env.BIBLE_API_URL}/passages?...`,
    { headers: { 'api-key': process.env.BIBLE_API_KEY! } }
  )

  const data = await response.json()
  return Response.json(data)
}
```

### Cache
- Usar `next/cache` com `revalidate: Infinity` para versículos (imutáveis)
- Cache adicional no cliente com `Map` em memória para sessão corrente

### TipTap Extension de versículo
```typescript
// Extension customizada que renderiza o bloco de versículo como Node especial
// Não-editável, com atributos: text, reference, version
```

### Atenção sobre licenças
- Verificar os termos de uso da API.Bible para cada tradução antes de usar
- ARC é domínio público; NVI/NVT têm direitos autorais, verificar permissões
- TODO: preencher IDs corretos das traduções após criar conta na API.Bible

## Plano de Implementação

### Pré-requisitos
- Issue 031 concluída (editor com TipTap e blocos funcionais)
- Issue 050 concluída (wrapper API.Bible e proxy disponíveis)
- IDs das traduções preenchidos em `versions.ts` após testes na API

### Passos

**1. Criar TipTap Extension de versículo**
Criar `src/lib/editor/bible-verse-extension.ts`:
- `Node.create({ name: 'bibleVerse', group: 'block', atom: true })`
- Atributos: `text: string`, `reference: string`, `version: string`
- `renderHTML`: retorna `<blockquote data-type="bible-verse">` com classe CSS para borda dourada (--vox-gold)
- `addNodeView`: ReactNodeViewRenderer para bloco read-only com botão remover

**2. Atualizar SermonBlock para incluir a extension**
Editar `src/components/editor/SermonBlock.tsx`:
- Adicionar `BibleVerseExtension` à lista de extensions do `useEditor`
- Isso permite que blocos de versículo sejam inseridos e renderizados

**3. Criar Route Handler proxy**
Criar `src/app/api/bible/route.ts`:
- GET com params `ref` e `version`
- Chamar `getVerse(ref, BIBLE_VERSIONS[version].id)` do wrapper (issue 050)
- Cache: `next: { revalidate: false }` (versículos imutáveis)
- Tratar erros: 404 se versículo não encontrado, 503 se API indisponível

**4. Criar BibleSearch**
Criar `src/components/editor/BibleSearch.tsx`:
- Props: `editor: Editor | null`, `defaultVersion: string`
- `<Popover>` do shadcn com trigger botão "Versículo"
- Dentro: Input de referência + Select de tradução (opções de `BIBLE_VERSIONS`)
- Cache em memória: `useRef<Map<string, VerseResult>>(new Map())`
- Ao buscar: verificar cache → se miss, fetch `/api/bible?ref=...&version=...`
- Resultado: texto do versículo + botão "Inserir"
- Inserir: `editor.commands.insertContent({ type: 'bibleVerse', attrs: { text, reference, version } })`

**5. Integrar BibleSearch no BlockToolbar**
Editar `src/components/editor/BlockToolbar.tsx`:
- Adicionar `<BibleSearch editor={editor} defaultVersion={userBibleVersion} />` no final da toolbar
- `userBibleVersion` passado como prop do SermonEditor (obtido do profile no Server Component pai)

**6. Estilizar bloco de versículo no modo apresentação**
Editar `src/components/present/PresentationBlock.tsx`:
- Adicionar CSS para `blockquote[data-type="bible-verse"]`: borda esquerda 3px `--vox-gold`, fundo levemente dourado, texto em itálico

### Como Verificar
- Abrir editor, clicar "Versículo": popover abre
- Digitar "João 3:16" + tradução ARC → texto do versículo aparece
- Clicar "Inserir" → bloco de versículo aparece no editor com visual diferenciado (borda dourada)
- Salvar sermão → recarregar → bloco de versículo persiste corretamente
- Abrir modo apresentação → versículo renderizado com destaque visual
