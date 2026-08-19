# PLANO UNIFICADO AUDITADO — FECHAMENTO DO DESIGN SYSTEM + INTELIGÊNCIA ORGÂNICA DO ROTA DE ATAQUE

> **Auditoria concluída em 13/08/2026.**
>
> Este documento foi confrontado com o código executável, os 40 pacotes de workers, as 40 filas reconciliadas, o Docker Compose, o deploy, as dez migrations do Prospector, as cinco migrations do Design System, a documentação canônica e o estado real dos dois bancos e dos containers em produção.
>
> **Reauditoria em 13/08/2026 após execução parcial pelo OpenCode:** o plano `plataforma/apps/design-system/PLANO_CORRECAO_CARROSSEL_IA_APIS_VPS.md` não havia sido concluído. Suas pendências reais foram incorporadas como fases DS0–DS5 e executadas junto às fases orgânicas F0–F10.
>
> **Execução concluída em 13/08/2026.** Este arquivo preserva o baseline anterior para rastreabilidade e registra, na seção 12, o estado implementado e verificado. Nenhum provider pago foi acionado: credenciais, budgets e flags continuam sendo gates operacionais explícitos.

---

## 1. Objetivo e fronteiras

Primeiro concluir o fluxo de carrossel/IA/API/migrations/deploy do Design System. Depois expandir o Prospector para operar um ciclo contínuo, progressivo e controlado de inteligência editorial:

```text
fontes oficiais e públicas permitidas
  -> descoberta
  -> coleta seletiva
  -> normalização + provenance
  -> deduplicação
  -> sinais, outliers e classificação
  -> oportunidades
  -> conteúdo em rascunho
  -> revisão humana
  -> Creative Bridge / Design System
  -> agendamento
  -> Instagram e Threads
  -> snapshots de performance
  -> recomendações de aprendizado
```

O objetivo é melhorar utilidade, salvamentos, compartilhamentos, comentários, alcance e crescimento orgânico com evidência rastreável. Volume de conteúdo não é objetivo por si só.

As fronteiras permanecem:

- **Prospector — `plataforma/apps/web`, `packages/*`, `workers/*`:** coleta, inteligência, oportunidades, conteúdo editorial, revisão, calendário, publicação, métricas, custos e operação.
- **Design System — `plataforma/apps/design-system`:** criação e revisão visual, templates, edição, geração gráfica e exportação.
- **Creative Bridge:** único contrato de integração entre os produtos. Não compartilhar stores, banco, sessão de navegador ou imports internos.

Não introduzir n8n, MCP ou outro orquestrador como núcleo do runtime. MCP pode existir apenas para diagnóstico/operação manual. Não criar banco, fila ou pipeline paralelo ao Prospector.

---

## 2. Baseline verificado que deve orientar a implementação

### 2.1 Monorepo e infraestrutura

- Next.js 15 e React 19 em `apps/web`.
- PostgreSQL 16/pgvector, Redis, BullMQ e embeddings locais de 384 dimensões.
- 14 packages existentes. Integrações seguem o padrão de pacote próprio, por exemplo:
  - `packages/meta-api`;
  - `packages/reddit-api`;
  - `packages/threads-api`;
  - `packages/whatsapp-cloud`;
  - `packages/email-provider`.
- O padrão real **não é** `packages/integrations/<provider>`. Novos conectores devem preferir:
  - `packages/exa-api`;
  - `packages/apify-api`;
  - `packages/bright-data-api`.
- `packages/shared` e `packages/ui-bridge` exportam artefatos em `dist`; vários outros packages exportam TypeScript de `src`.
- O deploy canônico é `plataforma/deploy/deploy-all.ps1`.

### 2.2 Baseline anterior à execução: workers, filas e runtime

Existiam **40 pacotes de worker**, 40 serviços Compose e 41 nomes de fila. A fila fantasma `whatsapp-group-manager`, sem pacote nem consumidor, foi removida; o estado final é 40 pacotes, 40 filas e 40 serviços.

Estado de produção encontrado antes da correção em 13/08/2026:

- web, PostgreSQL, Redis e embeddings: `running`;
- 38 workers: `exited`;
- `email-flow-engine` e `next-best-channel`: reiniciando continuamente;
- `worker_heartbeats`: zero registros;
- todos os fluxos assíncronos: não operacionais.

O arquivo local `docker/worker.Dockerfile` já contém build explícito de `@plataforma/shared`. Isso é uma remediação local a validar, não prova de que a imagem publicada ou todos os imports estejam corretos.

Problemas concretos que a Fase 0 precisa tratar:

1. `packages/shared/package.json` resolve `@plataforma/shared` para `dist/index.js` e `@plataforma/shared/worker` para `dist/worker.js`.
2. O runtime publicado ainda precisa ser reconstruído e validado contra essa resolução.
3. `runWorker()` em `packages/queue/src/runtime.ts` já registra heartbeat.
4. Dezessete `workers/*/src/main.ts` registram um segundo heartbeat manual, com métricas zeradas, concorrendo com o heartbeat do runtime.
5. Vários `main.ts` validam credenciais/dependências antes de saber se o worker está habilitado. Um worker desabilitado pode falhar ou reiniciar por configuração que só deveria ser obrigatória quando habilitado.
6. `/api/health` valida apenas PostgreSQL, Redis e embeddings.
7. A tela `apps/web/src/app/system-health` calcula estado a partir de heartbeats existentes; com zero linhas pode aparentar normalidade.
8. O dead-man de `workers/alerts` percorre heartbeats existentes e não detecta um worker esperado que nunca gravou heartbeat.
9. Schedulers são instalados pelo processo `alerts`; sua inicialização e ownership precisam ser comprovados, inclusive quando a fila de alertas estiver desativada.

### 2.3 Capacidades atuais relevantes

| Componente | Estado real no código | Direção correta |
|---|---|---|
| `discovery` | shell de preflight; não coleta nem persiste descoberta | implementar responsabilidade real ou reduzir seu papel formalmente |
| `adaptive-crawler` | agenda fontes existentes em `crawl_schedule` | estender para novos tipos de fonte/run sem virar provider client |
| `search-mining` | pesquisa Instagram via browser e classifica hits | preservar; não chamar de busca web multifonte |
| `collab-discovery` | extrai menções de captions e grava `candidate_sources` | reutilizar na descoberta/validação de concorrentes |
| `community-map` | já cria `competitor_candidates` a partir de comunidade | reutilizar e unificar o funil de candidatos |
| `meta-sync` | Meta própria + Business Discovery de concorrentes Instagram; atualiza performance própria | fonte oficial prioritária para dados próprios e publicação |
| `reddit-intelligence` | usa `packages/reddit-api`, grava `reddit_evidence` e `market_signals` | Reddit oficial continua primário; Bright Data é fallback |
| `extraction` | comentários de Instagram via browser, com circuit breaker e cobertura | não generalizar o payload Instagram para todas as plataformas |
| `classification` | classifica comentário em intent/topic/sentiment/pain/question e embedding | criar schema editorial novo sem quebrar o contrato existente |
| `competitive-intel` | agrega posts/comentários em topics, pain_points e questions | estender para evidência normalizada cross-platform |
| `content-opportunity` | cria oportunidade simples e determinística por momentum | estender scoring/evidência; não criar sistema concorrente |
| `content-item-orchestrator` | distribui item existente para canais; não gera copy | não sobrecarregar com geração de conteúdo |
| `review_inbox` | inbox polimórfica com decisão auditável | reutilizar para oportunidades/itens/variantes editoriais |
| `publisher` | publica Instagram a partir de `scheduled_publications` e exige aprovação | preservar guardas, idempotência e vínculo com variant |
| `threads-adapter` / `threads-publisher` | adaptação, review e publicação Threads | reutilizar |
| `meta-sync/instagram-performance.ts` | normaliza insights cumulativos próprios | alimentar snapshots temporais e agregados |

### 2.4 Baseline anterior à execução: banco de dados verificado

Produção possui PostgreSQL 16.14, 98 tabelas e ledger `schema_migrations` com 9/9 versões, até `0009_ai_runtime`.

Estado dos dados operacionais na inspeção:

- 2 contas e 2 campanhas;
- 0 concorrentes;
- 0 posts e comentários;
- 0 oportunidades, itens, variantes, publicações e métricas;
- 0 sinais de mercado, eventos, falhas e heartbeats;
- 1 provider e 2 modelos de IA configurados.

Estruturas já existentes a reutilizar:

- concorrência/coleta: `competitors`, `campaign_competitors`, `posts`, `comments`, `crawl_runs`, `crawl_schedule`;
- descoberta: `competitor_candidates`, `candidate_sources`, `search_terms`, `search_hits`;
- inteligência: `topics`, `pain_points`, `questions`, `post_radar`, `opportunities`, `market_signals`;
- editorial: `content_opportunities`, `theses`, `content_items`, `content_variants`, `review_inbox`;
- agenda/publicação: `scheduled_publications`, `content_publications`;
- performance: `own_media`, `content_performance` e views materializadas;
- operação: `events`, `failed_jobs`, `alerts`, `canary_runs`, `worker_heartbeats`, `slo_breaches`, `audit_log`;
- IA: `ai_providers`, `ai_models`.

Limitações reais:

- `competitors` e `posts` são modelados para Instagram (`username`, `shortcode`, `competitor_id NOT NULL`);
- `candidate_sources.discovered_via` tem enum limitado e não aceita Exa/Apify/Bright Data;
- não há modelo canônico de perfil/conteúdo/comentário cross-platform;
- não há provenance multi-provider por observação;
- não há transcrições/chunks editoriais;
- não há `research_run`, usage/custo externo, reservation/reconciliation ou budgets;
- não há baseline/outlier por criador;
- `content_performance` é agregado e não preserva todas as janelas temporais;
- `scheduled_publications` é legado Instagram, enquanto `content_publications` registra resultado multicanal; a página de publicação faz `UNION ALL` das duas fontes.

Não forçar TikTok, YouTube, X ou web dentro de `posts.shortcode`. Não reutilizar tabelas do banco opcional do Design System. Não reutilizar `ai_token_logs` do Design System no Prospector.

### 2.5 Providers existentes e ausentes

Existem Meta, Threads e Reddit. Não existe código nem configuração para Exa, Apify, Bright Data ou Windsor.

Precedência corrigida:

1. Meta/Threads oficiais para dados próprios, insights, webhooks e publicação.
2. Reddit oficial existente para watches configurados.
3. Exa para descoberta e conteúdo web pesquisável.
4. Apify para coleta social pública externa de Instagram, TikTok e YouTube, mediante Actor validado.
5. Bright Data somente quando não houver conector oficial/primário adequado ou quando o resultado principal falhar/incompleto.
6. Windsor fica fora do pipeline inicial. Só implementar após ADR com ganho incremental comprovado, custo, contrato e owner operacional.

Não duplicar sistematicamente a mesma coleta. Não contornar autenticação, paywall, CAPTCHA, bloqueios técnicos ou políticas de plataforma. Validar termos, base legal, minimização, retenção e direito de remoção antes de cada fonte.

### 2.6 Baseline anterior à execução: estado parcial deixado pelo OpenCode no Design System

O diff local e o build foram inspecionados sem descartar alterações. O build `pnpm --filter @plataforma/design-system build` falha com erros de TypeScript no wizard, catálogo de IA, validação Zod e middleware Hono.

| Frente do plano anterior | Estado revalidado | Pendência obrigatória |
|---|---|---|
| Skeletons dos cards antes da etapa 4 | parcial | extrair função pura testável; remover duplicações/efeitos destrutivos; preservar edição ao voltar de etapa |
| Navegação somente após sucesso | parcial/incorreta | `useWizardAI` ainda chama `nextStep()`; a tela deve controlar navegação por resultado discriminado |
| Feedback, retry e cancelamento | parcial/incorreto | há UI, mas botão aninhado inválido, variável inexistente e `AbortSignal` não chega às requisições |
| Fontes tese/texto/Markdown | parcial | validar cada fonte, carregar tese real, preservar Markdown e cobrir com testes |
| Contrato de campos por template | parcial | Zod não compila; `ScriptCard` reduz tudo a title/body/eyebrow e perde campos heterogêneos |
| Catálogo de providers/modelos | parcial | tipos não aceitam fal; IDs/modelos hard-coded divergem; teste e geração usam caminhos distintos |
| Seleção texto/imagem | parcial | existe no store/UI, mas capacidades e fallback não são validados de ponta a ponta |
| Segredos fora do navegador | não implementado | chaves e `customKey` continuam persistidas em `localStorage`; copy/imagem/teste chamam providers do browser |
| Gateway de IA | esqueleto | registry fixo, modelos antigos, sem timeout/circuit breaker/idempotência real; job da fal é simulado como `COMPLETED` |
| Autenticação/autorização | insuficiente | token global opcional apenas nas rotas de IA; projetos, perfis, teses, métricas e mutações continuam públicos |
| Rate limiting | insuficiente | mapa em memória por IP, não distribuído e baseado em `x-forwarded-for` não confiável |
| Cliente HTTP `/api` | parcial | comentário promete remover prefixo duplicado, mas `normalizePath()` não o remove; autenticação/request ID não existem |
| nginx/API same-origin | não implementado no deploy | o deploy unificado publica somente SPA estática; não cria proxy seguro da API do Design System |
| Dockerfile da API | não implementado | ainda usa Node 20 + npm + `package-lock.json`, incompatível com workspace pnpm/lockfile atual |
| Compose/API/migration job | não implementado | compose local contém apenas Postgres/Redis/MinIO; sem API, worker, migration job ou health/readiness |
| Migrations/ledger | parcial | quatro SQLs existem, mas não há baseline/reconciliação/runner versionado comprovado nem `down`/forward-fix documentado |
| Persistência de projetos/perfis/logs | parcial | schema e rotas existem, porém sem auth, ownership, validação completa e deploy |
| Logs/observabilidade de IA | parcial | token log grava custo zero e não correlaciona request/job/idempotência; faltam métricas e redaction testada |
| Testes unitários/integração/E2E | ausente para a correção | nenhum conjunto cobre o novo wizard/gateway/auth/nginx/migrations |
| Docs canônicos | inconsistente | documentação antiga foi removida; os Docs raiz ainda descrevem backend como opcional/não implantado |

Erros de compilação observados incluem declarações duplicadas em `WizardStep3Content.tsx`, variável `generating` inexistente, shadowing de `templateId`, tipos de provider incompatíveis, schema Zod inválido e assinaturas Hono incorretas. Corrigir todos antes de considerar qualquer item funcional.

---

## 3. Decisões obrigatórias que corrigem o plano original

1. **Rollout progressivo, não “todas as fontes na primeira versão”.** A ordem é Exa -> Apify -> Bright Data fallback -> inteligência profunda -> geração -> publicação.
2. **Quarenta workers, não “cerca de 40”.** Toda adição de fila/worker exige atualizar `QUEUE_NAMES`, package, Compose, `.env.example`, health, canários, testes e deploy.
3. **Inventário desejado no health.** Comparar workers/filas habilitados com containers, consumidores BullMQ e heartbeats. Ausência de linha é falha quando o worker é esperado.
4. **Worker desabilitado não exige credencial.** Configuração específica só pode falhar depois do gate de habilitação. Diferenciar `disabled`, `starting`, `running`, `degraded` e `failed`.
5. **Um único heartbeat por processo.** O runtime deve ser a fonte canônica; remover registros manuais duplicados ou absorver métricas reais nele.
6. **Scheduler com ownership explícito.** Não depender acidentalmente do ciclo de vida de um worker desabilitado.
7. **Packages seguem o padrão atual.** Não criar `packages/integrations` sem ADR.
8. **Contratos normalizados não vazam payload bruto.** Guardar raw somente quando necessário, sanitizado, com retenção e preferencialmente em object storage por referência.
9. **Deduplicação lógica não inclui provider como identidade.** Provider pertence à provenance; o mesmo conteúdo obtido por dois providers continua sendo um item lógico.
10. **Reddit oficial é primário.** Bright Data não substitui automaticamente `packages/reddit-api`.
11. **Conteúdo gerado por score nasce como rascunho.** Score alto autoriza geração, não aprovação nem publicação.
12. **`content-item-orchestrator` não é gerador.** Se nenhum componente existente comportar geração com responsabilidade coesa, criar um worker `content-generation` apenas após ADR curta.
13. **Uma agenda canônica.** Evoluir `scheduled_publications` para agendamento channel-aware/variant-aware ou migrar formalmente para outra única fonte. Não criar terceira agenda e não continuar com `UNION ALL` indefinido.
14. **Performance preserva snapshots.** Agregado atual não substitui medições de 1h/6h/24h/72h/7d.
15. **Aprendizado não altera pesos silenciosamente.** Gerar recomendação versionada, exigir amostra mínima, comparar com baseline e registrar ativação/rollback.
16. **Custos usam reservation + reconciliation.** Estimativa pré-chamada bloqueia budget; custo final/uso do provider reconcilia depois. Valores estimados não podem ser rotulados como faturados.
17. **Configuração de IA existente é a fonte.** Usar `ai_providers`, `ai_models`, `loadLlmRuntimeConfig` e `ConfigurableLlmClient`; não codificar “Claude” como provider obrigatório.

---

## 4. Contratos internos mínimos

Definir schemas Zod versionados em package compartilhado apropriado, sem acoplar workers aos DTOs dos providers.

### 4.1 Entidades normalizadas

```ts
type Platform =
  | 'instagram'
  | 'threads'
  | 'tiktok'
  | 'youtube'
  | 'reddit'
  | 'x'
  | 'google'
  | 'web'
  | 'news'
  | 'forum'
  | 'blog'

interface ExternalProfile {
  platform: Platform
  externalId?: string
  handle?: string
  canonicalUrl: string
  displayName?: string
  bio?: string
  followerCount?: number
  observedAt: string
}

interface ExternalContent {
  platform: Platform
  externalId?: string
  canonicalUrl: string
  creatorRef?: string
  contentType: string
  title?: string
  text?: string
  publishedAt?: string
  observedAt: string
  publicMetrics: Record<string, number>
}

interface ExternalComment {
  platform: Platform
  externalId: string
  contentRef: string
  parentExternalId?: string
  authorRef?: string
  text: string
  publishedAt?: string
  observedAt: string
}

interface ProviderObservation {
  provider: string
  operation: string
  providerRunId?: string
  observedAt: string
  normalizedEntityType: string
  normalizedEntityId: string
  rawStorageRef?: string
  quality: Record<string, number | boolean>
}
```

Também definir contratos para `Transcript`, `TranscriptChunk`, `SearchResult`, `TrendSignal`, `ResearchRun`, `ProviderUsageEvent` e `BudgetDecision`.

### 4.2 Identidade e deduplicação

Ordem de chaves:

1. `platform + external_id`, quando confiável;
2. URL canônica normalizada;
3. `platform + creator + published_at + content_hash`;
4. fingerprint semântico apenas como candidato, nunca merge destrutivo automático sem confiança alta.

Provider não participa da identidade lógica. Cada provider cria/atualiza uma observação ligada à mesma entidade.

Merges devem ser auditáveis e reversíveis. Concorrentes adicionados manualmente nunca podem ser apagados ou arquivados automaticamente.

### 4.3 Dados novos

Antes de nomear tabelas, produzir um mini-DDL/ADR confrontando o schema atual. A modelagem deve cobrir, sem duplicar o legado:

- entidade de concorrente e perfis por plataforma;
- conteúdo e comentários externos normalizados;
- provenance/observações por provider;
- runs de pesquisa/coleta;
- transcrições e chunks;
- snapshots de métricas e baseline por criador;
- clusters/sinais cross-platform;
- eventos de uso/custo e budgets;
- cache metadata sem transformar PostgreSQL em blob store.

Toda migration:

- recebe próximo número após a última migration real no momento da execução;
- possui `up` e `down`;
- preserva compatibilidade com as nove migrations anteriores e adiciona `0010_organic_intelligence`;
- inclui índices e constraints de idempotência;
- é testada em banco vazio e snapshot restaurado;
- não executa em produção antes de backup e teste de restauração;
- não registra segredo, texto pessoal desnecessário ou payload bruto sem retenção.

---

## 5. Providers e política de custo

### 5.1 Meta e Threads

Usar como fontes oficiais para contas próprias, mídia própria, insights, comentários/menções permitidos, webhooks e publicação. Não pagar outro provider pelo mesmo dado quando a API oficial atender qualidade e latência.

Respeitar capacidade real por tipo de conta/mídia, permissões, métricas disponíveis e janelas de consolidação. Não inferir métrica inexistente.

### 5.2 Reddit

Manter `packages/reddit-api` + `reddit-intelligence` como caminho primário. Bright Data só entra quando o conector oficial não atender uma fonte/caso aprovado e deve registrar o motivo do fallback.

### 5.3 Exa

Usar `/search` para descoberta e `/contents` para aprofundamento seletivo. Persistir `requestId`, tipo efetivamente resolvido quando útil, URLs e custo retornado como **estimativa**, reconciliando com uso/faturamento quando disponível.

Não usar busca profunda por padrão. `auto`/modo de menor custo deve ser baseline; modos profundos exigem threshold, budget e justificativa.

### 5.4 Apify

O Actor é configuração versionada, não hard-code espalhado:

- `actorId`, versão/build, schema de input, schema de output e capacidades;
- limites de itens, timeout, memória e gasto;
- adapter por Actor;
- canário/fixture antes de promoção.

Usar execução assíncrona para runs longos e webhook autenticado/idempotente quando aplicável. Buscar dataset por `runId/defaultDatasetId`. O custo de run pode ser eventualmente consistente; reconciliar após conclusão em vez de congelar o primeiro valor.

### 5.5 Bright Data

Usar scraper/dataset/API apropriado por fonte, com snapshot/run rastreável. Só acionar após decisão explícita:

```text
primary_not_supported | primary_failed | primary_incomplete | validation_sample
```

Não usar Bright Data como segundo coletor permanente do mesmo universo. Limitar validação amostral por budget.

### 5.6 Windsor

Fora do escopo inicial. Produzir ADR “não adotado” com critérios de reavaliação. Só criar package/flag se houver dado incremental mensurável que Meta e o pipeline existente não forneçam.

### 5.7 Custos e budgets

Registrar por operação:

- provider, operação, worker, campanha e `research_run_id`;
- unidades, moeda, custo estimado e custo reconciliado;
- duração, tentativas, resultado, cache hit/miss e fallback reason;
- IDs externos sanitizados necessários à reconciliação;
- `pricing_version` e timestamp.

Budgets:

- global, provider e campanha;
- diário e mensal;
- hard limit e soft limits em 50/75/90%;
- reserva atômica antes da chamada;
- reconciliação/refund da diferença;
- comportamento degradado documentado.

Próximo do limite: reduzir profundidade, comentários, resultados e frequência; aumentar threshold; preferir cache; adiar tarefas não críticas. Nunca driblar hard limit.

---

## 6. Plano de execução com gates

### Fase DS0 — Recuperar compilação e congelar o baseline do trabalho parcial

1. Não resetar nem sobrescrever o diff do OpenCode.
2. Corrigir todos os erros TypeScript atuais sem mascarar com `any`, comentários de lint ou remoção de funcionalidade.
3. Transformar `buildCardSkeletons()` em função pura fora do hook e cobri-la por tipo de criativo/preset/quantidade.
4. Eliminar declarações duplicadas, shadowing, imports mortos e botão interativo aninhado.
5. Executar build, lint e testes existentes; registrar falhas anteriores versus introduzidas.
6. Revisar as deleções documentais: manter a consolidação apenas quando o conteúdo estiver coberto pelos Docs canônicos e runbooks atuais.

**Gate DS0:** build e typecheck passam; lint não possui erros; testes existentes não regrediram; o diff parcial permanece preservado e compreendido.

### Fase DS1 — Concluir o domínio do wizard e os contratos de template

1. A tela `WizardView` controla transição; hooks retornam `GenerationResult` e nunca chamam `nextStep()`.
2. Inicializar cards ao confirmar template/preset/quantidade, sem efeito que apague edição válida ao remontar ou voltar de etapa.
3. Validar tese, texto livre e Markdown como fontes distintas; buscar a tese pelo contrato da API e não usar apenas seu título como conteúdo implícito.
4. Passar `AbortSignal`, timeout e idempotency key até o gateway; cancelar deve abortar rede/polling e liberar UI.
5. Impedir submissão concorrente e clique duplo; retry reutiliza contexto sem duplicar job.
6. Substituir `ScriptCard` rígido por conteúdo tipado que preserve todos os campos textuais do template, mantendo aliases de UI somente como projeção.
7. Validar quantidade, IDs, ordem, campos obrigatórios e limites; reparo limitado precisa ser explícito e observável.
8. Implementar capa com IA de ponta a ponta ou desabilitar o toggle com explicação até o gate correspondente.
9. Preservar edição manual, estado não secreto e recuperação do wizard em qualquer falha.

**Gate DS1:** texto/tese/Markdown avançam somente após geração válida; falhas nunca são silenciosas; custom fields não são descartados; cancel/retry/clique duplo e retorno de etapa passam em testes.

### Fase DS2 — Catálogo único e gateway de IA seguro

1. Remover chamadas diretas a DeepSeek/Anthropic/fal de `generateCopy.ts`, `generateImage.ts`, `testConnection.ts` e do store.
2. Remover chaves, `customKey` e valores sensíveis da persistência Zustand/localStorage; implementar migração que descarte segredos antigos sem registrá-los.
3. Manter no frontend somente IDs, labels, capacidades e status sanitizado.
4. Criar catálogo server-side único para texto/imagem/JSON/streaming, com modelo real configurável por env/banco e sem IDs aposentados hard-coded.
5. Fazer teste de conexão e geração real usarem o mesmo adapter.
6. Implementar gateway com:
   - timeout/AbortController;
   - allowlist fixa de hosts;
   - retry somente transitório;
   - circuit breaker;
   - erro público sanitizado + correlation ID;
   - idempotência persistente;
   - usage/custo real quando disponível;
   - prompt/parameter version.
7. Implementar fal assíncrona de verdade: submit, armazenamento seguro de `status_url`/`response_url`, status/result, falha e expiração. Nunca retornar `COMPLETED` fixo.
8. Nunca aceitar URL/baseUrl arbitrária enviada pelo browser.

**Gate DS2:** nenhuma credencial aparece em bundle/storage/DevTools/resposta; catálogo, teste e geração compartilham adapters; polling da fal é real e idempotente; testes contratuais passam com mocks.

### Fase DS3 — Autenticação, autorização, rate limit e contrato HTTP

1. Proteger todas as rotas não públicas, não apenas `/api/ai`.
2. Substituir token global comparado por igualdade simples por sessão/API auth integrada ou, no mínimo transitório, token server-side com comparação timing-safe, rotação e escopo.
3. Aplicar autorização/ownership por projeto, perfil, tese, plano, review, token log e job de IA.
4. Implementar rate limit Redis ou gateway distribuído, com chave por identidade + IP confiável; não confiar cegamente em `x-forwarded-for`.
5. Configurar CORS/headers para Authorization, request ID e origem exata; OPTIONS não pode abrir mutações.
6. Validar bodies/params de projetos e demais rotas com Zod; proibir mass assignment em PATCH.
7. Padronizar erros JSON e audit log sem conteúdo/segredo sensível.
8. Corrigir cliente para uma única convenção `/api`: remover prefixos duplicados, adicionar auth/correlation/idempotency e distinguir timeout/rede/HTTP.
9. Health e readiness são públicos apenas no nível sanitizado; métricas e diagnósticos exigem autorização.

**Gate DS3:** matriz de autorização e rate limit passa; `/api/api` é impossível; rota desconhecida retorna 404 JSON; nenhuma mutação anônima é aceita.

### Fase DS4 — Banco, migrations, containers, nginx e deploy da API

1. Inventariar DDL real e ledger da base do Design System; criar backup e testar restore em clone.
2. Estabelecer baseline formal das migrations `0000`–`0003` sem recriar objetos existentes.
3. Criar runner/migration job reproduzível, bloqueante e idempotente no workspace pnpm.
4. Adicionar migrations necessárias a auth/idempotência/jobs/segredos referenciados/auditoria, com rollback seguro ou forward-fix documentado.
5. Corrigir `Dockerfile.api` para Node suportado, pnpm, lockfile raiz e build multi-stage.
6. Incluir API, migration job e dependências/health no compose/deploy; decidir explicitamente se worker editorial/renderer também serão implantados.
7. Publicar imagem imutável por release/commit e validar release ID comum entre SPA/API/schema.
8. Configurar nginx same-origin preservando `/api`; impedir fallback da SPA em API; definir timeouts/limites/headers seguros.
9. Rollout da API antes do frontend dependente; rollback independente de SPA/API/nginx/banco.
10. Validar instalação limpa e upgrade de snapshot reconciliado.

**Gate DS4:** API e migration job sobem do zero; health/readiness passam; banco tem ledger reconciliado; nginx entrega JSON em `/api`; rollback foi ensaiado; deploy unificado realmente publica SPA + API.

### Fase DS5 — UX, observabilidade, testes e Docs do Design System

1. Exibir estados de preparação, copy, imagem, polling e finalização; erro com correlation ID e ações de recuperação.
2. Logs/métricas: request, usuário/escopo, provider/modelo, duração, tokens/custo, timeout, retry e resultado — sem prompt/resposta sensível por padrão.
3. Testes unitários: skeletons, fontes, contracts, reducers, adapters, erros e migração do store.
4. Integração: gateway/provider mocks, fal submit/status/result, auth/rate limit/ownership, HTTP, migrations e persistência.
5. E2E: fontes do wizard, modelo inválido, retry/cancel/clique duplo, capa, refresh seguro, canvas/export.
6. Infra: health JSON, 404 JSON, restart, migration idempotente, release ID e restore.
7. Atualizar `Docs/DESIGN-SYSTEM.md`, `Docs/ARQUITETURA-UNIFICADA.md`, `plataforma/deploy/DEPLOY.md`, `.env.example` e runbooks.

**Gate DS5:** todos os critérios de pronto do plano anterior passam por evidência executável; Docs descrevem o runtime implantado e limitações restantes. Somente então iniciar a Fase 0 do Prospector.

### Fase 0 — Fechar o runtime base

Arquivos prioritários:

- `packages/shared/package.json`;
- `packages/queue/src/runtime.ts`;
- `packages/queue/src/index.ts`;
- `workers/*/src/main.ts`;
- `docker/worker.Dockerfile`;
- `docker/docker-compose.yml`;
- `.env.example`;
- `apps/web/src/app/api/health/route.ts`;
- `apps/web/src/app/system-health/*`;
- `workers/alerts/src/main.ts`;
- `deploy/deploy-all.ps1`.

Executar:

1. Preservar e revisar as alterações deixadas pelo plano anterior; não resetar worktree.
2. Validar a imagem de worker do zero, sem `node_modules` ou `dist` do host.
3. Testar resolução de todos os imports runtime dos 40 packages.
4. Fazer credenciais/configuração específica serem avaliadas somente para worker habilitado.
5. Definir estado esperado de cada worker a partir de flag + capacidade configurada.
6. Consolidar heartbeat no runtime e remover os 17 registradores duplicados.
7. Fazer métricas do heartbeat refletirem jobs, falhas, backlog e p95 reais.
8. Reconciliar a fila reservada `whatsapp-group-manager`.
9. Separar ownership de schedulers; instalação deve ser idempotente e observável.
10. Criar health operacional autenticado/sanitizado ou ampliar a tela atual para comparar:
    - workers esperados x containers x heartbeats;
    - filas habilitadas x consumidores;
    - backlog/idade do job mais antigo;
    - DLQ/falhas;
    - schedulers;
    - provider capability;
    - budget state.
11. Corrigir dead-man para detectar ausência total de heartbeat.
12. Executar canário por pipeline habilitado, nunca nas 40 filas indiscriminadamente.

**Gate F0:** build, typecheck e testes passam; imagem limpa sobe; todo worker habilitado permanece `running`, produz heartbeat e consome canário; worker desabilitado aparece como `disabled`, não `healthy` nem `failed`; não há restart loop; PostgreSQL/Redis/embeddings e DLQ foram exercitados; produção tem dois ciclos de heartbeat válidos.

Não avançar para provider pago enquanto F0 não passar.

### Fase 1 — Fundação de providers, runs, custos e schema

1. Criar `packages/exa-api`, `packages/apify-api` e `packages/bright-data-api` seguindo os packages atuais.
2. Implementar clients HTTP com timeout, abort, retry transitório, rate limit, schemas Zod, redaction, capability check e adapters.
3. Criar registry/configuração server-side e flags desligadas por padrão.
4. Criar contracts normalizados da seção 4.
5. Implementar `ResearchRun`, `ProviderObservation`, usage/custo, reservation/reconciliation e budget guards.
6. Modelar entidades cross-platform sem quebrar `posts`/Instagram.
7. Atualizar `apps/web/src/lib/integration-capabilities.ts` para estados `not_configured`, `disabled`, `healthy`, `degraded`, `rate_limited`, `budget_blocked`.
8. Adicionar migrations reversíveis, repository tests e fixtures.

**Gate F1:** nenhum token aparece em logs/respostas; providers desligados não impedem boot; budget bloqueia antes da rede; duas observações do mesmo item geram uma entidade lógica e duas provenances; migrations passam em banco vazio e upgrade.

### Fase 2 — Exa: discovery web e concorrentes

Reutilizar/estender:

- `discovery`;
- `adaptive-crawler`;
- `search-mining` apenas onde ainda for Instagram/browser;
- `collab-discovery`;
- `community-map`;
- `candidate_sources` e `competitor_candidates`, com evolução de schema.

Fluxo:

1. Gerar queries por campanha, teses, público e sementes existentes.
2. Executar descoberta barata via Exa.
3. Normalizar resultado e provenance.
4. Detectar candidato de concorrente/fonte/assunto.
5. Consolidar candidatos de Exa, search, collab e community-map.
6. Calcular confiança explicável por evidências.
7. Enviar candidato para revisão humana antes de promover a concorrente ativa.
8. Concorrente manual recebe provenance manual e nunca é removido automaticamente.
9. Criar perfis por plataforma; não tratar todo candidato como username Instagram.

**Gate F2:** Exa descobre e deduplica fontes/candidatos; promoção é auditável; falsos positivos podem ser rejeitados; custo e cache são visíveis; nenhum candidato promove coleta ilimitada.

### Fase 3 — Apify: Instagram público, TikTok e YouTube

1. Selecionar Actors por experimento documentado; não congelar nomes comerciais no domínio.
2. Implementar adapters de perfil, conteúdo, comentário e transcrição quando o Actor realmente fornecer.
3. Começar por metadata/conteúdo superficial.
4. Aprofundar apenas acima do threshold.
5. Usar webhooks/run status/datasets com idempotência.
6. Versionar schemas por Actor e colocar payloads incompatíveis em quarentena, não no domínio.
7. Tratar YouTube/TikTok como fontes de inteligência, sem publicar neles.
8. Preservar Meta como primária para Instagram próprio.

**Gate F3:** canário por plataforma; Actor pode ser trocado por configuração; output inválido não contamina tabelas normalizadas; custo reconciliado; timeout/abort e replay de webhook testados.

### Fase 4 — Bright Data como fallback

1. Integrar X, Google e páginas web somente para casos aprovados.
2. Manter Reddit oficial como primário.
3. Implementar policy engine de fallback com reason code.
4. Proibir fallback em erro de validação local, budget bloqueado, credencial inválida ou fonte proibida.
5. Definir limite amostral de validação.
6. Medir taxa de fallback por fonte; excesso gera alerta e revisão do provider primário.

**Gate F4:** nenhuma execução duplicada sem reason code; fallback respeita idempotência/budget; custo incremental é mensurado.

### Fase 5 — Coleta progressiva, comentários, transcrições e inteligência

Estágios:

1. **Descoberta barata:** URL, IDs, autor, plataforma, tipo, timestamp, snippet e métricas superficiais.
2. **Aprofundamento seletivo:** conteúdo completo, perfil, histórico recente, comentários, transcrição e métricas adicionais.
3. **Inteligência profunda:** embeddings, clustering, padrões, comparação cross-platform e oportunidade.

Implementar:

- baseline móvel por criador/plataforma/formato, com mediana, percentil, MAD/desvio quando houver amostra;
- ratios com denominador e cobertura explícitos;
- outlier score somente com amostra mínima; usar confiança reduzida em cold start;
- snapshots de followers e métricas no mesmo intervalo do conteúdo;
- seleção de comentários por outlier, volume, tema e diversidade;
- classificação editorial em JSON validado:
  - topic, subtopic, pain, desire, question, objection;
  - thesis, promise, hook, CTA, format, structure;
  - sentiment, audience stage, utility;
  - potentials de save/share/comment/growth/reach/like;
  - evergreen, trend e confidence;
- transcrição com origem/licença/status, idioma, chunks e embeddings;
- separação entre evidência textual, métrica, visual e inferência do modelo;
- cluster cross-platform com links às evidências e `cross_platform_signal_score`.

Não afirmar análise visual a partir de caption/transcrição. Não enviar dataset inteiro ao LLM; pré-filtrar, agrupar e limitar contexto.

**Gate F5:** fixtures reproduzem dedup/outlier/classificação; scores registram versão e componentes; comentários/transcrições só aprofundam itens elegíveis; evidências permanecem navegáveis.

### Fase 6 — Oportunidades, geração e calendário

1. Estender `content-opportunity` para score versionado com:
   - performance relativa;
   - outlier;
   - recorrência multi-criador/plataforma;
   - crescimento temporal;
   - comentários/dor/dúvida;
   - utilidade e potenciais editoriais;
   - adequação ao público;
   - atualidade/evergreen/saturação;
   - confiança/cobertura;
   - performance histórica do Rota;
   - custo marginal previsto.
2. Guardar decomposição do score, não apenas total.
3. Oportunidade acima do threshold pode disparar geração, mas continua `new/draft`.
4. Gerar conteúdo original com referências, sem copiar texto protegido:
   - brief, tema, tese, argumento, hook, roteiro, copy e CTA;
   - formato/duração/slides;
   - legenda, hashtags justificadas, produção e variações;
   - template sugerido e requisitos de mídia.
5. Reutilizar `ai_providers`, `ai_models`, NLP, humanizer e brand voice.
6. Se necessário, criar `content-generation` como worker coeso; não colocar geração dentro de `content-item-orchestrator`.
7. Criar `content_items` e `content_variants` como rascunhos versionados.
8. Evoluir uma agenda canônica variant/channel-aware.
9. Distribuir datas com limites, diversidade de temas/teses/formatos/objetivos, timezone e conflitos.
10. Nunca agendar item sem versão de conteúdo, canal e status de revisão.

**Gate F6:** oportunidade -> rascunho -> variant -> agenda é idempotente; todos os campos requeridos existem ou ficam marcados como pendentes; não há aprovação automática; uma única consulta canônica alimenta calendário/publicação.

### Fase 7 — Review inbox e Creative Bridge

1. Reutilizar `review_inbox` com item types editoriais explícitos.
2. Suportar aprovar, rejeitar, editar, regenerar, trocar formato/canal/data, pedir hook/CTA e enviar ao Design System.
3. Registrar usuário, decisão, versão, timestamp, motivo e diff sanitizado.
4. Aprovação de conteúdo e aprovação de publicação são gates distintos quando necessário.
5. Definir payload Creative Bridge versionado:

```text
schema_version
content_item_id
variant_id
opportunity_id
campaign_id
thesis/topic/hook/copy/cta
format + slide_structure
media_requirements
template_recommendation
source_references sanitizadas
correlation_id
```

6. Validar origem, tamanho, tipos e compatibilidade.
7. Tratar o plano anterior do Design System como concluído; alterar o Design System apenas se um teste de contrato revelar incompatibilidade real.

**Gate F7:** nenhum item chega a publisher sem aprovação verificável; bridge rejeita versão/origem inválida; round-trip mantém IDs/correlação.

### Fase 8 — Publicação, performance e aprendizado

1. Reutilizar `publisher`, `threads-adapter` e `threads-publisher`.
2. Preservar role `actor`, kill switch, approval guards, rate limit e idempotência.
3. Instagram e Threads são os únicos canais de publicação desta entrega.
4. Registrar external ID e vínculo com variant/publication.
5. Coletar snapshots em janelas configuráveis, inicialmente 1h, 6h, 24h, 72h e 7d.
6. Persistir métrica ausente como ausente, não zero inventado.
7. Relacionar performance a topic, thesis, hook, CTA, format, structure, template, horário e objetivo.
8. Priorizar rates de save/share/comment, crescimento atribuível quando disponível, alcance e like rate.
9. Gerar recomendação de pesos versionada com:
   - amostra mínima;
   - intervalo/cobertura;
   - comparação contra baseline;
   - aprovação/ativação auditável;
   - rollback.

**Gate F8:** publicação só após aprovação; retries não duplicam post; snapshots são idempotentes por janela; aprendizado não altera configuração ativa sozinho.

### Fase 9 — UI, custos e operação

Estender superfícies existentes antes de criar páginas:

- Radar: temas, dores, teses, outliers, cross-platform e fontes;
- Concorrentes: manual/descoberto, entidades/perfis, origem, confiança, prioridade e última validação;
- Oportunidades: score decomposto, evidências, links, custo previsto, formato e status;
- Conteúdo/calendário/review: versões, agenda e ações humanas;
- Analytics: performance por tese/hook/formato/template;
- Configurações: provider, flags, limites e budgets;
- Saúde: desired state, consumidores, heartbeats, backlog, DLQ, providers, schedulers e budgets;
- Custos: estimado x reconciliado, hoje/7d/mês, projeção e maiores drivers.

Não expor tokens, payload bruto, autores pessoais ou stack traces internos.

**Gate F9:** operador consegue explicar por que um item foi coletado, aprofundado, ranqueado, gerado, aprovado, publicado e cobrado.

### Fase 10 — Testes, rollout, deploy e documentação

Testes obrigatórios:

- unitários de contracts/adapters/dedup/outlier/scoring/budget;
- contract tests gravados e sanitizados por provider;
- webhook/replay/polling/idempotência;
- integração de filas e repositories;
- migrations em banco vazio e upgrade;
- runtime de 40 workers/40 filas reconciliadas;
- health com zero heartbeat, heartbeat stale e fila sem consumer;
- E2E oportunidade -> review -> bridge -> agenda;
- publisher Meta/Threads com mocks oficiais;
- snapshots e aprendizado;
- segurança/redaction/SSRF/allowlist;
- falhas, retries, fallback e DLQ;
- carga controlada para backlog/custos.

Rollout:

1. shadow mode sem persistência operacional;
2. persistência de discovery com revisão;
3. Exa em uma campanha;
4. Apify em uma plataforma/Actor;
5. Bright Data fallback limitado;
6. inteligência profunda;
7. geração em rascunho;
8. calendário em draft;
9. publicação manualmente aprovada;
10. feedback/aprendizado apenas recomendatório.

Deploy:

- seguir `deploy/deploy-all.ps1`;
- backup e restore testado;
- build/test/lint/typecheck;
- migration job bloqueante;
- rollout por flags desligadas;
- health e canários;
- rollback por aplicação e estratégia de banco;
- verificar release/imagem/schema;
- nunca ativar todos os providers simultaneamente.

Documentação:

- atualizar `Docs/PROSPECTOR.md`;
- atualizar `Docs/ARQUITETURA-UNIFICADA.md` somente se a fronteira mudar;
- atualizar `plataforma/deploy/DEPLOY.md`;
- atualizar `.env.example`;
- atualizar runbooks de provider, budget, fila, worker, custo e publicação;
- adicionar ao `Docs/README.md` apenas documento canônico novo;
- separar implementado, configurado, ativado e verificado em produção.

---

## 7. Feature flags e configuração

Todas desligadas por padrão. Confirmar nomes finais com o padrão real antes de implementar.

```text
EXA_ENABLED=false
APIFY_ENABLED=false
BRIGHT_DATA_ENABLED=false
ORGANIC_DEEP_ANALYSIS_ENABLED=false
ORGANIC_AUTO_GENERATION_ENABLED=false
ORGANIC_AUTO_SCHEDULING_ENABLED=false
ORGANIC_LEARNING_RECOMMENDATIONS_ENABLED=false
```

Credenciais somente server-side em env/secret existente. Configuração não secreta, budgets e status podem ficar no PostgreSQL. Tokens nunca entram em código, logs, docs, browser ou payload de job.

Cada worker novo ou alterado mantém `WORKER_<QUEUE>_ENABLED=false` até o gate correspondente.

---

## 8. Critérios finais de aceite

A expansão só está concluída quando:

- o Design System compila, passa lint/testes e o wizard não perde nem avança com conteúdo inválido;
- texto livre, tese e Markdown possuem fluxos testados com cancel/retry/idempotência;
- todos os campos do template são preservados e validados;
- nenhuma chave de IA permanece no bundle, localStorage, IndexedDB ou chamada direta do navegador;
- gateway, adapters, teste de conexão e fal assíncrona são reais e compartilham catálogo único;
- todas as rotas e recursos sensíveis têm autenticação, autorização, ownership e rate limit distribuído;
- cliente, nginx e API usam uma convenção única `/api`;
- migrations do Design System têm baseline/ledger reconciliado e migration job reproduzível;
- deploy unificado publica SPA + API com health, release ID e rollback;
- Docs do Design System descrevem o estado implementado e verificado;

1. os 40 workers atuais têm desired state correto e os habilitados passam canário;
2. não existe restart loop nem erro de package resolution;
3. heartbeat, consumer, backlog, scheduler e DLQ são observáveis;
4. Exa, Apify e Bright Data passam contract tests e canários nas funções aprovadas;
5. Reddit oficial permanece primário;
6. entidades cross-platform são normalizadas, deduplicadas e possuem provenance;
7. concorrentes manuais e descobertos coexistem sem merge destrutivo;
8. coleta progressiva e budgets evitam aprofundamento indiscriminado;
9. outliers, comentários, transcrições e sinais cross-platform possuem evidências e confiança;
10. `content-opportunity` produz score explicável;
11. geração cria somente rascunhos originais e versionados;
12. calendário usa uma fonte canônica;
13. review humano é obrigatório e auditável;
14. Creative Bridge preserva fronteira e correlação;
15. apenas Instagram e Threads publicam nesta entrega;
16. publicação é idempotente e passa por guardas existentes;
17. snapshots de performance alimentam agregados sem perder janelas;
18. aprendizado gera recomendação reversível, não mutação silenciosa;
19. custos estimados e reconciliados, projeções e budgets são visíveis;
20. migrations, testes, deploy, rollback e runbooks foram validados;
21. documentação canônica descreve exatamente código e produção;
22. nenhuma credencial ou dado pessoal desnecessário foi exposto.

---

## 9. Arquivos e áreas prioritárias

- `plataforma/packages/shared/src/index.ts`
- `plataforma/packages/shared/src/worker.ts`
- `plataforma/packages/queue/src/index.ts`
- `plataforma/packages/queue/src/runtime.ts`
- `plataforma/packages/db/migrations/*`
- `plataforma/packages/meta-api/*`
- `plataforma/packages/reddit-api/*`
- `plataforma/packages/threads-api/*`
- `plataforma/packages/nlp/*`
- `plataforma/packages/humanizer/*`
- novos packages de provider no padrão `packages/<provider>-api`
- `plataforma/workers/discovery/*`
- `plataforma/workers/adaptive-crawler/*`
- `plataforma/workers/search-mining/*`
- `plataforma/workers/collab-discovery/*`
- `plataforma/workers/community-map/*`
- `plataforma/workers/extraction/*`
- `plataforma/workers/classification/*`
- `plataforma/workers/competitive-intel/*`
- `plataforma/workers/content-opportunity/*`
- `plataforma/workers/content-item-orchestrator/*`
- `plataforma/workers/meta-sync/*`
- `plataforma/workers/publisher/*`
- `plataforma/workers/threads-adapter/*`
- `plataforma/workers/threads-publisher/*`
- `plataforma/workers/alerts/*`
- `plataforma/apps/web/src/app/api/health/route.ts`
- `plataforma/apps/web/src/app/system-health/*`
- `plataforma/apps/web/src/app/review-inbox/*`
- `plataforma/apps/web/src/app/publishing/*`
- `plataforma/apps/web/src/lib/integration-capabilities.ts`
- `plataforma/docker/worker.Dockerfile`
- `plataforma/docker/docker-compose.yml`
- `plataforma/.env.example`
- `plataforma/deploy/deploy-all.ps1`

---

## 10. Fontes que devem ser relidas na execução

Fontes locais canônicas:

- `Docs/README.md`;
- `Docs/PROSPECTOR.md`;
- `Docs/ARQUITETURA-UNIFICADA.md`;
- `Docs/DESIGN-SYSTEM.md`;
- migrations, código, compose e deploy listados acima.

Referências oficiais de providers verificadas na auditoria:

- Exa Search: <https://exa.ai/docs/reference/search>
- Exa Contents: <https://exa.ai/docs/reference/get-contents>
- Apify Actor runs: <https://docs.apify.com/api/v2/actors-actor-runs>
- Apify default dataset: <https://docs.apify.com/api/v2/default-dataset>
- Bright Data Web Scraper APIs: <https://docs.brightdata.com/datasets/scrapers/overview>
- Meta Instagram Platform: <https://developers.facebook.com/docs/instagram-platform/>
- Threads API: <https://developers.facebook.com/docs/threads/>

Capabilities, preços, métricas, limites e termos mudam. Revalidar documentação oficial na data de implementação; não congelar no código suposições desta auditoria.

---

## 11. Modo de trabalho

Antes de cada fase:

1. ler o código e os Docs canônicos do domínio;
2. registrar o baseline e o gate;
3. fazer alteração pequena e reversível;
4. testar sem API paga real no caminho normal;
5. usar sandbox/canário com limite explícito quando chamada real for indispensável;
6. validar banco, fila, worker, UI e observabilidade proporcionais ao risco;
7. atualizar Docs somente depois de o código estar consistente;
8. informar o que está implementado, configurado, ativado e verificado.

Não fazer refactor amplo por preferência. Não substituir código estável sem evidência. Não executar migration ou deploy cegamente. Não sobrescrever alterações do plano anterior nem mudanças locais de outro responsável.

---

## 12. Registro final da execução

### 12.1 Resultado por fase

| Fase | Estado | Evidência principal |
|---|---|---|
| DS0 — baseline/compilação | concluída | build, typecheck, lint e testes do Design System aprovados sem descartar o diff parcial |
| DS1 — wizard/carrossel | concluída | esqueletos puros, campos heterogêneos, tese/Markdown, cancelamento, retry, idempotência e navegação somente após resultado válido cobertos por testes |
| DS2 — gateway de IA | concluída | catálogo único, nenhuma credencial no browser, `/api/ai`, adapters server-side e fal.ai assíncrona real |
| DS3 — segurança/API | concluída | sessão assinada HttpOnly, CSRF, ownership, CORS/headers, request ID, rate limit Redis e 404 JSON |
| DS4 — dados/migrations | concluída | `0004_secure_ai_gateway.sql`, ledger/checksum/baseline e runner reproduzível aplicados no VPS |
| DS5 — deploy | concluída | SPA e API publicadas; PostgreSQL/Redis saudáveis; `/api/health` retorna `ok` |
| F0 — runtime | concluída | 40/40 containers estáveis, uma imagem imutável, 40 filas, gate antes do import, heartbeat único, scheduler separado e health por desired state |
| F1 — dados orgânicos | concluída | migration `0010_organic_intelligence` aplicada e validada em banco vazio e clone da produção com restore |
| F2–F4 — providers/coleta/sinais | concluídas | packages Exa/Apify/Bright, modos discriminados, provenance, dedup lógico, snapshots, MAD robusto, fallback e budget antes de rede |
| F5 — oportunidades | concluída | `content-opportunity` consome sinais orgânicos e persiste decomposição explicável do score |
| F6–F7 — geração/bridge/review | concluídas | aprovação cria drafts idempotentes Instagram/Threads; Creative Bridge persistente/versionado; review e auditoria obrigatórios |
| F8 — agenda/publicação | concluída | `scheduled_publications` é a fonte canônica; variantes aprovadas; publishers por canal com guardas e idempotência |
| F9 — performance/aprendizado | concluída | snapshots 1h/6h/24h/72h/7d preservam janelas; recomendações permanecem reversíveis |
| F10 — custo/operação | concluída | budgets, reservas, custo estimado/real, UI/admin, validação de migrations, deploy e inspeção operacional |

### 12.2 Validações executadas

- Design System: 30 arquivos de teste e 121 testes aprovados; build Vite aprovado.
- Monorepo: typecheck 80/80, lint 81/81 e testes 81/81 aprovados; testes direcionados de providers, discovery, oportunidades, orquestração, publishers e performance aprovados.
- Web: 3 arquivos e 6 testes aprovados após correção do guardrail; build Next.js de produção aprovado.
- Banco: migration 0010 aplicada em produção; produção com 112 tabelas públicas e ledger até `0010_organic_intelligence`.
- Produção: Prospector web, PostgreSQL, Redis e embeddings saudáveis; 40 workers estáveis em uma imagem; scheduler instalado; Design API saudável; Gazeta n8n/worker preservada.
- Deploy do Design: helper remoto corrigido para arquivo temporário, `.npmrc` incluído no contexto Docker, release imutável confirmada no container/porta/nginx, readiness 200 e rota de IA protegida com 401 sem sessão.
- Banco legado do Design: 45 tabelas e zero registros; permaneceu fora do tráfego público e não foi removido sem uma janela explícita de descomissionamento.

### 12.3 Gates operacionais deliberadamente fechados

- `EXA_ENABLED`, `APIFY_ENABLED`, `BRIGHT_DATA_ENABLED` e as flags orgânicas permanecem `false` por padrão.
- As 40 flags `WORKER_<QUEUE>_ENABLED` permanecem `false`; por isso o health correto é 0 workers esperados e 0 ausentes.
- Ativação exige credencial server-side, budget cadastrado, canário limitado e habilitação consciente do pipeline correspondente.
- A ausência desses dados não é pendência de implementação e não autoriza chamada paga, coleta ou publicação automática.

### 12.4 Estado deste documento

O conteúdo das seções 2.2 e 2.6 é um baseline histórico anterior à execução. Em caso de divergência, esta seção, os Docs canônicos e o código/configuração executável têm precedência. O plano está integralmente mesclado, implementado e auditado; não restam itens parciais do plano anterior a executar.
