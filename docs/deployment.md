# Deploy

## Pre-requisitos

- Node.js 20+
- Docker e Docker Compose (para servicos)
- VPS com acesso SSH

## Servicos (Docker Compose)

```bash
docker compose up -d
```

Inicia:
- **PostgreSQL 16** — porta 5432
- **Redis 7** — porta 6379
- **MinIO** — porta 9000 (API), 9001 (Console)

## Variaveis de Ambiente

Copie `.env.example` para `.env` e configure:

```env
# Banco de dados
DATABASE_URL=postgresql://user:password@localhost:5432/rotadeataque

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# IA (opcional)
DEEPSEEK_API_KEY=sk-...
FAL_API_KEY=...

# Observabilidade (opcional)
VITE_SENTRY_DSN=https://...@sentry.io/...
```

## Build

```bash
npm run build         # Build de producao
npm run preview       # Preview local do build
```

## Migracao de Banco

```bash
npx drizzle-kit generate   # Gerar SQL de migracao
npx drizzle-kit push        # Aplicar ao banco
```

## Storybook

```bash
npm run storybook          # Dev mode
npm run build-storybook    # Build estatico
```

## Seguranca

- Nunca commitar `.env`
- API keys apenas via variaveis de ambiente
- MinIO com credenciais fortes em producao
- PostgreSQL com senha forte e SSL em producao
