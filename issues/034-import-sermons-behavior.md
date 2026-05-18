# Issue 034, Importação de Sermões

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /import
**Depende de:** 030
**Prioridade:** P1

---

## O Que Fazer

Implementar a importação de sermões existentes via upload de arquivo
(.docx, .txt) ou colagem de texto.

## Componentes Envolvidos

- `src/app/(app)/import/page.tsx`, Página de importação
- `src/app/api/sermons/import/route.ts`, Route Handler para processar arquivo
- `src/components/sermon/ImportForm.tsx`, Formulário de importação

## Comportamentos

- **Upload de arquivo:**
  - Aceita `.docx` e `.txt`
  - Limite: 10MB
  - Extrai texto bruto do arquivo
- **Colagem de texto:**
  - Textarea com textarea grande para colar conteúdo
- **Preview:** exibe os primeiros 500 chars do texto extraído
- **Criação do sermão:**
  - Framework padrão: "livre" (único bloco com todo o conteúdo)
  - Campos obrigatórios: título
  - Campos opcionais: referência bíblica, data
  - Redireciona para `/sermons/[id]` após criação

## Critério de Aceite

- [ ] Upload de `.txt` extrai texto corretamente
- [ ] Upload de `.docx` extrai texto corretamente
- [ ] Cola de texto funciona
- [ ] Limite de 10MB aplicado (erro claro se exceder)
- [ ] Preview do texto extraído renderizando
- [ ] Sermão criado com framework "livre" e conteúdo importado
- [ ] Redirect para editor após importação
- [ ] Loading state durante upload/processamento

## Notas de Implementação

### Packages
```bash
npm install mammoth  # para .docx
```

### Route Handler
```typescript
// src/app/api/sermons/import/route.ts
import mammoth from 'mammoth'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: 'Arquivo muito grande (máx 10MB)' }, { status: 400 })
  }

  let text = ''
  if (file.name.endsWith('.docx')) {
    const buffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
    text = result.value
  } else if (file.name.endsWith('.txt')) {
    text = await file.text()
  }

  return Response.json({ text })
}
```

### Criação do sermão importado
- Conteúdo vai para um único bloco do tipo `livre`
- Título default: nome do arquivo sem extensão (editável antes de salvar)

## Plano de Implementação

### Pré-requisitos
- Issue 030 concluída (`createSermon` Server Action disponível)
- `npm install mammoth`

### Passos

**1. Criar Route Handler de extração**
Criar `src/app/api/sermons/import/route.ts`:
- Implementar conforme código das Notas
- Aceitar também campo `text` no FormData (quando usuário cola texto diretamente)
- Retornar `{ text: string }` em ambos os casos
- Validar extensão do arquivo além do tamanho (rejeitar outros formatos)

**2. Criar ImportForm**
Criar `src/components/sermon/ImportForm.tsx`:
- `"use client"`, estado: `extractedText`, `title`, `bibleRef`, `isLoading`, `error`
- Aba 1 (Upload): `<input type="file" accept=".docx,.txt">` com drag-and-drop zone visual
- Aba 2 (Colar): `<textarea>` grande (min 200px)
- Ao selecionar arquivo ou confirmar cola: POST para `/api/sermons/import` → salvar `extractedText`
- Preview: mostrar primeiros 500 chars com `...` (truncado)
- Campos de metadados: Input `title` (required), `bibleRef` (optional), `preached_at` (optional)
- Botão "Importar Sermão" → chama Server Action de criação

**3. Criar Server Action de importação**
Adicionar `importSermon(data)` em `src/lib/supabase/actions/sermons.ts`:
- Schema Zod: `title` required, `content` (texto bruto), `bible_ref` optional
- Converter texto bruto para bloco único do tipo `livre`:
  ```typescript
  const content = [{ id: crypto.randomUUID(), type: 'livre', title: 'Conteúdo', order: 0, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: rawText }] }] } }]
  ```
- Insert com `framework: 'livre'` → redirect para `/sermons/[id]`

**4. Criar página /import**
Criar `src/app/(app)/import/page.tsx`:
- Layout simples com título + `<ImportForm>`
- `<Tabs>` shadcn para alternar entre Upload e Colar

### Como Verificar
- Fazer upload de `.txt` → texto aparece no preview truncado → preencher título → salvar → redireciona para editor com conteúdo no bloco único
- Fazer upload de `.docx` → texto extraído corretamente (sem marcações XML)
- Tentar arquivo > 10MB → mensagem de erro clara
- Colar texto longo → preview truncado correto → importar cria sermão com framework "livre"
