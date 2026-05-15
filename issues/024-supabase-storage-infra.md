# Issue 024 — Supabase Storage (Bucket de Slides)

**Status:** [ ] PENDENTE
**Tipo:** infra
**Página:** global
**Depende de:** 020
**Prioridade:** P1

---

## O Que Fazer

Configurar o bucket `sermon-slides` no Supabase Storage com RLS adequada
e criar o Route Handler de upload que processa PDF/PPT em imagens WebP.

## Componentes Envolvidos

- `supabase/migrations/004_slides.sql` — tabela slides + migration type
- `supabase/migrations/005_storage.sql` — bucket + policies
- `src/app/api/sermons/slides/upload/route.ts` — Route Handler de upload
- `src/lib/supabase/storage.ts` — helpers de Storage

## Comportamentos

### Bucket
- Nome: `sermon-slides`
- Acesso: público (URLs públicas para exibir imagens)
- RLS: usuário só acessa pasta `{user_id}/`
- Estrutura: `{user_id}/{sermon_id}/slide-{NNN}.webp`

### Processamento de Upload
- PDF → imagens WebP (1280×720) por página
- PPT/PPTX → via LibreOffice headless ou serviço externo (ver notas)
- Limite: 50MB por arquivo
- Output: WebP com qualidade 85% (boa compressão)
- Após upload: cria registros na tabela `slides` com `image_url` e `storage_path`

### Google Slides
- Não faz upload de arquivo
- Apenas armazena `slides_url` na tabela `sermons`
- Thumbnails via URL pública do Google: `https://docs.google.com/presentation/d/{id}/export/png?pageid=p{N}`

## Critério de Aceite

- [ ] Bucket `sermon-slides` criado no Supabase
- [ ] RLS: usuário só vê/acessa seus próprios slides
- [ ] Upload de PDF gera imagens WebP por página no Storage
- [ ] Registros criados na tabela `slides` após upload
- [ ] Limite de 50MB aplicado com erro claro
- [ ] `storage_path` salvo para permitir deleção posterior
- [ ] Ao deletar sermão (soft delete), slides não são deletados imediatamente
- [ ] Função de limpeza de Storage quando sermão é permanentemente deletado (futuro)

## Notas de Implementação

### Migration SQL

```sql
-- supabase/migrations/004_slides.sql
create table public.slides (
  id            uuid default gen_random_uuid() primary key,
  sermon_id     uuid references public.sermons on delete cascade not null,
  "order"       int not null,
  image_url     text,
  storage_path  text,
  comment       text default '',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.slides enable row level security;
create policy "Usuário gerencia próprios slides"
  on slides for all
  using (
    exists (
      select 1 from public.sermons
      where sermons.id = slides.sermon_id
        and sermons.user_id = auth.uid()
    )
  );

create index slides_sermon_order_idx on slides(sermon_id, "order");

-- supabase/migrations/005_sermons_type.sql
alter table public.sermons
  add column type text not null default 'esboço'
    check (type in ('esboço', 'apresentação'));

alter table public.sermons
  add column slides_source text
    check (slides_source in ('upload', 'google_slides', 'manual'));

alter table public.sermons
  add column slides_url text;
```

### Bucket + Storage Policy

```sql
-- supabase/migrations/005_storage.sql
insert into storage.buckets (id, name, public)
values ('sermon-slides', 'sermon-slides', true);

create policy "Usuário gerencia seus slides"
  on storage.objects for all
  using (
    bucket_id = 'sermon-slides'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

### Route Handler de Upload

```typescript
// src/app/api/sermons/slides/upload/route.ts
import sharp from 'sharp'
import { fromPath } from 'pdf2pic'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const sermonId = formData.get('sermon_id') as string

  if (file.size > 50 * 1024 * 1024) {
    return Response.json({ error: 'Arquivo muito grande (máx 50MB)' }, { status: 400 })
  }

  // Processar PDF
  if (file.type === 'application/pdf') {
    const buffer = Buffer.from(await file.arrayBuffer())
    const pages = await convertPdfToImages(buffer)

    const slides = await Promise.all(pages.map(async (pageBuffer, index) => {
      const webp = await sharp(pageBuffer).resize(1280, 720, { fit: 'inside' }).webp({ quality: 85 }).toBuffer()
      const path = `${user.id}/${sermonId}/slide-${String(index + 1).padStart(3, '0')}.webp`

      const { data } = await supabase.storage.from('sermon-slides').upload(path, webp, { contentType: 'image/webp' })
      const { data: { publicUrl } } = supabase.storage.from('sermon-slides').getPublicUrl(path)

      return { order: index + 1, image_url: publicUrl, storage_path: path, comment: '' }
    }))

    const { error } = await supabase.from('slides').insert(
      slides.map(s => ({ ...s, sermon_id: sermonId }))
    )
    if (error) return Response.json({ error: error.message }, { status: 500 })

    return Response.json({ slides })
  }

  // PPT/PPTX: por enquanto, retornar erro com sugestão de converter para PDF
  if (file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) {
    return Response.json({
      error: 'PPT/PPTX em desenvolvimento. Por enquanto, exporte como PDF no PowerPoint e faça upload do PDF.'
    }, { status: 400 })
  }

  return Response.json({ error: 'Formato não suportado. Use PDF.' }, { status: 400 })
}
```

### Packages necessários
```bash
npm install sharp pdf2pic
# pdf2pic usa graphicsmagick — instalado no ambiente da Vercel
```

### Atenção — PPT/PPTX
- Conversão de PPT no servidor requer LibreOffice ou uma API externa (Cloudmersive, ConvertAPI)
- Para o MVP: aceitar apenas PDF + mostrar mensagem clara para PPT ("exporte como PDF")
- Fase 2: integrar serviço de conversão

## Plano de Implementação

### Pré-requisitos
- Issue 020 concluída (schema base + Supabase configurado)
- `npm install sharp pdf2pic`

### Passos

**1. Aplicar migration de slides e tipo**
Criar `supabase/migrations/004_slides.sql` e `supabase/migrations/005_sermons_type.sql`:
- Tabela `slides` com RLS conforme spec
- Colunas `type`, `slides_source`, `slides_url` em `sermons`
- Executar: `npx supabase db push` ou `npx supabase migration up`

**2. Criar bucket + policy de Storage**
Criar `supabase/migrations/005_storage.sql`:
- `INSERT INTO storage.buckets` + policy `storage.foldername(name)[1] = auth.uid()::text`
- Aplicar migration

**3. Criar helper de Storage**
Criar `src/lib/supabase/storage.ts`:
- `uploadWebp(userId, sermonId, index, buffer)` → faz upload e retorna `{publicUrl, storagePath}`
- `deleteSlide(storagePath)` → remove arquivo do bucket

**4. Criar Route Handler de upload**
Criar `src/app/api/sermons/slides/upload/route.ts`:
- Verificar auth com `createClient()` server
- Verificar tamanho (> 50MB → 400)
- PDF: `pdf2pic.fromBuffer()` → array de buffers → `sharp().resize(1280,720).webp({quality:85})`
- Upload via `uploadWebp` + `INSERT INTO slides` batch
- PPT/PPTX: retornar 400 com mensagem amigável
- Retornar `{slides: [{order, image_url, storage_path}]}`

**5. Regenerar tipos**
- `npx supabase gen types typescript --local > src/types/database.ts`

### Como Verificar
- `POST /api/sermons/slides/upload` com PDF pequeno (< 10 páginas): retorna array de slides com URLs
- Imagens aparecem no bucket `sermon-slides` em `{userId}/{sermonId}/slide-NNN.webp`
- Registros criados na tabela `slides` com `image_url` e `storage_path` corretos
- Upload de PPT retorna erro 400 com mensagem legível
- Upload de arquivo > 50MB retorna erro 400 antes de processar
