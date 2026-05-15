# VOX — Workflow de Desenvolvimento

---

## O Loop Principal

```
SPEC → BREAK → PLAN → EXECUTE → REVIEW → NEXT
```

Nunca pule fases. Pular fases produz retrabalho.

---

## Como Iniciar uma Sessão de Trabalho

1. Abra o projeto no Claude Code
2. Rode `/status` — veja o que está concluído e o que está pendente
3. Rode `/next` — o sistema sugere a próxima issue de maior impacto
4. Rode `/plan <issue>` — produza o plano ANTES de codar
5. Aguarde aprovação explícita do usuário
6. Rode `/execute` — implemente seguindo o plano
7. Rode `/review <issue>` — valide contra os critérios de aceite
8. Marque a issue como `[x] CONCLUÍDA`
9. Volte ao passo 2

---

## Convenção de Issues

| Faixa | Tipo | Descrição |
|-------|------|-----------|
| 001–019 | `proto` | Protótipos de UI — componentes visuais sem dados reais |
| 020–029 | `infra` | Infraestrutura — auth, banco, clients de API, PWA |
| 030–049 | `behavior` | Behavior — conectar UIs a dados reais |
| 050–059 | `integration` | Integrações externas — webhooks, cron, APIs |
| 060+ | `expansion` | Expansões e redesigns |

**Regra de prioridade:**
- Infra (020+) deve ser concluída antes de behavior (030+)
- Protos (001+) podem rodar em paralelo com infra
- Behaviors dependem da infra estar pronta

---

## Formato de uma Issue

```markdown
# Issue NNN — Título da Issue

**Status:** [ ] PENDENTE | [~] EM ANDAMENTO | [x] CONCLUÍDA
**Tipo:** proto | infra | behavior | integration
**Página:** /rota ou "global"
**Depende de:** NNN, NNN | nenhuma
**Prioridade:** P0 | P1 | P2

## O Que Fazer
[Descrição clara do que implementar, sem ambiguidade]

## Componentes Envolvidos
- `src/components/...` — [descrição]
- `src/app/...` — [descrição]

## Comportamentos
- [Comportamento 1]
- [Comportamento 2]

## Critério de Aceite
- [ ] [Critério testável 1]
- [ ] [Critério testável 2]

## Notas de Implementação
[Decisões técnicas, armadilhas conhecidas, referências]
```

---

## Prioridades

| Nível | Significado |
|-------|-------------|
| P0 | Bloqueante — sem isso o MVP não existe |
| P1 | Alta — necessário para o MVP funcionar bem |
| P2 | Média — melhoria importante mas não bloqueante |

---

## Padrões de Commit

```
feat(sermons): adicionar CRUD de sermões
fix(editor): corrigir auto-save offline
infra(supabase): adicionar migration de profiles
style(cards): ajustar layout de cards no mobile
docs(spec): atualizar spec da página de apresentação
```

---

## Checklist antes de marcar issue como CONCLUÍDA

- [ ] Todos os critérios de aceite atendidos
- [ ] Nenhum `any` no TypeScript adicionado
- [ ] Tratamento de erro em todas as chamadas ao Supabase
- [ ] Loading states implementados
- [ ] Responsivo (mobile + desktop)
- [ ] `/review` executado e aprovado

---

## Regras Inegociáveis

1. **Nunca implemente sem plan aprovado**
2. **Nunca commite segredos** (`.env.local` no `.gitignore`)
3. **Nunca use `any`** no TypeScript
4. **Sempre valide com Zod** antes de salvar no banco
5. **Sempre verifique a flag de IA** antes de renderizar UI de IA
6. **Server Components por padrão** — `"use client"` só com justificativa
