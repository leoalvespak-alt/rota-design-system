# Prospector — arquitetura e funcionamento

**Estado verificado em 18/08/2026.** Este documento descreve o código executável do monorepo e a release publicada. Não pressupõe que planos históricos tenham sido implementados.

> A release atual aplica migrations `0023`–`0026`, inicia o supervisor de workers mesmo quando pausados e usa `worker_settings` como estado desejado. A ativação de fontes, providers e publishers continua deliberada por canário; estar implantado não autoriza automaticamente consumo externo ou publicação.

## 1. Papel e limites

O Prospector é o produto de inteligência, prospecção e operação multicanal em `plataforma/apps/web`, apoiado pelos pacotes de `plataforma/packages`, pelos workers de `plataforma/workers` e pela infraestrutura de `plataforma/docker`. O Design System é outro produto; a dependência visual do Prospector é apenas `@plataforma/ui-bridge`.

O sistema separa quatro responsabilidades:

- **Interface e API:** Next.js 15, React 19 e route handlers em `apps/web`.
- **Contratos e integrações:** pacotes compartilhados para banco, filas, Meta, Threads, Reddit, WhatsApp, e-mail, regras de texto, notificações e UI.
- **Processamento assíncrono:** 40 workers BullMQ em 40 filas, cada um habilitado por flag própria; o scheduler é um processo separado.
- **Estado operacional:** PostgreSQL 16/pgvector como fonte de verdade, Redis para filas e controles efêmeros e Text Embeddings Inference para vetores de 384 dimensões.

Foram examinados os arquivos de código/configuração do Prospector, incluindo `.ts`, `.tsx`, as 19 migrations versionadas com pares `up`/`down`, Docker, scripts de operação e deploy.

## 2. Arquitetura de execução

```text
Navegador / webhooks externos
            |
       Next.js /prospector
       |       |        |
   PostgreSQL Redis   embeddings
                 |
              BullMQ
                 |
  collectors -> inteligência -> decisão/revisão -> actors
                 |
       Meta / Threads / WhatsApp / e-mail
```

`apps/web` lê e altera o banco, publica jobs e recebe callbacks OAuth/webhooks. Os workers consomem jobs com concorrência configurável. `packages/shared` define schemas, motivos de resultado, papéis `collector`/`actor`, preflight e telemetria; `packages/queue` cria filas, IDs determinísticos, retry exponencial e DLQ.

Cada container carrega o módulo do worker somente se `WORKER_<NOME>_ENABLED=true`; desabilitado, permanece estável sem tocar credenciais ou dependências. O runtime registra um único heartbeat por worker habilitado e também verifica migrações, dimensão de embedding, validade de token, lock, orçamento e saúde/papel da conta. Ações externas passam por políticas, papel `actor`, kill switch e, nos fluxos previstos, aprovação humana. O scheduler instala agendas BullMQ sem assumir a propriedade de alertas.

## 3. Fluxos funcionais

### 3.1 Descoberta, coleta e qualificação

1. Campanha, contas e concorrentes delimitam o universo de coleta.
2. `discovery` executa modos discriminados: busca web por Exa, coleta social por Actors Apify e fallback explícito por Bright Data; Reddit oficial permanece primário. Os demais coletores existentes continuam obtendo sinais por API, webhook ou navegador automatizado.
3. `extraction` normaliza posts/comentários e mede cobertura; `enrichment` completa perfis; `classification` calcula intenção, tema, sentimento, sinal de compra e embedding.
4. `scoring` aplica pesos por campanha, recência, intenção, semântica, relacionamento e origem; grava prioridade P0/P1/P2 e histórico.
5. Observações preservam provider, URL, horário, dataset/run e chave lógica cross-platform; snapshots e MAD robusto detectam outliers. `community-map`, `audience-overlap`, `competitive-intel` e `content-opportunity` transformam os sinais em comunidades, sobreposição, radar competitivo e oportunidades editoriais com score decomposto.

Coletas são desenhadas para serem idempotentes por identificadores externos e chaves únicas. Contas de coleta e de ação têm papéis separados para impedir que um coletor execute contato.

### 3.2 Decisão, revisão e ação

1. `nba-engine` e `next-best-channel` calculam a melhor ação/canal elegível.
2. `contact-policy-engine` considera opt-in, cadência, canal, campanha e histórico de contato.
3. Itens que exigem decisão humana entram em `review_inbox`; APIs de aprovação/rejeição registram o decisor.
4. `engagement`, `private-reply`, `dm-copilot`, `threads-publisher`, `whatsapp-outbound` e `publisher` são caminhos de saída. Guardas bloqueiam DM fria, janela expirada, ausência de opt-in/aprovação, texto fora das regras ou conta sem papel `actor`.
5. `retention-tracker`, `reciprocity-detector`, `conversion-tracking` e `source-roi` medem retenção, reciprocidade, conversão e retorno por origem.

### 3.3 Conteúdo multicanal

Ao aprovar uma oportunidade, o sistema cria idempotentemente um item de conteúdo e variantes em rascunho para carrossel Instagram e Threads, além do review. `content-item-orchestrator` só distribui conteúdo aprovado. A agenda canônica é `scheduled_publications`; somente variantes aprovadas podem ser agendadas. `publisher` e `threads-publisher` consomem registros vencidos do canal correto, aplicam guardas e persistem sucesso/falha idempotentemente. Snapshots de performance em 1h, 6h, 24h, 72h e 7d preservam janelas e alimentam agregados.

### 3.4 Identidade e conversas

`identity-resolver` propõe união de identidades entre canais, exige evidência para aprovação e mantém snapshot reversível. Webhooks Meta e WhatsApp registram eventos inbound; `conversation-agent` e `dm-copilot` mantêm estágio, intenção, objeções e necessidade de revisão. Opt-out do WhatsApp é reconhecido e bloqueia novas saídas.

## 4. Workers por domínio

| Domínio | Workers | Responsabilidade principal |
|---|---|---|
| Aquisição | adaptive-crawler, discovery, extraction, follower-mining, live-monitor, mention-monitor, search-mining | Agendar e coletar sinais públicos/permitidos |
| Integrações | meta-sync, meta-webhook-consumer, reddit-intelligence, threads-adapter, whatsapp-inbound | Sincronização e entrada por canal |
| Inteligência | classification, enrichment, scoring, community-map, audience-overlap, competitive-intel, content-opportunity | Normalização, classificação, ranking e oportunidades |
| Orquestração | content-item-orchestrator, nba-engine, next-best-channel, contact-policy-engine, identity-resolver | Decisão, elegibilidade, distribuição e identidade |
| Conversa/saída | conversation-agent, dm-copilot, engagement, private-reply, publisher, threads-publisher, whatsapp-outbound | Produzir ou executar ações controladas |
| E-mail | email-flow-engine, email-events-consumer | Fluxos e eventos de e-mail |
| Resultado | conversion-tracking, reciprocity-detector, retention-tracker, source-roi | Conversão, reciprocidade, retenção e ROI |
| Radar orgânico | news-radar | RSS polling (15min incremental, 12h full), classificação por keywords ou IA, geração de achados |
| Operação | alerts, data-quality | Alertas, reparo e materialized views |

Todos usam o mesmo contrato de preflight e resultado. Filas têm até 5 tentativas por padrão; `engagement` e `publisher`, 3. Falhas persistentes permanecem na fila e são copiadas para DLQ, com registro em `failed_jobs`/eventos quando o observador correspondente está ativo.

## 5. Web, autenticação e API

A aplicação é publicada sob `NEXT_PUBLIC_BASE_PATH=/prospector`. NextAuth usa credenciais de e-mail + OTP assinado; o middleware protege as páginas internas e as permissões distinguem leitura, operação e administração. O contexto de campanha é persistido e aplicado às consultas do dashboard.

Redirecionamentos de autenticação preservam obrigatoriamente o base path: uma rota como `/prospector/radar` envia o usuário para `/prospector/login` e mantém `/prospector/radar` como callback validado. Nenhum caminho interno do Prospector pode cair no `/login` ou em uma rota relativa da SPA do Design System.

As superfícies principais cobrem campanhas, radar, oportunidades de conteúdo, itens editoriais, review inbox, conversas, timeline, identidades, políticas de contato, ROI, publicação, teses, notificações, configurações e saúde do sistema.

As listas principais de radar, inteligência competitiva, comunidades, ROI por
origem e timeline consultam diretamente as tabelas operacionais. Uma auditoria
posterior, registrada na seção 16, encontrou simulações remanescentes em
detalhes, gráficos e ações complementares; portanto a ausência total de mocks
ainda não está verificada. As rotas internas dispõem de skeletons de
carregamento; Saúde do sistema e Automações também isolam erros de carregamento
com orientação segura.

Os route handlers formam estes grupos de contrato:

- **Administração:** contas/políticas, IA, concorrentes, configurações, gatilhos de notificação e automações (`/api/admin/automations`).
- **Operação:** leads, ações de engajamento, review inbox (com abas radar/insights/sugestões), kill switch, publicação (cancel/confirm-manual/kill-switch) e políticas de contato.
- **Orçamento orgânico:** `/api/admin/organic-budgets` (PUT tetos), `/api/admin/organic-metrics` (métricas operacionais).
- **Triagem orgânica:** ações autenticadas de radar, insights de concorrentes e sugestões editoriais em `/api/admin/radar-findings/[id]/action`, `/api/admin/competitor-insights/[id]/action` e `/api/admin/content-suggestions/[id]/action`. Elas registram auditoria e promovem itens aprovados ao calendário.
- **Conteúdo:** teses, oportunidades, criação/fork/aprovação de itens, calendário/Kanban e dashboards.
- **Identidade/canais:** candidatos de identidade, rollback, OAuth/webhook Meta, Reddit, WhatsApp e e-mail.
- **Plataforma:** autenticação OTP, capacidades de integração, contexto de campanha, métricas e health check.

`/api/health` só retorna saudável quando PostgreSQL, Redis e embeddings respondem. O bloco operacional compara os workers individualmente habilitados com heartbeats recentes e reporta esperados, ativos, ausentes e falhas recentes; backlog e DLQ aparecem na tela de saúde.

As mutações de publicação (cancelamento, confirmação manual e kill switch), as métricas orgânicas e as ações de triagem exigem papel `operator`. Os registros de auditoria usam o e-mail da sessão, sem identificador fixo. A solicitação de OTP valida e normaliza o e-mail, limita tentativas por identificador e IP no Redis em janela de 15 minutos, aplica cooldown e fail-closed, e nunca devolve detalhes internos de falha ao navegador.

Na tela de publicação, o estado do kill switch fica visível e pode ser alterado pelo operador autorizado. Slots em `awaiting_manual_publish` permitem confirmar a postagem com ID externo obrigatório; slots agendados para os próximos dez minutos exibem a ação de cancelamento, que exige motivo, e a API rejeita cancelamentos fora da janela. O calendário aceita teclado: Enter abre o primeiro slot do dia, Escape cancela um arraste pendente, Home/End vão ao primeiro/último dia e as setas esquerda/direita movem o foco; cada slot também oferece reagendamento sem arrastar.

## 6. Dados

As dezenove migrações versionadas possuem pares `up`/`down` e ledger `schema_migrations`. Migrations 0011–0019 implementam a consolidação de banco (schema `design`), proveniência e imutabilidade, doutrina editorial com seed, reservas de orçamento, estados/idempotência das ações orgânicas, undo da Review Inbox, contexto de campanha/página e jobs versionados de enrichment. O modelo de proveniência adiciona `origin` ('manual'/'ai_generated'/'automation'), `locked_at`/`locked_by` para imutabilidade, e `curation_status` com `superseded_by` para versionamento. Triggers no banco (`enforce_manual_immutability`) impedem que automação modifique conteúdo manual ou travado.

O modelo é organizado por domínio, não por telas:

- **Configuração:** `accounts`, `campaigns`, `competitors`, vínculos de campanha, políticas, scoring e agenda de crawl.
- **Coleta:** `posts`, `comments`, mídia/menções/DM próprias, snapshots de seguidores, lives, buscas e execuções de crawl.
- **Lead:** `leads`, usernames, fontes, perfil, interações, status, scores e histórico.
- **Inteligência:** classificação, tópicos, dores, perguntas, comunidades, sobreposição, oportunidades e sinais de mercado.
- **Ação/conversa:** ações, drafts, recomendações NBA, estado de conversa, inbox de revisão, reciprocidade e conversões.
- **Conteúdo:** teses, itens, variantes, publicações, performance e timeline.
- **Multicanal:** identidades, WhatsApp, assinantes/fluxos/eventos de e-mail, Reddit e Threads.
- **Operação:** eventos, falhas, alertas, heartbeats, violações de SLO, auditoria e materialized views.
- **IA:** provedores e modelos com chaves cifradas.
- **Inteligência orgânica:** runs, observações/provenance, entidades e perfis cross-platform, snapshots, comentários/transcrições, sinais, budgets/reservas/custos, agenda/publicações e entregas do Creative Bridge.

Vetores usam dimensão 384. Tokens Meta e chaves de IA são armazenados cifrados; logs compartilhados aplicam redaction. O documento deliberadamente não registra valores de credenciais nem dados pessoais.

## 7. Deploy e operação

`plataforma/deploy/deploy-all.ps1` publica Design System e Prospector separadamente ou em conjunto. Para o Prospector ele:

1. valida pré-requisitos e a saúde do serviço Gazeta compartilhado;
2. empacota o fonte sem `.env`, dependências e artefatos locais;
3. envia uma release identificada para `/opt/prospector-platform/releases`;
4. constrói imagens no VPS, sobe PostgreSQL/Redis/embeddings e espera health checks;
5. executa migrations e valida a última versão;
6. recria web, scheduler e os 40 containers de worker a partir de uma única imagem imutável, troca o symlink da release ativa e conserva três releases;
7. configura/testa nginx e confirma que o serviço compartilhado não foi afetado.

O proxy público encaminha `/prospector` para a porta local do container web. Postgres e Redis usam volumes persistentes. Redis tem AOF e snapshots; cron prevê backups de Postgres, Redis e perfis Chromium. Prometheus/Grafana, edge Caddy e backup rodam por profiles opcionais, não como parte obrigatória do compose padrão.

## 8. Histórico de verificação de produção em 13/08/2026

| Componente | Estado verificado |
|---|---|
| Web | Saudável; imagem ativa coincide com a imagem mais recente |
| PostgreSQL | Saudável; 10/10 migrações; `0010_organic_intelligence` aplicada |
| Redis | Saudável; AOF ativo, último snapshot OK, sem chaves no instante da consulta |
| Embeddings | Saudável |
| Workers | 40/40 containers estáveis em uma imagem; desired state 0 porque todas as flags individuais permanecem `false` |
| Scheduler | Ativo e com agendas BullMQ instaladas |
| Proxy | `/prospector` encaminhado para o web local |

A base contém duas contas, duas campanhas e registros de configuração; leads, coletas, ações, conteúdo e eventos estão zerados. Portanto, as telas vazias refletem o banco real, não apenas um estado visual.

Os providers pagos e todos os workers foram mantidos desativados por padrão: ativação exige credenciais, orçamento configurado, canário limitado e mudança consciente da flag individual. Não há restart loop nem erro de resolução de pacote; a amostra remota do worker `discovery` confirmou o gate antes do carregamento do módulo. Com desired state zero, `/api/health` reporta 0 esperados/0 ausentes. Isso representa código implantado e seguro, não autorização para consumo ou publicação automática.

## 9. Fontes canônicas executáveis

- UI/API: `plataforma/apps/web/src`
- Workers: `plataforma/workers/*/src`
- Contratos: `plataforma/packages/shared`, `queue`, `db` e integrações
- Banco: `plataforma/packages/db/migrations`
- Infraestrutura: `plataforma/docker`
- Deploy: `plataforma/deploy/deploy-all.ps1`
- Operação: `plataforma/docs/runbooks` e `plataforma/deploy/DEPLOY.md`
## 10. Estado implementado nas etapas 1 e 2 (15/08/2026)

As etapas 1 e 2 do plano de correções foram implementadas no código local.

- `@plataforma/shared` declara `pg` como dependência de runtime e `@types/pg`
  como dependência de desenvolvimento; os workers que importam `Pool` apenas
  para tipos também declaram `pg` e `@types/pg` diretamente.
- `scripts/check-runtime-deps.mjs` percorre `apps`, `packages` e `workers`,
  distingue código de produção de testes/stories, aceita builtins e aliases
  internos, e verifica subpaths exportados de pacotes do workspace. Seus cinco
  fixtures cobrem dependência externa ausente, dependência workspace ausente,
  builtin, import somente de tipo, teste/story e subpath válido/inválido.
- O runtime de workers devolve um handle de estado para os entrypoints que
  publicam heartbeat; a inicialização continua assíncrona e workers desativados
  permanecem reportados como inativos.
- A migration `0015_budget_reservations` reconcilia a tabela criada pela 0010;
  preserva `budget_id`, `research_run_id`, `refunded` e `expired`, adiciona
  `provider`, o estado `released`, precisão `numeric(18,4)`, índices e uma
  quarentena para provider ambíguo. O rollback não remove a tabela da 0010 e
  aborta quando houver reserva provider-only ou estado `released`.
- O `budget-gate` agora contabiliza reservas em `reserved_usd`, reconcilia o
  valor reservado com o custo real e torna replay de reconciliação/liberação
  inócuo após a primeira transição. O worker `discovery` também grava provider
  nas novas reservas legadas.

Verificações locais concluídas: install congelado offline, checker de runtime,
build/typecheck/lint completos do Turbo (61 pacotes), além dos testes de
`shared`, `db`, `queue`, `organic-intelligence` e fixtures do checker.

Limitação ainda aberta: este host não possui Docker nem `psql`. Portanto, a
cadeia limpa, upgrade sobre dump, rollback em PostgreSQL real e concorrência
monetária da Etapa 2 ainda precisam ser executados em ambiente com PostgreSQL
descartável/staging antes de aplicar a migration em produção. O estado remoto
registrado acima permanece código implantado/verificado anteriormente, não uma
aprovação deste novo migration gate.

## 11. Estado implementado nas etapas 3 a 5 (15/08/2026)

As etapas 3, 4 e 5 foram implementadas no código local e revisadas contra o
plano.

- Publishers: `makeWorkerJob` fornece job tipado com preflight válido, trace,
  tentativas e payload completo; publishers validam payload antes do repositório
  e os testes cobrem migration desatualizada, kill-switch, aprovação humana,
  retry/falha permanente, fallback e ausência de chamada externa após bloqueio.
  Os seis testes que usavam casts perigosos foram substituídos por fixtures
  tipadas e contratos de cliente mínimos.
- A migration `0016_organic_action_state` formaliza estados de radar e insights,
  relaciona o finding aprovado à publicação e cria unicidade por origem para
  sugestões orgânicas. As rotas de radar, insights, sugestões, review inbox e
  publicações usam `BEGIN`/`FOR UPDATE`/`COMMIT`, rollback no erro, auditoria no
  mesmo client e respostas determinísticas para replay ou estado inválido.
- Administração: ausência de sessão retorna 401, papel insuficiente retorna
  403, erros internos retornam apenas código público e `traceId`, e os detalhes
  ficam sanitizados no log. Cancelamento, confirmação manual e kill-switch usam
  schemas Zod estritos para UUID, external ID, motivo e ação; a identidade da
  sessão é usada na auditoria.

Verificações locais desta etapa: publishers 8/8 e 7/7, DB 13/13, contratos web
de ações/auth e typechecks dos pacotes alterados. O ensaio HTTP com Next,
PostgreSQL e concorrência real ainda depende de ambiente descartável/staging;
nenhum resultado de produção foi inferido a partir dos testes locais.

## 12. Estado implementado nas etapas 6 a 12 (15/08/2026)

As etapas 6 a 12 foram implementadas no código local e reanalisadas contra o
plano. OTP agora usa Redis distribuído com limite, cooldown e fail-closed;
Review Inbox tem undo versionado e ações transacionais; as páginas orgânicas
consultam dados reais com campanha, filtros e paginação; e os fluxos críticos
usam Dialog, foco, tabs ARIA e campos sem prompt nativo.

Publicação expõe o estado do kill-switch, confirmação manual auditável,
cancelamento dentro de uma única janela de dez minutos e calendário com
teclado/reagendamento sem arrastar. O worker enrichment deixou de ser stub:
recebe job versionado com correlação/idempotência, faz classificação e
normalização de fronteira, reserva/reconcilia orçamento, persiste entidade,
perfil e proveniência em transação, registra `provider_usage` e enfileira o
próximo passo uma vez. A migration `0019_enrichment_jobs` mantém tentativas,
reason code e estado de recuperação.

Os boundaries de Automações e Saúde do sistema passam `reset` real e runbook;
o contrato `page-state.ts` diferencia loading, vazio, sem campanha, permissão,
provider indisponível e erro. `plataforma/docs/runbooks/automations.md` foi
adicionado ao índice canônico.

Os testes locais cobrem os adapters falsos do enrichment, estados de página,
OTP, Review Inbox, páginas de dados e acessibilidade das telas críticas: web
10 arquivos/25 testes, DB 4/14, enrichment 2/7 e UI bridge 5/6. O build do web
chegou à geração das 40 páginas e o typecheck foi reexecutado após os ajustes.
Permanecem gates de PostgreSQL/Redis reais, Playwright/E2E,
sandbox de provider, validação visual dos loading states e as etapas 13–16;
nenhum desses gates foi inferido a partir de mocks. O `turbo run typecheck` dos
61 pacotes foi tentado com concorrência reduzida, mas ficou sem saída por tempo
excessivo e foi interrompido; os typechecks isolados dos pacotes alterados
passaram.

## 13. Etapas 13 a 16 e deploy verificado (16/08/2026)

### Etapa 13 — higiene e imagens

- O checker percorreu `apps`, `packages` e `workers` sem dependências de runtime
  ausentes; os cinco fixtures do checker passaram. `news-radar` preserva
  `ok: true`, `@plataforma/meta-api` está declarado nos consumidores e as
  dependências de teste do scoring permanecem em `devDependencies`.
- Os Dockerfiles executam o guardrail antes de instalar/compilar. O build remoto
  com lockfile congelado passou; a imagem única iniciou scheduler e os 40
  entrypoints de worker, sem hoisting acidental observado. Workers orgânicos
  continuam desabilitados por flag por padrão.

### Etapa 14 — qualidade

As suítes focadas passaram: web 25/25, DB 17/17, UI bridge 6/6, enrichment 7/7,
publisher 8/8, threads-publisher 7/7 e runtime-deps 5/5. A suíte Turbo dos 61
pacotes ficou sem progresso no host local e foi interrompida; Playwright/E2E,
testes concorrentes de Redis/PostgreSQL e validação visual ficam registrados
como testes manuais do operador, conforme decisão de execução desta entrega.

### Etapa 15 — migrations e rollout

O deploy oficial `deploy/deploy-all.ps1 -Only prospector` foi executado com
sucesso. Durante a primeira execução foram corrigidos dois drifts reais antes
de prosseguir: a migration 0011 agora tolera banco sem `design.editorial_theses`
com view vazia compatível, e a 0014 cria os metadados ausentes de
`candidate_sources` antes do seed. O runner aplicou 0011–0019, confirmou
`0019_enrichment_jobs`, o web ficou saudável, 40 workers usaram uma imagem e o
scheduler iniciou. A repetição com `-ReuseWorkerImage` validou ainda o backup
pré-migration antes do runner. A inspeção pós-deploy confirmou PostgreSQL,
Redis, embeddings, web e Gazeta saudáveis; as flags dos workers permanecem
desligadas até canário manual.

### Etapa 16 — documentação

Este documento, a arquitetura unificada, o deploy, o runbook de restore, o
changelog e este plano foram atualizados. O índice `Docs/README.md` continua
apontando para os documentos canônicos; não foram adicionados segredos, tokens,
cookies, e-mails ou dumps.

## 14. Correção visual e deploy integral (17/08/2026)

O problema visual não era apenas ausência de um deploy completo. Os componentes
de `@plataforma/ui-bridge` renderizavam classes `bridge-*`, mas o pacote não
fornecia uma folha de estilos consumível; além disso, o tema do Prospector não
definia todos os aliases usados pelos componentes e o ECharts recebia
`var(--token)` diretamente no canvas, onde a variável não era resolvida.

O `ui-bridge` agora exporta `styles.css` com botões, campos, KPIs, tabelas,
drawers, estados, painéis e gráficos. O Prospector importa essa camada no layout
raiz e fornece espaçamento, raios, elevação e aliases semânticos compatíveis.
Botões usam borda transparente ou sutil, superfícies têm raios de 14–22 px e
elevação leve, e os KPIs voltaram a ocupar uma grade de cards. O adaptador de
gráficos resolve os tokens para cores concretas antes de entregar opções ao
canvas.

O Overview deixou de mostrar deltas e sparklines simulados. Ele usa os totais
reais da campanha em três painéis — funil, comparação por campanha e mix
operacional — e mostra estados vazios explícitos quando a base não possui
atividade. Assim, o dashboard ganha densidade visual sem inventar dados.

O script canônico foi executado sem `-Only`, `-SkipBuild` ou
`-ReuseWorkerImage`. Foram reconstruídos e publicados a SPA e a API do Design
System, o web do Prospector, o scheduler e os 40 workers em uma imagem nova. O
backup pré-migration passou, o ledger permaneceu em `0019_enrichment_jobs`, e a
inspeção pós-deploy confirmou web, PostgreSQL, Redis, embeddings e API do Design
System saudáveis. A inspeção no navegador confirmou a nova folha publicada,
KPIs com raio de 18 px, botões sem borda nativa e os três painéis analíticos.

## 15. Sessão, notificações e baseline editorial manual (18/08/2026)

O layout do Prospector deixou de injetar o papel fictício `actor` no cliente e
passou a propagar o papel real da sessão NextAuth. No modo de visualização sem
sessão, o usuário é identificado como `viewer`; somente `admin` consulta e
visualiza o contador de notificações. A rota
`/api/admin/notifications/count` agora converte falhas de autorização em
respostas HTTP públicas adequadas. A verificação em produção confirmou `401`
sem sessão, em vez de `500`, e nenhum erro novo no console da tela inicial.

O conteúdo inicial de
`Docs/CRESCIMENTO-ORGANICO-ROTA-DE-ATAQUE.md` foi materializado no banco como
baseline estritamente manual da campanha **Rota de Ataque**:

- 6 teses editoriais, com princípios e hooks de exemplo;
- 7 ideias de calendário para a próxima semana completa, às 19h no fuso
  `America/Sao_Paulo`;
- 20 temas prioritários como sugestões de conteúdo propostas.

Na ausência de uma preferência salva, Rota de Ataque é a campanha inicial do
seletor; uma escolha explícita do usuário continua sendo preservada por cookie.

As ideias nascem no estado `idea`, sem autorizar publicação. Teses e
publicações recebem proveniência e trava contra alteração por automação, mas
continuam editáveis por uma sessão humana. A tela de publicação ganhou uma rota
administrativa para criar e editar slots manuais, passou a respeitar o
`basePath` `/prospector` e exibe itens autônomos mesmo quando não nasceram de
uma oportunidade. A migration `0020_growth_organic_manual_baseline` cria o
baseline; a `0021_scope_growth_baseline_to_rota` corrige instalações que tenham
recebido o seed também em outra campanha.

O deploy integral reconstruiu SPA e API do Design System, web do Prospector,
scheduler e os 40 workers na release `20260818020821-2d1806e7`. A inspeção
pós-deploy confirmou web, PostgreSQL, Redis, embeddings e Design API saudáveis,
ledger do Prospector em `0021`, Design API em `0004`, contador sem sessão em
`401` e contagens editoriais de `6/7/20` apenas na campanha Rota de Ataque. As
flags de workers e providers pagos permanecem desligadas; testes E2E e canários
continuam sob execução manual do operador.

## 16. Limitações abertas de IA, dialogs e realidade operacional (18/08/2026)

A tela de Modelos de IA ainda possui falhas abertas: dialogs altos não têm área
rolável; mutações exigem admin fora do boundary de erros e podem responder 500;
o cliente assume JSON em toda resposta; prioridade de fallback só muda estado
local; não há remoção de provider; e providers/chaves do ambiente não são
reconciliados com o banco exibido no painel. O runtime pode ainda escolher o
registro padrão do banco sem chave antes do fallback de ambiente.

Também permanecem simulações em código de produção, incluindo a tabela fixa de
workers de IA, o gráfico de falhas de Saúde, a série de tendência do Radar e
ações de identidade, comunidade e ROI que apenas exibem toast ou usam números
fixos. O roteiro de correção e os gates de remoção estão em
[`PLANO-CORRECOES-IA-E-MOCKS-PROSPECTOR.md`](../plataforma/Docs/PLANO-CORRECOES-IA-E-MOCKS-PROSPECTOR.md).
Até a execução integral desse plano, esses elementos não devem ser tratados
como operação implementada ou evidência de produção.

## 17. Correções de bloqueio P0 e plano de controle de workers (19/08/2026)

Oito etapas de correções foram implementadas no código local. O ledger de
migrations passa de `0026` para `0029`; o ui-bridge passa de 6 para 9
arquivos de teste.

### Bugs de crash corrigidos (P0)

- **C1 — Overview crash:** `WHERE enabled=true` mudou para `WHERE active=true`
  (coluna real na tabela `news_sources`); o bloco de erro passou de `finally`
  para `catch`, retornando `<EmptyState>` ao invés de propagar.
- **C2 — Accounts crash:** `SELECT … created_at FROM audit_log` mudou para
  `at AS created_at` (coluna real é `at`).
- **C3 — DataGrid crash:** TanStack Table v9 exige `tableFeatures({…})` com
  todas as features registradas. `ui-bridge` agora exporta `gridFeatures` (com
  `rowSortingFeature`, `rowSelectionFeature`, `columnVisibilityFeature`,
  `rowPaginationFeature` e todos os row model factories). O hook `useTable`
  recebe `features: gridFeatures` e o estado de paginação é gerenciado
  externamente via `useState`. Todos os consumidores (`AutomationsClient`,
  `creative-bridge/page`, `LeadsClient`, `OperationalInteractive`) importam
  `createColumnHelper` e `gridFeatures` de `@plataforma/ui-bridge`.
- **C4 — Saúde do sistema com workers errados:** a página passou a consultar
  `worker_settings` no banco e constrói o estado `desired` a partir do DB com
  fallback em variável de ambiente.
- **C5 — Heartbeat orphans:** `beat()` deleta registros antigos do mesmo worker
  com `instance_id` diferente. Migration `0027_worker_heartbeat_retention`
  remove heartbeats mais antigos que 2h e resolve alertas `worker_dead_man` de
  instâncias extintas.
- **C6 — Agendamento não configurável:** a UI de Automações ganhou coluna
  "Agendamento" com edição inline; a API `/api/admin/automations` aceita a ação
  `set_schedule` (retorno antecipado antes do INSERT em `worker_commands` para
  não violar o CHECK constraint existente em produção).
- **C7 — Cadeia editorial quebrada:** migration `0028_bridge_manual_baseline_to_opportunities`
  promove sugestões de conteúdo do baseline manual a oportunidades com status
  `new`, com constraint CHECK no status e idempotência via `NOT EXISTS`.
- **C8 — Copy da publicação sem campo editável:** `scheduled_publications` agora
  expõe `content_structure` (roteiro, legenda longa, observações, slides) na API
  e no `SlotEditor`; migration `0029_fix_publication_column_types` converte
  `hashtags` e `cta` de `text[]` para `jsonb`.

### Alertas de dead-man corrigidos (E3.2)

O worker `alerts` passou a ler `worker_settings` do banco em vez de variáveis
de ambiente; workers explicitamente desabilitados no banco são ignorados na
verificação de heartbeat, eliminando alertas falsos de workers intencionalmente
desligados.

### Testes e typecheck

`pnpm --filter @plataforma/ui-bridge typecheck` passou sem erros.
`pnpm --filter @plataforma/ui-bridge test` — 15/15 testes passando (9 arquivos).

### Pendências de operação (não código)

- **E4.1** Ativar workers em canário: data-quality → alerts → news-radar →
  competitive-intel → content-opportunity (ação do operador via UI de Automações).
- **E6.4** Seed de copies reais a partir de `Docs/PLANO-DE-PUBLICACAO-15-DIAS.md`.
- **E0** Coletar evidências de produção via SSH para confirmar diagnósticos C1/C2.
- **X8** Adicionar `'use client'` a `feedback.tsx`, `fields.tsx`, `help.tsx` em
  `packages/ui-bridge/src` (não bloqueante).
- Deploy na ordem: E1+E7.1 → E2+E3+migration 0027 → E4 → E5+E6+migrations 0028/0029.
