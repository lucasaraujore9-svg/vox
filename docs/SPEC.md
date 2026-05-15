# VOX — Especificação do Sistema

> Documento vivo. Atualize à medida que o produto evolui.
> Leia este arquivo antes de qualquer implementação.

---

## Visão Geral

**VOX** é uma PWA para pregadores e pastores. Cobre o ciclo completo:
**preparação → entrega → arquivo.**

O diferencial central são os **frameworks homiléticos** como templates guiados no editor.

---

## Página: `/` — Landing Page

**Objetivo:** Apresentar o VOX e converter visitantes em usuários.

**Componentes:**
- Hero com headline, subtítulo e CTA principal ("Começar grátis")
- Seção de benefícios (3 pilares: Preparar, Pregar, Arquivar)
- Seção de frameworks homiléticos disponíveis
- Depoimentos (TODO: coletar)
- CTA final + rodapé

**Comportamentos:**
- Página estática, sem autenticação
- Redireciona usuário autenticado para `/dashboard`
- CTA leva para `/auth/register`

**Critério de aceite:**
- [ ] Página renderiza corretamente em mobile e desktop
- [ ] CTA redireciona para cadastro
- [ ] Usuário já logado é redirecionado para dashboard

---

## Página: `/auth/login`

**Objetivo:** Autenticar usuário existente.

**Componentes:**
- Formulário: email + senha
- Link "Esqueci minha senha"
- Link para `/auth/register`
- Botão de submit com loading state

**Comportamentos:**
- Validação client-side com Zod (email válido, senha >= 8 chars)
- Submit chama Supabase Auth `signInWithPassword`
- Sucesso: redireciona para `/dashboard`
- Erro: exibe mensagem inline (não alert)
- Usuário já autenticado: redireciona para `/dashboard`

**Critério de aceite:**
- [ ] Login com credenciais válidas funciona
- [ ] Erro exibido para credenciais inválidas
- [ ] Loading state durante submit
- [ ] Redirect após login bem-sucedido

---

## Página: `/auth/register`

**Objetivo:** Criar nova conta de pastor.

**Componentes:**
- Formulário: nome, email, senha, confirmar senha
- Campo: denominação/organização (opcional)
- Checkbox: aceitar termos
- Botão de submit com loading state
- Link para `/auth/login`

**Comportamentos:**
- Validação: email único, senha >= 8 chars, senhas iguais
- Submit chama Supabase Auth `signUp`
- Cria perfil em tabela `profiles` após cadastro
- Sucesso: redireciona para `/dashboard` com toast de boas-vindas
- Flag `ai_enabled` iniciada como `false`

**Critério de aceite:**
- [ ] Cadastro cria conta no Supabase Auth
- [ ] Perfil criado na tabela `profiles`
- [ ] Validação de email duplicado
- [ ] Redirect após cadastro

---

## Página: `/dashboard`

**Objetivo:** Painel principal — visão geral do ministério do pastor.

**Componentes:**
- Header com nome do pastor e avatar
- Card de stats: total de sermões, último sermão, série em andamento
- Seção "Sermões Recentes" (últimos 5, cards clicáveis)
- Botão flutuante "Novo Sermão" (FAB)
- Barra lateral com navegação principal

**Comportamentos:**
- Dados carregados via Server Component (Supabase)
- Clique em card de sermão → `/sermons/[id]`
- FAB → `/sermons/new`
- Protegida por autenticação (middleware redireciona se não autenticado)

**Critério de aceite:**
- [ ] Stats corretos para o usuário logado
- [ ] Sermões recentes carregam (máx 5)
- [ ] Navegação para editor e banco funcionam
- [ ] Redireciona para login se não autenticado

---

## Página: `/sermons`

**Objetivo:** Banco completo de sermões com busca e filtros.

**Componentes:**
- Campo de busca textual (busca em título, conteúdo, tags)
- Filtros: livro bíblico, tema, framework homilético, data, série
- Grid/lista de cards de sermões
- Card de sermão: título, referência bíblica, data, framework, tags, preview
- Botão "Novo Sermão"
- Paginação ou scroll infinito

**Comportamentos:**
- Busca full-text via Supabase `fts` (PostgreSQL full-text search)
- Filtros acumulativos (podem combinar)
- Ordenação: mais recente, mais antigo, A-Z
- Clique no card → `/sermons/[id]`
- Hover no card → ações rápidas (editar, apresentar, duplicar, excluir)
- Exclusão: confirmação modal + soft delete

**Critério de aceite:**
- [ ] Busca textual funciona (título + conteúdo)
- [ ] Filtros combinados funcionam
- [ ] Cards exibem informações corretas
- [ ] Soft delete funciona com confirmação
- [ ] Paginação ou scroll infinito funcionam

---

## Página: `/sermons/new`

**Objetivo:** Criar novo sermão. O pastor escolhe primeiro o **tipo** (Apresentação ou Esboço Guia)
e depois o sistema abre o fluxo correto para cada modalidade.

---

### Step 1 — Escolha do Tipo

**Componentes:**
- Dois cards grandes lado a lado (ou empilhados no mobile):
  - **Esboço Guia** — ícone de manuscrito, descrição: "Escreva seu sermão por blocos, com estrutura definida por um framework homilético."
  - **Apresentação** — ícone de slides, descrição: "Importe seus slides (PDF, PPT ou Google Slides) e adicione comentários para cada slide."
- Seleção: card fica marcado com borda Forest Deep, botão "Continuar" habilita

**Comportamentos:**
- Seleção de tipo persiste no estado local durante o fluxo
- Tipo `esboço` → continua para Step 2A (seleção de framework)
- Tipo `apresentação` → continua para Step 2B (informações + upload/link)

---

### Fluxo A — Esboço Guia (tipo: `esboço`)

**Step 2A:** Seleção de framework (cards dos 6 frameworks — mesmo fluxo anterior)

**Step 3A:** Informações básicas (título, referência bíblica, data prevista, série, tags)

**Step 4A:** Editor abre com blocos do framework selecionado

**Frameworks disponíveis:**
| ID | Nome | Estrutura |
|----|------|-----------|
| `expositivo` | Expositivo | Contexto → Explicação → Aplicação → Conclusão |
| `tematico` | Temático | Introdução → 3 Pontos Principais → Conclusão |
| `narrativo` | Narrativo | Cenário → Tensão → Reviravolta → Aplicação → Conclusão |
| `topico` | Tópico | Introdução → Ponto 1 → Ponto 2 → Ponto 3 → Chamado |
| `textual` | Textual | Texto Bíblico → Divisão → Exposição → Aplicação |
| `livre` | Livre | Sem estrutura pré-definida (editor em branco) |

---

### Fluxo B — Apresentação (tipo: `apresentação`)

**Step 2B:** Informações básicas + escolha da fonte dos slides

**Componentes do Step 2B:**
- Título (obrigatório)
- Referência bíblica (opcional)
- Data prevista (opcional)
- Série (opcional), Tags
- **Seleção de fonte dos slides** (3 opções em radio cards):
  - **Upload de arquivo** — PDF ou PPT/PPTX, máx 50MB
  - **Link do Google Slides** — campo de URL
  - **Sem slides ainda** — começa com lista de slides vazia, adiciona depois

**Step 3B:** Painel de slides

**Componentes do painel de slides:**
- Layout dois painéis: lista de slides (esquerda, 280px) + painel de comentário (direita)
- **Lista de slides:**
  - Miniaturas dos slides em ordem (geradas do PDF/PPT ou do Google Slides)
  - Indicador de slide atual (bordas Forest Deep)
  - Número do slide (Geist Mono, canto inferior)
  - Ícone de comentário preenchido se o slide tiver comentário
  - Botão "+ Slide" ao final da lista (para adicionar slide manual em branco)
  - Drag para reordenar
- **Painel de comentário (slide selecionado):**
  - Miniatura grande do slide (ou placeholder de slide em branco)
  - Campo de textarea: "Comentário do slide [N]" com placeholder: "Notas do apresentador para este slide..."
  - Barra de formatação mínima: negrito, itálico, lista
  - Word count do comentário

**Comportamentos (Apresentação):**
- Upload PDF: extraído server-side em imagens por página (uma por slide)
- Upload PPT/PPTX: convertido em imagens por slide
- Google Slides URL: armazena URL + gera thumbnails via embed público
- Cada slide tem: `order`, `image_url` (Storage), `comment` (texto), `slide_number`
- Auto-save de comentários igual ao editor de esboço
- Funciona offline após carregar (imagens cacheadas)

**Critério de aceite (Fluxo B):**
- [ ] Step 1 permite escolher tipo com clareza visual
- [ ] Upload PDF gera miniaturas por página
- [ ] Upload PPT/PPTX gera miniaturas por slide
- [ ] Link Google Slides armazenado e exibido
- [ ] Comentário de cada slide salva corretamente
- [ ] Reordenação de slides por drag funciona
- [ ] Auto-save de comentários funciona (online e offline)

**Critério de aceite (Fluxo A — mantidos):**
- [ ] 6 frameworks disponíveis com descrição clara
- [ ] Seleção de framework gera estrutura no editor
- [ ] Informações básicas salvas corretamente
- [ ] Auto-save funciona (online e offline)
- [ ] Inserção de versículos bíblicos inline

---

## Página: `/sermons/[id]`

**Objetivo:** Editar sermão existente.

**Componentes:**
- Mesmo editor de `/sermons/new` populado com dados existentes
- Barra superior: título editável inline, status (rascunho/pronto), botão "Apresentar"
- Painel lateral: metadados (referência bíblica, data, série, tags, framework)
- Histórico de versões (TODO: fase 2)
- Botão de exportar (PDF, DOCX)
- Assistente de IA (se `ai_enabled = true` no perfil)

**Comportamentos:**
- Dados carregados via Server Component
- Edição em tempo real com auto-save (30s)
- Botão "Apresentar" → `/sermons/[id]/present`
- Exportar PDF: gera via API Route Handler
- IA: botão visível apenas se `profile.ai_enabled = true`

**Critério de aceite:**
- [ ] Editor carrega com conteúdo existente
- [ ] Auto-save funciona
- [ ] Metadados editáveis
- [ ] Botão "Apresentar" navega corretamente
- [ ] IA aparece/some conforme flag do usuário

---

## Página: `/sermons/[id]/present`

**Objetivo:** Modo apresentação para pregação. O layout e comportamento variam conforme
o **tipo** do sermão (`esboço` ou `apresentação`).

---

### Modo Apresentação — Esboço Guia (tipo: `esboço`)

**Componentes:**
- Tela limpa (sem sidebar, sem distrações)
- Texto do bloco atual em fonte grande (ajustável: médio/grande/muito grande)
- Indicador de bloco atual (ex: "Desenvolvimento 2/4") — discreto no topo
- Barra de controle inferior: ◀ ▶ blocos, A− A+, modo noturno, sair
- Wake Lock + Fullscreen API

**Comportamentos:**
- Texto dos blocos renderizado em Fraunces grande (leitura fácil)
- Blocos de "Notas pessoais" **não aparecem** no modo apresentação
- Blocos de "Texto Bíblico" têm destaque especial (gold border-left)
- Controle por teclado (→ ←) e swipe mobile
- Funciona offline após carregado

---

### Modo Apresentação — Apresentação de Slides (tipo: `apresentação`)

**Layout:** Dois painéis lado a lado (splitscreen):
- **Painel esquerdo (60%):** imagem do slide atual em tela cheia
- **Painel direito (40%):** comentário do apresentador em fonte grande

**OU** modo teleprompter puro (sem slide):
- Apenas o comentário do slide em tela cheia com fonte grande (igual ao esboço)
- Toggle na barra de controles para alternar entre os modos

**Componentes:**
- Slide image (painel esquerdo) — `<img>` ou iframe do Google Slides
- Comentário do slide (painel direito, fonte Fraunces 26px, Warm Off-White, fundo Stage Dark)
- Barra de controle inferior: ◀ ▶ slides, toggle "Slide / Só comentário", modo noturno, sair
- Indicador: "Slide 3 / 12" Geist Mono Stage muted
- Wake Lock + Fullscreen API

**Comportamentos:**
- Navegação entre slides (→ ← teclado, swipe mobile, botões)
- Slide sem imagem: painel esquerdo exibe placeholder com número
- Slide sem comentário: painel direito exibe placeholder muted
- Funciona offline (imagens dos slides cacheadas no Service Worker)
- Google Slides: exibido via `<iframe>` com slide específico como parâmetro

**Critério de aceite (ambos os tipos):**
- [ ] Tela cheia automática (Fullscreen API)
- [ ] Wake Lock ativo (tela não dorme)
- [ ] Navegação por teclado (→ ←) e swipe mobile
- [ ] Modo noturno funciona
- [ ] Funciona offline após carregado

**Critério adicional (Apresentação):**
- [ ] Slide image renderiza corretamente
- [ ] Comentário renderiza ao lado do slide
- [ ] Toggle "Slide / Só comentário" funciona
- [ ] Indicador "Slide N / total" correto
- [ ] Google Slides exibido via iframe (se fonte for URL)

---

## Página: `/templates`

**Objetivo:** Biblioteca de frameworks homiléticos com guias de uso.

**Componentes:**
- Cards dos 6 frameworks com descrição detalhada
- Para cada framework: quando usar, estrutura visual, exemplo
- Botão "Usar este framework" → `/sermons/new` com framework pré-selecionado

**Comportamentos:**
- Página estática (conteúdo não muda com frequência)
- Sem autenticação necessária (pode ser pública para atrair usuários)

**Critério de aceite:**
- [ ] 6 frameworks documentados com descrição e estrutura
- [ ] CTA "Usar este framework" funciona
- [ ] Responsivo

---

## Página: `/import`

**Objetivo:** Importar sermões existentes para o VOX.

**Componentes:**
- Upload de arquivo (.docx, .txt, .pdf)
- OU campo de cola de texto livre
- Preview do conteúdo importado
- Seleção de framework para estruturar (ou "livre")
- Formulário de metadados (título, data, referência bíblica)
- Botão "Importar"

**Comportamentos:**
- Upload processa arquivo via API Route Handler
- Extrai texto bruto do arquivo
- Cria sermão com tipo `livre` e conteúdo como um único bloco
- Usuário pode reorganizar blocos manualmente após importar
- Limite de arquivo: 10MB

**Critério de aceite:**
- [ ] Upload de .docx funciona
- [ ] Upload de .txt funciona
- [ ] Cole de texto funciona
- [ ] Sermão criado com conteúdo importado
- [ ] Limite de 10MB aplicado

---

## Página: `/settings`

**Objetivo:** Configurações do perfil e preferências do pastor.

**Componentes:**
- Seção Perfil: nome, email, denominação, avatar
- Seção Preferências: idioma da interface, tema (claro/escuro/sistema)
- Seção Bíblia: tradução padrão (ARC, NVI, NVT, etc.)
- Seção IA: toggle para ativar/desativar módulo de IA + explicação
- Botão "Salvar alterações"
- Seção Conta: alterar senha, excluir conta

**Comportamentos:**
- Toggle de IA atualiza `profile.ai_enabled` no Supabase
- Tradução padrão salva em `profile.bible_version`
- Excluir conta: confirmação com digitação do email + soft delete

**Critério de aceite:**
- [ ] Perfil atualiza corretamente
- [ ] Toggle de IA muda flag e reflete em toda a aplicação
- [ ] Tradução padrão da Bíblia salva e usada no editor
- [ ] Excluir conta com confirmação

---

## Modelo de Dados (Supabase / PostgreSQL)

### Tabela: `profiles`
```sql
id            uuid (FK auth.users)
name          text
email         text
denomination  text (nullable)
avatar_url    text (nullable)
ai_enabled    boolean default false
bible_version text default 'ARC'
created_at    timestamptz
updated_at    timestamptz
```

### Tabela: `sermons`
```sql
id            uuid
user_id       uuid (FK profiles)
title         text
type          text NOT NULL DEFAULT 'esboço'
              CHECK (type IN ('esboço', 'apresentação'))
-- Campos de Esboço Guia
framework     text (expositivo|tematico|narrativo|topico|textual|livre)
              nullable — só relevante quando type = 'esboço'
content       jsonb  -- array de blocos (tipo esboço)
              nullable — só relevante quando type = 'esboço'
word_count    int default 0
-- Campos de Apresentação
slides_source text CHECK (slides_source IN ('upload','google_slides','manual'))
              nullable — só relevante quando type = 'apresentação'
slides_url    text  -- URL do Google Slides (quando slides_source = 'google_slides')
              nullable
-- Campos comuns
bible_ref     text (nullable, ex: "Romanos 5:1—11")
bible_book    text (nullable, para filtro)
status        text NOT NULL DEFAULT 'rascunho'
              CHECK (status IN ('rascunho', 'pronto'))
series_id     uuid (nullable, FK series)
tags          text[] default '{}'
preached_at   date (nullable)
created_at    timestamptz
updated_at    timestamptz
deleted_at    timestamptz (nullable, soft delete)
```

### Tabela: `slides`
> Só usada quando `sermons.type = 'apresentação'`
```sql
id            uuid default gen_random_uuid()
sermon_id     uuid REFERENCES sermons ON DELETE CASCADE
order         int NOT NULL
image_url     text nullable  -- Supabase Storage path (upload) ou null (Google Slides)
storage_path  text nullable  -- path interno no bucket para deleção
comment       text default '' -- comentário/notas do apresentador
created_at    timestamptz
updated_at    timestamptz

-- Índice para ordenação eficiente
CREATE INDEX slides_sermon_order_idx ON slides(sermon_id, "order");
```

### Estrutura de blocos do Esboço Guia (`sermons.content`)
```jsonb
[
  {
    "id": "uuid",
    "type": "Texto Bíblico|Introdução|Contexto|Ponto Principal|Subponto|Ilustração|Aplicação|Citação|Pergunta retórica|Conclusão|Oração|Notas pessoais|livre",
    "title": "Introdução",
    "content": {},  -- TipTap JSON
    "order": 1
  }
]
```

### Tabela: `series`
```sql
id            uuid
user_id       uuid (FK profiles)
title         text
description   text (nullable)
created_at    timestamptz
```

### Supabase Storage — Bucket: `sermon-slides`
```
sermon-slides/
└── {user_id}/
    └── {sermon_id}/
        ├── slide-001.webp
        ├── slide-002.webp
        └── slide-003.webp
```
- Acesso: RLS — usuário só acessa seus próprios arquivos
- Formato de output: WebP (melhor compressão que PNG para thumbnails)
- Tamanho máximo de upload: 50MB (PDF/PPT)
- Resolução de output: 1280×720px por slide

---

## TODO (itens a especificar nas próximas iterações)

- [ ] Especificar comportamento de conflito no sync offline/online
- [ ] Especificar estrutura de exportação PDF
- [ ] Especificar prompt do assistente de IA por framework
- [ ] Definir traduções bíblicas disponíveis e licenças (API.Bible)
- [ ] Especificar modelo de monetização (freemium / limites de sermões)
