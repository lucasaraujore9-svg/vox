# /next, Próxima Issue a Trabalhar

## O que este comando faz
Analisa o estado atual e recomenda a próxima issue com maior impacto.

## Protocolo de execução

1. Leia `issues/README.md` para entender a convenção de numeração
2. Leia todos os arquivos em `issues/` e identifique:
   - Quais estão `[x] CONCLUÍDAS`
   - Quais têm dependências satisfeitas
   - Qual a prioridade (P0 > P1 > P2)
3. Aplique a lógica de ordenação:
   - **Primeiro:** issues infra (020-029) desbloqueadas, o resto depende delas
   - **Segundo:** issues proto (001-019) P0, validam UX antes do behavior
   - **Terceiro:** issues behavior (030-049), conectam UIs a dados reais
   - **Último:** issues de integration (050+)

## Formato de saída

```markdown
## Próxima Issue Recomendada

**Issue:** 021, Autenticação Supabase Auth
**Tipo:** infra
**Por quê agora:** Issue 020 (schema) foi concluída. Auth é pré-requisito para todas as issues de behavior.
**Depende de:** 020 ✅

### Para iniciar:
1. `/plan issues/021-supabase-auth-infra.md`
2. Aguarde aprovação
3. `/execute`
```
