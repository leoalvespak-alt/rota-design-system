# Plano de Correção — Deploys Dokploy (Rota de Ataque)

> **Documento historico, encerrado e substituido.** Nao use este plano como estado atual nem
> execute seus comandos. A fonte canonica auditada e `docs/DEPLOY-DOKPLOY.md`; o codigo dos
> workflows e scripts versionados prevalece em caso de divergencia. Em particular, a Plataforma
> 2.0 de producao continua em PM2/porta 3000, e o application Dokploy/porta 3030 e legado/inativo.
>
> Diagnóstico feito em 20/08/2026, execução iniciada em 20/08.
> **Atualizado em 20/08/2026** — seções concluídas removidas, só resta o que falta.

---

## 0. DECISÕES JÁ TOMADAS — NÃO REABRIR

| # | Decisão | Consequência prática |
|---|---|---|
| D1 | **nginx é o edge** (Opção A). O Traefik do Dokploy vai para 8080/8443. O painel do Dokploy vai para a porta **3100**. | nginx mantém 80/443 e todos os certificados atuais. Zero reemissão de TLS. |
| D2 | **O Prospector builda no GitHub Actions** (imagens no GHCR); a VPS só faz `pull`. **A Gazeta continua buildando no Dokploy.** | Nenhum serviço do compose do Prospector pode ter bloco `build:`. A Gazeta é um app único que já builda em 11 min na VPS e mora num repo privado. |
| D3 | **O Prospector continua em `design.rotadeataque.com.br/prospector`** | Zero DNS novo, zero certificado novo. `NEXT_PUBLIC_BASE_PATH=/prospector` fica como está. |
| D4 | **A Plataforma 2.0 (`rota-de-ataque-v2`) é a última fase**, e não entra em produção nesta rodada. | Ela volta ao ar pelo PM2 + nginx na Fase 0, como sempre foi. |
| D5 | **A IA configura o Dokploy sozinha**, via API REST com `x-api-key` (§8). | A chave já existe e foi testada; os endpoints necessários foram verificados um a um. |

### Mapa de portas final

| Porta | Quem ocupa |
|---|---|
| 80 / 443 | **nginx** (edge) |
| 3000 | `rota-frontend` (Plataforma 2.0, PM2) |
| 3001 | `deriva-pwa` |
| 3002 | `rota-design-api` |
| **3010** | **Prospector web (Dokploy)** |
| **3020** | **Gazeta (Dokploy)** |
| **3100** | **painel Dokploy** |
| 8080 / 8443 | Traefik do Dokploy |

---

## 1. REGRAS DE EXECUÇÃO PARA A IA

1. **Escopo travado.** Faça o que está nas Fases. Não refatore código de produto, não
   "melhore" componentes, não renomeie nada, não atualize dependências.
2. **Nunca grave arquivo com here-string interpolado do PowerShell** (`@"..."@`,
   `Set-Content` com `$` ou crase). Use here-string literal (`@'...'@`), heredoc do
   bash (`<<'EOF'`) ou as ferramentas de escrita do agente.
3. **Depois de gravar qualquer arquivo, valide que não há caractere de controle:**
   ```bash
   grep -nP '[\x00-\x08\x0B\x0C\x0E-\x1F]' CAMINHO_DO_ARQUIVO && echo "CORROMPIDO" || echo "OK"
   ```
4. **Valide o build localmente antes de cada `git push`.**
5. **Nunca commite segredos.** Os `.txt` da raiz são **somente leitura**.
6. Use a **API key** do Dokploy (§8), nunca senha de admin.
7. **Comandos destrutivos na VPS:** apenas os escritos neste documento.
8. **Relate ao final** o que foi feito, o que falhou, e a lista da §9 que sobrou.

---

## 1-B. Autorizações e ambiente já verificado

**O dono autorizou expressamente (20/08/2026):**
- ✅ Rodar os comandos SSH na VPS
- ✅ Apagar o recurso Postgres `rotadeataque-prospector` no Dokploy (passo 1.14) — **TEM DADOS** (132 tabelas), mas o dump existe
- ✅ Usar a API key do Dokploy

**Ambiente já conferido:**

| Item | Estado |
|---|---|
| SSH `root@187.127.249.22` | funciona (chave `~/.ssh/id_rsa`) |
| API key do Dokploy | válida (`http://127.0.0.1:3100/api`) |
| `gh` CLI | autenticado como `leoalvespak-alt` (**sem** scope `packages`) |
| `rota-de-ataque-plataforma` | repositório **público** |
| `gazetacon` | repositório **privado** |
| `gazeta.rotadeataque.com.br` DNS | ✅ resolve para `187.127.249.22`, sem Cloudflare proxy |
| `design.rotadeataque.com.br` nginx | ✅ vhost com `location ^~ /prospector → 127.0.0.1:3010` |

---

## ESTADO CONSOLIDADO DAS FASES

### ✅ FASE 0 — CONCLUÍDA

Traefik em 8080/8443, painel em 3100, nginx ativo, PM2 7/7 online com systemd startup.
3/4 URLs = 200.

**Pendência externa (para o dono):** `notes-api.rotadeataque.com.br` = NXDOMAIN.
Precisa de registro A → `187.127.249.22` no Cloudflare.

### 🔶 FASE 1 — Prospector (parcial)

**Concluído:**
- 1.1-1.7: .gitignore, commit, env_file removido (5x), `docker-compose.dokploy.yml` criado,
  imports do `ui-bridge` corrigidos, YAML validado
- 1.8: PR #7 merged → origin/main = `5396536`
- 1.11-1.13: Dokploy API configurado (`branch=main`, `composePath=docker/docker-compose.dokploy.yml`,
  `autoDeploy=false`, env vars confirmados ok)
- `plataforma-ci` (CI quality): ✅ PASSED (lint, typecheck, tests, build, migrations, e2e)

### 🔶 FASE 2 — Gazeta (parcial)

**Concluído (repo):**
- 2.1: `next.config.mjs` deletado, `next.config.ts` consolidado com `output: 'standalone'`
- 2.2: `.github/workflows/dokploy-ci.yml` deletado
- 2.3-2.4: Build local OK, push em `master` feito

**A verificar na VPS/Dokploy (agente reportou ter feito — confirmar):**
- 2.5: `dockerfile: "Dockerfile"` configurado no app
- 2.6: Porta `3020 → 3000` publicada
- 2.8: Vhost nginx `gazeta.rotadeataque.com.br` + certbot
- 2.8-b: `NEXT_PUBLIC_SITE_URL=https://gazeta.rotadeataque.com.br` no env
- 2.9: Deploy disparado e sucesso

### 🔶 FASE 3 — Design System (parcial)

**Concluído:**
- 3.1: Gitlink `plataforma` removido do index, adicionado ao `.gitignore`
- 3.3-3.4: 388 deleções commitadas e pushadas (commit `ebf9b93`)

### 🔶 FASE 4 — Documentação (parcial)

**Concluído (working tree, falta commit):**
- 4.1: `docs/DEPLOY-DOKPLOY.md` reescrito
- 4.2: `docs/README.md` e `docs/DESIGN-SYSTEM.md` atualizados
- CLAUDE.md, AGENTS.md, GEMINI.md: regras de escrita de arquivo adicionadas
- 4.3: `.githooks/pre-commit` criado (rejeita chars de controle)

### ❓ FASE 5 — Plataforma 2.0 skeleton

**Concluído:**
- 5.1: `Dockerfile` existe no branch `codex/auth-proxy-safe-vps`

**A verificar no Dokploy (agente reportou ter feito — confirmar):**
- 5.2: App `plataforma2` configurado (repo, branch, buildType, porta 3030)

---

## 2. O QUE FALTA FAZER — EM ORDEM

### ETAPA A — Fix do Dockerfile.web (BLOQUEIO CRÍTICO da Fase 1)

**Problema:** o workflow `deploy.yml` (`Dokploy CI/CD Design System`) builda 4 imagens
em sequência. A primeira — Design Web, via `apps/design-system/Dockerfile.web` — falha com:

```
ERR_PNPM_LOCKFILE_CONFIG_MISMATCH  Cannot proceed with the frozen installation.
The current "settings.autoInstallPeers" configuration doesn't match the value found in the lockfile
```

**Causa:** o `Dockerfile.web` não copia `.npmrc` (que define `auto-install-peers=false`).
O `Dockerfile.api` copia e funciona. O `apps/web/Dockerfile` (Prospector) faz `COPY . .`
e também funciona. Só o `Dockerfile.web` está errado.

**Fix:** em `plataforma/apps/design-system/Dockerfile.web`, adicionar `.npmrc` ao COPY:

```dockerfile
FROM node:22-alpine AS build

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/design-system/package.json ./apps/design-system/
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/

RUN corepack enable pnpm && pnpm install --frozen-lockfile

COPY apps/design-system/ ./apps/design-system/
RUN corepack enable pnpm && pnpm --filter design-system run build

FROM nginx:alpine
COPY --from=build /app/apps/design-system/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Depois do fix:**

```bash
git add apps/design-system/Dockerfile.web
git commit -m "fix(deploy): copy .npmrc into Dockerfile.web for pnpm lockfile compat"
git push origin main
```

> **Nota:** como `main` é protegida (exige PR + checks), pode ser necessário criar um
> branch, abrir PR, esperar os checks passarem e fazer merge — igual ao PR #7.

Aguardar o GitHub Actions rodar o `deploy.yml` até o fim (4 imagens publicadas no GHCR).

### ETAPA B — Liberar pull das imagens GHCR (pode precisar do dono)

Depois que o Actions publicar as imagens, testar na VPS:

```bash
docker pull ghcr.io/leoalvespak-alt/prospector-platform-web:latest
```

- **Funcionou?** Seguir para a etapa C.
- **`denied`?** O dono precisa abrir estes links e em cada um:
  **Danger Zone → Change visibility → Public**:
  1. `https://github.com/users/leoalvespak-alt/packages/container/prospector-platform-web/settings`
  2. `https://github.com/users/leoalvespak-alt/packages/container/prospector-platform-worker/settings`

> O repositório já é público. Tornar os pacotes públicos não expõe nada novo.

### ETAPA C — Deploy do Prospector no Dokploy

**C.1** Disparar o deploy:

```bash
ssh root@187.127.249.22
KEY=$(grep -oP '(?<=key: ")[^"]+' credenciais_dokploy.txt)
curl -s -X POST -H "x-api-key: $KEY" -H 'Content-Type: application/json' \
  -d '{"composeId":"PXQCDj9zwHR772nHRE-pu"}' \
  http://127.0.0.1:3100/api/compose.deploy
```

**C.2** Aguardar e verificar:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3010/prospector/api/health
curl -s -o /dev/null -w "%{http_code}\n" https://design.rotadeataque.com.br/prospector
```

Ambos devem retornar **200**.

**C.3** Apagar o recurso Postgres avulso `rotadeataque-prospector` (se decidido pelo dono):

O recurso tem 132 tabelas com dados. O dump mais recente está em
`/opt/prospector-platform/shared/backups/pre-migration-20260819014444`.
Se o dono confirmar que é descartável, apagar via Dokploy API ou painel.

**C.4** Restaurar o banco do dump (depois do deploy bem-sucedido):

```bash
docker ps --format '{{.Names}}' | grep -i prospector
```

```bash
cat /opt/prospector-platform/shared/backups/pre-migration-20260819014444*.dump \
  | docker exec -i CONTAINER_POSTGRES pg_restore -U prospector -d prospector -1 --no-owner --role=prospector
```

### ETAPA D — Verificar Fase 2 (Gazeta) na VPS

O agente reportou ter concluído a Fase 2 na VPS. Verificar:

```bash
ssh root@187.127.249.22
```

**D.1** Checar se o app está no ar:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3020
curl -s -o /dev/null -w "%{http_code}\n" https://gazeta.rotadeataque.com.br
```

**D.2** Se NÃO estiver no ar, executar o que faltou:

- Dokploy: setar `dockerfile: "Dockerfile"` no app `AJcua9f7P4PYRWRkO-72W`
- Dokploy: publicar porta `127.0.0.1:3020 → 3000`
- Criar vhost nginx:

```nginx
server {
  listen 80;
  server_name gazeta.rotadeataque.com.br;
  location / {
    proxy_pass http://127.0.0.1:3020;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 300s;
    client_max_body_size 25m;
  }
}
```

```bash
ln -sf /etc/nginx/sites-available/gazeta.rotadeataque.com.br /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d gazeta.rotadeataque.com.br
```

- Adicionar ao env do app: `NEXT_PUBLIC_SITE_URL=https://gazeta.rotadeataque.com.br`
- Disparar deploy

### ETAPA E — Finalizar Fase 3 (Design System)

**E.1** Deletar `.github/workflows/deploy.yml` do repo `rota-design-system` (Sistema de Design).
Ele referencia `./plataforma/...` que nunca existe no CI:

```bash
cd "Sistema de Design"
git rm .github/workflows/deploy.yml
git commit -m "chore: remove orphan deploy workflow (moved to plataforma repo)"
git push origin main
```

### ETAPA F — Finalizar Fase 4 (Documentação)

As mudanças em `docs/DEPLOY-DOKPLOY.md`, `docs/DESIGN-SYSTEM.md`, `docs/README.md` estão no
working tree mas não commitadas.

```bash
cd "Sistema de Design"
git add docs/DEPLOY-DOKPLOY.md docs/DESIGN-SYSTEM.md docs/README.md .githooks/pre-commit
git add Docs/PLANO-CORRECAO-DEPLOY-DOKPLOY.md Docs/PLANO-DE-PUBLICACAO-15-DIAS-CICLO-2.md
git commit -m "docs: update deploy docs and add pre-commit control-char guard"
git push origin main
```

### ETAPA G — Verificar Fase 5 (Plataforma 2.0 skeleton)

Verificar no Dokploy se o app `plataforma2` (`kiMKbGqJOo5cSXbMcruMv`) está configurado:

```bash
ssh root@187.127.249.22
KEY=$(grep -oP '(?<=key: ")[^"]+' credenciais_dokploy.txt)
curl -s -H "x-api-key: $KEY" "http://127.0.0.1:3100/api/application.one?applicationId=kiMKbGqJOo5cSXbMcruMv" | python3 -m json.tool | grep -E '"repository|branch|buildType|dockerfile|autoDeploy"'
```

Se não estiver configurado:
- Repository: `leoalvespak-alt/rota-de-ataque-v2`
- Branch: `codex/auth-proxy-safe-vps`
- Build Type: `Dockerfile`
- Dockerfile: `Dockerfile`
- Autodeploy: **DESLIGADO**
- Porta: `127.0.0.1:3030 → 3000`

**PROIBIDO:** apontar domínio de produção, parar PM2, ou mexer no banco `rota_ataque`.

---

## 8. Como a IA configura o Dokploy — API

A API key está em `credenciais_dokploy.txt`. Base: `http://127.0.0.1:3100/api`.
Rode sempre via SSH, nunca exponha a chave na rede.

```bash
KEY=$(grep -oP '(?<=key: ")[^"]+' credenciais_dokploy.txt)
```

### IDs já mapeados

| Recurso | ID |
|---|---|
| Project `rotadeataque` | `Z5RFUAV2CMMdkaHzYsrm_` |
| Compose `prospector` | `PXQCDj9zwHR772nHRE-pu` |
| Application `gazeta` | `AJcua9f7P4PYRWRkO-72W` |
| Application `plataforma2` | `kiMKbGqJOo5cSXbMcruMv` |
| GitHub provider | `LCtwXuLi2UlaUzOkzJ-xX` |

### Endpoints verificados

| Método | Rota | Uso |
|---|---|---|
| GET | `/api/project.all` | listar tudo |
| GET | `/api/compose.one?composeId=` | ler compose |
| POST | `/api/compose.update` | alterar branch, composePath, env |
| POST | `/api/compose.deploy` | disparar deploy |
| GET | `/api/application.one?applicationId=` | ler application |
| POST | `/api/application.update` | alterar dockerfile, etc. |
| POST | `/api/application.saveBuildType` | trocar build type |
| POST | `/api/application.saveEnvironment` | gravar env |
| POST | `/api/application.deploy` | disparar deploy |
| POST | `/api/port.create` | publicar porta |
| GET | `/api/settings.health` | healthcheck do painel |

### ⚠️ Variáveis de ambiente do Prospector: NÃO REESCREVER

O `env` do compose já contém 60+ variáveis corretas. **Regra:** leia o `env` atual,
altere **apenas** o que precisar, e regrave o texto completo. Nunca mande um `env` do zero.

**Não use** a senha de `credenciais_postgresql_dokploy.txt` no compose — ela pertence ao
recurso Postgres avulso, não ao compose.

---

## 9. O que só o dono pode fazer

| # | Tarefa | Status |
|---|---|---|
| A | API key do Dokploy | ✅ feita |
| B | Autorizar SSH | ✅ autorizado |
| C | DNS `gazeta.rotadeataque.com.br` | ✅ feito e verificado |
| E | Apagar Postgres avulso | ✅ autorizado (mas TEM DADOS — dump existe) |
| F | Variáveis de ambiente | ✅ já estavam preenchidas |
| **D** | **Liberar pull GHCR** | ⏳ só depois da Etapa A (fix do Dockerfile) |
| **G** | **DNS `notes-api.rotadeataque.com.br`** | ❌ NXDOMAIN — criar registro A → `187.127.249.22` no Cloudflare |

---

## 10. Prompt para colar no Codex / Claude Code

```
Você tem permissão total para executar o plano em
"Sistema de Design/Docs/PLANO-CORRECAO-DEPLOY-DOKPLOY.md".

Leia o plano inteiro antes de começar. As Fases 0-5 originais já foram parcialmente
executadas. O plano agora lista apenas o que falta, organizado em Etapas A-G.

O BLOQUEIO CRÍTICO é a Etapa A: o Dockerfile.web do Design System não copia .npmrc,
quebrando o deploy.yml no GitHub Actions. Comece por aí.

Regras inegociáveis:
- A seção 0 do plano é decisão fechada. Não proponha alternativas.
- Nunca grave arquivo com here-string interpolado do PowerShell.
- Valide builds antes de push.
- Não commite segredos. Os .txt de credenciais são somente leitura.
- Use a API key do Dokploy (seção 8), nunca a senha de admin.
- Na VPS, rode apenas os comandos escritos no plano.
- Fase 5 (Plataforma 2.0) é só esqueleto. PROIBIDO apontar domínio de
  produção, parar PM2 ou tocar no banco rota_ataque.
- main do plataforma é protegida — precisa de PR + checks para merge.

Ao terminar, entregue um relatório com: (1) o que foi feito por etapa,
(2) o resultado de cada verificação, (3) o que falhou e por quê,
(4) a lista da seção 9 que ainda depende de mim.
```
