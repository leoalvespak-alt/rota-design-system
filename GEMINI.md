Your operating instructions and project conventions are located in the `CLAUDE.md` file in the root of this repository.

You MUST read `CLAUDE.md` entirely before executing any commands, creating files, or answering queries. Do not make assumptions about the folder structure or project rules without reading it first.

Before modifying code, consult the project's documentation in the `Docs/` folder. After changes, update the relevant docs in the same work unit.

Always reply to the user in **pt-BR (Brazilian Portuguese)**.

For deploy and infrastructure questions, consult `plataforma/deploy/DEPLOY.md`.

## Deploy — regra fundamental

**NUNCA é necessario abrir PR para fazer deploy. O push direto para `main` e suficiente.**

### Mapa de repositorios

| Projeto | Repositorio | O que fazer |
|---|---|---|
| Design System + Prospector | `leoalvespak-alt/rota-de-ataque-plataforma` | `git push origin main` |
| Plataforma 2.0 | `leoalvespak-alt/rota-de-ataque-v2` | `git push origin main` |
| Gazeta | repo Gazeta | `git push origin main` |

Apos o push, GitHub Actions builda a imagem Docker, sobe para GHCR e faz SSH deploy na VPS — tudo automatico, sem cliques no Dokploy.

Verifique o andamento em: `https://github.com/leoalvespak-alt/<repo>/actions`

Via SSH (reimplantar sem novo codigo): `ssh root@187.127.249.22 '/opt/rota-deploy/deploy.sh <project>'`
Projetos: design-web, design-api, prospector, gazeta, plataforma, all, status, cleanup.

# File writing safety

**Never use PowerShell interpolated here-strings** (`@"..."@`) or `Set-Content` with interpolation
to write code or Markdown. Backtick is escape and `$` is interpolation in PowerShell — this
**has already destroyed** `otp-rate-limit.ts` and `DEPLOY-DOKPLOY.md`. Use literal here-strings
(`@'...'@`), bash heredocs (`<<'EOF'`), or the agent's file-writing tools. After writing,
validate: `grep -nP '[\x00-\x08\x0B\x0C\x0E-\x1F]' FILE`
