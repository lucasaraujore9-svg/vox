# Issue 041, Curso: Behavior Completo

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /courses, /courses/new, /courses/[id]
**Depende de:** 009, 025, 040
**Prioridade:** P1

---

## O Que Fazer

Implementar o CRUD completo de cursos: criação com ementa e objetivos, gestão da
lista de aulas vinculadas com reordenação, e cálculo de carga horária.

## Comportamentos

### Criação de curso (/courses/new)
1. Usuário preenche título (obrigatório), ementa, objetivos, carga horária
2. Salva rascunho imediato: `INSERT INTO courses (user_id, title)`
3. Editor abre com o curso criado, auto-save nos campos

### Auto-save dos metadados
- Ementa e objetivos: auto-save com debounce de 1s
- Carga horária: save ao perder foco (onBlur)
- Indicador "Salvo" / "Salvando…" Geist Mono 11px Muted

### Gestão de aulas vinculadas

**Vincular aula existente:**
1. Clique em "+ Vincular aula" → abre modal de busca
2. Modal: busca por título entre conteúdos do usuário com `content_type = 'aula'`
3. Seleciona uma ou mais aulas → `INSERT INTO course_lessons (course_id, sermon_id, order)`
4. Aula aparece na lista do curso

**Criar nova aula direto do curso:**
- Botão "+ Criar nova aula" → cria rascunho de aula e vai para o editor
- Ao retornar, aula é automaticamente vinculada ao curso

**Reordenação (drag-and-drop):**
- `UPDATE course_lessons SET "order" = $1 WHERE id = $2` batch ao soltar

**Remover aula do curso:**
- `DELETE FROM course_lessons WHERE course_id = $1 AND sermon_id = $2`
- Aula continua existindo, só desvincula do curso

### Carga horária
- Pode ser definida manualmente pelo usuário
- Ou calculada: botão "Calcular" que soma `duration_min / 60` das aulas vinculadas
- Exibe: "24h · calculada" ou "20h · manual"

### Listagem de cursos (/courses)
- Grid de CourseCards (similar a SermonCards)
- Card mostra: título, número de aulas, carga horária, status, tags
- Filtros: status (rascunho/pronto/publicado)
- Busca full-text na `search_vector` dos cursos

### Soft delete
- Deletar curso: `UPDATE courses SET deleted_at = NOW()`
- Aulas vinculadas permanecem (apenas desvinculadas implicitamente)
- Não propaga delete para as aulas

## Critério de Aceite

- [ ] CRUD completo de cursos (criar, editar, listar, soft delete)
- [ ] Auto-save de ementa, objetivos e carga horária
- [ ] Modal de busca para vincular aulas existentes
- [ ] Reordenação de aulas com save no banco
- [ ] Remoção de aula do curso (sem deletar a aula)
- [ ] Cálculo automático de carga horária
- [ ] Listagem com filtros e busca
- [ ] Aula indica o curso ao qual pertence

## Notas de Implementação

```typescript
// src/hooks/useCourse.ts
export function useCourse(courseId: string) {
  async function addLesson(sermonId: string) {
    const maxOrder = await getMaxOrder(courseId)
    await supabase.from('course_lessons').insert({
      course_id: courseId,
      sermon_id: sermonId,
      order: maxOrder + 1
    })
  }

  async function removeLesson(sermonId: string) {
    await supabase.from('course_lessons')
      .delete()
      .eq('course_id', courseId)
      .eq('sermon_id', sermonId)
    // Re-ordenar os demais
  }

  async function reorderLessons(orderedIds: string[]) {
    const updates = orderedIds.map((id, index) => ({
      id,
      order: index + 1
    }))
    // Batch update, usar Promise.all ou upsert
  }
}
```

## Plano de Implementação

### Pré-requisitos
- Issue 009 concluída (CourseEditor visual pronto)
- Issue 025 concluída (tabelas `courses` e `course_lessons` existem)
- Issue 040 concluída (`content_type` disponível para filtrar aulas)

### Passos

**1. Criar useCourse hook**
Criar `src/hooks/useCourse.ts` (`"use client"`):
- `createCourse(userId)` → INSERT + retorna `id`
- `updateCourse(id, fields)` → UPDATE com debounce 1s (ementa, objectives)
- `saveCourseHours(id, hours)` → UPDATE ao onBlur
- `addLesson(sermonId)` → INSERT `course_lessons` com order = max + 1
- `removeLesson(sermonId)` → DELETE + re-ordenar restantes
- `reorderLessons(orderedIds)` → `Promise.all` de UPDATEs por order
- `calculateHours()` → soma `duration_min / 60` das aulas vinculadas

**2. Criar Server Actions para curso**
Criar `src/app/(app)/courses/actions.ts` (`"use server"`):
- `createCourseAction(userId)` → valida com Zod + chama INSERT
- `deleteCourseAction(id)` → UPDATE `deleted_at = NOW()`

**3. Conectar CourseEditor aos dados reais**
Editar `src/components/course/CourseEditor.tsx`:
- Substituir state mock por `useCourse(courseId)`
- Auto-save ementa/objectives com `useEffect` + debounce 1s
- onBlur de horas → `saveCourseHours()`
- Indicador "Salvando…" / "Salvo" Geist Mono 11px Muted

**4. Criar modal de busca de aulas**
Criar `src/components/course/LessonSearchModal.tsx` (`"use client"`):
- `shadcn/ui Dialog` + input de busca
- Query: `SELECT id, title FROM sermons WHERE content_type = 'aula' AND user_id = ? AND title ILIKE ?`
- Selecionar aula → `addLesson(sermonId)` → fechar modal

**5. Criar listagem /courses**
Criar `src/app/(app)/courses/page.tsx` (Server Component):
- `SELECT * FROM courses WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`
- FTS via `search_vector @@ to_tsquery('portuguese', ?)` quando há busca
- Grid de CourseCards com filtro de status client-side

**6. Criar páginas de curso**
Criar `src/app/(app)/courses/new/page.tsx`:
- Server Action cria curso vazio → redireciona para `/courses/{id}`
Editar `src/app/(app)/courses/[id]/page.tsx`:
- Buscar curso + aulas vinculadas (JOIN) → passar para `CourseEditor`

### Como Verificar
- Criar curso: redireciona para editor com ID real na URL
- Editar ementa: "Salvando…" aparece, banco atualizado após 1s de pausa
- Vincular aula: modal busca aulas com content_type='aula'; aula aparece na lista
- Drag-and-drop de aulas: order atualizado no banco após soltar
- Soft delete: curso some da listagem mas permanece no banco com `deleted_at`
