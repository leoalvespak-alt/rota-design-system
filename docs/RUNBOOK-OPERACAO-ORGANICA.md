# Runbook — Operação Orgânica

Documento operacional para a rotina diária do sistema de operação orgânica do @rotadeataque.

## Visão geral

O sistema consolida dois bancos Postgres em um, com proveniência (manual / ai_generated / automation), travas de imutabilidade por trigger, doutrina editorial semeada, radar de notícias, inteligência de concorrentes, calendário/Kanban, curadoria humana e publicação híbrida.

## Rotina diária

1. **Abrir `/review-inbox`** — aba Radar: triagem dos achados do radar de notícias (RSS a cada 15 min, full a cada 12h). Aprovar os relevantes para criar slots no calendário.
2. **Aba Sugestões** — revisar sugestões de pauta geradas por IA a partir de insights de concorrentes. Aprovar, editar+aprovar ou rejeitar com motivo.
3. **Abrir `/publishing`** — verificar calendário da semana. Arrastar slots se necessário. Verificar aderência aos pesos dos pilares (Radar Policial 30%, Técnico 25%, Método 20%, Identificação 15%, TAF 10%).
4. **Abrir `/automations`** — verificar saúde dos workers. Divergências entre configurado e efetivo aparecem como alerta.

## Publicação

### Fluxo por origin

| Origin | Canal | Comportamento |
|---|---|---|
| `manual` + aprovado | Instagram | Publica via Meta API se token disponível; senão gera pacote pronto (arte no R2 + legenda) e notifica para postagem manual |
| `manual` + aprovado | Threads | Publica automaticamente via Threads API |
| `ai_generated` + aprovado | Qualquer | Publica normalmente |
| `ai_generated` sem aprovação | Qualquer | Skip + notificação no review inbox |

### Kill-switch

`POST /api/admin/publishing/kill-switch` com `{ active: false }` desliga todos os publishers. Afeta `publisher` e `threads-publisher`. Reativar com `{ active: true }`.

### Cancelamento

`POST /api/admin/publishing/cancel` com `{ publicationId }` cancela uma publicação pendente. Funciona até o momento do disparo.

### Confirmação manual (Instagram fallback)

Quando o publisher gera pacote pronto, a notificação aparece no review inbox. Após postar manualmente:
`POST /api/admin/publishing/confirm-manual` com `{ publicationId, externalId? }`.

## Coleta de métricas

Após publicação, métricas são agendadas para coleta em 24h, 72h e 7 dias. `GET /api/admin/organic-metrics` retorna:
- Achados do radar por fonte
- Latência média (notícia → achado)
- Taxa de aprovação de sugestões
- Aderência do calendário aos pesos dos pilares

## Workers

| Worker | Cadência padrão | Função |
|---|---|---|
| `news-radar` (rss) | 15 min | Busca RSS das fontes de notícia |
| `news-radar` (full) | 12h | Reprocessamento completo (fixo) |
| `competitive-intel` | Diário (1h) | Análise de concorrentes |
| `competitive-intel` (weekly) | Semanal (seg 6h) | Análise semanal (fixo) |
| `data-quality` | Diário (4h) | Reparo de views e consistência |
| `publisher` | 1 min | Publica Instagram |
| `threads-publisher` | 1 min | Publica Threads |
| `alerts` | dead-man 30s, canário 3h (fixo) | Monitora workers e canários |

Todos os workers podem ser ligados/desligados em `/automations` sem redeploy. A ação grava um comando auditável e a confirmação operacional é o heartbeat/runtime, não apenas o toggle visual.

### Ativação gradual (canário E4.1)

Ative na ordem, aguardando `heartbeat.state='running'` após cada passo:

1. **`data-quality`** — repara as materialized views antes de qualquer dashboard.
2. **`alerts`** — habilita o monitoramento dead-man (lê `worker_settings` do banco; workers desabilitados não geram alerta).
3. **`news-radar`** — exige pelo menos uma linha `active=true` em `news_sources`.
4. **`competitive-intel`** — exige concorrentes vinculados à campanha em `campaign_competitors`.
5. **`content-opportunity`** — só produz oportunidades após `competitive-intel` gerar `topics`.

Não ligue os 41 workers de uma vez: o VPS tem 2 vCPU / 8 GB.

### Configurar cadência pela UI

Na tela `/automations`, a coluna "Agendamento" exibe a cadência atual e permite editá-la inline. Formatos aceitos:
- `every:<ms>` — intervalo fixo em milissegundos (ex: `every:900000` = 15 min)
- Expressão cron (ex: `0 */6 * * *` = a cada 6h)

A mudança é aplicada imediatamente ao scheduler BullMQ E é persistida no banco. Quando o scheduler reconcilia (a cada 5 min), ele lê a cadência do banco e mantém a configuração do operador.

## Providers pagos

Tela: `/organic-budgets`. Providers: Exa, Apify, Bright Data.

Regras:
- Default desligado (`EXA_ENABLED=false`, etc.)
- Ativar requer: chave API configurada + teto diário e/ou mensal definido
- Cada chamada passa por reserva de orçamento antes de executar
- Estouro de teto bloqueia a execução e registra no audit_log

## Imutabilidade

- Conteúdo `origin='manual'` ou `locked_at IS NOT NULL` é protegido por trigger no banco
- Automação (`app.actor_type = 'automation'`) não pode modificar nem deletar registros manuais/travados
- Fixar item: ação "Fixar" no calendário marca `locked_at` e torna intocável por automação

## Migrations

Sequência: 0011 (schema design) → 0012 (proveniência e travas) → 0013 (doutrina editorial) → 0014 (seed da doutrina) → 0015 (reservas de orçamento).

## Rollback

Scripts em `deploy/`:
- `consolidation-backup.sh` — dump dos dois bancos
- `consolidation-rollback.sh` — reverte consolidação
- Down migrations em cada arquivo `*.down.sql`
