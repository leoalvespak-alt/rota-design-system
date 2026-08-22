Your operating instructions and project conventions are located in the `CLAUDE.md` file in the root of this repository.

You MUST read `CLAUDE.md` entirely before executing any commands, creating files, or answering queries. Do not make assumptions about the folder structure or project rules without reading it first.

Before modifying code, consult the project's documentation in the `Docs/` folder. After changes, update the relevant docs in the same work unit.

Always reply to the user in **pt-BR (Brazilian Portuguese)**.

For deploy and infrastructure questions, consult `plataforma/deploy/DEPLOY.md`.

## Deploy — regra fundamental

Push direto para `main` e suficiente em todos os repositorios — sem PR necessario.

| Projeto | Repositorio | Acao |
|---|---|---|
| Design System + Prospector | `leoalvespak-alt/rota-de-ataque-plataforma` | `git push origin main` |
| Plataforma 2.0 | `leoalvespak-alt/rota-de-ataque-v2` | `git push origin main` |
| Gazeta | repo Gazeta | `git push origin main` |

Apos o push, o fluxo e automatico. Design System/Prospector buildam no GitHub Actions e usam
Dokploy apenas para o Compose do Prospector. A Plataforma 2.0 builda na VPS, publica no GHCR e
ativa uma release imutavel via PM2; o application legado do Dokploy nao participa da producao.

- Design System/Prospector: `https://github.com/leoalvespak-alt/rota-de-ataque-plataforma/actions`
- Plataforma 2.0: `https://github.com/leoalvespak-alt/rota-de-ataque-v2/actions`

Via SSH (reimplantar sem novo codigo): `ssh root@187.127.249.22 '/opt/rota-deploy/deploy.sh <project>'`
Projetos atuais: design-web, design-api, prospector, design-prospector,
plataforma-v2 <tag>, status, cleanup.

# File writing safety

**Never use PowerShell interpolated here-strings** (`@"..."@`) or `Set-Content` with interpolation
to write code or Markdown. Backtick is escape and `$` is interpolation in PowerShell — this
**has already destroyed** `otp-rate-limit.ts` and `DEPLOY-DOKPLOY.md`. Use literal here-strings
(`@'...'@`), bash heredocs (`<<'EOF'`), or the agent's file-writing tools. After writing,
validate: `grep -nP '[\x00-\x08\x0B\x0C\x0E-\x1F]' FILE`
