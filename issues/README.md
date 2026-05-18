# Issues, VOX

## Convenção de Numeração

| Faixa | Tipo | Descrição |
|-------|------|-----------|
| 001–019 | `proto` | Protótipos de UI, sem dados reais |
| 020–029 | `infra` | Infraestrutura, banco, auth, PWA |
| 030–049 | `behavior` | Behavior, UIs conectadas a dados |
| 050–059 | `integration` | Integrações externas |
| 060+ | `expansion` | Expansões futuras |

## Ordem de Execução Recomendada

```
FASE 1, Fundação
020 → 023 → 021 → 022               (setup Next.js + Supabase + auth + PWA)

FASE 2, Protótipos Core
005 → 001 → 002 → 003 → 004         (auth + dashboard + editor + banco + apresentação)
006 → 007 → 008                      (seletor tipo + slides + content_type)
013 → 014 → 015                      (séries + settings + templates)
009 → 010 → 011 → 012               (curso + estudo + apresentador + cores)

FASE 3, Infra de Dados
024 → 025 → 026                      (storage + schemas cursos + schemas estudo/cores)

FASE 4, Behavior Core (Esboço)
030 → 031 → 032 → 033               (CRUD + editor + busca + apresentação esboço)
034 → 035 → 036                      (importação + IA + bíblia)
045 → 046 → 047 → 048 → 049        (séries + settings + export + templates + dashboard)

FASE 5, Behavior Apresentação
037 → 038 → 039 → 043               (type selector + upload slides + modo simples + apresentador)

FASE 6, Behavior Expandido
040 → 041 → 042 → 044               (content types + cursos + estudo + cores)

FASE 7, Integrations
050 → 051                            (API.Bible + OpenAI)
```

> **Nota sobre tipos:** Issues 030–036 são para `type = 'esboço'`. Issues 037–039 e 043 são para `type = 'apresentação'`. Issues 040–042 cobrem `content_type` expandido.

---

## Lista de Issues

### Infra (020–029)
- [x] 020, Setup Supabase + Schema base (profiles, series, sermons, slides)
- [x] 021, Autenticação Supabase Auth (login, register, middleware, Server Actions)
- [x] 022, PWA + Offline (Service Worker, manifest, IndexedDB sync)
- [x] 023, Setup Next.js 15 (App Router, Tailwind 4, shadcn/ui, fontes, globals.css)
- [x] 024, Supabase Storage (bucket sermon-slides + Route Handler upload PDF→WebP)
- [x] 025, Schema: content_type em sermons + courses + course_lessons (migrations 006–007)
- [x] 026, Schema: study_modules + study_sessions + block_color_preferences + seed (migrations 008–009)

### Proto (001–019)
- [x] 001, Dashboard UI proto (layout sidebar, StatsCards mock, SermonCards mock)
- [x] 002, Editor de Esboço UI proto (FrameworkPicker, blocos TipTap, toolbar)
- [x] 003, Banco de Conteúdo UI proto (grid, filtros, ações por card)
- [x] 004, Modo Apresentação Esboço UI proto (teleprompter, controles, modo noturno)
- [x] 005, Auth Pages UI proto (login/register, formulários visuais)
- [x] 006, Seletor de Formato UI proto (Esboço vs Apresentação, TypePicker)
- [x] 007, Painel de Slides UI proto (lista lateral + upload dropzone + comentário)
- [x] 008, Seletor de Tipo de Conteúdo UI proto (Sermão / Palestra / Aula)
- [x] 009, Curso: Editor UI proto (ementa, objetivos, carga horária, lista aulas)
- [x] 010, Estudo Guiado UI proto (trilhas, sessão ativa, notas blocos, output picker)
- [x] 011, Modo Apresentador UI proto (duas janelas simuladas, painel de controle)
- [x] 012, Configuração de Cores dos Blocos UI proto (paleta por tipo, preview ao vivo)
- [x] 013, Séries de Sermões UI proto (SeriesCard, SeriesForm, SeriesSelector)
- [x] 014, Configurações de Perfil UI proto (tabs: Perfil, Preferências, IA, Blocos, Conta)
- [x] 015, Biblioteca de Frameworks UI proto (grid bento, FrameworkDetail modal)

### Behavior (030–049)

#### Core, Esboço e CRUD
- [x] 030, CRUD de Conteúdo (criar/editar/listar/soft delete, auto-save, offline)
- [x] 031, Editor com Frameworks Homiléticos (TipTap real, blocos, Zustand, auto-save)
- [x] 032, Busca e Filtros no Banco (full-text search PT, filtros URL state)
- [x] 033, Modo Apresentação Esboço (Fullscreen API, Wake Lock, swipe, dados reais)
- [x] 034, Importação de Conteúdo (.docx/.txt → blocos, mammoth)
- [x] 035, Módulo de IA (guard ai_enabled, OpenAI suggest, rate limit, settings toggle)
- [x] 036, Integração de Versículos Bíblicos (API.Bible proxy, TipTap extension, cache)

#### Apresentação, Slides
- [x] 037, Seletor de Tipo: Behavior (cria sermão com type no Supabase, wizard routing)
- [x] 038, Slides Upload: Behavior (PDF→WebP, Google Slides URL, comentários auto-save)
- [x] 039, Modo Apresentação Simples de Slides (bifurcação por type, preload, swipe)
- [x] 043, Modo Apresentador: Behavior (BroadcastChannel, duas janelas, comment_blocks)

#### Expandido, Tipos, Cursos, Estudo, Cores
- [x] 040, Palestra e Aula: Behavior (labels, badges, frameworks por content_type)
- [x] 041, Curso: Behavior (CRUD, vincular aulas, carga horária, reordenação)
- [x] 042, Estudo Guiado: Behavior (sessões, progresso, notas, gerar output)
- [x] 044, Cores dos Blocos: Behavior (CSS custom properties, persistência, Context)

#### Features Complementares
- [x] 045, Séries: Behavior (CRUD completo, vincular sermões, filtro no banco)
- [x] 046, Configurações de Perfil: Behavior (perfil, avatar, preferências, senha)
- [x] 047, Exportação PDF/DOCX/TXT: Behavior (Route Handler, jspdf, docx package)
- [x] 048, Biblioteca de Frameworks: Behavior (dados estáticos, fluxo usar→criar)
- [x] 049, Dashboard: Behavior (stats reais, recentes, série ativa, estudo em andamento)

### Integration (050–059)
- [x] 050, API.Bible Integration (wrapper, proxy Route Handler, cache permanente)
- [x] 051, OpenAI API Integration (client singleton, prompts por framework, schema Zod)

---

## Mapa de Dependências Críticas

```
023 (Next.js setup) ──► 001–015 (todos os protos)
020 (Supabase schema) ──► 021 (auth) ──► 030 (CRUD)
030 ──► 031 (editor) ──► 032 (busca) ──► 033 (apresentação)
024 (storage) ──► 037 ──► 038 ──► 039
025 (cursos schema) ──► 041 (cursos behavior)
026 (study schema) ──► 042 (estudo behavior)
026 ──► 044 (cores behavior)
050 (API.Bible) ──► 036 (versículos no editor)
051 (OpenAI) ──► 035 (módulo IA)
```

## Features Identificadas para Expansão (060+)
- 060, Calendário de pregações (visualização por data/mês)
- 061, Compartilhamento de sermão (link público ou por e-mail)
- 062, Analytics de ministério (quantas vezes pregou cada texto, livros mais usados)
- 063, Conversão PPT/PPTX no servidor (LibreOffice headless ou ConvertAPI)
- 064, Editor nativo de slides (criar slides dentro do VOX sem upload)
- 065, Colaboração (co-edição em tempo real com outro pastor)
- 066, Recuperação de senha (forgot password flow)
- 067, Multi-idioma (EN, ES além de PT-BR)
