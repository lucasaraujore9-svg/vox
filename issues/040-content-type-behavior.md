# Issue 040, Palestra e Aula: Behavior (content_type)

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /sermons/new, /sermons, /sermons/[id]
**Depende de:** 008, 025, 037
**Prioridade:** P1

---

## O Que Fazer

Conectar o `ContentTypePicker` (proto 008) ao Supabase, garantindo que `content_type`
seja salvo corretamente e que a UI adapte labels, badges e navegação conforme o tipo.

## Comportamentos

### Wizard de criação, Step 0
- Usuário escolhe `content_type` (sermão / palestra / aula)
- Valor salvo no state do wizard, só persiste no Supabase após Step 1 (TypePicker)
- `INSERT INTO sermons (user_id, content_type, type, title)`

### Adaptação de UI por content_type

**Labels no editor:**
- Sermão: "Novo Sermão", "Pregações", "Pregar", campo "Data de pregação"
- Palestra: "Nova Palestra", "Palestras", "Apresentar", campo "Data do evento"
- Aula: "Nova Aula", "Aulas", "Ensinar", campo "Data da aula"

**Badge na listagem (`ContentCard`):**
- Sermão → badge "Sermão" Slate
- Palestra → badge "Palestra" Teal
- Aula → badge "Aula" Violeta

**Filtros na listagem:**
- Adicionar chip "Tipo": Todos / Sermões / Palestras / Aulas
- Filtro combina com framework e status existentes

### Frameworks disponíveis por content_type
- Sermão: todos os 6 frameworks (Expositivo, Textual, Narrativo, Temático, Tópico, Livre)
- Palestra: Temático, Tópico, Narrativo, Livre (remover Expositivo e Textual)
- Aula: Livre + framework especial "Aula Estruturada" (Introdução → Conteúdo → Exercício → Conclusão)

### Aulas e cursos
- Aulas (`content_type = 'aula'`) podem ser vinculadas a cursos
- No editor de aula: indicador se está vinculada a algum curso ("Parte de: [Nome do Curso]")
- Link para o curso vinculado

## Critério de Aceite

- [ ] `content_type` salvo corretamente no Supabase
- [ ] Labels da UI adaptam-se por content_type (editor, header, botões)
- [ ] Badge correto na listagem por content_type
- [ ] Filtro de content_type funcional na listagem
- [ ] FrameworkPicker filtra frameworks disponíveis por content_type
- [ ] Aula mostra indicador de curso vinculado (se houver)

## Notas de Implementação

```typescript
// src/lib/content/labels.ts
export const CONTENT_TYPE_LABELS = {
  'sermão':   { singular: 'Sermão',  plural: 'Sermões',  verb: 'Pregar',    dateLabel: 'Data de pregação' },
  'palestra': { singular: 'Palestra', plural: 'Palestras', verb: 'Apresentar', dateLabel: 'Data do evento' },
  'aula':     { singular: 'Aula',    plural: 'Aulas',    verb: 'Ensinar',   dateLabel: 'Data da aula' },
} as const

// Uso no componente:
const labels = CONTENT_TYPE_LABELS[sermon.content_type]
```

```typescript
// Frameworks por content_type
export const FRAMEWORKS_BY_CONTENT_TYPE = {
  'sermão':   ['expositivo', 'textual', 'narrativo', 'tematico', 'topico', 'livre'],
  'palestra': ['tematico', 'topico', 'narrativo', 'livre'],
  'aula':     ['livre', 'aula-estruturada'],
} as const
```

## Plano de Implementação

### Pré-requisitos
- Issue 008 concluída (ContentTypePicker visual pronto)
- Issue 025 concluída (coluna `content_type` em `sermons` via migration 006)
- Issue 037 concluída (createSermon já cria o sermão; agora adicionar content_type)

### Passos

**1. Criar arquivo de labels e frameworks**
Criar `src/lib/content/labels.ts`:
- Exportar `CONTENT_TYPE_LABELS` conforme spec
- Exportar `FRAMEWORKS_BY_CONTENT_TYPE` conforme spec

**2. Persistir content_type no wizard**
Editar `src/hooks/useSermon.ts`:
- Atualizar `createSermon(type, contentType, userId)` para incluir `content_type` no INSERT

**3. Adaptar labels da UI por content_type**
Editar `src/app/(app)/sermons/[id]/page.tsx` (editor):
- Ler `sermon.content_type`; aplicar `CONTENT_TYPE_LABELS[content_type]` no header, campo data, botão

Editar `src/app/(app)/sermons/page.tsx` (listagem):
- Título da página usa `plural` do content_type do filtro ativo

**4. Badge por content_type no SermonCard**
Editar `src/components/sermon/SermonCard.tsx`:
- Badge: Sermão → Slate; Palestra → Teal; Aula → violeta (`bg-violet-100 text-violet-700`)

**5. Filtro de content_type na listagem**
Editar `src/app/(app)/sermons/page.tsx` e componente de filtros:
- Chips "Todos / Sermões / Palestras / Aulas"
- Passado como `?content_type=aula` na query da listagem Server Component

**6. Filtrar frameworks no FrameworkPicker**
Editar `src/components/sermon/FrameworkPicker.tsx`:
- Receber `contentType` como prop
- Filtrar opções por `FRAMEWORKS_BY_CONTENT_TYPE[contentType]`
- Adicionar framework "Aula Estruturada" nos dados de frameworks

**7. Indicador de curso vinculado (aulas)**
Editar editor de aula (`/sermons/[id]` com `content_type='aula'`):
- Query: `SELECT courses.title FROM course_lessons JOIN courses WHERE sermon_id = ?`
- Se resultado: badge/link "Parte de: [Nome do Curso]"

### Como Verificar
- Criar palestra: labels "Palestra", "Data do evento", "Apresentar" no editor
- FrameworkPicker para palestra: sem Expositivo e Textual
- FrameworkPicker para aula: apenas Livre e Aula Estruturada
- Filtro "Aulas" na listagem: retorna só content_type='aula'
- Aula vinculada a curso: badge "Parte de: X" visível no editor
