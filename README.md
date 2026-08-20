# Sistema de Design — Rota de Ataque

Workspace da plataforma integrada, composto pelo Design System de criação visual e pelo Prospector de inteligência/prospecção multicanal.

## Documentação

- [Índice canônico](Docs/README.md)
- [Prospector](Docs/PROSPECTOR.md)
- [Design System](Docs/DESIGN-SYSTEM.md)
- [Arquitetura unificada](Docs/ARQUITETURA-UNIFICADA.md)

## Código

O monorepo fica em `plataforma` e usa pnpm/Turborepo. Os produtos são independentes:

- `plataforma/apps/design-system`: SPA React/Vite publicada como site estático.
- `plataforma/apps/web`: dashboard Next.js do Prospector.
- `plataforma/workers`: processamento assíncrono do Prospector.
- `plataforma/packages`: contratos, banco, filas, integrações e UI compartilhada.
- `plataforma/docker` e `plataforma/deploy`: infraestrutura e publicação.

```powershell
cd plataforma
corepack enable
pnpm install
pnpm build
pnpm test
```

Use `.env.example` como referência e nunca versione credenciais. Para operação e deploy, consulte primeiro o índice de documentação.
