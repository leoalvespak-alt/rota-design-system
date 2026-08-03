# Log de Deploy — Modernização

## Migrations (Drizzle)

- `npx drizzle-kit generate` executado localmente, offline (não requer conexão com banco).
- Gerado `drizzle/0000_young_skreet.sql` — DDL inicial das 19 tabelas do schema (`src/db/schema.ts`).
- **Nao aplicado a nenhum banco em producao**: o deploy de producao deste projeto e um site estatico (Vite build servido por nginx em `/var/www/design-rota-ataque`), sem PostgreSQL provisionado no VPS para este dominio. `deploy/.env` nao contem `DATABASE_URL` de producao.
- Quando um Postgres de producao for provisionado (ex.: via `docker-compose.yml` neste repo, adaptado para o VPS), aplicar com:
  ```bash
  DATABASE_URL="postgresql://..." npx drizzle-kit push
  # ou, para deploy controlado por SQL versionado:
  psql "$DATABASE_URL" -f drizzle/0000_young_skreet.sql
  ```
- Nenhuma migration destrutiva foi executada; nenhum dado de producao existente foi tocado.

## Deploy do site (deploy/deploy.ps1)

Ver `deploy/DEPLOY.md` para o fluxo completo. Resumo do que o script faz:
1. `npm run lint` + `npm run build`
2. `git add -A` + commit + `git push origin main`
3. Empacota `dist/` e envia via `scp` para o VPS (`187.127.249.22`)
4. No servidor: limpa `/var/www/design-rota-ataque`, extrai o novo build, ajusta dono para `www-data`, valida `nginx -t`
