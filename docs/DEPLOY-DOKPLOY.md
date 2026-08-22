# Deploy — GitHub Actions, VPS e Dokploy

> Documento canonico de deploy dos projetos Rota de Ataque.
> Estado auditado na configuracao executavel e na VPS em 22/08/2026.

## Arquitetura em producao

Os tres projetos usam a mesma VPS, mas nao usam o mesmo mecanismo de ativacao.

| Projeto | Repositorio | Build | Ativacao em producao |
|---|---|---|---|
| Design System (web + API) | `leoalvespak-alt/rota-de-ataque-plataforma` | GitHub Actions, imagens no GHCR | web estatico no nginx; API em Docker via systemd |
| Prospector | `leoalvespak-alt/rota-de-ataque-plataforma` | GitHub Actions, imagens no GHCR | Compose gerenciado pelo Dokploy |
| Plataforma 2.0 | `leoalvespak-alt/rota-de-ataque-v2` | na VPS, iniciado pelo GitHub Actions; imagem no GHCR | release extraida da imagem e processos PM2 |

A Plataforma 2.0 de producao **nao** roda no application legado do Dokploy. O nginx aponta
`app.rotadeataque.com.br` para o frontend PM2 em `127.0.0.1:3000`. O recurso Dokploy na
porta 3030 e apenas legado/inativo e nao deve ser acionado pelo CI.

### Portas relevantes

| Porta | Servico |
|---|---|
| 80 / 443 | nginx, edge TLS dos dominios |
| 3000 | Plataforma 2.0, PM2 (`rota-frontend`) |
| 3002 | Design API, systemd + Docker |
| 3010 | Prospector web, Dokploy Compose |
| 3020 | Gazeta, Dokploy Application (fora do escopo destes tres projetos) |
| 3030 | application legado/inativo da Plataforma 2.0 |
| 3100 | painel/API local do Dokploy |
| 8080 / 8443 | Traefik interno do Dokploy |

## Fluxo automatico

### Design System e Prospector

Um push em `main` do repositorio `rota-de-ataque-plataforma` executa
`.github/workflows/deploy.yml`:

1. builda e publica quatro imagens (`rota-design-web`, `rota-design-api`,
   `prospector-platform-web` e `prospector-platform-worker`);
2. abre uma unica sessao SSH com keepalive;
3. executa `/opt/rota-deploy/deploy.sh design-prospector` sob lock global;
4. aplica as migrations antes de substituir os processos;
5. exige que a API/containers estejam usando as imagens novas e que os health checks retornem 200.

Falha de migration, chamada do Dokploy, troca de imagem ou health check encerra o workflow com
erro. Nao existe mais o comportamento de registrar `WARN` e deixar o deploy verde.

As migrations do Design usam checksum canonico com fim de linha LF. Um checksum historico que
difere somente por LF/CRLF e reconciliado uma vez; qualquer mudanca real no SQL aplicado continua
bloqueando o deploy. As migrations do Prospector sao executadas pelo profile `tools` no diretorio
materializado pelo Dokploy em `/etc/dokploy/compose/.../code/docker`.

### Plataforma 2.0

Um push em `main` do repositorio `rota-de-ataque-v2` executa
`.github/workflows/dokploy-ci.yml`:

1. o runner envia um `git archive` do commit exato para `/srv/rota-ci/`;
2. a VPS verifica espaco e builda a imagem com memoria + swap locais, fora do limite de cgroup do runner;
3. a imagem recebe label com o SHA completo, e a label e verificada antes do push ao GHCR;
4. `/opt/rota-deploy/deploy.sh plataforma-v2 <tag>` extrai o artefato para uma release imutavel;
5. `scripts/vps/activate-release.sh` aplica schema, troca `current`, reinicia frontend/workers PM2
   e executa as verificacoes de consistencia e saude.

O build nao deve voltar ao runner hospedado padrao: esse caminho excedeu repetidamente o limite
de memoria da cgroup, mesmo com swap criada no host. Na VPS, heap Node de 8 GiB e suportado pela
RAM + swap e ja superou a fase de compilacao que falhava com 4 GiB.

## Script central da VPS

O arquivo versionado e `plataforma/deploy/rota-deploy.sh`; a copia operacional fica em
`/opt/rota-deploy/deploy.sh`, modo `755`. Os deploys compartilham
`/run/lock/rota-deploy.lock`, evitando builds/ativacoes concorrentes entre repositorios.

Configuracao sensivel nao fica no script. Ela e lida de `/etc/rota-deploy.env`, que deve pertencer
a `root:root`, modo `600`, e conter somente as variaveis necessarias:

```text
DOKPLOY_API_KEY=...
DESIGN_DATABASE_URL=...
```

Nunca imprimir esse arquivo, copiar seus valores para logs, Docs ou Git, nem passar segredos na
linha de comando. O token temporario do GHCR usado pela Plataforma 2.0 chega ao helper pela entrada
padrao e usa um `DOCKER_CONFIG` temporario fora do contexto de build.

Comandos operacionais:

```bash
/opt/rota-deploy/deploy.sh design-prospector
/opt/rota-deploy/deploy.sh design-web
/opt/rota-deploy/deploy.sh design-api
/opt/rota-deploy/deploy.sh prospector
/opt/rota-deploy/deploy.sh plataforma-v2 <tag-imutavel>
/opt/rota-deploy/deploy.sh status
/opt/rota-deploy/deploy.sh cleanup
```

`status` inclui a Gazeta para observabilidade manual. Os deploys dos tres projetos nao dependem
da saude da Gazeta; cada fluxo valida apenas os servicos que acabou de alterar.

## Contrato do Compose do Prospector

O Compose canonico e `docker/docker-compose.dokploy.yml`. O Dokploy materializa as variaveis do
painel no arquivo `.env` do checkout e, por isso, o servico web usa `env_file: .env`. Essa entrada
e intencional e nao deve ser removida. Nao adicionar caminhos de env locais, arquivos de credenciais
ou valores sensiveis ao repositorio.

O Postgres `pgvector/pgvector:pg16` e o Redis pertencem ao proprio Compose. O Design API acessa o
schema `design` nesse Postgres por configuracao externa; nenhuma URL ou senha de banco e canonica
em Markdown.

## Deploy e verificacao

Nao e necessario PR para deploy. Depois de validar o repositorio correto:

```bash
git remote -v
git add <arquivos-do-ajuste>
git commit -m "fix: descricao"
git push origin main
```

Monitorar:

- Design System/Prospector: `https://github.com/leoalvespak-alt/rota-de-ataque-plataforma/actions`
- Plataforma 2.0: `https://github.com/leoalvespak-alt/rota-de-ataque-v2/actions`

Ao final, confirmar o SHA/release ativado e os health checks, nao apenas o status verde do job.
Um `200` isolado nao prova deploy novo: Design API e Prospector verificam o ID da imagem; Plataforma
2.0 verifica a label do SHA, o `current` e o cwd dos processos PM2.

## Troubleshooting

| Sintoma | Verificacao/acao |
|---|---|
| SSH retorna `Permission denied` ao executar o script | `stat /opt/rota-deploy/deploy.sh`; restaurar modo `755` |
| Build V2 morre e logs desaparecem no runner | confirmar que o workflow envia o build para a VPS; nao tentar resolver com swap do runner |
| Build V2 sem espaco | verificar `/var/lib/docker`; o helper poda cache antigo abaixo de 20 GiB e aborta abaixo de 12 GiB |
| Migration do Design acusa checksum | distinguir LF/CRLF de alteracao real; nunca sobrescrever o ledger manualmente sem comparar o SQL |
| Migration do Prospector nao avanca | verificar o compose real sob `/etc/dokploy/compose/` e executar o profile `tools`; falha deve deixar o job vermelho |
| Prospector continua na imagem anterior | verificar os IDs dos containers web e worker e os logs da chamada `compose.deploy` |
| Plataforma 2.0 retorna 502 | conferir `readlink -f /srv/rota-ataque/frontend/current`, `pm2 status` e porta 3000 |
| API do Design retorna 502 | conferir `systemctl status rota-design-api.service` e o container `rota-design-api` |

## Limitacoes e gates

- Migrations devem continuar compativeis com a versao anterior durante a janela entre migration e troca de processo.
- O build da Plataforma 2.0 compartilha recursos com a producao; o lock evita concorrencia, e os gates de disco
  evitam iniciar build sem margem minima, mas o consumo de memoria/swap deve ser acompanhado nos proximos deploys.
- O application legado da Plataforma 2.0 no Dokploy nao e fonte da verdade e deve permanecer fora do fluxo automatico.
