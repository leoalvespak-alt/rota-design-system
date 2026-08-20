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

## Deploy (Dokploy)

Os tres projetos (Prospector, Gazeta, Design System) sao servidos via **Dokploy** na VPS `187.127.249.22:3000`.

Regras obrigatorias para agentes:
- **Nunca adicionar `env_file` no docker-compose.yml** — o Dokploy apaga a pasta inteira antes de cada deploy e injeta variaveis diretamente pelo painel.
- **Build Path no Dokploy Application deve ser `/`** (diretorio raiz) — nao o nome do arquivo Dockerfile.
- Para qualquer mudanca de infra ou deploy, consulte `Docs/DEPLOY-DOKPLOY.md` antes de agir.
- O CI/CD e via `.github/workflows/dokploy-ci.yml` — push no branch ativo dispara rebuild automatico.
- Commits de correcao de build devem mencionar o erro corrigido na mensagem.
