Your operating instructions and project conventions are located in the `CLAUDE.md` file in the root of this repository.

You MUST read `CLAUDE.md` entirely before executing any commands, creating files, or answering queries. Do not make assumptions about the folder structure or project rules without reading it first.

Before modifying code, consult the project's documentation in the `Docs/` folder. After changes, update the relevant docs in the same work unit.

Always reply to the user in **pt-BR (Brazilian Portuguese)**.

For deploy and infrastructure questions, consult `Docs/DEPLOY-DOKPLOY.md`. The three projects (Prospector, Gazeta, Design System) are deployed via Dokploy on VPS `187.127.249.22:3100`.

# File writing safety

**Never use PowerShell interpolated here-strings** (`@"..."@`) or `Set-Content` with interpolation
to write code or Markdown. Backtick is escape and `$` is interpolation in PowerShell — this
**has already destroyed** `otp-rate-limit.ts` and `DEPLOY-DOKPLOY.md`. Use literal here-strings
(`@'...'@`), bash heredocs (`<<'EOF'`), or the agent's file-writing tools. After writing,
validate: `grep -nP '[\x00-\x08\x0B\x0C\x0E-\x1F]' FILE`
