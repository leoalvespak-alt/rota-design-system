# Documentação canônica

Documentação atualizada e verificada em 19/08/2026:

- [Prospector](PROSPECTOR.md): arquitetura, APIs, workers, dados, fluxos, deploy e estado real de produção.
- [Design System](DESIGN-SYSTEM.md): editor, templates, estado, IA server-side, API segura, exportação e deploy.
- [Arquitetura unificada](ARQUITETURA-UNIFICADA.md): fronteiras, Creative Bridge, jornada conjunta, segurança e operação.

Documentação de marca e crescimento:

- [Crescimento orgânico Rota de Ataque](CRESCIMENTO-ORGANICO-ROTA-DE-ATAQUE.md): diagnóstico do @rotadeataque, concorrentes, teses editoriais, posicionamento, bio, formatos e calendário. Coleta de 13/08/2026.
- [Plano de publicação 15 dias](PLANO-DE-PUBLICACAO-15-DIAS.md): execução operacional para Instagram e Threads — calendário 17–31/08/2026, copys completas, 7 teses, linguagem do público, iscas e opções de posicionamento.

Planos de implementação:

- [Plano de operação orgânica](PLANO-OPERACAO-ORGANICA.md): consolidação dos bancos sob um Postgres, proveniência manual vs automático com trava, seed da doutrina, radar de notícias, inteligência de concorrentes, painel de automações, calendário e Kanban gerenciáveis e publicação híbrida. 12 etapas.

- [Plano de correções e conclusão do Prospector](../plataforma/Docs/PLANO-CORRECOES-PROSPECTOR.md): roteiro executável para resolver os bloqueadores e implementações parciais remanescentes, incluindo migrations, mocks, atomicidade, OTP, Review Inbox, dados reais, acessibilidade, enrichment, testes e rollout.

- [Plano de correção integral de IA, modais e mocks do Prospector](../plataforma/Docs/PLANO-CORRECOES-IA-E-MOCKS-PROSPECTOR.md): roteiro em seis etapas para corrigir responsividade dos dialogs, contratos HTTP/RBAC, control plane de IA, sincronização segura com o ambiente e remoção comprovável de toda simulação da interface.

- [Plano de correção do Prospector — auditoria de 19/08/2026](../plataforma/docs/PLANO-CORRECAO-PROSPECTOR-2026-08-19.md): auditoria por `systematic-debugging` dos 9 relatos abertos em 19/08, com oito causas-raiz fechadas por evidência estática (colunas inexistentes em `news_sources` e `audit_log`, `DataGrid` incompatível com TanStack Table v9, control plane lendo variável de ambiente em vez do banco, heartbeats órfãos, cadeia editorial sem ponte, copy ausente em Publicação) e roteiro executável em nove etapas.

- [Plano de recuperação integral do Prospector](../plataforma/Docs/PLANO-RECUPERACAO-INTEGRAL-PROSPECTOR.md): auditoria do estado atual e roteiro executável para corrigir os 16 relatos, restaurar o control plane de workers, fechar os fluxos de radar e conteúdo, completar o Creative Bridge e publicação, unificar IA e aplicar uma revisão visual responsiva sem mocks.

- [Runbook de operação orgânica](RUNBOOK-OPERACAO-ORGANICA.md): operação diária do radar, curadoria, calendário, publicação, kill-switch, orçamento de providers.

Documentos operacionais preservados porque continuam ligados ao código atual:

- `plataforma/deploy/DEPLOY.md`
- `plataforma/docs/runbooks/account-checkpoint.md`
- `plataforma/docs/runbooks/automations.md`
- `plataforma/docs/runbooks/embeddings.md`
- `plataforma/docs/runbooks/queue-backlog.md`
- `plataforma/docs/runbooks/restore.md`
- `plataforma/docs/runbooks/worker-dead-man.md`
- `plataforma/docs/compliance/whatsapp-groups-availability.md`
- `plataforma/CHANGELOG.md`

## Política

Código, migrations, compose e scripts de deploy prevalecem sobre texto histórico. Ao alterar comportamento, contrato, banco, autenticação, operação, deploy ou fluxo, atualize o documento do produto e, quando a fronteira for afetada, a arquitetura unificada. Registre separadamente “implementado no código” e “verificado em produção”. Nunca documente segredos ou dados pessoais.
