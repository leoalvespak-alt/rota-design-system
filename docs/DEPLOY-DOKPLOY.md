# Deploy — Infraestrutura Dokploy (Rota de Ataque)

> Documento canônico de deploy dos três sistemas da Rota de Ataque via Dokploy.
> Estado: implementado e verificado em 20/08/2026.

## Visão geral

Todos os três projetos são servidos na mesma VPS (187.127.249.22) pelo **Dokploy** (v0.30.2), que gerencia build, containers, Traefik (reverso) e healthchecks.

| Projeto | Tipo no Dokploy | Repo GitHub | Branch ativo |
|---|---|---|---|
| **Prospector** (plataforma) | Compose | leoalvespak-alt/rota-de-ataque-plataforma | eat/ui-ux-prospector-completion |
| **Gazeta** (blog/conteúdo) | Application | leoalvespak-alt/gazetacon | master |
| **Design System** | Application | leoalvespak-alt/rota-de-ataque-v2 | codex/auth-proxy-safe-vps |

---

## Acesso ao Dokploy

- **URL:** http://187.127.249.22:3000
- **Conta:** admin (criada pelo proprietário)
- **SSH para emergências:** ssh root@187.127.249.22 (chave em ~/.ssh/id_rsa)

---

## Prospector — Tipo: Compose

### Configuração no Dokploy
- **Provider:** GitHub → leoalvespak-alt/rota-de-ataque-plataforma
- **Branch:** eat/ui-ux-prospector-completion
- **Compose Path:** docker/docker-compose.yml
- **Autodeploy:** ativo (push dispara rebuild)

### Variáveis de ambiente (aba Environment do Dokploy)
Preencher no painel — **nunca usar env_file no docker-compose.yml** pois o Dokploy apaga a pasta antes de cada deploy:

`
DATABASE_URL=postgresql://prospector:YOUR_PASSWORD@postgres:5432/prospector
REDIS_URL=redis://redis:6379
APP_URL=https://prospector.rotadeataque.com.br
META_API_VERSION=v21.0
META_APP_SECRET=YOUR_VALUE
META_WEBHOOK_VERIFY_TOKEN=YOUR_VALUE
EMBEDDINGS_PROVIDER=local
EMBEDDINGS_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
EMBEDDINGS_ENDPOINT=http://tei:8080
EMBEDDING_DIM=384
TOKEN_ENCRYPTION_KEY=YOUR_32_CHAR_MIN_VALUE
WORKERS_DEFAULT_ENABLED=false
OTP_SECRET=YOUR_VALUE
RESEND_API_KEY=YOUR_VALUE
RESEND_FROM=no-reply@rotadeataque.com.br
NODE_ENV=production
`

### Restore do banco após deploy
Existe backup em /opt/prospector-platform/shared/backups/ na VPS. Para restaurar:
`ash
# 1. Identificar o container do postgres do Compose
docker ps | grep prospector

# 2. Restaurar o dump
cat /opt/prospector-platform/shared/backups/NOME_DO_ARQUIVO.dump \
  | docker exec -i CONTAINER_POSTGRES \
    pg_restore -U prospector -d prospector -1 --no-owner --role=prospector
`

---

## Gazeta — Tipo: Application

### Configuração no Dokploy
- **Provider:** GitHub → leoalvespak-alt/gazetacon
- **Branch:** master
- **Build Type:** Dockerfile
- **Build Path:** / (raiz — **não** /Dockerfile)
- **Autodeploy:** ativo

### Variáveis de ambiente
Preencher na aba Environment do Dokploy (sem valores aqui).

---

## Design System — Tipo: Application

### Configuração no Dokploy
- **Provider:** GitHub → leoalvespak-alt/rota-de-ataque-v2
- **Branch:** codex/auth-proxy-safe-vps
- **Build Type:** Dockerfile
- **Build Path:** / (raiz)
- **Autodeploy:** ativo

---

## CI/CD

Cada projeto possui .github/workflows/dokploy-ci.yml que aciona o webhook do Dokploy em cada push, disparando rebuild automático.

---

## Monitoramento

No painel do Dokploy, cada projeto tem as abas:
- **Deployments** — histórico e logs de cada deploy
- **Logs** — logs em tempo real dos containers
- **Containers** — status de saúde de cada container

---

## Troubleshooting

| Problema | Causa | Solução |
|---|---|---|
| env_file not found no Compose | O Dokploy apaga a pasta antes do deploy | Remover env_file do docker-compose.yml; usar aba Environment |
| Gazeta: Build Path erro | Campo deve ser /, não /Dockerfile | Colocar só / no campo Build Path |
| Build cancelado após ~14 min | Timeout da VPS com CPU 100% | Aguardar e tentar de novo; builds longos são normais na primeira vez |
| Container sem log na aba Logs | Container ainda não subiu | Esperar o deploy concluir; verificar aba Deployments |
| pnpm-lock.yaml not found | Dockerfile pedindo pnpm em projeto npm | Usar 
pm ci no Dockerfile em vez de pnpm i --frozen-lockfile |
