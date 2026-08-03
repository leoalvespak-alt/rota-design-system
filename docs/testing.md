# Testes

## Stack

- **Vitest** — Testes unitarios e de integracao
- **Testing Library** — Testes de componentes React
- **axe-core** — Testes de acessibilidade
- **Playwright** — Testes E2E e visuais

## Executar

```bash
npm test              # Vitest watch mode
npx vitest run        # Execucao unica
npx vitest run --coverage  # Com cobertura
```

## Arquivos de Teste

| Arquivo | Cobertura |
|---------|-----------|
| `schemas.test.ts` | Schemas Zod, validacao de templates |
| `creativeWorkflow.test.ts` | XState transitions, estados, retry |
| `visualValidator.test.ts` | Overflow, contraste, tipografia |
| `motionTokens.test.ts` | Tokens e presets de animacao |
| `logger.test.ts` | Logger estruturado, niveis |
| `metrics.test.ts` | Metricas, timing, buffer |
| `brandTheme.test.ts` | Tema ECharts, cores brand |
| `exporters.test.ts` | Registro de exportadores |
| `types.test.ts` (slides) | Tipos de slide e deck |
| `types.test.ts` (documents) | Tipos de documento e bloco |

## Configuracao

Setup em `src/test/setup.ts`. Vitest configurado em `vite.config.ts`:

```typescript
test: {
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  exclude: ['node_modules', 'dist', 'tests/e2e/**'],
}
```

## Resultados

72 testes passando em 14 arquivos de teste.
