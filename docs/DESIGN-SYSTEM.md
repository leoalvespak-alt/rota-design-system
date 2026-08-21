# Design System — arquitetura e funcionamento

**Estado verificado em 18/08/2026.** A descrição foi confrontada com o código executável/configurável da aplicação e com o ambiente publicado, não com planos e auditorias removidos.

## 1. Papel e modelo de execução

`plataforma/apps/design-system` é uma SPA React/Vite para criar, editar, organizar e exportar criativos da Rota de Ataque. Edição e exportação continuam local-first; autenticação, preferências sincronizadas, persistência compartilhada e qualquer operação de IA passam obrigatoriamente pela API Hono. A aplicação está isolada do Prospector; a integração explícita entre produtos ocorre pelo Creative Bridge.

Há dois modos complementares:

- **Local-first:** editor, templates, projetos, biblioteca, histórico e exportações rodam no navegador, com Zustand, localStorage e IndexedDB.
- **Backend implantado:** API Hono, PostgreSQL/Drizzle e Redis atendem sessão, autorização, ownership, preferências, IA e persistência compartilhada. MinIO, Sharp, Playwright e workers editoriais continuam dependências condicionais dos fluxos que os utilizam.

## 2. Interface e estado

`main.tsx` monta providers globais (AuthGate, TooltipProvider, ExportNodeProvider, ProjectSessionProvider, CreativeBridgeListener, FeatureDiagnostics, Toaster) e entrega controle ao `RouterProvider` com o roteador criado em `src/app/router.tsx`. O `AppShell` atua como layout-route pai com `<Outlet />`.

Roteamento baseado em URL real (React Router v7 / `createBrowserRouter`):

| URL                 | Componente         |
|---------------------|--------------------|
| `/`                 | DashboardView      |
| `/marca`            | BrandView          |
| `/ia`               | AIConfigView       |
| `/renders`          | RendersView        |
| `/historico`        | HistoryView        |
| `/criar`            | CreateTab          |
| `/wizard`           | WizardView         |
| `/teses`            | ThesesListView     |
| `/teses/conhecimento` | KnowledgeListView |
| `/teses/planejador` | PlannerConfigView  |
| `/teses/lote`       | BatchDashboard     |
| `/teses/calendario` | CalendarView       |
| `/teses/revisao`    | ContentReviewView  |
| `/teses/prompts`    | PromptManagerView  |
| `/teses/metricas`   | AnalyticsDashboard |

O hook `useRouteSync` mantém `useUiStore.activeTab` sincronizado com a rota (URL → store) e patcha `setTab` para também navegar (store → URL), preservando atalhos de teclado (1-6) e CommandPalette. O `AppHeader` usa `NavLink` para indicar a aba ativa via rota. `EditorialLayout` é o layout aninhado para `/teses/*` com barra de sub-abas via `NavLink`.


Principais áreas:

- **Criar/editor:** galeria de templates, canvas e painel de controles.
- **Wizard:** formato, template, conteúdo, roteiro e canvas.
- **Séries:** ordenação de slides, importação Markdown e exportação em lote.
- **Projetos/edições:** sessão, autosave, recuperação, versões e galerias.
- **Marca:** perfis, tokens e guia visual.
- **Renders/histórico:** ativos importados e artes salvas.
- **IA:** provedores/modelos, teste de conexão, custos e geração.
- **Editorial:** teses, conhecimento, planner, review, calendário, lote e analytics.
- **Apresentações/documentos:** decks, slides, documentos e blocos técnicos/diagramas.

O estado é dividido por store. `useEditorStore` controla template, formato, tema do canvas, zoom e elementos; Immer faz atualizações profundas e Zundo mantém undo/redo. Stores específicos controlam decoração, séries, biblioteca, IA, UI e catálogo de templates.

Projetos usam documentos versionados. `ProjectRepository` persiste em IndexedDB com prefixos próprios; ao migrar uma versão, salva backup antes de regravar. Imagens e históricos também usam IndexedDB para evitar o limite de localStorage. Tema e preferências estritamente locais podem permanecer no localStorage. Credenciais de IA nunca são lidas, gravadas ou enviadas pelo browser.

## 3. Templates e renderização

O registro tipado é a fonte de verdade para templates, defaults, dimensões, renderer e controles. Atualmente contém:

- 12 layouts quadrados;
- 6 layouts retrato/story;
- 8 layouts de carrossel;
- presets de carrossel e renderer declarativo para composições adicionais.

Os templates reutilizam primitivas como título, corpo, eyebrow, slot de imagem, box, tag, redline e indicador de página. Schemas Zod validam o conteúdo. `Hideable<T>` permite ocultar campos sem mudar o contrato do template. Canvas e tokens distinguem os formatos 1080×1080 e 1080×1920.

Tokens existem em três níveis: primitivos (cor, tipografia, espaçamento e elevação), semânticos claro/escuro/UI e formatos de canvas. Style Dictionary gera o artefato consumível; Tailwind 4 e `index.css` aplicam os valores. Perfis de marca podem sobrepor tokens e fontes em tempo de execução.

## 4. Edição, mídia e IA

O canvas combina conteúdo editável, imagens, textura, watermark, modo escuro e escala de visualização. `EditableText` mantém o DOM não controlado durante foco para preservar o cursor. O painel de controles edita apenas os campos aceitos pelo template selecionado. O wizard cria esqueletos puros por template, preserva campos heterogêneos, só avança após resultado válido e suporta cancelamento, retry e idempotência.

Uploads passam por slots e biblioteca; o modo servidor pode usar Sharp para variantes e MinIO para objetos. O navegador usa blobs/URLs locais. Copy, validação, embeddings e imagens usam exclusivamente `/api/ai`: o servidor seleciona o adapter, injeta a credencial, aplica timeout, retry, circuit breaker, rate limit Redis e idempotência e valida a resposta antes de devolvê-la. Jobs fal.ai usam submissão e polling assíncronos reais e aceitam somente hosts de mídia permitidos.

O motor editorial opcional implementa ingestão, chunking, embeddings, busca, planejamento, seleção de template, geração por formato, ajuste de conteúdo, similaridade, qualidade, ledger e métricas. Filas BullMQ separam brief e geração. Esse pipeline depende de API, Postgres e Redis iniciados à parte; ele não é ativado pelo bundle estático.

## 5. Exportação

`ExportEngine` seleciona exportadores por formato:

- PNG e JPEG a partir de um nó de exportação dedicado;
- HTML autocontido;
- PPTX para apresentações;
- ZIP para séries de cards.

O nó de captura fica fora da área visível e em escala 1:1. Antes da captura, a aplicação sincroniza estado, aguarda fontes, decodifica imagens e estabiliza frames. Isso desacopla o arquivo final do zoom da interface. O módulo servidor condicional oferece renderização Playwright para jobs headless.

## 6. Backend implantado e segurança

A API Hono expõe health/readiness, autenticação, catálogo/preferências de IA e módulos de teses, argumentos, estruturação, conhecimento, campanhas, planos, prompts, revisão, taxonomia, lotes, projetos, perfis e logs de tokens. Sessões são assinadas em cookie `HttpOnly`; mutações exigem CSRF; o fallback bearer é comparado em tempo constante. CORS, headers de segurança, IDs de request, JSON 404 e rate limit distribuído são aplicados globalmente. Projetos, perfis e logs validam ownership no servidor.

As cinco migrações `0000`–`0004` modelam:

- marcas, tokens, templates, criativos, versões, decks, slides, documentos, renders, exports e usuários;
- teses, taxonomia, evidências, conhecimento/RAG, briefs, planos, conteúdo, revisão, similaridade e jobs;
- projetos criativos e contabilização de tokens;
- perfis de marca.
- sessão/autorização, catálogo e preferências seguras de IA, idempotência e contabilização do gateway.

O runner de migrations mantém ledger e checksum, aceita baseline explícito e falha em drift. PostgreSQL e Redis são iniciados pelo compose da API e possuem health checks. MinIO e renderer só são necessários nos módulos que os utilizam.

## 7. Creative Bridge

O Prospector cria uma entrega persistente e abre o Design System com correlação e contrato versionado. `CreativeBridgeListener` valida origem, versão e schema estrito antes de transformar o contexto em estado editável. Status e falhas da entrega são persistidos no Prospector; não existe importação direta de código entre as duas aplicações.

Essa fronteira mantém o editor reutilizável e impede que o bundle Vite dependa de banco, autenticação ou workers do Prospector.

## 8. Testes e observabilidade

Vitest cobre stores, schemas, templates, layout, exportadores, parser Markdown, tokens, animação, qualidade e motor editorial. Playwright cobre editor e jornadas; testes visuais mantêm baseline claro/escuro por template. Storybook documenta componentes e padrões. Logs estruturados, métricas e Sentry estão disponíveis para o backend/SPA quando configurados.

O pipeline local relevante é `build`, `lint`, `test` e `test:e2e`; geração de tokens deve anteceder a validação quando os arquivos-fonte de tokens mudarem.

## 9. Deploy e limitações verificadas

O deploy unificado executa o build Vite local, publica a SPA por swap atômico e também constrói/sobe API, PostgreSQL e Redis, executa migrations e valida `/api/health`. A aplicação é servida na raiz do domínio e `/api` é encaminhado à API; `/prospector` é reservado ao produto Next.js.

Estado verificado em produção em 13/08/2026: SPA publicada, release imutável da API saudável na porta interna 3002, nginx apontando `/api` para essa release e migrations `0000`–`0004` aplicadas. A stack editorial legada permanece ligada na porta 3001, mas não recebe tráfego público; seu PostgreSQL possui 45 tabelas e nenhum registro. Ela não foi removida para evitar uma ação destrutiva sem uma janela de descomissionamento. Credenciais de providers permanecem server-side; sem a respectiva credencial, o adapter fica indisponível de modo explícito. Dados estritamente local-first continuam vinculados ao navegador, e o Creative Bridge integra contexto e fluxo sem unificar bancos ou sessões.

## 10. Fontes canônicas executáveis

- Roteamento: `plataforma/apps/design-system/src/app/router.tsx`, `src/app/AppShell.tsx`, `src/hooks/useRouteSync.ts`
- Editor/aba Criar: `src/app/CreateTab.tsx`
- Sub-abas editoriais: `src/features/editorial/EditorialLayout.tsx`
- Templates/stores: `src/features`, `src/stores`, `src/domain`
- Tokens: `src/tokens` e `style-dictionary.config.mjs`
- Exportação: `src/lib/export`
- IA/editorial: `src/lib/ai`, `src/server/editorial`
- API/dados/filas: `src/server`, `src/db`, `drizzle`
- Schema unificado: `src/db/editorial-schema.ts` (`unifiedCreatives`)
- Migrations: `packages/db/migrations/0032_unified_creatives.{up,down}.sql`
- SPA nginx: `apps/design-system/nginx.conf`, `apps/design-system/Dockerfile.web`
- Testes: `tests`, arquivos `*.test.*` e stories
- Deploy: `plataforma/deploy/deploy-all.ps1`


## 11. Verificação integral de produção em 17/08/2026

O deploy unificado foi executado sem filtro e recompilou a SPA e a imagem
imutável da API do Design System. O swap estático, o nginx e o health check da
API passaram; PostgreSQL e Redis permaneceram saudáveis e o ledger continuou
com as cinco migrations `0000`–`0004`. A tela pública de acesso carregou o novo
asset versionado sem erros de console. A stack editorial legada foi preservada,
pois sua remoção continua fora do escopo e exige uma janela destrutiva própria.

## 12. Consolidação do banco em 20/08/2026

A VPS foi reinstalada em 20/08/2026 (Dokploy novo) e os volumes Docker anteriores,
incluindo o Postgres do Design System, se perderam. Na mesma data o banco do Design
System (`rota_design`, dump de 19/08) foi restaurado como schema **`design`** dentro
do Postgres do Prospector (`db_prospector_postgresql`), concluindo a Etapa 1 do plano
de operação orgânica: 51 tabelas em `design.*`, teses doutrinárias semeadas em
`design.editorial_theses` (7, ativas) e a view `theses_from_design` expondo o contrato
para o Prospector. Quando a API do Design System voltar ao ar, o `DATABASE_URL` deve
apontar para esse Postgres com `search_path=design,public` — não existe mais um
Postgres separado para o Design System.

## 13. Integração concluída em 21/08/2026

O design-api passou a apontar para o **banco único** (compose do Prospector, porta
`127.0.0.1:5433`, role `design_app`, `options=-csearch_path=design,public` — as
migrations 0000–0004 do Design System estão registradas em `design.design_schema_migrations`).
A SPA do Design System e o Prospector leem o mesmo Postgres. Novas rotas do design-api:

- `GET /api/publications` — agendamentos do ciclo (scheduled_publications + theses)
- `GET /api/publications/batch/:batchId` — filtro por lote

A tela **Calendário editorial** da SPA (antes mock) lista os agendamentos reais
(75 do batch `d15db4a0-...` + 7 baseline) agrupados por canal. O banco `rota_design`
do host (5432) ficou órfão como referência histórica. Login/sessão: senha única
`DESIGN_API_PASSWORD` + sessão HMAC (não depende do banco).

Em 21/08/2026 o dashboard "Meus Projetos" foi repovoado com 9 projetos de trabalho
(3 por status: em andamento, não iniciado, finalizado; formatos post/carrossel/story,
template IDs do registry da SPA, `user_id` = operator padrão). Os projetos originais
se perderam na reinstalação de 20/08 — nenhum dump os continha. Os templates do
Gerador de Criativos (29) são hardcoded no registry da SPA e nunca dependeram do banco;
o histórico de artes é localStorage do navegador.

## 14. Roteamento URL real e tabela unificada de criativos — 21/08/2026

**Implementado no código / pendente de deploy.**

### Roteamento (Etapa 1)

- `react-router-dom@7` adicionado ao `@plataforma/design-system`.
- `src/app/router.tsx`: mapa de rotas via `createBrowserRouter`. AppShell é o layout-route pai; EditorialLayout é o layout aninhado para `/teses/*`.
- `src/app/AppShell.tsx`: reescrito — todos os condicionais de aba substituídos por `<Outlet />`.
- `src/app/CreateTab.tsx` (novo): lógica da aba Criar extraída do AppShell.
- `src/features/editorial/EditorialLayout.tsx` (novo): barra de sub-abas com `NavLink` + `<Outlet />` — substitui o `EditorialView` com `useState` local.
- `src/hooks/useRouteSync.ts` (novo): sincroniza rota ↔ Zustand bidireccionalmente, preservando atalhos de teclado (1-6) e CommandPalette.
- `src/app/AppHeader.tsx`: botões de aba migrados para `NavLink`; active class determinada pela rota.
- `src/main.tsx`: montagem migrada de `<App />` para `<RouterProvider router={router} />`.
- `apps/design-system/nginx.conf` (novo) + `Dockerfile.web` atualizado: SPA fallback `try_files $uri $uri/ /index.html` — sem isso rotas como `/teses/calendario` retornam 404 ao recarregar.
- Redirecionamentos de compatibilidade: `/dashboard → /` e `/editorial → /teses`.

**Pendente de verificação manual após deploy:** navegação direta por URL, botão voltar do browser, atalhos de teclado, CommandPalette, deep-link para sub-aba, refresh mantendo rota.

### Tabela unificada de criativos (Etapa 2)

- `packages/db/migrations/0032_unified_creatives.up.sql`: cria `unified_creatives`, migra dados de `scheduled_publications` e `content_items`, enriquece com `editorial_plan_items`, cria views `scheduled_publications_compat` e `content_items_compat`.
- `packages/db/migrations/0032_unified_creatives.down.sql`: rollback (dropa views, trigger e tabela).
- `src/db/editorial-schema.ts`: definição Drizzle `unifiedCreatives` com FKs para Design System side; `thesis_id` (Prospector) como `uuid` sem FK Drizzle para evitar dependência cruzada de schema.

**Pendente de execução:** `pnpm db:migrate` (ou equivalente) na VPS — a migration não foi aplicada automaticamente nesta sessão.

### APIs apontando para tabela unificada (Etapa 3)

- `src/server/api/routes/publications.ts`: refatorado para ler/escrever em `unified_creatives`. Endpoints: `GET /` (com filtros `channel`, `status`, `origin`), `GET /batch/:batchId`, `POST /` (criar criativo), `PATCH /:id` (atualização dinâmica de campos incluindo `origin`), `DELETE /:id`.
- `apps/web/src/app/api/admin/publications/route.ts`: migrado para usar `unified_creatives` com transações, auditoria e validação de transição de status.
- Creative Bridge continua usando `creative_bridge_deliveries` como log; o criativo canônico vive em `unified_creatives`.

### CalendarView com dados unificados (Etapa 4)

- `src/features/editorial/calendar/CalendarView.tsx`: exibe criativos da tabela unificada agrupados por canal, com badges de origem e status. Botão "Novo Criativo" e click-to-edit por card.
- `src/features/editorial/calendar/CreativeForm.tsx` (novo): formulário de criação/edição com campos título, canal, formato (select com valores válidos: carrossel/reels/static/stories), status, agendamento e legenda. Salva via `POST/PATCH /api/publications`.

### Sincronização bidirecional de teses (Etapa 5)

- `packages/db/migrations/0033_thesis_mapping.up.sql`: adiciona `prospector_thesis_id` a `editorial_theses`; cria trigger `audit_creative_published` que loga no `audit_log` quando um criativo muda para status `published`.
- `packages/db/migrations/0033_thesis_mapping.down.sql`: rollback.
- `src/server/api/routes/theses.ts`: endpoint `POST /theses/sync` que recebe `prospector_thesis_id`, busca na tabela `theses` do Prospector (mesmo banco), e cria/atualiza em `editorial_theses` com mapeamento bidirecional (usando `core_statement`, `summary`, `slug`).
- `src/db/editorial-schema.ts`: `prospectorThesisId` adicionado ao schema Drizzle.

### Correções aplicadas na auditoria (21/08/2026)

- `POST /theses/sync`: corrigido para usar colunas reais (`summary`, `core_statement` em vez de `description`, `author`); slug com 8 chars do UUID para menos colisão; fix do retorno de `db.execute()`.
- `useRouteSync`: corrigido loop infinito — guard `syncingFromRoute` evita que mudança de rota chame `navigate()` recursivamente.
- `publications.ts PATCH`: adicionado campo `origin` às atualizações dinâmicas; fix de `scheduled_for` null usando `sql\`NULL\`` em vez de raw null.
- `CreativeForm`: formato padrão alterado de `'post'` para `'carrossel'`; campo formato trocado de input texto livre para select com valores válidos.
- `EditorialView.tsx` (dead code) removido — substituído por `EditorialLayout.tsx`.

**Pendente de execução na VPS:** `pnpm db:migrate` para aplicar migrations 0032 e 0033. Após aplicação, verificar: criação de criativos no Design System aparecendo no Prospector; deep-link `/teses/calendario`; botão voltar do browser.

