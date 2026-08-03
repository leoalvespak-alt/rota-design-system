# Modelo de Dados

## Tecnologia

- **ORM**: Drizzle ORM
- **Banco**: PostgreSQL 16
- **Schema**: `src/db/schema.ts`
- **Config**: `drizzle.config.ts`

## Tabelas (20)

### Core
- **users** — Usuarios do sistema
- **brands** — Marcas/identidades visuais
- **brandTokens** — Tokens de design por marca

### Templates
- **templates** — Definicoes de templates
- **templateVersions** — Versionamento de templates

### Criativos
- **creatives** — Criativos gerados
- **creativeVersions** — Versoes de criativos

### Slides & Documentos
- **decks** — Apresentacoes
- **slides** — Slides individuais
- **documents** — Documentos
- **documentPages** — Paginas de documentos

### Assets
- **assets** — Arquivos (imagens, fontes)
- **assetVariants** — Variacoes processadas (thumbnails, crops)

### Rendering & Export
- **renders** — Jobs de renderizacao
- **exports** — Exportacoes geradas

### IA
- **aiProviders** — Configuracao de providers
- **aiGenerations** — Historico de geracoes

### Sistema
- **settings** — Configuracoes key-value
- **auditLogs** — Log de auditoria

## Migracao

```bash
npx drizzle-kit generate   # Gerar migrations
npx drizzle-kit push        # Aplicar ao banco
npx drizzle-kit studio      # UI de exploracao
```

## Docker Compose

```bash
docker compose up -d   # PostgreSQL, Redis, MinIO
```
