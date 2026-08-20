# Plano de publicação — 15 dias · Ciclo 2 (Instagram + Threads + Stories)

Período: **21/08/2026 (sex) a 04/09/2026 (sex)**
Doutrina e evidências: [CRESCIMENTO-ORGANICO-ROTA-DE-ATAQUE.md](CRESCIMENTO-ORGANICO-ROTA-DE-ATAQUE.md)
Ciclo anterior (17–31/08): [PLANO-DE-PUBLICACAO-15-DIAS.md](PLANO-DE-PUBLICACAO-15-DIAS.md)
Estado verificado: 20/08/2026.

> **Onde o conteúdo vive:** este ciclo NÃO é só um documento — está persistido no banco do Prospector
> (VPS 187.127.249.22, `db_prospector_postgresql`) pela migration
> `plataforma/packages/db/migrations/0030_growth_organic_15day_batch.*.sql`.
> As cópias integrais (capas, slides, legendas, hashtags, CTA, roteiros) estão nos registros de
> `scheduled_publications` (+ `content_items`/`content_variants` para Threads), prontas para edição
> e aprovação na tela **Publicação multicanal** do Prospector.

---

## 1. O que foi feito e o estado da VPS

| Item | Estado em 20/08/2026 |
|---|---|
| Postgres do Prospector (Dokploy) | Rodando com `pgvector/pgvector:pg18` (imagem corrigida; config durável no Dokploy) |
| Migrations 0001–0030 | Aplicadas via `schema_migrations` (mesmo runner do app — `pnpm db:migrate` pulará tudo) |
| **Banco do Design System** | **Consolidado no Postgres do Prospector sob o schema `design`** (51 tabelas restauradas do dump `rota_design` de 19/08, conforme Etapa 1 do PLANO-OPERACAO-ORGANICA) |
| **Teses editoriais** | **7 no `design.editorial_theses`** (T1–T6 da doutrina + T7), ricas (crenças, vocabulário, formatos, CTAs) — mesma base consumida pelo editor de teses do Design System |
| **Integração Prospector ↔ Design System** | View `theses_from_design` (criada pela migration 0011) ativa sobre `design.editorial_theses`, expondo o contrato que os workers consomem |
| Teses operacionais (UI de publicação) | `public.theses` com as mesmas 7 (IDs próprios, usados como FK dos agendamentos) |
| Calendário | 15 posts de feed + 30 blocos de stories + 30 threads = 75 agendamentos |
| Aprovação | **Nenhuma** — tudo `status='ready'`, `approved_by=NULL`, `curation_status='proposed'` |
| Proveniência | `origin='manual'` + `locked_at` (automação não edita; você edita livremente) |
| Apps web | Fora do ar — o deploy do Prospector falha no `next build` (erro webpack em `src/lib/otp-rate-limit.ts`). Corrigir o build é pré-requisito para usar a UI; o banco está pronto |

> **Sobre as 6 teses que você lembrava:** elas viviam no banco do Design System (rota_design).
> Os dumps de 14–19/08 da VPS traziam as tabelas editoriais **vazias** (a edição era feita pela UI),
> e o volume Docker original se perdeu na reinstalação de 20/08. A doutrina foi então **re-semeada**
> no lugar canônico: `design.editorial_theses` (as 6 do manual + a T7 do plano de 15 dias),
> com o Prospector consumindo via `theses_from_design` — exatamente a integração que você descreveu.

---

## 2. Calendário de feed (15 posts · horário de São Paulo)

**Card styles:** alternância entre os templates existentes do Design System (nenhum foi alterado):
carrossel usa `cr-cover`/`cr-cover-dark` + `cr-slide`/`cr-list`/`cr-fact`/`cr-comparison`/`cr-cta`
com presets `educacional`/`lista`/`impacto`/`misto`/`curto`; estáticos usam `sq-quote` e `sq-tip`;
stories usam `pt-cover`/`pt-content`/`pt-cta`; reels são motion/texto 9:16 (sem rosto).

| # | Data | Hora | Formato | Tese | Pilar | Tema | Estilo de card | CTA / Isca |
|---|---|---|---|---|---|---|---|---|
| D1 | sex 21/08 | 19h30 | Carrossel-notícia | T4 | radar-policial | Radar Policial #1 | cr-cover-dark + preset-curto | `RADAR` |
| D2 | sáb 22/08 | 10h30 | Carrossel de save | T3 | tecnico-aplicado | 4 pegadinhas de Português | cr-cover + preset-educacional | comentário |
| D3 | dom 23/08 | 19h00 | Carrossel CTA-comentário | T7 | metodo-rotina | PM x Polícia Penal | cr-cover-dark + cr-comparison + preset-misto | `FARDA` |
| D4 | seg 24/08 | 19h30 | Carrossel-notícia | T4 | radar-policial | Radar Policial #2 — banca definida | cr-cover + preset-curto | `RADAR` |
| D5 | ter 25/08 | 18h30 | Reel motion | T5 | identificacao-bastidor | 2h com direção > 8h sem | 9:16 texto queimado | marcação |
| D6 | qua 26/08 | 07h30 | Estático (opinião) | T6 | metodo-rotina | Trocar de curso é recomeçar | sq-quote | comentário |
| D7 | qui 27/08 | 19h30 | Carrossel CTA-comentário | T2 | taf-etapas | Psicotécnico: verdade x lenda | cr-cover-dark + cr-fact + preset-impacto | comentário |
| D8 | sex 28/08 | 18h30 | Reel motion | T5 | identificacao-bastidor | "Você não atrasou" | 9:16 texto queimado | share |
| D9 | sáb 29/08 | 10h30 | Carrossel de save | T3 | tecnico-aplicado | 3 questões: a banca troca 1 palavra | cr-cover + preset-educacional | `60` |
| D10 | dom 30/08 | 19h00 | Carrossel CTA-comentário | T7 | metodo-rotina | 4 perguntas antes de escolher | cr-cover + cr-list + preset-misto | comentário |
| D11 | seg 31/08 | 19h30 | Carrossel-notícia | T4 | radar-policial | Radar Policial #3 — balanço da quinzena | cr-cover-dark + preset-curto | `RADAR` |
| D12 | ter 01/09 | 18h30 | Reel motion | T1 | metodo-rotina | Mais horas x critério | 9:16 texto queimado | comentário |
| D13 | qua 02/09 | 07h30 | Estático (dica) | T3 | tecnico-aplicado | Errar 40 em casa > errar 5 na prova | sq-tip | comentário |
| D14 | qui 03/09 | 19h30 | Carrossel de save | T2 | taf-etapas | TAF por corporação | cr-cover + cr-list + preset-lista | `TAF` |
| D15 | sex 04/09 | 18h30 | Reel motion | T5 | identificacao-bastidor | 2 semanas de constância | 9:16 texto queimado | share |

**Proporção:** 9 carrosséis · 4 reels · 2 estáticos. Pilares: método 27% · radar 20% · técnico 20% · identificação 20% · TAF 13% (a aderência exata aos pesos semanais 30/25/20/15/10 é compensada pelas threads e stories, que carregam mais técnico e identificação).

**Iscas em uso (mesmas 9 do ciclo 1 — nenhuma isca nova para produzir):** `RADAR`, `LEI`, `BASE`, `FARDA`, `60`, `TAF`, `SOCIAL`, `TATTOO`, `30`. Menção ao produto em no máximo 3 dos 15 posts (D9, D14 e 1 radar), sempre 1 linha no fim.

**Placeholders `[Estado]`/`[Cargo]`/`[banca]`/`[data]`:** os 3 Radars precisam das movimentações reais do radar de notícias no dia da publicação. Sem o worker `news-radar` ativo, conferir manualmente em PCI Concursos/JC Concursos/DOU antes de aprovar o post do dia.

---

## 3. Threads — 2/dia (07h00 e 21h00)

30 textos completos no banco (`content_variants.payload.text`, canal `threads`), 1 ideia por post, sem hashtag, sem link. As threads cobrem as 7 teses em rotação e ecoam os posts do feed (ex.: noite do D9 → "A banca não quer saber se você sabe a lei...").

## 4. Stories — 2 blocos/dia (07h30 e 19h00), 3 telas cada

30 blocos no banco com roteiro por tela e 1 sticker interativo obrigatório (enquete/caixinha/slider), link só na 3ª tela. A grade semanal roda os padrões do ciclo 1 (quiz de terça, caixinha de quarta, bastidor de sexta, planejamento de domingo) ligados ao post do dia.

## 5. Hashtags (blocos do ciclo 1, máx. 12)

- **A (sempre):** `#concursopolicial #carreiraspoliciais #concursopublico #concurseiro #rotadeataque`
- **B (corporação):** `#policiapenal #policiamilitar #policiacivil #prf #policiafederal #guardamunicipal`
- **C (estudo):** `#rotinadeestudos #planodeestudos #questoescomentadas #revisao #leiseca`
- **D (etapas):** `#taf #testedeaptidaofisica #investigacaosocial #psicotecnico`
- Extras usados: `#radarpolicial #portuguesparaconcursos #legislacaoespecial #concurseiroquetrabalha #constancia`

## 6. Aprovação (SUA — fluxo no Prospector)

Nada deste ciclo está aprovado. Quando o app voltar ao ar:
1. Tela **Publicação multicanal** → Kanban: os 75 itens aparecem na coluna **Pronto**.
2. Aprovar = arrastar para **Aprovado** e depois **Agendado** (o worker `publisher` só dispara com `approved`).
3. Antes de agendar os 3 Radars: preencher os dados reais da semana no editor de slot.
4. Antes de agendar posts de feed: gerar as artes no Design System (as referências de template já estão em cada item, campo `media_ref`/`content_structure`) e registrar o PNG no R2 (`media_asset_ref`) — sem arte, o publisher cria o pacote fallback para postagem manual.
5. Threads: conectar a conta Threads (worker `threads-publisher` já lê `content_variants.payload.text` — o pipeline está completo).

## 7. SQL entregue

- Schema: `plataforma/packages/db/migrations/0001_*` … `0029_*` (canônico, aplicado no VPS).
- Ciclo de conteúdo: `0030_growth_organic_15day_batch.up.sql` / `.down.sql` — idempotente por `batch_id` (`d15db4a0-2026-4a08-8a15-d00000000030`). Rolar de novo: remover a linha em `schema_migrations` da versão 0030 e aplicar o `.up`; o `.down` desfaz só o que este ciclo criou (75 agendamentos, 30 itens, 30 variantes, 15 oportunidades, tese T7).

## 8. Pendências fora deste ciclo (não alteradas de propósito)

1. **Build do Prospector quebrado** (`apps/web` — erro webpack em `otp-rate-limit.ts`) — sem ele a UI não sobe; o banco já está pronto para quando subir.
2. Design System fora do ar na VPS (reinstalada em 20/08) — arte dos cards depende dele.
3. Contas Meta/Threads não conectadas (workers de publicação dependem disso).
4. Workers `news-radar`/`competitive-intel` desligados — radar manual enquanto isso.
