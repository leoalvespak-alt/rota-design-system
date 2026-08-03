# Deploy — Gerador de Criativos (Gerador-React)

Como o build é publicado no GitHub e no VPS de produção.

## Visão geral

App 100% client-side (Vite build estático). Não há servidor de API — `dist/` é
servido diretamente pelo nginx.

| Item | Valor |
|---|---|
| Repositório | `git@github.com:leoalvespak-alt/rota-design-system.git` (branch `main`) |
| VPS | `187.127.249.22` (`srv1739841.hstgr.cloud`) — compartilhado com Rota de Ataque, Gazeta Concursos e Deriva |
| Diretório no servidor | `/var/www/design-rota-ataque` |
| Domínio | `design.rotadeataque.com.br` (nginx configurado; aguardando DNS apontar para emitir o certificado SSL via certbot) |
| Config nginx | `/etc/nginx/sites-available/design.rotadeataque.com.br` |

O VPS hospeda outros serviços (containers Docker `rota-aulas-engine`,
`gazeta-n8n`, `gazeta-worker`, outros sites nginx). O deploy deste projeto só
toca em `/var/www/design-rota-ataque` e no arquivo de config nginx do próprio
domínio — nunca em outros diretórios ou containers.

## Pré-requisito único: SSH sem senha

O acesso ao VPS já funciona por chave SSH configurada nesta máquina
(`ssh root@187.127.249.22` não pede senha). O script de deploy depende disso.
A senha root do servidor (documentada em `CREDENCIAIS_VPS.txt`, na raiz de
`Sistema de Design/`) é só o fallback de emergência — **não é usada pelo
script** e não fica gravada em nenhum arquivo deste repositório.

## Configuração inicial (uma vez só)

```powershell
cd "Gerador-React"
copy deploy\.env.example deploy\.env
notepad deploy\.env   # confira/ajuste VPS_HOST, VPS_USER, VPS_TARGET_DIR, VPS_DOMAIN
```

`deploy/.env` está no `.gitignore` — nunca é commitado.

## Rodando o deploy

No **PowerShell**, a partir da pasta `Gerador-React/`:

```powershell
.\deploy\deploy.ps1
```

Isso faz, em sequência (tudo automático por padrão):
1. `npm run lint` e `npm run build` (aborta se qualquer um falhar)
2. `git add -A` + `git commit` + `git push origin main` (pula o commit se não
   houver nada para commitar; nunca cria commit vazio)
3. Empacota `dist/` num `.tar.gz`
4. Envia para `/tmp/` no VPS via `scp`
5. No servidor: apaga o conteúdo atual de `/var/www/design-rota-ataque`,
   extrai o novo build no lugar, corrige dono (`www-data`) e roda `nginx -t`
   (valida a config antes de qualquer coisa depender dela — se falhar, o
   script para e avisa, sem deixar o site quebrado)

### Variações

```powershell
# Mensagem de commit customizada
.\deploy\deploy.ps1 -Message "ajusta layout mobile do painel de controles"

# Builda e envia pro VPS, mas NÃO mexe no git (sem commit/push)
.\deploy\deploy.ps1 -NoPush

# Reenvia o dist/ já buildado, sem rodar lint/build de novo
.\deploy\deploy.ps1 -SkipBuild
```

## Depois do deploy

- Enquanto o DNS de `design.rotadeataque.com.br` não apontar para
  `187.127.249.22`, o site responde só em `http://` (porta 80).
- Assim que o DNS propagar, emitir o certificado (uma vez):
  ```bash
  ssh root@187.127.249.22
  certbot --nginx -d design.rotadeataque.com.br
  ```
  O certbot edita a config nginx automaticamente para redirecionar HTTP→HTTPS
  e passa a renovar sozinho (mesmo mecanismo já usado pelos outros domínios
  no servidor).

## Troubleshooting

| Sintoma | Causa provável |
|---|---|
| `scp` pede senha ou trava | Chave SSH não autorizada nesta máquina — rode `ssh root@187.127.249.22` manualmente uma vez para diagnosticar |
| `nginx -t` falha no final do script | Não deveria acontecer (o script só mexe nos arquivos estáticos, não na config nginx) — se acontecer, o site em produção **não foi afetado**, investigar a config existente separadamente |
| Site no ar mas mostrando versão antiga | Cache do navegador/CDN — os arquivos em `/assets/` têm `Cache-Control: immutable` por 1 ano (nomes com hash do Vite, então isso é esperado); `index.html` não tem cache longo |
| `deploy/.env não encontrado` | Rodar o passo de "Configuração inicial" acima |
