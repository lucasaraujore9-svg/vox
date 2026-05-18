# /plan, Planejar Implementação de uma Issue

## O que este comando faz
Lê a issue indicada e produz um plano detalhado de implementação **antes** de escrever código.

## Como usar
```
/plan issues/030-sermon-crud-behavior.md
```

## Protocolo de execução

1. **Leia** a issue indicada completamente
2. **Leia** `CLAUDE.md`, atores, padrões, estrutura de pastas, tokens principais
3. **Leia** `docs/SPEC.md`, comportamentos esperados da página/feature
4. **Leia** `docs/references/architecture.md`, schema do banco, padrões técnicos
5. **Leia** `docs/references/design-system.md`, tokens reais, componentes, regras visuais
6. **Consulte** `design-system/vox/primitives.jsx`, componentes reutilizáveis (VoxIcon, VoxMark, FrameworkBadge, Status)
7. **Consulte** `design-system/vox/data.js`, frameworks, block types, dados mock
8. **Verifique** as dependências da issue (campo "Depende de"), estão completas?

## Formato do plano gerado

```markdown
## Plano, Issue NNN: [Título]

### Arquivos a criar
- `src/app/(app)/...`, [descrição]
- `src/components/...`, [descrição]
- `src/lib/...`, [descrição]

### Arquivos a modificar
- `src/...`, [o que muda e por quê]

### Schema / Queries Supabase
- Tabela usada: ...
- Queries necessárias: ...

### Componentes necessários (shadcn/ui)
- ...

### Riscos e decisões
- [Decisão técnica e justificativa]
- [Possível risco e como mitigar]

### Critério de aceite (da issue)
- [ ] ...
- [ ] ...
```

7. **Aguarde aprovação** do usuário antes de executar
8. Só após aprovação: use `/execute`

## Regra anti-implementação prematura
Nunca escreva código de implementação durante o `/plan`. Só após aprovação explícita do usuário.
