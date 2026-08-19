# Plano de operação orgânica — Prospector + Design System

Plano de implementação para tirar a operação de conteúdo do estado zerado e colocá-la sob controle: doutrina curada manualmente, radares automáticos, calendário gerenciável e publicação com separação rígida entre o que você define e o que a IA propõe.

**Documento-fonte da doutrina:** [`CRESCIMENTO-ORGANICO-ROTA-DE-ATAQUE.md`](CRESCIMENTO-ORGANICO-ROTA-DE-ATAQUE.md)
**Data:** 2026-08-15

---

## Decisões que orientam este plano

| Decisão | Escolha |
|---|---|
| Fonte de verdade das teses | Banco compartilhado — consolidar no Postgres do Prospector |
| Curadoria manual | Dividida por natureza: Design System = editorial; Prospector = operacional |
| Modo de publicação | Híbrido por origem — manual publica sozinho, IA exige aprovação |
| Meta API sem permissão de publicação | Construir tudo + fila com fallback de pacote pronto |
| Fontes do radar de notícias | Portais de concursos + Diários oficiais |
| Apify / Bright Data / Exa | Integrados no código, desligados por padrão |

---

## Diagnóstico do estado atual

**Teses.** Existem nos dois lados, sem qualquer sincronia. O Design System tem `editorial_theses` com estrutura rica (argumentos, objeções, exemplos, evidências, relações, versionamento) e editor funcional. O Prospector tem `theses` (tenets, ângulos proibidos, hooks, embedding, trigger de máximo 7 ativas), somente leitura na UI. São dois containers Postgres separados, em projetos Compose distintos.

**Colisão de nomes.** Os dois bancos têm `content_items`, `content_briefs` e `content_usage_ledger` com schemas diferentes. Consolidação exige namespace por schema — não dá para juntar em `public`.

**Inteligência e radares.** Os 40 workers sobem e ficam ociosos: todo `WORKER_*_ENABLED` está `false`, não há botão de disparo em lugar nenhum do admin, e a ativação é por variável de ambiente (exige redeploy para mudar). Não existe worker de notícias/RSS.

**Calendário e Kanban.** `apps/web/src/app/publishing/PublishingClient.tsx` renderiza `scheduled_publications` e nada mais — sem criar, editar, arrastar, agendar em lote ou recorrência. Os botões de alternância entre Kanban e Calendário existem; o conteúdo abaixo deles é estático.

**Proveniência.** Nenhuma tabela distingue conteúdo curado de conteúdo gerado, e não existe trava impedindo automação de sobrescrever o que você definiu. Hoje um worker mal comportado apagaria sua tese sem obstáculo.

**Providers.** As tabelas de `0010_organic_intelligence` (`research_runs`, `provider_observations`, `provider_usage`, `organic_budgets`) existem e estão vazias. Nenhuma chave configurada.

**O que já está pronto e será aproveitado.** `@plataforma/meta-api` v26.0 recém-publicada com superfície completa (business discovery, insights, publishing, stories, reels, hashtags). Guardrails `assertRole` / `assertHumanApproval` / `assertExternalAllowed` em `@plataforma/shared`. Agendamento BullMQ via `installPlatformSchedulers`. Kill-switch global em `/api/kill-switch`. `vendor-dnd` já no bundle do Design System.

---

## Etapa 0 — Preparação e rede de segurança

Nada começa sem ponto de retorno. Consolidação de banco é a operação mais arriscada do plano.

**Passo 0.1 — Backup completo dos dois bancos.**
`pg_dump -Fc` de `rota_design` e `prospector`, com verificação de integridade (`pg_restore --list`) e cópia para o R2 (`prospector-backups`). Registrar o par de dumps com o mesmo `run_id`.

**Passo 0.2 — Ambiente de ensaio.**
Restaurar os dois dumps em bancos de ensaio no próprio VPS (`rota_design_rehearsal`, `prospector_rehearsal`). Toda a Etapa 1 roda ali primeiro, cronometrada, antes de tocar produção.

**Passo 0.3 — Janela e plano de rollback.**
Documentar o procedimento de reversão: reapontar `DATABASE_URL` do Design System para o container original e restaurar o dump do Prospector. Manter o volume do Postgres do Design System intacto por 30 dias após a consolidação.

**Critério de aceite:** restauração de ensaio concluída, tempo de execução medido e procedimento de rollback testado ao menos uma vez.

---

## Etapa 1 — Consolidar os bancos sob um Postgres

O Postgres do Prospector recebe tudo. Ele já tem pgvector, as campanhas e os 40 workers apontados para lá.

**Passo 1.1 — Criar o schema de namespace.**
Migration `packages/db/migrations/0011_design_schema.up.sql`: `CREATE SCHEMA design;` mais o `.down.sql` correspondente. As 49 tabelas do Design System vivem em `design.*`, resolvendo as três colisões sem renomear nada.

**Passo 1.2 — Transferir os dados com renomeação de schema na origem.**
Evitar reescrita de SQL com `sed`, que é frágil. O caminho seguro renomeia o schema numa cópia antes de exportar:

```bash
createdb design_staging
pg_dump -Fc rota_design | pg_restore -d design_staging
psql design_staging -c 'ALTER SCHEMA public RENAME TO design;'
pg_dump -Fc design_staging > design_ns.dump
pg_restore -d prospector design_ns.dump
```

**Passo 1.3 — Verificar paridade.**
Comparar contagem de linhas tabela a tabela entre `rota_design.public.*` e `prospector.design.*`. Conferir que `pgvector` está disponível e que `design.knowledge_embeddings` manteve as dimensões. Divergência em qualquer tabela aborta a etapa.

**Passo 1.4 — Reapontar a API do Design System.**
`DATABASE_URL` passa a apontar para o Postgres do Prospector, com `?options=-c%20search_path%3Ddesign,public`. Ajustar `apps/design-system/docker-compose.yml` e o fragmento de env no `deploy/deploy-all.ps1`. As migrations Drizzle passam a rodar contra o schema `design`.

**Passo 1.5 — Ligar as duas redes Docker.**
Criar rede externa compartilhada e conectar o serviço `api` do Design System ao Postgres do Prospector.

**Passo 1.6 — Aposentar o Postgres antigo.**
Parar o container `rota-design-api-postgres-1` sem remover o volume. Remover do Compose só após 30 dias de operação estável.

**Passo 1.7 — Expor as teses ao Prospector.**
Substituir a tabela `theses` do Prospector por uma view sobre `design.editorial_theses`, preservando as colunas que os workers já consomem (`tenets`, `forbidden_angles`, `tone_guidelines`, `example_hooks`, `centroid_embedding`, `active`). Onde a view não puder ser gravável, criar `INSTEAD OF` triggers. O limite de 7 teses ativas migra para o lado do Design System.

**Critério de aceite:** Design System e Prospector ambos saudáveis lendo do mesmo Postgres; `/theses` do Prospector exibe as teses editadas no Design System sem qualquer job de sincronia.

---

## Etapa 2 — Proveniência e imutabilidade do que é seu

O coração do que você pediu: automação nunca edita nem apaga o que você definiu.

**Passo 2.1 — Colunas de proveniência.**
Migration `0012_provenance_and_locks.up.sql` adiciona a `design.editorial_theses`, `content_items`, `content_variants`, `scheduled_publications` e `candidate_sources`:

- `origin text NOT NULL DEFAULT 'manual' CHECK(origin IN ('manual','ai_generated','automation'))`
- `locked_at timestamptz`, `locked_by text` — quando preenchidos, o registro é intocável por automação
- `curation_status text CHECK(curation_status IN ('raw','proposed','approved','rejected'))`
- `superseded_by uuid` — automação que quer alterar algo travado cria versão nova apontando para a original

**Passo 2.2 — Trava no banco, não na aplicação.**
Função `enforce_manual_immutability()` em trigger `BEFORE UPDATE OR DELETE`: se `OLD.origin = 'manual'` ou `OLD.locked_at IS NOT NULL`, e a sessão declarar `app.actor_type = 'automation'`, levanta exceção. A regra vive no banco porque worker novo, script de manutenção ou query manual descuidada passam por cima de qualquer verificação em TypeScript.

**Passo 2.3 — Workers declaram identidade.**
`packages/queue/src/runtime.ts` passa a executar `SET LOCAL app.actor_type = 'automation'` na abertura de toda transação de worker. As rotas de API autenticadas por usuário declaram `'human'`. Sem essa declaração, o default é `'human'` — falha em favor da liberdade de edição para você, e da restrição para o que roda sozinho.

**Passo 2.4 — Tabelas de estágio separadas.**
Automação escreve exclusivamente em áreas próprias, nunca no acervo curado:

- `radar_findings` — notícias e sinais brutos do radar
- `competitor_insights` — leituras de performance de concorrentes
- `content_suggestions` — propostas de pauta com evidência anexada

A promoção de estágio para acervo só acontece por ação sua na fila de revisão.

**Passo 2.5 — Testes de guardrail.**
Suíte que tenta, sob `app.actor_type = 'automation'`: atualizar tese manual, deletar publicação agendada manual, sobrescrever legenda travada. Todos devem falhar com exceção. As mesmas operações sob `'human'` devem passar.

**Critério de aceite:** os testes de violação passam; nenhum caminho de automação consegue tocar registro `origin='manual'`.

---

## Etapa 3 — Semear a doutrina manual

Carregar o documento de crescimento orgânico como base fixa, marcada `origin='manual'` e travada.

**Passo 3.1 — Estruturas para a doutrina.**
Migration `0013_editorial_doctrine.up.sql`:

- `content_pillars` — pilar, peso semanal, tese vinculada, objetivo primário
- `format_playbook` — formato, função, estrutura, frequência alvo, objetivo
- `editorial_rules` — regra do tipo `do` ou `dont`, escopo, justificativa
- `audience_vocabulary` — termos reais do público, com origem da evidência
- `validated_hooks` — hook, fonte, resultado medido

**Passo 3.2 — Seed idempotente das 6 teses.**
T1 a T6 do documento em `design.editorial_theses`, cada uma com ideia central, crença, problema combatido, assuntos derivados e motivo estratégico mapeados para argumentos e evidências. Todas com `origin='manual'`, `locked_at` preenchido. Seis teses cabem no limite de sete ativas.

**Passo 3.3 — Seed dos pilares e formatos.**
Os cinco pilares com seus pesos (Radar Policial 30%, técnico aplicado 25%, método e rotina 20%, identificação 15%, TAF e etapas 10%) e os cinco formatos com frequência alvo (Reels 3–4/sem, carrosséis 2–3/sem, estático 1–2/sem, stories 5–7 dias, Threads 7–14/sem).

**Passo 3.4 — Seed do tom de voz e das interdições.**
Tom, formalidade, autoridade, proximidade, humor e provocação como perfil de marca. A lista de "evitar" vira `editorial_rules` do tipo `dont` — estética militarista, conteúdo político, promessa de prazo de aprovação, release de feature, excesso de emoji, "link na bio" como única razão do post. Essas regras alimentam a validação de qualquer copy gerada.

**Passo 3.5 — Seed dos 20 concorrentes.**
Os perfis da seção 3 do documento em `candidate_sources` com `origin='manual'`, incluindo plataforma, tipo de concorrência, segmento, posicionamento e o motivo de acompanhar. Essa lista alimenta a análise automática da Etapa 5.

**Passo 3.6 — Seed do vocabulário e dos hooks validados.**
As expressões coletadas em comentários e os hooks com resultado medido, cada um com a métrica que o valida.

**Critério de aceite:** rodar o seed duas vezes não duplica nada; a UI do Design System mostra as 6 teses editáveis e travadas contra automação; o Prospector lista os 20 concorrentes.

---

## Etapa 4 — Radar de notícias de concursos

Worker novo, `workers/news-radar/`. Duas cadências: RSS quase imediato e varredura completa a cada 12 horas.

**Passo 4.1 — Cadastro de fontes.**
Tabela `news_sources`: URL do feed, portal, tipo (`rss` ou `scrape`), ativo, `last_fetched_at`, `etag`, `last_modified`, `failure_count`. Seed com os portais (PCI Concursos, Folha Dirigida, JC Concursos, Gran Cursos, Direção Concursos, Qconcursos) e os diários oficiais (DOU via API da Imprensa Nacional, mais os DOEs dos estados com concurso policial ativo).

**Passo 4.2 — Coleta com requisição condicional.**
RSS a cada 15 minutos usando `If-None-Match` e `If-Modified-Since` — resposta `304` custa quase nada, então frequência alta não pesa. Varredura completa a cada 12 horas para pegar o que o feed não expôs. Backoff exponencial por fonte com falha, e desativação automática após 10 falhas seguidas com alerta.

**Passo 4.3 — Deduplicação e anti-regressão.**
Chave lógica por hash da URL canônica normalizada (sem parâmetros de rastreamento). `news_items` com `UNIQUE(source_id, external_id)`. Marca d'água por fonte para nunca reprocessar o que já entrou — a coleta é incremental por natureza, e reprocessamento só acontece por comando explícito seu.

**Passo 4.4 — Classificação.**
Cada item recebe: concurso alvo (PM, Polícia Penal, PC, PF, PRF, GCM), estado, banca quando identificável, e fase do ciclo (autorização, comissão, banca definida, edital publicado, retificação, resultado). A classificação usa o LLM configurado com fallback para regras por palavra-chave quando a IA estiver indisponível.

**Passo 4.5 — Saída para estágio.**
Itens classificados viram `radar_findings` com relevância calculada. Nunca entram direto no calendário. Os de fase `edital publicado` e `banca definida` disparam notificação imediata, porque são o insumo da tese T4 e o conteúdo que mais gerou save no levantamento.

**Passo 4.6 — Registro no agendador.**
Em `packages/queue/src/index.ts`:

```ts
registry.queues['news-radar'].upsertJobScheduler('news-radar-rss-15m-v1',  { every: 900_000 },      { name: 'news-radar-rss',  data: { mode: 'incremental' } }),
registry.queues['news-radar'].upsertJobScheduler('news-radar-full-12h-v1', { pattern: '0 */12 * * *' }, { name: 'news-radar-full', data: { mode: 'full' } }),
```

**Critério de aceite:** o radar traz notícias reais de concurso policial em menos de 15 minutos da publicação no feed; rodar duas vezes seguidas não gera item duplicado.

---

## Etapa 5 — Inteligência de concorrentes

Sob demanda por botão, mais varredura automática a cada 7 dias.

**Passo 5.1 — Coleta pela Meta API.**
Usar `businessDiscovery` da `@plataforma/meta-api` v26.0 — gratuita e já disponível — sobre os 20 concorrentes semeados. Traz perfil, contagem de seguidores e mídias recentes com curtidas e comentários.

**Passo 5.2 — Análise de performance por formato.**
Para cada concorrente e cada janela: distribuição de formato, engajamento mediano por formato, hooks recorrentes nas primeiras linhas de legenda, CTAs usados, horários de publicação. O resultado responde qual formato e qual abertura estão performando agora no nicho.

**Passo 5.3 — Detecção de outlier.**
Post cujo desempenho supera em 3x a mediana do próprio perfil entra em `competitor_insights` marcado como outlier, com a hipótese do que causou o pico. É o mecanismo que capturaria um caso como o Reel de 756 mil views documentado na seção 1.

**Passo 5.4 — Geração de sugestões.**
Cada insight relevante vira `content_suggestions` amarrada a uma tese e a um pilar, com evidência anexada, respeitando as `editorial_rules` do tipo `dont`. Sugestão nasce `curation_status='proposed'` — nunca entra no calendário sozinha.

**Passo 5.5 — Disparo manual e automático.**
`POST /api/admin/research/run` com escopo (todos os concorrentes, um perfil, uma janela) para o botão do admin. Agendador semanal:

```ts
registry.queues['competitive-intel'].upsertJobScheduler('competitive-intel-weekly-v1', { pattern: '0 6 * * 1' }, { name: 'competitive-intel-weekly', data: { windowDays: 7 } }),
```

**Critério de aceite:** o botão dispara e retorna insights dos 20 perfis; a rodada semanal produz sugestões vinculadas a tese e pilar.

---

## Etapa 6 — Painel de controle das automações

Hoje ligar um worker exige editar env e redeployar. Isso precisa virar um botão.

**Passo 6.1 — Configuração em banco.**
Tabela `worker_settings`: nome do worker, habilitado, cadência, última execução, próxima execução, itens processados, último erro. Migra o controle de `WORKER_*_ENABLED` estático para runtime, com o valor de env servindo apenas de default na primeira subida.

**Passo 6.2 — Tela `/admin/automations`.**
Lista os 40 workers mais os dois novos, agrupados por domínio (radar, inteligência, publicação, mensageria, manutenção). Cada linha mostra estado, saúde, última execução e volume processado.

**Passo 6.3 — Ações operacionais.**
Executar agora, pausar, retomar, reprocessar janela de datas, limpar fila de mortos. Toda ação passa por `assertRole('operator')` e entra no `audit_log`.

**Passo 6.4 — Estado real, não presumido.**
O painel lê o estado efetivo do BullMQ (jobs ativos, aguardando, falhos, agendamento instalado), não apenas o que a tabela de configuração diz. Divergência entre configurado e efetivo aparece como alerta.

**Critério de aceite:** ligar e desligar qualquer worker pela interface, sem redeploy, com efeito em menos de um minuto.

---

## Etapa 7 — Calendário e Kanban gerenciáveis

Substitui a tela somente-leitura por uma ferramenta de operação.

**Passo 7.1 — Modelo de agendamento.**
Ampliar `scheduled_publications` com: canal e subtipo (feed, reels, stories, carrossel, Threads), legenda, hashtags, referência de arte, CTA, tese, pilar, formato, fuso horário, regra de recorrência e `origin` com `locked_at`.

**Passo 7.2 — Calendário com arrastar e soltar.**
Visões de mês e semana. Arrastar remarca; a operação valida a nova janela contra a frequência alvo por formato e avisa quando o dia excede o piso ou o teto do playbook. Aproveita `vendor-dnd`, já presente no bundle.

**Passo 7.3 — Editor de slot.**
Criar e editar um agendamento com todos os campos: data, hora, canal, formato, tese, pilar, legenda, hashtags, arte, CTA. Validação contra as `editorial_rules` no momento de salvar, com o motivo da interdição exibido quando alguma regra é violada.

**Passo 7.4 — Programação em lote e recorrência.**
Programar N dias de uma vez a partir de um padrão ("toda terça e quinta 19h, Reel do pilar Radar Policial"). O gerador respeita os pesos dos pilares e a frequência alvo por formato, e nunca ocupa slot já preenchido.

**Passo 7.5 — Kanban operacional.**
Colunas por status: ideia, rascunho, aprovado, agendado, publicado, falhou. Arrastar entre colunas muda o estado com as transições válidas aplicadas. Cartões de `origin='manual'` exibem cadeado.

**Passo 7.6 — Fixar e travar.**
Ação de fixar um item: marca `locked_at` e o torna intocável por qualquer automação, conforme a trava da Etapa 2.

**Passo 7.7 — Estado vazio útil.**
Onde hoje aparece "sem dados", passa a aparecer o caminho de saída: criar primeiro agendamento, gerar programação a partir do playbook, ou revisar sugestões pendentes.

**Critério de aceite:** criar, editar, arrastar, fixar e programar em lote funcionando; item fixado sobrevive a uma rodada completa de automação sem alteração.

---

## Etapa 8 — Das recomendações ao calendário

**Passo 8.1 — Fila de revisão unificada.**
`/review-inbox` ganha as abas de achados do radar, insights de concorrentes e sugestões de pauta. Cada item mostra a evidência que o originou — a notícia, o post do concorrente, a métrica.

**Passo 8.2 — Ações de curadoria.**
Aprovar cria o slot no calendário; editar e aprovar abre o editor com a proposta pré-preenchida; rejeitar pede motivo. Os motivos de rejeição alimentam o aprendizado e reduzem a recorrência do mesmo tipo de sugestão.

**Passo 8.3 — IA preenche apenas lacunas.**
Função `find_available_slots()` que devolve os espaços livres respeitando a frequência alvo, os pesos dos pilares e os itens já fixados. A automação só pode propor dentro desses espaços — nunca sobre o que existe.

**Passo 8.4 — Acúmulo com versionamento.**
Conteúdo automático que evolui gera versão nova apontando para a anterior via `superseded_by`, preservando o histórico. O que é seu permanece na versão que você escreveu.

**Critério de aceite:** aprovar uma sugestão cria o agendamento corretamente; a IA não consegue propor em dia já ocupado por item manual.

---

## Etapa 9 — Publicação híbrida por origem

**Passo 9.1 — Bifurcação no publisher.**
No worker `publisher`, ao processar item vencido: `origin='manual'` com aprovação registrada publica direto; `origin='ai_generated'` exige `approved_by` preenchido, e sem isso o item é pulado com notificação.

**Passo 9.2 — Fallback de pacote pronto.**
Enquanto faltar `instagram_content_publish`, a tentativa de publicação no Instagram gera um pacote — arte no R2, legenda e hashtags — e notifica você para postar manualmente. O item fica `awaiting_manual_publish` até você confirmar. Quando a permissão for concedida, o mesmo fluxo passa a publicar sozinho sem alteração de código.

**Passo 9.3 — Threads publica de verdade agora.**
A API do Threads é mais permissiva e o worker `threads-publisher` já existe. Ativar de imediato, o que dá operação automática real no formato de menor custo marginal (7 a 14 posts por semana segundo o playbook).

**Passo 9.4 — Janela de cancelamento e kill-switch.**
Item agendado entra em janela de 10 minutos antes do disparo, cancelável. O kill-switch global já existente interrompe toda publicação.

**Passo 9.5 — Registro de resultado.**
Publicação bem-sucedida grava o ID externo e agenda coleta de métricas em 24h, 72h e 7 dias, alimentando a análise de qual formato performa.

**Critério de aceite:** item manual aprovado publica no Threads no horário; item de IA sem aprovação não publica e gera notificação; falha de permissão no Instagram produz pacote pronto com notificação.

---

## Etapa 10 — Providers pagos integrados e desligados

**Passo 10.1 — Ligar os adapters ao controle de orçamento.**
Os pacotes `exa-api`, `apify-api` e `bright-data-api` passam pelo fluxo de reserva em `organic_budgets` antes de qualquer chamada: estima custo, reserva, executa, reconcilia. Estouro de teto bloqueia a execução.

**Passo 10.2 — Tela de orçamento.**
`/admin/organic-budgets`, cuja rota de API já existe, ganha interface: teto diário e mensal por provider, gasto corrente, histórico e alternância de ativação.

**Passo 10.3 — Default desligado.**
`EXA_ENABLED`, `APIFY_ENABLED` e `BRIGHT_DATA_ENABLED` permanecem `false`. Ligar exige chave configurada e teto em dólar definido — a interface recusa ativação sem os dois.

**Critério de aceite:** provider sem chave ou sem teto não pode ser ativado; tentativa de execução acima do teto é bloqueada e registrada.

---

## Etapa 11 — Testes, observabilidade e documentação

**Passo 11.1 — Testes de guardrail.** Cobertura das travas de imutabilidade, do limite de teses ativas, das transições válidas de status e do respeito à frequência alvo.

**Passo 11.2 — Testes de integração.** Radar da coleta ao achado; inteligência de concorrente do disparo à sugestão; calendário da criação à publicação, com a Meta API mockada.

**Passo 11.3 — Métricas operacionais.** Itens coletados por fonte, taxa de aprovação de sugestões, aderência do calendário à frequência alvo, latência entre publicação da notícia e disponibilidade do achado.

**Passo 11.4 — Documentação canônica.** Atualizar `Docs/PROSPECTOR.md` e `Docs/ARQUITETURA-UNIFICADA.md` com a consolidação de banco e o modelo de proveniência; registrar a operação diária em runbook; indexar em `Docs/README.md`.

---

## Etapa 12 — Deploy e rollout

**Passo 12.1 — Migrations em produção**, com backup imediatamente antes e verificação de paridade depois.

**Passo 12.2 — Consolidação do banco** na janela ensaiada, com rollback pronto.

**Passo 12.3 — Seed da doutrina** e conferência visual nas duas interfaces.

**Passo 12.4 — Ativação gradual dos workers.** Primeiro o radar de notícias sozinho por 48 horas, observando volume e qualidade. Depois a inteligência de concorrentes. Publicação automática por último, começando pelo Threads.

**Passo 12.5 — Operação assistida por 7 dias**, revisando diariamente os achados e ajustando relevância e classificação antes de confiar no fluxo.

---

## Ordem de execução e dependências

```
Etapa 0  Preparação
  └─ Etapa 1  Consolidação do banco
       ├─ Etapa 2  Proveniência e travas
       │    ├─ Etapa 3  Seed da doutrina
       │    │    ├─ Etapa 4  Radar de notícias ──┐
       │    │    └─ Etapa 5  Concorrentes ───────┤
       │    │                                    ├─ Etapa 8  Recomendações → calendário
       │    └─ Etapa 7  Calendário e Kanban ─────┘        └─ Etapa 9  Publicação híbrida
       └─ Etapa 6  Painel de automações                        └─ Etapa 10 Providers pagos
                                                                     └─ Etapa 11 Testes e docs
                                                                          └─ Etapa 12 Deploy
```

As etapas 4 e 5 são independentes entre si e podem correr em paralelo. A 6 depende apenas da 1 e pode ser antecipada se a prioridade for ganhar controle sobre os workers antes de tudo.

---

## Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Migração de banco corrompe dados | Alto | Ensaio completo cronometrado, verificação de paridade tabela a tabela, volume antigo preservado 30 dias |
| Colisão de nomes de tabela | Alto | Namespace por schema `design` em vez de merge em `public` |
| Automação sobrescreve conteúdo curado | Alto | Trava no banco por trigger, não na aplicação |
| Permissão Meta nunca é concedida | Médio | Fallback de pacote pronto desde o primeiro dia; Threads automático desde já |
| Portal muda estrutura e quebra a coleta | Médio | Backoff, desativação após 10 falhas, alerta, e RSS como caminho preferencial sobre scraping |
| Custo descontrolado em provider pago | Médio | Reserva de orçamento antes da chamada e teto obrigatório para ativar |
| Volume de notícias irrelevantes | Baixo | Classificação com relevância, fila de revisão, aprendizado por motivo de rejeição |
