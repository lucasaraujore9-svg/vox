# /review, Revisar Implementação

## O que este comando faz
Revisa o código implementado contra os critérios de aceite da issue.

## Como usar
```
/review issues/030-sermon-crud-behavior.md
```

## Protocolo de execução

1. **Leia** a issue indicada (critérios de aceite)
2. **Leia** os arquivos implementados (listados no plano)
3. **Verifique** cada critério de aceite:

### Checklist técnico obrigatório
- [ ] Nenhum `any` no TypeScript
- [ ] Server Components usados onde possível
- [ ] Todos os inputs validados com Zod
- [ ] Tratamento de erro em todas as chamadas ao Supabase
- [ ] Loading states presentes em operações assíncronas
- [ ] Sem segredos hardcoded
- [ ] Flag de IA verificada (se a feature for do módulo de IA)
- [ ] Responsivo (mobile + desktop)
- [ ] Funciona offline (se feature depende de dados locais)

### Checklist funcional
- [ ] Cada critério de aceite da issue foi atendido
- [ ] Fluxo happy path funciona
- [ ] Casos de erro tratados (input inválido, erro de rede, usuário não autenticado)

## Formato de saída

```markdown
## Review, Issue NNN: [Título]

### ✅ Aprovado
- Critério X: implementado corretamente
- Tipagem: nenhum `any` encontrado

### ⚠️ Ajustes necessários
- Critério Y: falta tratamento de erro quando Supabase retorna null
- Componente Z: não está responsivo em mobile

### 🚫 Bloqueante
- [Problema crítico que impede marcar como concluída]
```

Após aprovação: marque a issue como `[x] CONCLUÍDA` e use `/next`.
