# Log de Deploy — Modernização

Ultima atualizacao: 2026-08-04

## Deploy do site (producao)

- Commit [`7668314`](https://github.com/leoalvespak-alt/rota-design-system/commit/7668314) enviado para `github.com:leoalvespak-alt/rota-design-system.git` (branch `main`).
- Build (`npm run build`) empacotado e enviado ao VPS, extraido em `/var/www/design-rota-ataque`, dono ajustado para `www-data`, `nginx -t` validado.
- Site confirmado no ar: `https://design.rotadeataque.com.br/` (HTTP 200, redirect HTTP->HTTPS ativo, certificado SSL ja emitido).

### Bug conhecido no `deploy/deploy.ps1`

Ao rodar o script via automação (não interativo), o bloco de `git add -A` + `git commit` + `git push` (linhas ~83-98) falha com um erro confuso (`CommandNotFoundException: 'working'`) mesmo com `-NoPush`, aparentemente por causa de como PowerShell 5.1 trata a saída do `git` (que escreve avisos de CRLF e progresso do `push` no stderr) combinada com `$ErrorActionPreference = "Stop"` no topo do script. O bug **não depende do branch `if ($hasChanges)`** — ocorre mesmo quando esse trecho não deveria executar, então provavelmente é causado pela forma como a shell não-interativa herda/mistura os streams do `git`.

**Workaround usado neste deploy**: fazer `git add` / `git commit` / `git push` manualmente (fora do script), depois rodar os passos de empacotamento+scp+ssh do script separadamente (ou `deploy.ps1 -NoPush -SkipBuild`, que ainda tromba no mesmo bug e precisa do mesmo workaround manual).

**Recomendado para consertar de vez**: mover o bloco de git para dentro de um `try { ... } catch { }` com `$ErrorActionPreference` local `'Continue'` só para os comandos `git`, ou redirecionar explicitamente `2>$null` nas chamadas de `git push`/`git add` dentro do script (o stderr já é informativo, não indica falha real — checar `$LASTEXITCODE` continua sendo a forma correta de detectar erro real).

## Infraestrutura de dados em produção (PostgreSQL + Redis + MinIO)

Provisionada em `2026-08-04`, isolada do restante do VPS compartilhado (que também hospeda Rota de Ataque e Gazeta Concursos).

### Levantamento prévio (antes de mexer em qualquer coisa)

- VPS já tinha **PostgreSQL nativo** (`127.0.0.1:5432`, banco `rota_ataque` — pertence ao Rota de Ataque) e **Redis nativo** (`127.0.0.1:6379`) rodando fora de Docker.
- Containers Docker existentes: `rota-aulas-engine`, `gazeta-n8n`, `gazeta-worker` — nenhum foi tocado.
- Portas `5433`, `6380`, `9002`, `9003` confirmadas livres antes de usar.

### O que foi criado

Stack Docker isolada em `/opt/design-system/` (separado de `/var/www/design-rota-ataque`, que é só o site estático):

| Serviço | Container | Porta (bind `127.0.0.1` apenas) | Volume |
|---|---|---|---|
| PostgreSQL 16 | `design-postgres` | `5433` -> `5432` | `design-system_design_postgres_data` |
| Redis 7 | `design-redis` | `6380` -> `6379` | `design-system_design_redis_data` |
| MinIO | `design-minio` | `9002` (API) / `9003` (console) | `design-system_design_minio_data` |

- Rede Docker dedicada `design-system_design-internal`, separada das redes `gazeta-internal`/`bridge` existentes.
- Nenhuma porta exposta publicamente (`0.0.0.0`) — tudo em `127.0.0.1`, só acessível a partir do próprio VPS (mesmo padrão já usado por `gazeta-n8n`).
- Senhas geradas aleatoriamente (24 caracteres), diferentes das senhas de dev do `docker-compose.yml` local.
- Migração `drizzle/0000_young_skreet.sql` aplicada com sucesso — **19 tabelas criadas** no banco `design_system`.

### Credenciais

Salvas em `deploy/.env.production` (gitignored, nunca commitado). Para conectar do PC local seria necessário um túnel SSH:

```bash
ssh -L 5433:127.0.0.1:5433 -L 6380:127.0.0.1:6380 -L 9002:127.0.0.1:9002 root@187.127.249.22
```

### Validação pós-deploy

- `docker ps`: 6 containers ativos e saudáveis (3 novos + 3 pré-existentes intactos).
- `psql` no Postgres nativo (`rota_ataque`) confirmado intacto, nenhum dado tocado.
- Redis novo: `PING` -> `PONG`.
- MinIO novo: health check HTTP 200.
- Site do Rota de Ataque (`app.rotadeataque.com.br`) confirmado HTTP 200 depois da mudança.
- Site do Design System (`design.rotadeataque.com.br`) confirmado HTTP 200.

### Estado atual

A infraestrutura de dados está pronta e populada com o schema, mas **nenhum backend Node ainda se conecta a ela** — o app publicado continua sendo o SPA estático client-side. Essa infra fica pronta para quando um backend/worker for implementado (fora do escopo desta modernização, que era focada no frontend/design system).
