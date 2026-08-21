@C:\Users\Lenovo\.codex\RTK.md

# Language policy

The user is Brazilian (pt-BR).

| Content type | Language |
|---|---|
| Conversation, summaries, recommendations, reports | **pt-BR** |
| Code, CLI output, commit messages, filenames | **English** |
| Config files, frontmatter, one-line descriptions | **English** |

When in doubt: content the user will read → pt-BR; content tools and AI will consume → English.

# Documentation policy

Before analyzing, planning, or modifying code, consult the project's documentation:
- Look for `Docs/README.md` or equivalent index
- Read the domain-specific docs relevant to your change
- Do not treat prompts, audits, or historical plans as current state without cross-checking against the actual code and configuration

After any change that affects behavior, architecture, HTTP contracts, database, auth, operations, deploy, configuration, or user flows, update the relevant canonical docs in the same work unit. Final documentation must describe the actually implemented state, record pending limitations/gates, and never expose secrets, tokens, cookies, emails, or other personal data.

Before concluding:
1. Diff your code changes against the domain docs
2. Remove or correct statements that became obsolete
3. Add links to the docs index when a new canonical document is created
4. Report which docs were consulted and updated
5. If no doc update is needed, explicitly state why

# CodeGraph

In repositories with `.codegraph/`, use CodeGraph before textual search to locate and understand code. For documentation and known filenames, start from the docs index.

# Security

- Never commit secrets, tokens, API keys, passwords, or credentials
- Never expose personal data (emails, names, addresses) in code or docs
- Sanitize all user input at system boundaries
- Use parameterized queries for database access

# Conventions

- Prefer editing existing files over creating new ones
- Keep changes minimal and focused on the task
- Write tests for new functionality when the project has a test suite
- Follow existing code patterns and naming conventions in the project

# Deploy

**Regra fundamental: NUNCA é necessário abrir PR para fazer deploy. Basta fazer `git push origin main` no repositório correto. O CI/CD cuida do resto automaticamente.**

## Mapa de repositórios e projetos

| Projeto | URL | Repositório Git | Ação para deploy |
|---|---|---|---|
| Design System (web + API) | design.rotadeataque.com.br | `leoalvespak-alt/rota-de-ataque-plataforma` | `git push origin main` |
| Prospector | design.rotadeataque.com.br/prospector | `leoalvespak-alt/rota-de-ataque-plataforma` | `git push origin main` |
| Plataforma 2.0 | app.rotadeataque.com.br | `leoalvespak-alt/rota-de-ataque-v2` | `git push origin main` |
| Gazeta | (URL própria) | repo Gazeta | push → Dokploy webhook |

## O que acontece após o push

**Design System / Prospector** (`rota-de-ataque-plataforma`):
1. GitHub Actions builda imagem Docker → sobe para GHCR
2. CI faz SSH na VPS e executa `/opt/rota-deploy/deploy.sh`
3. Deploy concluído — sem PR, sem clique manual

**Plataforma 2.0** (`rota-de-ataque-v2`):
1. GitHub Actions inicia build Docker diretamente na VPS (via nohup — evita OOM no runner)
2. VPS sobe imagem para GHCR
3. CI faz SSH e executa `/opt/rota-deploy/deploy.sh plataforma`
4. Dokploy puxa a imagem GHCR e reinicia o container

## Se o agente fez alterações no código

```bash
# 1. Confirmar em qual repositório está (olhar o remote):
git remote -v

# 2. Commit e push direto para main (SEM criar branch, SEM abrir PR):
git add -p          # ou git add <arquivos específicos>
git commit -m "fix: descrição do que mudou"
git push origin main

# 3. Aguardar o CI — GitHub Actions cuida do deploy automaticamente.
#    Monitorar em: https://github.com/leoalvespak-alt/<repo>/actions
```

**NUNCA fazer:** `git push origin feature-branch` e esperar PR — isso NÃO faz deploy.
**SEMPRE fazer:** commit e push direto em `main`.

## Deploy manual via SSH (para reimplantar sem novo código)

```bash
ssh root@187.127.249.22 '/opt/rota-deploy/deploy.sh <project>'
# Projetos: design-web, design-api, prospector, gazeta, plataforma, all, status, cleanup
```

## Regras

- Push para `main` dispara CI + deploy automático — sem cliques no Dokploy
- Nunca adicionar `env_file` no docker-compose.yml (gerenciado pelo Dokploy)
- Manter apenas 1 imagem anterior por projeto na VPS para rollback
- Para mudanças de infraestrutura, consultar `Docs/DEPLOY-DOKPLOY.md`

# File writing safety

**Never use PowerShell interpolated here-strings** (`@"..."@`) or `Set-Content` with interpolation
to write code or Markdown. Backtick is escape and `$` is interpolation in PowerShell — this
**has already destroyed** `otp-rate-limit.ts` and `DEPLOY-DOKPLOY.md`. Use literal here-strings
(`@'...'@`), bash heredocs (`<<'EOF'`), or the agent's file-writing tools. After writing,
validate: `grep -nP '[\x00-\x08\x0B\x0C\x0E-\x1F]' FILE`
