# Documentacao canonica

Documentacao atualizada e verificada em 20/08/2026:

- [Prospector](PROSPECTOR.md): arquitetura, APIs, workers, dados, fluxos, deploy e estado real de producao.
- [Design System](DESIGN-SYSTEM.md): editor, templates, estado, IA server-side, API segura, exportacao e deploy.
- [Arquitetura unificada](ARQUITETURA-UNIFICADA.md): fronteiras, Creative Bridge, jornada conjunta, seguranca e operacao.
- [Deploy Dokploy](DEPLOY-DOKPLOY.md): infraestrutura de deploy dos tres projetos via Dokploy, mapa de portas, procedimentos de restore e troubleshooting.

Documentacao de marca e crescimento:

- [Crescimento organico Rota de Ataque](CRESCIMENTO-ORGANICO-ROTA-DE-ATAQUE.md): diagnostico do @rotadeataque, concorrentes, teses editoriais, posicionamento, bio, formatos e calendario. Coleta de 13/08/2026.
- [Plano de publicacao 15 dias](PLANO-DE-PUBLICACAO-15-DIAS.md): execucao operacional para Instagram e Threads — calendario 17–31/08/2026, copys completas, 7 teses, linguagem do publico, iscas e opcoes de posicionamento.
- [Plano de publicacao 15 dias — Ciclo 2](PLANO-DE-PUBLICACAO-15-DIAS-CICLO-2.md): ciclo 21/08–04/09/2026 persistido no banco do Prospector pela migration `0030_growth_organic_15day_batch` — 15 posts de feed, 30 stories, 30 threads, estilos de card, hashtags, CTAs e fluxo de aprovacao.

- [Plano de correcao dos deploys Dokploy](PLANO-CORRECAO-DEPLOY-DOKPLOY.md): diagnostico verificado na VPS em 20/08/2026 (nginx/PM2 derrubados por conflito de portas com o Traefik, branch incompleto no Prospector, next.config duplicado na Gazeta, app da Plataforma 2.0 vazio) e roteiro em 6 fases separando o que a IA executa do que exige acao manual.

Planos de implementacao:

- [Plano de operacao organica](PLANO-OPERACAO-ORGANICA.md): consolidacao dos bancos sob um Postgres, proveniencia manual vs automatico com trava, seed da doutrina, radar de noticias, inteligencia de concorrentes, painel de automacoes, calendario e Kanban gerenciaveis e publicacao hibrida. 12 etapas.

- [Plano de correcoes e conclusao do Prospector](../plataforma/Docs/PLANO-CORRECOES-PROSPECTOR.md): roteiro executavel para resolver os bloqueadores e implementacoes parciais remanescentes, incluindo migrations, mocks, atomicidade, OTP, Review Inbox, dados reais, acessibilidade, enrichment, testes e rollout.

- [Plano de correcao integral de IA, modais e mocks do Prospector](../plataforma/Docs/PLANO-CORRECOES-IA-E-MOCKS-PROSPECTOR.md): roteiro em seis etapas para corrigir responsividade dos dialogs, contratos HTTP/RBAC, control plane de IA, sincronizacao segura com o ambiente e remocao comprovavel de toda simulacao da interface.

- [Plano de correcao do Prospector — auditoria de 19/08/2026](../plataforma/docs/PLANO-CORRECAO-PROSPECTOR-2026-08-19.md): auditoria por `systematic-debugging` dos 9 relatos abertos em 19/08, com oito causas-raiz fechadas por evidencia estatica (colunas inexistentes em `news_sources` e `audit_log`, `DataGrid` incompativel com TanStack Table v9, control plane lendo variavel de ambiente em vez do banco, heartbeats orfas, cadeia editorial sem ponte, copy ausente em Publicacao) e roteiro executavel em nove etapas.

- [Plano de recuperacao integral do Prospector](../plataforma/Docs/PLANO-RECUPERACAO-INTEGRAL-PROSPECTOR.md): auditoria do estado atual e roteiro executavel para corrigir os 16 relatos, restaurar o control plane de workers, fechar os fluxos de radar e conteudo, completar o Creative Bridge e publicacao, unificar IA e aplicar uma revisao visual responsiva sem mocks.

- [Runbook de operacao organica](RUNBOOK-OPERACAO-ORGANICA.md): operacao diaria do radar, curadoria, calendario, publicacao, kill-switch, orcamento de providers.

Documentos operacionais preservados porque continuam ligados ao codigo atual:

- `plataforma/deploy/DEPLOY.md`
- `plataforma/docs/runbooks/account-checkpoint.md`
- `plataforma/docs/runbooks/automations.md`
- `plataforma/docs/runbooks/embeddings.md`
- `plataforma/docs/runbooks/queue-backlog.md`
- `plataforma/docs/runbooks/restore.md`
- `plataforma/docs/runbooks/worker-dead-man.md`
- `plataforma/docs/compliance/whatsapp-groups-availability.md`
- `plataforma/CHANGELOG.md`

## Politica

Codigo, migrations, compose e scripts de deploy prevalecem sobre texto historico. Ao alterar comportamento, contrato, banco, autenticacao, operacao, deploy ou fluxo, atualize o documento do produto e, quando a fronteira for afetada, a arquitetura unificada. Registre separadamente "implementado no codigo" e "verificado em producao". Nunca documente segredos ou dados pessoais.
