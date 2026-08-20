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

This workspace (Sistema de Design / Plataforma) is deployed via **Dokploy** on the shared VPS.
See `Docs/DEPLOY-DOKPLOY.md` for the full deployment guide covering all three projects (Prospector, Gazeta, Design System).

Key rules:
- Never add `env_file` to docker-compose.yml — Dokploy deletes the folder before each deploy and injects env vars directly via its panel.
- The **Build Path** field in Dokploy Application accepts a *directory*, not a filename. Use `/` (root), not `/Dockerfile`.
- For infrastructure changes, consult `Docs/DEPLOY-DOKPLOY.md` first.
- CI/CD is via `.github/workflows/dokploy-ci.yml` — pushes to the active branch trigger automatic deploys.

# File writing safety

**Never use PowerShell interpolated here-strings** (`@"..."@`) or `Set-Content` with interpolation
to write code or Markdown. Backtick is escape and `$` is interpolation in PowerShell — this
**has already destroyed** `otp-rate-limit.ts` and `DEPLOY-DOKPLOY.md`. Use literal here-strings
(`@'...'@`), bash heredocs (`<<'EOF'`), or the agent's file-writing tools. After writing,
validate: `grep -nP '[\x00-\x08\x0B\x0C\x0E-\x1F]' FILE`
