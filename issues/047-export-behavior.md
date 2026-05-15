# Issue 047 — Exportação de Conteúdo: Behavior (PDF / DOCX / TXT)

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /sermons/[id], /sermons (ação no card)
**Depende de:** 031, 030
**Prioridade:** P2

---

## O Que Fazer

Implementar a exportação de sermões/palestras/aulas em três formatos:
PDF (para imprimir e compartilhar), DOCX (para editar no Word) e TXT (simples).

## Componentes Envolvidos

- `src/app/api/sermons/export/route.ts` — Route Handler de exportação
- `src/components/sermon/ExportMenu.tsx` — dropdown de formatos no editor
- `src/lib/export/pdf.ts` — gerador de PDF com blocos coloridos
- `src/lib/export/docx.ts` — gerador de DOCX
- `src/lib/export/txt.ts` — gerador de TXT plano

## Comportamentos

### Trigger de exportação
- Botão "Exportar" no editor (toolbar do sermão)
- Dropdown com opções: PDF / DOCX / TXT
- Também disponível no card do banco via ações de hover

### Formato do export

**PDF:**
- Papel A4, margens 2cm
- Header: título do sermão + referência bíblica + data
- Cada bloco com sua barra colorida à esquerda (cor do tipo do bloco)
- Texto formatado (negrito, itálico preservados)
- Rodapé: "Gerado pelo VOX" + data de export + número de página
- Fonte: 12pt, line-height 1.6

**DOCX:**
- Título no estilo Heading 1
- Cada bloco: Heading 2 para o nome do tipo + parágrafo para o conteúdo
- Formatação básica preservada (negrito, itálico, listas)
- Sem barra colorida (DOCX não suporta borda lateral facilmente)

**TXT:**
- Texto plano sem formatação
- Blocos separados por linha em branco
- Cada bloco: "=== TIPO ===" + conteúdo
- Simples, para copiar e colar

### Route Handler
```
GET /api/sermons/export?id={sermonId}&format=pdf|docx|txt
```
- Verifica autenticação + `user_id` do sermão
- Converte `content` JSONB → formato solicitado
- Retorna arquivo com headers corretos para download

### Packages necessários
```bash
npm install jspdf @types/jspdf           # PDF no servidor
npm install docx                         # DOCX
# TXT: sem package, concatenação simples
```

## Critério de Aceite

- [ ] ExportMenu aparece no editor com 3 opções
- [ ] PDF gerado com título, blocos coloridos e rodapé
- [ ] DOCX gerado com heading e parágrafos
- [ ] TXT gerado com separadores de bloco
- [ ] Download inicia automaticamente no browser
- [ ] Acesso a sermão de outro usuário retorna 403
- [ ] Loading state no botão durante geração
- [ ] Erro claro se geração falhar

## Plano de Implementação

### Pré-requisitos
- Issue 031 concluída (conteúdo dos blocos em JSONB no Supabase)
- `npm install jspdf docx`

### Passos

**1. Criar lib de exportação TXT**
Criar `src/lib/export/txt.ts`:
- Recebe `blocks: SermonBlock[]`
- Para cada bloco: `=== ${block.type.toUpperCase()} ===\n${plainText}\n\n`
- TipTap JSON → texto plano via `generateText(content, [StarterKit])`

**2. Criar lib de exportação DOCX**
Criar `src/lib/export/docx.ts`:
- Usar package `docx` para gerar Document com Heading + Paragraph por bloco
- TipTap JSON → texto limpo (sem HTML)

**3. Criar lib de exportação PDF**
Criar `src/lib/export/pdf.ts`:
- `jsPDF` + layout A4
- Header com título + referência + data
- Cada bloco: retângulo colorido à esquerda (2px) + texto
- Rodapé com paginação

**4. Criar Route Handler**
Criar `src/app/api/sermons/export/route.ts`:
- GET com `?id=&format=`
- Verificar autenticação + ownership
- Buscar sermão do Supabase
- Chamar lib correta → retornar `Response` com `Content-Disposition: attachment`

**5. Criar ExportMenu**
Criar `src/components/sermon/ExportMenu.tsx` (`"use client"`):
- shadcn `DropdownMenu` com 3 itens
- onClick: `fetch('/api/sermons/export?id=...&format=pdf')` → `blob()` → criar link de download
- Loading state por formato

### Como Verificar
- Clicar em "Exportar → PDF": arquivo baixado, abre no visualizador de PDF
- PDF tem blocos com barras coloridas e rodapé com paginação
- DOCX abre no Word com estrutura de headings
- TXT legível e com separadores claros
- Tentar exportar sermão de outro usuário: 403 Forbidden
