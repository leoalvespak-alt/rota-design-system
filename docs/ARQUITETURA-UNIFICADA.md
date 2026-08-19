# Plataforma unificada — Prospector + Design System

**Estado verificado em 18/08/2026.** Este é o mapa de integração dos dois produtos. Os detalhes internos ficam em [Prospector](PROSPECTOR.md) e [Design System](DESIGN-SYSTEM.md).

## 1. Visão geral

O diretório `plataforma` é um monorepo pnpm/Turborepo com dois produtos implantáveis de forma independente:

| Produto | Runtime principal | Persistência principal | Publicação |
|---|---|---|---|
| Design System | React 19 + Vite 8 + API Hono | IndexedDB/localStorage + PostgreSQL/Redis da API | SPA na raiz e API em `/api` |
| Prospector | Next.js 15 + 40 workers Node/BullMQ | PostgreSQL 16/pgvector + Redis | `/prospector` via container e nginx |

`packages/ui-bridge` fornece componentes, tokens, tema de gráficos e a folha
visual compartilhada para o Prospector sem importar a SPA. O Design System não
importa `apps/web`. Workers nunca importam aplicações; dependem apenas de
`packages/*`. Cores destinadas a canvas são resolvidas para valores concretos
no navegador; variáveis CSS permanecem a fonte semântica para o DOM.

```text
                          domínio público
                   +------------+-------------+
                   |                          |
             / (nginx estático)        /prospector (proxy)
                   |                          |
          Design System SPA/API         Next.js web/API
                   ^                    /       |       \
                   | Creative Bridge   DB     Redis   embeddings
                   +--------------------+        |
                                              workers
                                                |
                          Meta / Threads / WhatsApp / e-mail / Reddit
```

## 2. Jornada integrada

1. O Prospector coleta sinais permitidos, classifica intenção e calcula prioridade e oportunidades.
2. Um operador revisa a oportunidade ou item editorial no dashboard.
3. O fluxo “criar criativo” abre o Design System com contexto validado pelo Creative Bridge.
4. O Design System escolhe template, permite edição e IA, aplica identidade visual e exporta o ativo.
5. O ativo/contexto volta ao fluxo editorial do Prospector, onde variantes podem ser aprovadas e agendadas.
6. Workers de publicação/contato executam somente após políticas e aprovações; eventos posteriores alimentam performance, conversão e ROI.

Durante a atualização de recuperação integral, o retorno do passo 4 para o passo 5 é persistido como asset, metadados e copy no Prospector; uma confirmação visual sem asset não transiciona a variante para revisão.

Esta jornada é uma composição de contratos. Os produtos não compartilham store, sessão de navegador ou schema de banco. O bridge deve ser tratado como fronteira de integração, com payload versionado e origem confiável.

### 2.1 Operação orgânica

O sistema de operação orgânica consolida os dois bancos Postgres sob um único, usando schema `design` para as tabelas do Design System quando há colisão de nomes. A proveniência (`origin: manual | ai_generated | automation`) e as travas de imutabilidade por trigger garantem que conteúdo curado por humano não é sobrescrito por automação. O radar de notícias (RSS), a inteligência de concorrentes (Meta API), a curadoria humana (review inbox) e a publicação híbrida (Instagram fallback + Threads automático) formam o pipeline orgânico completo. Veja [Runbook de operação orgânica](RUNBOOK-OPERACAO-ORGANICA.md) para detalhes operacionais.

## 3. Fontes de verdade

- **Identidade visual e edição:** registro de templates, tokens e documentos de projeto do Design System.
- **Campanhas, leads, decisões e resultados:** banco do Prospector.
- **Jobs do Prospector:** BullMQ/Redis, com fatos duráveis no PostgreSQL.
- **Criativos:** documentos locais em IndexedDB; sessões, ownership, preferências e IA na API/banco próprios do Design System.
- **Configuração implantada:** `.env` preservado no VPS, compose e release ativa.

Não há transação distribuída entre os produtos. IDs externos e referências do bridge devem ser persistidos para correlação; uma exportação local não implica publicação, e uma oportunidade no Prospector não implica que um arquivo tenha sido gerado.

## 4. Segurança e governança

O Prospector usa OTP/NextAuth, permissões, papéis `collector`/`actor`, políticas de ação, kill switch, opt-in e aprovação humana. Tokens e chaves server-side são cifrados; logs compartilhados removem campos sensíveis. Webhooks validam contratos/segredos conforme o canal.

O Design System usa sessão assinada `HttpOnly`, CSRF, ownership, rate limit Redis e CORS estrito. Chaves de IA existem somente no servidor; o browser usa `/api/ai`. O Creative Bridge valida origem e contrato versionado antes de aceitar contexto.

Nenhum segredo, host, usuário, e-mail, telefone, cookie ou payload real deve entrar em documentação, logs de build ou artefatos versionados.

## 5. Build, deploy e rollback

O script `plataforma/deploy/deploy-all.ps1` é o orquestrador canônico:

- `-Only design`: build Vite local, upload, API/DB/Redis, migrations, health, validação nginx, swap e rollback do diretório estático.
- `-Only prospector`: upload do fonte, guardrail de dependências no Docker, build remoto, backup pré-migration, migrations pelo runner canônico, web, scheduler, imagem única dos workers, proxy e ativação da release.
- sem filtro: executa os dois fluxos e preserva os serviços compartilhados existentes.

O Design System e o Prospector têm unidades de rollback diferentes. Reverter o diretório estático não reverte containers/migrations; trocar a release do Prospector não altera o bundle estático. Migrações têm scripts `down`, mas rollback de banco deve seguir runbook, backup e validação, nunca apenas a troca de symlink.

## 6. Observabilidade e saúde

| Sinal | Design System | Prospector |
|---|---|---|
| Disponibilidade | resposta do site/nginx e carregamento do bundle | `/api/health`, container web e proxy |
| Dependências | API Hono, PostgreSQL e Redis para sessão/IA/sincronização | PostgreSQL, Redis e embeddings |
| Processamento | gateway de IA e jobs editoriais quando habilitados | desired state, heartbeats, filas, DLQ, scheduler e 40 containers |
| Qualidade | testes unitários/E2E/visuais | testes unitários/integrados/E2E, SLOs e canários |
| Erros | Sentry/logs quando configurados | logs estruturados, Sentry, alertas e Prometheus opcionais |

O endpoint de saúde do Prospector cruza desired state com heartbeats e falhas recentes; a operação também monitora backlog, DLQ e containers. Worker desabilitado não é ausência operacional.

## 7. Estado integrado de produção

Na verificação consolidada de 18/08/2026:

- o Design System estático e o proxy `/prospector` estão configurados no mesmo nginx;
- web, PostgreSQL, Redis e embeddings do Prospector estão saudáveis;
- as migrations do Prospector estão aplicadas até `0021_scope_growth_baseline_to_rota`;
- a campanha Rota de Ataque contém o baseline manual do plano de crescimento:
  6 teses, 7 ideias de calendário e 20 sugestões prioritárias; a Gazeta não
  recebe esse conteúdo específico;
- os 40 containers de worker e o scheduler estão estáveis em uma imagem imutável; as 40 flags individuais e os providers pagos estão desligados por padrão;
- a API do Design System, seu PostgreSQL e Redis estão implantados e `/api/health` está saudável.
- a stack editorial legada do Design System continua ligada, sem tráfego público e com banco vazio; seu descomissionamento é uma operação separada e destrutiva, não requisito do runtime novo.

O ciclo está implementado e implantado, mas qualquer coleta paga ou publicação continua deliberadamente inativa até configurar credenciais/budget, executar canário e habilitar somente os workers desejados. Esse gate operacional impede gasto e ação externa acidentais; não é falha de código.

Em 17/08/2026, o orquestrador canônico foi executado sem filtro: SPA e API do
Design System, web do Prospector, scheduler e os 40 workers foram reconstruídos
e publicados. Os dois bancos executaram seus runners de migration; o Prospector
permaneceu em `0019_enrichment_jobs` e a API do Design System em `0004`. A
verificação pública confirmou os novos assets visuais e a saúde das duas
superfícies, preservando a Gazeta e a stack editorial legada.

Em 18/08/2026, um novo deploy integral publicou a correção de sessão e
notificações e o baseline editorial manual. O Prospector usa o papel real da
sessão, não consulta notificações administrativas como `viewer` e responde
`401` — não `500` — quando o endpoint protegido é acessado sem sessão. O
calendário manual permanece editável por humano e bloqueado contra
sobrescrita automática; itens nascem como `idea` e não autorizam publicação.

## 8. Regras de evolução

Ao alterar uma fronteira entre produtos:

1. versionar e validar o payload do Creative Bridge;
2. manter `apps/design-system` independente de `apps/web`;
3. colocar contratos reutilizáveis em `packages/*`;
4. adicionar migration e rollback para mudanças duráveis;
5. atualizar o documento específico e este mapa unificado;
6. validar build/testes dos dois produtos e, no deploy, saúde + workers + fila;
7. registrar limitações de produção sem confundir código implementado com serviço ativo.
