# Migracoes

## Drizzle Kit

```bash
npx drizzle-kit generate   # Gerar migracao a partir do schema
npx drizzle-kit push        # Aplicar schema diretamente (dev)
npx drizzle-kit studio      # Interface visual do banco
```

## Schema

Definido em `src/db/schema.ts` com 20 tabelas. Alteracoes no schema geram migrations automaticamente via `drizzle-kit generate`.

## Estrategia

1. **Desenvolvimento**: Use `drizzle-kit push` para aplicar schema diretamente
2. **Staging/Producao**: Use `drizzle-kit generate` para gerar SQL, revise, e aplique

## Rollback

Drizzle Kit nao gera rollback automatico. Para rollback:

1. Crie um snapshot do banco antes da migracao
2. Em caso de falha, restaure o snapshot
3. Ou crie uma migracao reversa manualmente

## Boas Praticas

- Sempre gere migrations em branch separada
- Revise o SQL gerado antes de aplicar
- Nunca execute migrations destrutivas sem backup
- Teste migrations em staging antes de producao
- Use `drizzle-kit studio` para verificar estado do banco
