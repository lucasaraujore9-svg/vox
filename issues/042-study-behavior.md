# Issue 042 — Estudo Guiado: Behavior Completo

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /study, /study/[moduleId]
**Depende de:** 010, 026
**Prioridade:** P1

---

## O Que Fazer

Implementar o fluxo completo do Estudo Guiado: listagem de módulos com progresso do usuário,
sessão de estudo com notas em blocos visuais, auto-save, conclusão de sessão, e geração de
output (criar conteúdo a partir do estudo).

## Comportamentos

### Listagem (/study)
1. Busca todos os módulos ativos: `SELECT * FROM study_modules WHERE is_active = true ORDER BY sort_order`
2. Para cada módulo, busca o progresso do usuário: `SELECT * FROM study_sessions WHERE user_id = ? AND module_id = ?`
3. Card mostra: progresso (%), sessão atual, botão "Começar" ou "Continuar"
4. Filtro por categoria (client-side)

### Iniciar módulo
1. Clique em "Começar" → `INSERT INTO study_sessions (user_id, module_id, current_session, progress)`
   - Se já existe (UNIQUE), faz `SELECT` e redireciona para a sessão atual
2. Redireciona para `/study/[moduleId]`

### Sessão de estudo (/study/[moduleId])
1. Carrega `study_sessions` do usuário para este módulo
2. Exibe o conteúdo da sessão atual (hardcoded como constantes TypeScript no MVP)
3. Usuário lê o conteúdo e escreve nas notas (BlockEditor)

**Auto-save das notas:**
```
UPDATE study_sessions SET notes_content = $1, updated_at = NOW()
WHERE user_id = $2 AND module_id = $3
```
- Debounce de 800ms
- Notas persistem entre sessões (o campo `notes_content` é cumulativo)

**Concluir sessão:**
- Botão "Concluir sessão →"
- `UPDATE study_sessions SET current_session = current_session + 1, progress = (current_session / total) * 100`
- Se última sessão: `SET completed_at = NOW(), progress = 100`
- Feedback visual: animação de progresso + toast "Sessão concluída!"

**Navegar entre sessões:**
- Usuário pode navegar para sessões anteriores (só leitura se já concluída)
- Não pode pular para sessões futuras sem completar as anteriores

### Gerar conteúdo a partir do estudo
Aparece quando `progress >= 50` (pelo menos metade do módulo concluída):

1. Usuário clica "Gerar conteúdo"
2. Modal `StudyOutputPicker`: escolhe tipo (sermão/palestra/aula/curso)
3. Sistema cria rascunho:
   - Para sermão/palestra/aula: `INSERT INTO sermons (user_id, content_type, title, content)`
     - `title`: "[Título do módulo] — [Tipo]"
     - `content`: blocos das notas do estudo, reorganizados como esboço inicial
   - Para curso: `INSERT INTO courses (user_id, title, ementa)`
     - `ementa`: resumo das notas
4. Redireciona para o editor do conteúdo criado
5. Toast: "Rascunho criado a partir do seu estudo!"

### Conteúdo das sessões (MVP)
No MVP, o conteúdo de cada sessão é hardcoded em TypeScript:
```typescript
// src/lib/study/content.ts
export const STUDY_CONTENT: Record<string, SessionContent[]> = {
  'homiletica-essencial': [
    {
      session: 1,
      title: 'O que é Homilética',
      content: '...markdown do conteúdo...',
      reflectionQuestions: [
        'O que me motivou a pregar?',
        'Qual sermão mais me marcou e por quê?',
      ],
    },
    // ...
  ],
}
```

## Critério de Aceite

- [ ] Listagem com progresso do usuário por módulo
- [ ] Iniciar módulo cria/retoma study_session
- [ ] Conteúdo da sessão renderiza (markdown → HTML)
- [ ] BlockEditor nas notas, auto-save 800ms
- [ ] Concluir sessão atualiza current_session e progress
- [ ] Navegação entre sessões anteriores/posteriores
- [ ] "Gerar conteúdo" aparece a partir de 50% de progresso
- [ ] Modal de output → cria rascunho no tipo escolhido
- [ ] Redireciona para editor após criar rascunho

## Notas de Implementação

```typescript
// src/hooks/useStudy.ts
export function useStudy(moduleId: string) {
  const [session, setSession] = useState<StudySession | null>(null)
  const [moduleContent, setModuleContent] = useState<SessionContent[]>([])

  async function startOrResume() {
    const { data } = await supabase
      .from('study_sessions')
      .upsert({ user_id: userId, module_id: moduleId }, { onConflict: 'user_id,module_id' })
      .select()
      .single()
    setSession(data)
  }

  async function completeCurrentSession() {
    const total = moduleContent.length
    const next = Math.min((session!.current_session) + 1, total)
    const progress = Math.round((next - 1) / total * 100)
    const completed = next > total

    await supabase.from('study_sessions').update({
      current_session: next,
      progress,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }).eq('id', session!.id)
  }

  async function generateContent(contentType: ContentType) {
    const title = `${module.title} — ${contentType}`
    const content = session?.notes_content ?? []
    // Cria rascunho no tipo escolhido
  }
}
```

## Plano de Implementação

### Pré-requisitos
- Issue 010 concluída (StudySession visual pronto)
- Issue 026 concluída (tabelas `study_modules` e `study_sessions` existem + seed executado)
- Issue 025 concluída (`content_type` disponível em sermons para geração de output)

### Passos

**1. Criar conteúdo das sessões (hardcoded MVP)**
Criar `src/lib/study/content.ts`:
- `STUDY_CONTENT: Record<string, SessionContent[]>` com ao menos 2–3 sessões por módulo
- Conteúdo em Markdown (texto guiado + perguntas de reflexão)

**2. Criar useStudy hook**
Criar `src/hooks/useStudy.ts` (`"use client"`):
- `startOrResume(moduleId)` → `upsert study_sessions` com `onConflict: 'user_id,module_id'`
- `saveNotes(notes_content)` → debounce 800ms → UPDATE
- `completeSession()` → atualizar `current_session` e `progress` (fórmula da spec)
- `generateContent(contentType)` → INSERT em `sermons` (ou `courses`) com dados das notas

**3. Conectar página /study com progresso real**
Editar `src/app/(app)/study/page.tsx` (Server Component):
- Buscar todos `study_modules WHERE is_active = true`
- Buscar `study_sessions` do usuário em paralelo
- Passar progresso para `StudyModuleCard`

**4. Conectar /study/[moduleId] ao hook**
Editar `src/app/(app)/study/[moduleId]/page.tsx`:
- Server Component: buscar módulo + session do usuário
- Passar para `StudySession` como props

Editar `src/components/study/StudySession.tsx`:
- Substituir mocks por `useStudy(moduleId)`
- `BlockEditor` em notas chama `saveNotes()` com debounce
- Botão "Concluir sessão": chama `completeSession()` + animação de progresso + toast
- Navegação entre sessões anteriores: bloquear avanço além de `current_session`

**5. Implementar generateContent**
Em `useStudy`:
- Para `sermão/palestra/aula`: `INSERT INTO sermons (user_id, content_type, title, content)`
  - `content`: notas do estudo convertidas para blocos
- Para `curso`: `INSERT INTO courses (user_id, title, ementa)`
- Após inserção: `router.push` para o editor
- Toast: "Rascunho criado a partir do seu estudo!"

**6. Conectar StudyOutputPicker ao behavior**
Editar `src/components/study/StudyOutputPicker.tsx`:
- Ao selecionar tipo e clicar "Gerar": chamar `generateContent(contentType)` do hook
- Loading state no botão durante criação

### Como Verificar
- `/study`: cards mostram progresso real (0% para módulos não iniciados)
- Clicar "Começar": cria session; clicar novamente → retoma (sem duplicata)
- Notas no BlockEditor: auto-save; recarregar página mantém as notas
- Concluir sessão: índice avança, progresso na barra atualiza
- "Gerar conteúdo" aparece com ≥ 50% de progresso; gera rascunho e redireciona
