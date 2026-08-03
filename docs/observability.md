# Observabilidade

## Logger Estruturado

`src/lib/observability/logger.ts`

4 niveis: debug, info, warn, error. Nivel minimo configuravel (debug em dev, info em prod).

```typescript
import { logger, setLogLevel } from './observability'

logger.info('Render completo', { templateId: 'sq-cover', duration: 150 })
logger.error('Export falhou', { format: 'pptx', error: err.message })
setLogLevel('warn') // Silencia debug e info
```

## Metricas

`src/lib/observability/metrics.ts`

Buffer circular de 1000 entradas com timing automatico.

```typescript
import { recordMetric, timeOperation, getMetrics, clearMetrics } from './observability'

recordMetric('render-time', 150, 'ms', { template: 'sq-cover' })

const result = await timeOperation('export', async () => {
  return await exporter.export(element, options)
})

const renderMetrics = getMetrics('render-time')
```

## Sentry

`src/lib/observability/sentry.ts`

- `initSentry()` — Inicializa com DSN via env var
- `captureError(error, context)` — Captura erros
- `captureMessage(message, level)` — Captura mensagens
- `setUser(user)` — Identifica usuario
- `addBreadcrumb(breadcrumb)` — Adiciona breadcrumb

Seguranca: headers de Authorization sao removidos automaticamente.

## Configuracao

```env
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_SENTRY_ENVIRONMENT=production
```

Sentry e desativavel — se DSN nao estiver configurado, as funcoes sao no-op.
