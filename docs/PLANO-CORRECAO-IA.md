# Auditoria e Plano de Correção — Geração por IA do Design System

> **Data**: 21/08/2026  
> **Endpoint com falha**: `POST /api/ai/copy/generate → 503 Service Unavailable`  
> **Escopo**: Todos os endpoints de IA (copy, imagem, pipeline editorial)

---

## Arquitetura atual

```
Frontend (useWizardAI, AICopyControls, AIImageControls)
    ↓
API Hono (/api/ai/*) — auth + rate-limit (Redis) + circuit-breaker
    ↓
Providers: DeepSeek (text) | Claude/Anthropic (text) | fal.ai/FLUX (image)
    ↓
PostgreSQL: ai_token_logs, ai_jobs, api_idempotency
Redis: rate-limit, sessions, BullMQ (editorial pipeline)
```

### Endpoints existentes

| Método | Rota | Função | Rate limit |
|--------|------|--------|------------|
| GET | `/api/ai/catalog` | Lista modelos e providers configurados | — |
| POST | `/api/ai/copy/generate` | Geração de texto/copy via DeepSeek ou Claude | 20/60s |
| POST | `/api/ai/image/submit` | Submissão de job de imagem via fal.ai | 5/60s |
| GET | `/api/ai/jobs/:id` | Polling de status de job de imagem | 60/60s |
| POST | `/api/ai/providers/:provider/test` | Teste de conectividade do provider | 10/60s |

### Arquivos-chave

- `server/api/routes/ai.ts` — Todos os endpoints de IA
- `server/api/auth.ts` — Rate-limiter Redis + autenticação
- `lib/ai/generateCopy.ts` — Client-side copy generation
- `lib/ai/generateImage.ts` — Client-side image generation with polling
- `features/wizard/hooks/useWizardAI.ts` — Wizard AI orchestration
- `server/editorial/pipeline.ts` — Editorial pipeline (text generation)
- `server/editorial/workers/index.ts` — Worker de brief (stub)
- `server/queue/editorialQueues.ts` — Filas BullMQ

---

## Diagnóstico dos problemas encontrados

### CRÍTICO: 503 no `/api/ai/copy/generate`

Três causas possíveis (em ordem de probabilidade):

**Causa 1 — Redis offline ou inacessível**  
O rate-limiter em `auth.ts:84-105` usa Redis (ioredis). Se a conexão falhar, o catch genérico na linha 101 retorna `ApiError(503, 'Rate limit temporariamente indisponível.')`. O `REDIS_URL` no docker-compose aponta para `redis://redis:6379`, mas o container Redis pode estar caído.

**Causa 2 — Chave de API vazia**  
A função `providerKey()` em `ai.ts:40-43` verifica `process.env[config.keyEnv]`. Se `ANTHROPIC_API_KEY` ou `DEEPSEEK_API_KEY` estiver vazia/ausente no container, retorna `ApiError(503, 'Provider não configurado.')`.

**Causa 3 — Circuit breaker aberto**  
Após 5 falhas consecutivas em um provider, `assertCircuit()` (linha 56) retorna 503 por 60 segundos. Se as chaves estão inválidas, cada tentativa incrementa falhas e abre o circuito.

### ATENÇÃO: Credenciais reais no repositório

O arquivo `plataforma/.env.production` contém chaves reais de produção. Garantir que não seja commitado ao git.

### ATENÇÃO: Pipeline editorial — workers stub

O worker em `editorial/workers/index.ts` não executa geração por IA. Ele apenas atualiza status dos plan items para `brief_generated` e marca o job como `completed`. As 9 etapas restantes do pipeline (copy, review, similarity, rewrite, template, visual, render, finalize) não têm workers implementados.

### ATENÇÃO: Redis do BullMQ usa variáveis diferentes

O rate-limiter usa `REDIS_URL` (URL completa), mas o BullMQ em `editorialQueues.ts:3` usa `REDIS_HOST` e `REDIS_PORT` (host/porta separados). Se apenas `REDIS_URL` estiver definida, o BullMQ conecta em `localhost:6379` ao invés do container Redis.

### ATENÇÃO: Sem failover entre providers de texto

Se o provider selecionado (ex: Claude) está fora, a requisição falha sem tentar o DeepSeek como fallback. Não há mecanismo de failover automático.

### ATENÇÃO: Catálogo não expõe status do circuit breaker

O endpoint `/api/ai/catalog` retorna `configured: Boolean(process.env[keyEnv])` mas não informa se o circuito está aberto.

---

## Plano de correção

### Etapa 1 — Corrigir o 503 (Redis + chaves) [P0, ~30 min]

**Objetivo**: Resolver o 503 imediato no endpoint de geração de copy.

#### Passo 1.1 — Verificar estado do Redis na VPS

```bash
ssh root@187.127.249.22 'docker ps | grep redis'
```

Se não estiver rodando:
```bash
ssh root@187.127.249.22 'cd /opt/design-system && docker compose up -d redis'
```

#### Passo 1.2 — Verificar variáveis de ambiente no container API

```bash
ssh root@187.127.249.22 'docker exec design-api env | grep -E "REDIS_URL|ANTHROPIC_API_KEY|DEEPSEEK_API_KEY|FAL_API_KEY"'
```

Confirmar que todas as chaves estão presentes e não vazias. Se faltarem, configurar via Dokploy ou no `.env` de deploy da VPS.

#### Passo 1.3 — Tornar o rate-limiter resiliente (graceful degradation)

**Arquivo**: `server/api/auth.ts`, linhas 99-101

Alterar o catch genérico para permitir a requisição prosseguir sem rate-limit quando o Redis falha:

```typescript
// ANTES (linha 100-101):
if (error instanceof ApiError) throw error
throw new ApiError(503, 'Rate limit temporariamente indisponível.')

// DEPOIS:
if (error instanceof ApiError) throw error
console.error(JSON.stringify({ level: 'warn', event: 'rate_limit_redis_unavailable', path: c.req.path }))
await next()
return
```

#### Passo 1.4 — Adicionar health-check de Redis ao `/api/ready`

**Arquivo**: `server/api/index.ts`, linhas 43-50

Incluir verificação do Redis no health-check:

```typescript
app.get('/api/ready', async (c) => {
  const checks: Record<string, string> = {}
  try { await db.execute(sql`select 1`); checks.database = 'ok' } catch { checks.database = 'unavailable' }
  try {
    const redis = rateLimitRedis()
    if (redis.status === 'wait') await redis.connect()
    await redis.ping()
    checks.redis = 'ok'
  } catch { checks.redis = 'unavailable' }
  const ready = checks.database === 'ok'
  return c.json({ status: ready ? 'ready' : 'not_ready', ...checks }, ready ? 200 : 503)
})
```

#### Passo 1.5 — Testar o endpoint

```bash
curl -X POST https://design.rotadeataque.com.br/api/ai/copy/generate \
  -H "Authorization: Bearer $API_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-default","prompt":"Teste","systemPrompt":"Responda OK","maxTokens":10,"temperature":0}'
```

---

### Etapa 2 — Proteger credenciais no repositório [P0, ~10 min]

#### Passo 2.1 — Verificar se `.env.production` está no git

```bash
git log --all -- plataforma/.env.production
```

Se tiver commits, remover do histórico:
```bash
git filter-repo --path plataforma/.env.production --invert-paths
```

#### Passo 2.2 — Adicionar ao `.gitignore`

Garantir estas entradas no `.gitignore` (raiz e `plataforma/`):
```
.env
.env.local
.env.production
.env.*.local
!.env.example
!.env.production.example
```

---

### Etapa 3 — Failover entre providers de texto [P1, ~45 min]

#### Passo 3.1 — Criar função `generateTextWithFallback()`

**Arquivo**: `server/api/routes/ai.ts`

Criar wrapper que aceita o modelo preferido e, se falhar com 502/503/circuit aberto, tenta automaticamente o outro provider de texto configurado:

```typescript
async function generateTextWithFallback(
  preferredModelId: string,
  prompt: string,
  systemPrompt: string,
  maxTokens: number,
  temperature: number,
): Promise<{ content: string; inputTokens: number; outputTokens: number; config: ModelConfig; fallbackUsed: boolean }> {
  const preferred = modelConfig(preferredModelId, 'text')
  try {
    const result = await generateText(preferred, prompt, systemPrompt, maxTokens, temperature)
    return { ...result, config: preferred, fallbackUsed: false }
  } catch (error) {
    if (!(error instanceof ApiError) || ![502, 503].includes(error.status)) throw error
    const fallback = MODELS.find(m =>
      m.id !== preferredModelId &&
      m.capabilities.includes('text') &&
      process.env[m.keyEnv]
    )
    if (!fallback) throw error
    const result = await generateText(fallback, prompt, systemPrompt, maxTokens, temperature)
    return { ...result, config: fallback, fallbackUsed: true }
  }
}
```

#### Passo 3.2 — Atualizar `/copy/generate` para usar fallback

No handler do POST `/copy/generate`, substituir a chamada direta a `generateText()` pela nova `generateTextWithFallback()`. Adicionar campo `fallbackUsed` na resposta JSON.

#### Passo 3.3 — Expor status do circuit breaker no `/catalog`

No handler do GET `/catalog`, adicionar para cada provider:

```typescript
const circuitState = circuits.get(provider)
// Adicionar ao objeto do provider:
circuitOpen: Boolean(circuitState && circuitState.openedUntil > Date.now()),
circuitResetAt: circuitState?.openedUntil ? new Date(circuitState.openedUntil).toISOString() : null,
consecutiveFailures: circuitState?.failures ?? 0,
```

---

### Etapa 4 — Unificar configuração Redis [P1, ~20 min]

#### Passo 4.1 — Criar utilitário `server/infra/redis.ts`

```typescript
import Redis from 'ioredis'
import type { ConnectionOptions } from 'bullmq'

const redisUrl = process.env.REDIS_URL ?? `redis://${process.env.REDIS_HOST ?? 'localhost'}:${process.env.REDIS_PORT ?? 6379}`

let instance: Redis | undefined
export function getRedis(): Redis {
  instance ??= new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false })
  return instance
}

export function getBullMQConnection(): ConnectionOptions {
  const url = new URL(redisUrl)
  return { host: url.hostname, port: Number(url.port || 6379) }
}
```

#### Passo 4.2 — Atualizar `editorialQueues.ts`

Substituir a linha 3:
```typescript
import { getBullMQConnection } from '@/server/infra/redis'
const connection = getBullMQConnection()
```

#### Passo 4.3 — Atualizar `auth.ts`

Substituir `rateLimitRedis()` para usar `getRedis()` do utilitário compartilhado.

---

### Etapa 5 — Implementar workers reais do pipeline editorial [P2, ~3 horas]

#### Passo 5.1 — Worker `editorial-copy`

**Arquivo**: `server/editorial/workers/copy-worker.ts`

- Receber `planItemId` e `generationJobId` do job
- Carregar plan item + thesis do banco
- Instanciar TextProvider real (DeepSeek ou Claude) usando as chaves de env
- Chamar `generateCopy()` de `pipeline.ts` com o provider
- Salvar resultado em `content_items`
- Enfileirar na fila `editorial-review`

#### Passo 5.2 — Worker `editorial-review`

**Arquivo**: `server/editorial/workers/review-worker.ts`

- Carregar content item gerado
- Chamar `reviewCopy()` e `calculateSimilarity()` de `pipeline.ts`
- Se score < 0.65 e tentativas < 2: enfileirar em `editorial-rewrite`
- Se score >= 0.65: enfileirar em `editorial-template`

#### Passo 5.3 — Worker `editorial-rewrite`

**Arquivo**: `server/editorial/workers/rewrite-worker.ts`

- Chamar `rewriteIfNeeded()` com o motivo da baixa nota
- Re-gerar copy com prompt refinado via TextProvider
- Re-enfileirar em `editorial-review` (max 2 ciclos)

#### Passo 5.4 — Worker `editorial-template`

**Arquivo**: `server/editorial/workers/template-worker.ts`

- Chamar `selectTemplate()` de `pipeline.ts`
- Salvar `templateSuggestion` no content item
- Enfileirar em `editorial-visual`

#### Passo 5.5 — Workers `editorial-visual` e `editorial-render`

**Arquivo**: `server/editorial/workers/visual-worker.ts`

- Gerar imagem de capa via fal.ai usando `providerFetch()` direto
- Salvar URL da imagem no content item
- Enfileirar em `editorial-finalize`

#### Passo 5.6 — Worker `editorial-finalize`

**Arquivo**: `server/editorial/workers/finalize-worker.ts`

- Atualizar status do content item para `ready_for_approval`
- Contar itens restantes; se todos prontos, marcar generation job como `completed`

#### Passo 5.7 — Registrar workers no boot da API

No entrypoint do servidor, importar e inicializar todos os workers. Garantir graceful shutdown:

```typescript
const workers = [
  createEditorialBriefWorker(),
  createEditorialCopyWorker(),
  createEditorialReviewWorker(),
  // ...
]
process.on('SIGTERM', () => Promise.all(workers.map(w => w.close())))
```

---

### Etapa 6 — Melhorar observabilidade [P2, ~45 min]

#### Passo 6.1 — Logging estruturado em `providerFetch()`

Em cada tentativa e no resultado final, logar JSON estruturado:
```typescript
console.log(JSON.stringify({
  level: 'info', event: 'provider_call',
  provider: config.provider, model: config.model,
  attempt, statusCode: response.status,
  latencyMs: Date.now() - start,
}))
```

#### Passo 6.2 — Endpoint `GET /api/ai/status`

Novo endpoint que retorna o estado de cada provider:
```json
{
  "providers": [
    {
      "id": "deepseek",
      "configured": true,
      "circuitOpen": false,
      "consecutiveFailures": 0,
      "lastSuccess": "2026-08-21T10:00:00Z"
    }
  ]
}
```

#### Passo 6.3 — Mensagens de erro específicas no frontend

Em `useWizardAI.ts`, quando receber 503 do servidor, parsear o body da resposta e exibir a mensagem específica (`'Provider não configurado'` vs `'Rate limit indisponível'` vs `'Provider temporariamente indisponível'`).

#### Passo 6.4 — Painel de status no `AIConfigView.tsx`

Consumir `/api/ai/status` e mostrar indicador visual (verde/amarelo/vermelho) para cada provider com último teste bem-sucedido e botão para testar.

---

### Etapa 7 — Validar fluxo completo de imagens fal.ai [P2, ~30 min]

#### Passo 7.1 — Verificar `FAL_API_KEY` no container

```bash
ssh root@187.127.249.22 'docker exec design-api env | grep FAL_API_KEY'
```

#### Passo 7.2 — Testar submit + polling

```bash
# Submit
curl -X POST https://design.rotadeataque.com.br/api/ai/image/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider":"fal","model":"fal-flux-schnell","prompt":"Teste de geração"}'

# Poll (substituir JOB_ID)
curl https://design.rotadeataque.com.br/api/ai/jobs/JOB_ID \
  -H "Authorization: Bearer $TOKEN"
```

#### Passo 7.3 — Revisar whitelist de hosts

Confirmar que `ALLOWED_HOSTS` em `ai.ts:31-32` cobre todos os domínios de resposta da fal.ai. Verificar documentação atualizada em https://fal.ai/docs.

#### Passo 7.4 — Limpeza de jobs expirados

Adicionar cron job ou cleanup periódico para remover registros expirados da tabela `ai_jobs`:
```sql
DELETE FROM ai_jobs WHERE expires_at < now() - interval '7 days';
```

---

## Priorização

| Prioridade | Etapa | Esforço | Bloqueador? |
|------------|-------|---------|-------------|
| **P0** | Etapa 1 — Fix do 503 (Redis + chaves) | 30 min | Sim — nada funciona |
| **P0** | Etapa 2 — Proteger credenciais no .gitignore | 10 min | Sim — segurança |
| **P1** | Etapa 3 — Failover entre providers | 45 min | Não |
| **P1** | Etapa 4 — Unificar Redis | 20 min | Não |
| **P2** | Etapa 5 — Workers do pipeline editorial | 3 h | Não |
| **P2** | Etapa 6 — Observabilidade | 45 min | Não |
| **P2** | Etapa 7 — Validar imagens fal.ai | 30 min | Não |

**Tempo total estimado**: ~6 horas
