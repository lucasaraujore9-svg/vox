# Issue 038, Slides Upload: Behavior (Fluxo Completo)

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /sermons/new (Step 2B e 3B), /sermons/[id] (tipo apresentação)
**Depende de:** 007, 024, 037
**Prioridade:** P1

---

## O Que Fazer

Conectar o painel de slides (proto 007) ao Supabase Storage e à tabela `slides`,
implementando o fluxo completo de upload → processamento → exibição → edição de comentários.

## Componentes Envolvidos

- `src/components/slides/SlidesUpload.tsx`, dropzone funcional
- `src/components/slides/SlidesPanel.tsx`, lista + comentário conectados
- `src/components/slides/GoogleSlidesInput.tsx`, validação e save de URL
- `src/hooks/useSlides.ts`, CRUD de slides + upload
- `src/app/api/sermons/slides/upload/route.ts`, Route Handler (issue 024)

## Comportamentos

### Step 2B, Escolha da fonte
1. Usuário escolhe entre Upload / Google Slides / Começar em branco
2. Seleção salva `sermons.slides_source` no Supabase:
   - `upload` → avança para Step 3B (upload)
   - `google_slides` → avança para Step 3B (campo de URL)
   - `manual` → vai direto para `/sermons/{id}` (painel vazio, pode adicionar slides depois)

### Fluxo Upload (PDF)
1. Usuário arrasta ou seleciona arquivo PDF (máx 50MB)
2. Upload imediato: `POST /api/sermons/slides/upload` com FormData
3. Durante processamento:
   - Progress bar por página convertida
   - Texto: "Processando slide X de Y…"
4. Após conclusão:
   - Slides aparecem na lista lateral com miniaturas WebP
   - Registros criados na tabela `slides` com `image_url` e `storage_path`
   - `sermons.slides_source = 'upload'` confirmado
5. Se arquivo PPT/PPTX: exibe mensagem clara (sem processar)
   - "Formato PPT ainda não suportado. Exporte como PDF no PowerPoint e tente novamente."
6. Se > 50MB: mensagem de erro antes do envio
   - "Arquivo muito grande. Limite: 50MB."

### Fluxo Google Slides
1. Input de URL com validação de formato:
   - Aceita: `https://docs.google.com/presentation/d/{id}/...`
   - Rejeita formatos inválidos com mensagem inline
2. Ao salvar:
   - `sermons.slides_url = url` no Supabase
   - `sermons.slides_source = 'google_slides'`
3. Preview: iframe embed carregado com a URL pública
4. Aviso: "Certifique-se de que a apresentação está definida como pública ou com acesso por link"

### Fluxo Manual (começar em branco)
- Painel de slides abre com lista vazia
- Botão "+ Adicionar slide" abre input para URL de imagem (fase MVP)
  - Futuro: editor de slide nativo

### Edição de Comentários (em tempo real)
1. Usuário seleciona slide na lista lateral
2. Textarea TipTap carrega o `comment` atual do slide
3. Auto-save com debounce de 800ms:
   ```
   UPDATE slides SET comment = $1, updated_at = now() WHERE id = $2
   ```
4. Indicador "Salvo há Xs" atualizado a cada save
5. Offline: salva no IndexedDB, sincroniza ao reconectar

### Reordenação de Slides
- Drag-and-drop via `@dnd-kit/sortable` (mesmo do editor de blocos)
- Ao soltar: `UPDATE slides SET "order" = $1 WHERE id = $2` para cada slide afetado
- Otimistic update, lista reordena antes de confirmar com Supabase

### Deleção de Slide
- Ícone de lixeira aparece no hover da miniatura
- Confirmação simples (sem modal): "Deletar este slide?"
- Deleta registro de `slides` + arquivo do Storage (`storage_path`)
- `UPDATE slides SET "order" = ...` para manter sequência

## Critério de Aceite

- [ ] Upload de PDF processa todas as páginas e exibe miniaturas
- [ ] Progress bar durante processamento
- [ ] Registros criados na tabela `slides` com `image_url` e `storage_path`
- [ ] Erro claro para PPT/PPTX e para arquivos > 50MB
- [ ] URL do Google Slides validada e salva no Supabase
- [ ] Comentário auto-salva com debounce (indicador de status)
- [ ] Reordenação drag-and-drop funcional com save no banco
- [ ] Deleção de slide remove do Storage e do banco
- [ ] Offline: comentários salvos no IndexedDB e sincronizados

## Notas de Implementação

```typescript
// src/hooks/useSlides.ts
export function useSlides(sermonId: string) {
  const [slides, setSlides] = useState<Slide[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)

  async function uploadFile(file: File) {
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('sermon_id', sermonId)

    const res = await fetch('/api/sermons/slides/upload', { method: 'POST', body: form })
    const data = await res.json()

    if (!res.ok) throw new Error(data.error)
    setSlides(prev => [...prev, ...data.slides])
    setUploading(false)
  }

  async function updateComment(slideId: string, comment: string) {
    await supabase.from('slides').update({ comment, updated_at: new Date().toISOString() }).eq('id', slideId)
  }

  async function reorder(from: number, to: number) {
    // optimistic update + batch UPDATE por ordem
  }

  async function deleteSlide(slide: Slide) {
    await supabase.storage.from('sermon-slides').remove([slide.storage_path])
    await supabase.from('slides').delete().eq('id', slide.id)
    setSlides(prev => prev.filter(s => s.id !== slide.id))
  }

  return { slides, uploading, uploadProgress, uploadFile, updateComment, reorder, deleteSlide }
}
```

### Validação de URL Google Slides
```typescript
function isValidGoogleSlidesUrl(url: string): boolean {
  return /^https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9_-]+/.test(url)
}
```

### IndexedDB (offline)
- Comentários pendentes armazenados em `vox-pending-comments` store
- `useOfflineSync` detecta reconexão e envia batch de updates

## Plano de Implementação

### Pré-requisitos
- Issue 007 concluída (SlidesPanel visual pronto)
- Issue 024 concluída (Route Handler de upload + bucket Storage criados)
- Issue 037 concluída (wizard cria sermão com `type` antes de chegar aqui)
- `npm install idb` (IndexedDB wrapper)

### Passos

**1. Criar useSlides hook**
Criar `src/hooks/useSlides.ts` (`"use client"`):
- `fetchSlides(sermonId)` → `SELECT * FROM slides WHERE sermon_id = ? ORDER BY "order"`
- `uploadFile(file)` → valida tamanho → `POST /api/sermons/slides/upload` → atualiza state
- `updateComment(slideId, comment)` → debounce 800ms → `UPDATE slides SET comment = ?`
- `reorder(from, to)` → optimistic update + batch `UPDATE slides SET "order" = ?`
- `deleteSlide(slide)` → remove Storage + DELETE da tabela
- `saveGoogleSlidesUrl(url)` → `UPDATE sermons SET slides_url = ?, slides_source = 'google_slides'`

**2. Validação de URL Google Slides**
Criar `src/lib/slides/validation.ts`:
- `isValidGoogleSlidesUrl(url)` conforme regex da spec
- Mensagem de erro inline (não toast) ao falhar validação

**3. Conectar SlidesUpload ao upload real**
Editar `src/components/slides/SlidesUpload.tsx`:
- Verificar tamanho antes de enviar (erro imediato se > 50MB)
- Chamar `uploadFile()` do hook; exibir progress bar com mensagem "Processando slide X de Y…"
- Erro PPT: exibir mensagem inline

**4. Conectar SlideComment ao auto-save**
Editar `src/components/slides/SlideComment.tsx`:
- Ao mudar comentário: chamar `updateComment()` com debounce 800ms
- Indicador de status: "Salvando…" / "Salvo há Xs" (atualizado no callback)
- Offline: salvar em IndexedDB via `idb`; `useOfflineSync` envia ao reconectar

**5. Conectar SlidesPanel ao hook**
Editar `src/components/slides/SlidesPanel.tsx`:
- Substituir mocks por dados reais do `useSlides`
- `onReorder` → `reorder()`; `onDeleteSlide` → `deleteSlide()`

**6. Salvar slides_source no wizard**
Editar `src/app/(app)/sermons/new/page.tsx` Step 2B:
- Ao confirmar fonte: `UPDATE sermons SET slides_source = ?`
- `manual` → redirecionar direto para `/sermons/{id}`

### Como Verificar
- Upload de PDF: miniaturas aparecem na lista após processamento
- Comentário editado: "Salvando…" → "Salvo há 2s" em sequência
- Reordenar slides: nova ordem reflete no banco após soltar
- Deletar slide: remove da lista + arquivo some do Storage
- Upload PPT: mensagem de erro legível sem processar
- Arquivo > 50MB: erro antes de qualquer envio ao servidor
