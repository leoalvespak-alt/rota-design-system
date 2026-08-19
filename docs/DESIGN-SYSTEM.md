# Design System — arquitetura e funcionamento

**Estado verificado em 18/08/2026.** A descrição foi confrontada com o código executável/configurável da aplicação e com o ambiente publicado, não com planos e auditorias removidos.

## 1. Papel e modelo de execução

`plataforma/apps/design-system` é uma SPA React/Vite para criar, editar, organizar e exportar criativos da Rota de Ataque. Edição e exportação continuam local-first; autenticação, preferências sincronizadas, persistência compartilhada e qualquer operação de IA passam obrigatoriamente pela API Hono. A aplicação está isolada do Prospector; a integração explícita entre produtos ocorre pelo Creative Bridge.

Há dois modos complementares:

- **Local-first:** editor, templates, projetos, biblioteca, histórico e exportações rodam no navegador, com Zustand, localStorage e IndexedDB.
- **Backend implantado:** API Hono, PostgreSQL/Drizzle e Redis atendem sessão, autorização, ownership, preferências, IA e persistência compartilhada. MinIO, Sharp, Playwright e workers editoriais continuam dependências condicionais dos fluxos que os utilizam.

## 2. Interface e estado

`App.tsx` monta providers de tooltip, exportação e sessão de projeto, o listener do Creative Bridge, o shell, diagnósticos e notificações. O shell alterna as áreas funcionais sem roteamento de servidor.

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

- Entrada/shell: `plataforma/apps/design-system/src/App.tsx` e `src/app`
- Editor/templates/stores: `src/features`, `src/stores`, `src/domain`
- Tokens: `src/tokens` e `style-dictionary.config.mjs`
- Exportação: `src/lib/export`
- IA/editorial: `src/lib/ai`, `src/server/editorial`
- API/dados/filas: `src/server`, `src/db`, `drizzle`
- Testes: `tests`, arquivos `*.test.*` e stories
- Deploy: `plataforma/deploy/deploy-all.ps1`

## 11. Verificação integral de produção em 17/08/2026

O deploy unificado foi executado sem filtro e recompilou a SPA e a imagem
imutável da API do Design System. O swap estático, o nginx e o health check da
API passaram; PostgreSQL e Redis permaneceram saudáveis e o ledger continuou
com as cinco migrations `0000`–`0004`. A tela pública de acesso carregou o novo
asset versionado sem erros de console. A stack editorial legada foi preservada,
pois sua remoção continua fora do escopo e exige uma janela destrutiva própria.
