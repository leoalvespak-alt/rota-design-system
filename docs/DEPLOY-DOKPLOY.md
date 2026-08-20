# Deploy — Infraestrutura Dokploy (Rota de Ataque)

> Documento canonico de deploy dos tres sistemas da Rota de Ataque via Dokploy.
> Estado implementado e verificado em 20/08/2026.

## Visao geral

Todos os tres projetos sao servidos na mesma VPS (`187.127.249.22`) pelo **Dokploy** (v0.30.2),
que gerencia build, containers, Traefik (reverso) e healthchecks. O nginx externo funciona
como edge (portas 80/443), mantendo todos os certificados TLS existentes.

### Mapa de portas

| Porta | Quem ocupa | Estado |
|---|---|---|
| 80 / 443 | **nginx** (edge, todos os dominios) | ativo |
| 3000 | `rota-frontend` (Plataforma 2.0, PM2) | ativo via PM2 |
| 3001 | `deriva-pwa` | ativo via PM2 |
| 3002 | `rota-design-api` | ativo via PM2 |
| **3010** | **Prospector web (Dokploy)** | compose no Dokploy |
| **3020** | **Gazeta (Dokploy)** | app no Dokploy |
| **3030** | **Plataforma 2.0 (Dokploy, skeleton)** | app no Dokploy (nao em producao) |
| **3100** | **painel Dokploy** | movido da 3000 |
| 8080 / 8443 | Traefik do Dokploy | reverso interno |
| 8081 / 8083 / 8092 | gateways legados (notes, study-room, editorial-api) | ativos via PM2 |

---

## Acesso ao Dokploy

- **URL:** http://187.127.249.22:3100
- **Conta:** admin (criada pelo proprietario)
- **API key:** em `credenciais_dokploy.txt` — usar sempre via API (`x-api-key`), nunca senha de admin
- **SSH para emergencias:** ssh root@187.127.249.22 (chave em ~/.ssh/id_rsa)

---

## Prospector — Tipo: Compose

- **Repo:** `leoalvespak-alt/rota-de-ataque-plataforma`
- **Branch:** `main`
- **Compose Path:** `docker/docker-compose.dokploy.yml`
- **Autodeploy:** desligado (deploy manual apos GitHub Actions publicar imagens)
- **Porta publicada:** `127.0.0.1:3010 -> 3000` (acesso via nginx em `design.rotadeataque.com.br/prospector`)

### Configuracao do Dokploy (via API)

| Campo | Valor |
|---|---|
| `composeId` | `PXQCDj9zwHR772nHRE-pu` |
| `branch` | `main` |
| `composePath` | `docker/docker-compose.dokploy.yml` |
| `autoDeploy` | `false` |

### Variaveis de ambiente

Preencher no painel do Dokploy (aba Environment) — **nunca usar env_file no docker-compose.yml**,
pois o Dokploy apaga a pasta antes de cada deploy e injeta as variaveis diretamente.

Variaveis obrigatorias confirmadas:
```
APP_URL=https://design.rotadeataque.com.br/prospector
NEXTAUTH_URL=https://design.rotadeataque.com.br/prospector
NEXT_PUBLIC_BASE_PATH=/prospector
WORKERS_DEFAULT_ENABLED=false
```

### Banco de dados

O compose do Prospector inclui seu proprio Postgres (`pgvector/pgvector:pg16`) e Redis.
A extensao `pgvector` e obrigatoria — a imagem `postgres:18` do recurso avulso do Dokploy nao a tem.

### Restore do banco

Backups em `/opt/prospector-platform/shared/backups/` na VPS.

```bash
# 1. Identificar o container do postgres do Compose
docker ps | grep prospector

# 2. Restaurar o dump
cat /opt/prospector-platform/shared/backups/pre-migration-20260818043423-83a41fa7.dump \
  | docker exec -i CONTAINER_POSTGRES \
    pg_restore -U prospector -d prospector -1 --no-owner --role=prospector
```

---

## Gazeta — Tipo: Application

- **Repo:** `leoalvespak-alt/gazetacon` (privado)
- **Branch:** `master`
- **Build Type:** Dockerfile
- **Dockerfile:** `Dockerfile` (nao vazio)
- **Docker Context Path:** vazio
- **Autodeploy:** ativo (push no master dispara rebuild)
- **Porta publicada:** `127.0.0.1:3020 -> 3000` (acesso via nginx em `gazeta.rotadeataque.com.br`)

### Configuracao do Dokploy (via API)

| Campo | Valor |
|---|---|
| `applicationId` | `AJcua9f7P4PYRWRkO-72W` |
| `dockerfile` | `Dockerfile` |
| `dockerContextPath` | (vazio) |
| `buildType` | `dockerfile` |

### Variaveis de ambiente

Preencher na aba Environment do Dokploy. Variavel obrigatoria:
```
NEXT_PUBLIC_SITE_URL=https://gazeta.rotadeataque.com.br
```

### nginx vhost

`/etc/nginx/sites-available/gazeta.rotadeataque.com.br` — proxy para `127.0.0.1:3020`.

---

## Plataforma 2.0 — Tipo: Application (skeleton, NAO em producao)

- **Repo:** `leoalvespak-alt/rota-de-ataque-v2`
- **Branch:** `codex/auth-proxy-safe-vps`
- **Build Type:** Dockerfile
- **Dockerfile:** `Dockerfile`
- **Autodeploy:** desligado
- **Porta publicada:** `127.0.0.1:3030 -> 3000`

### Configuracao do Dokploy (via API)

| Campo | Valor |
|---|---|
| `applicationId` | `kiMKbGqJOo5cSXbMcruMv` |
| `dockerfile` | `Dockerfile` |
| `buildType` | `dockerfile` |

### restricoes

- **PROIBIDO** apontar qualquer dominio de producao (app., admin., fox., etc.) para este app
- **PROIBIDO** parar o PM2 ou mexer no banco `rota_ataque`
- Para testes, usar `dev-v2.rotadeataque.com.br` (se configurado)

---

## Design System

O Design System **nao esta no Dokploy** nesta rodada. Ele e servido pelo nginx estatico
em `/var/www/design-rota-ataque`, acessivel em `design.rotadeataque.com.br`. O codigo fonte
migrou para `plataforma/apps/design-system/` no repo `rota-de-ataque-plataforma`.

---

## CI/CD

| Projeto | Workflow | Trigger |
|---|---|---|
| Prospector | `.github/workflows/deploy.yml` em `rota-de-ataque-plataforma` | push em `main` |
| Gazeta | webhook do Dokploy (GitHub App) | push em `master` |
| Plataforma 2.0 | (nenhum — deploy manual) | manual |

---

## Monitoramento

No painel do Dokploy (http://187.127.249.22:3100), cada projeto tem as abas:
- **Deployments** — historico e logs de cada deploy
- **Logs** — logs em tempo real dos containers
- **Containers** — status de saude de cada container

Logs de deploy na VPS: `/etc/dokploy/logs/<appName>/`
Codigo clonado pelo Dokploy: `/etc/dokploy/compose/<appName>/code/`

---

## Troubleshooting

| Problema | Causa | Solucao |
|---|---|---|
| env_file not found no Compose | O Dokploy apaga a pasta antes do deploy | Remover env_file do docker-compose.yml; usar aba Environment |
| Build cancelado apos ~14 min | Timeout da VPS com CPU 100% | Aguardar e tentar de novo; builds longos sao normais na primeira vez |
| Container sem log na aba Logs | Container ainda nao subiu | Esperar o deploy concluir; verificar aba Deployments |
| deploy automatico dispara antes da imagem pronta | autoDeploy ligado antes do GH Actions terminar | Manter autoDeploy desligado; disparar deploy manual apos imagem publicada |
| Caractere de controle em arquivo | Here-string interpolado do PowerShell | Usar here-string literal (@'...'@), heredoc bash (<<'EOF'), ou ferramentas de escrita do agente |
