@C:\Users\Lenovo\.codex\RTK.md

# Documentacao obrigatoria

Antes de analisar, planejar ou alterar codigo, consulte `Docs/README.md` e os documentos Markdown do dominio afetado. Use o indice para selecionar somente os Docs relevantes; nao trate prompts, auditorias ou planos historicos como estado atual sem confronta-los com o codigo e a configuracao executavel.

Depois de qualquer ajuste que altere comportamento, arquitetura, contrato HTTP, banco, autenticacao/autorizacao, operacao, deploy, configuracao ou fluxo de usuario, atualize no mesmo trabalho os Docs canonicos relacionados. A documentacao final deve descrever o estado realmente implementado, registrar limitacoes/gates ainda pendentes e nao expor secrets, tokens, cookies, e-mails ou outros dados pessoais.

Antes de concluir:

1. confira o diff de codigo contra os Docs do dominio;
2. remova ou corrija afirmacoes que ficaram obsoletas;
3. adicione links no `Docs/README.md` quando surgir um documento canonico novo;
4. informe no resultado quais Docs foram consultados e atualizados;
5. se a documentacao nao precisar mudar, registre explicitamente a justificativa.

## CodeGraph

Em repositorios com `.codegraph/`, use CodeGraph antes de busca textual para localizar e compreender codigo. Para documentacao e nomes de arquivos conhecidos, comece pelo indice `Docs/README.md`.

## Deploy

**NUNCA e necessario abrir PR para fazer deploy. Push direto para `main` e o deploy.**

### Mapa de repositorios — qual push faz o deploy de qual projeto

| Projeto | URL | Repositorio | Acao |
|---|---|---|---|
| Design System (web + API) | design.rotadeataque.com.br | `leoalvespak-alt/rota-de-ataque-plataforma` | `git push origin main` |
| Prospector | design.rotadeataque.com.br/prospector | `leoalvespak-alt/rota-de-ataque-plataforma` | `git push origin main` |
| Plataforma 2.0 | app.rotadeataque.com.br | `leoalvespak-alt/rota-de-ataque-v2` | `git push origin main` |
| Gazeta | (URL propria) | repo Gazeta | `git push origin main` |

### Como fazer deploy apos alteracoes de codigo

```bash
# Confirme o repositorio (remote) antes de tudo:
git remote -v

# Commit e push DIRETAMENTE em main — sem branch, sem PR:
git add <arquivos>
git commit -m "fix: descricao"
git push origin main

# GitHub Actions cuida de todo o resto automaticamente.
# Acompanhe em: https://github.com/leoalvespak-alt/<repo>/actions
```

O que acontece apos o push:
- **Design System / Prospector**: CI builda imagem Docker → GHCR → SSH deploy na VPS
- **Plataforma 2.0**: CI inicia build na propria VPS (evita OOM no runner) → GHCR → Dokploy pull

### Deploy manual via SSH (reimplantar sem novo codigo)

```bash
ssh root@187.127.249.22 '/opt/rota-deploy/deploy.sh <project>'
# Projetos: design-web, design-api, prospector, gazeta, plataforma, all, status, cleanup
```

Regras:
- Push para `main` dispara CI + deploy automatico — nao precisa clicar em nada no Dokploy
- Nunca adicionar `env_file` no docker-compose.yml (compose gerenciado pelo Dokploy)
- O script de deploy da VPS cuida de: pull de imagem, restart, migrations, health check, limpeza de imagens antigas
- Manter apenas 1 imagem anterior por projeto na VPS para rollback

## Seguranca de escrita de arquivos

**Nunca use here-string interpolado do PowerShell** (`@"..."@`) nem `Set-Content` com interpolacao
para gravar codigo ou Markdown. A crase e escape e `$` e interpolacao no PowerShell — isso
**ja destruiu** `otp-rate-limit.ts` e `DEPLOY-DOKPLOY.md`. Use here-string literal (`@'...'@`),
heredoc do bash (`<<'EOF'`) ou as ferramentas de escrita do agente. Depois de gravar, valide:
`grep -nP '[\x00-\x08\x0B\x0C\x0E-\x1F]' ARQUIVO`
