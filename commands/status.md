# /status, Situação Atual do Projeto

## O que este comando faz
Lista todas as issues e o progresso atual do projeto.

## Protocolo de execução

1. Leia todos os arquivos em `issues/`
2. Classifique por status (baseado no campo no topo de cada issue):
   - `[ ] PENDENTE`, ainda não iniciada
   - `[~] EM ANDAMENTO`, em implementação
   - `[x] CONCLUÍDA`, implementada e revisada

## Formato de saída

```markdown
## Status VOX, [data]

### ✅ Concluídas
- [x] 020, Setup Supabase + Schema
- [x] 021, Autenticação Supabase Auth

### 🔄 Em Andamento
- [~] 030, CRUD de Sermões

### ⏳ Pendentes (próximas)
- [ ] 001, Dashboard UI proto (P0)
- [ ] 031, Editor com frameworks (P0)
- [ ] 022, PWA + Offline (P1)
...

### 🚫 Bloqueadas
- [ ] 035, Módulo de IA [bloqueada por: 020, 030]
```

3. Exiba o **percentual de conclusão** por fase (proto/infra/behavior/integration)
4. Sugira a próxima issue de maior prioridade desbloqueada
