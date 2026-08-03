# Arquitetura — Gerador de Criativos Rota de Ataque

## Visao Geral

SPA React 19.2 + Vite 8.2 para geracao de criativos para redes sociais com consistencia de marca.

## Estrutura de Diretorios

```
src/
  components/
    brand/           # 17 componentes brand (BrandText, BrandChart, etc.)
    layout/          # Componentes de layout (Header, Footer)
    ui/              # Componentes UI genericos (Button, Dialog, etc.)
  features/
    templates/       # Schemas Zod, renderer declarativo
    editor/          # Tiptap editor com 3 perfis
    diagrams/        # Mermaid, React Flow, SVG
    charts/          # ECharts com tema brand
    technical/       # KaTeX formulas, Shiki code
    slides/          # Modulo de slides HTML (18 tipos)
    documents/       # Modulo de documentos HTML (7 tipos)
  machines/          # XState state machines
  lib/
    animation/       # Motion tokens, GSAP utilities
    export/          # Exportadores (PNG, JPEG, HTML, PPTX)
    ai/              # Providers de IA (DeepSeek, Fal)
    validation/      # Validacao visual (overflow, contraste, safe area)
    observability/   # Logger, metrics, Sentry
  server/
    images/          # Sharp image processing
    render/          # Playwright server-side rendering
    storage/         # MinIO storage adapter
    queue/           # BullMQ job queues
  db/                # Drizzle schemas (20 tabelas)
  tokens/            # Style Dictionary tokens
  stores/            # Zustand stores
  test/              # Setup de testes
```

## Stack Principal

| Camada | Tecnologia |
|--------|-----------|
| UI | React 19.2, Tailwind CSS |
| Build | Vite 8.2 |
| Estado | Zustand + XState 5 |
| Editor | Tiptap |
| Tokens | Style Dictionary |
| Graficos | ECharts |
| Diagramas | Mermaid, React Flow, D3 |
| Animacoes | Motion, GSAP |
| Export | html-to-image, PptxGenJS |
| Rendering | Playwright (server), html-to-image (client) |
| Imagens | Sharp |
| IA | DeepSeek (texto), Fal.ai (imagem) |
| DB | PostgreSQL + Drizzle ORM |
| Storage | MinIO (S3-compativel) |
| Filas | Redis + BullMQ |
| Observabilidade | Sentry + logger estruturado |
| Testes | Vitest, Playwright, axe-core |
| Documentacao | Storybook 10 |

## Decisoes Arquiteturais

1. **Manter Vite**: Evitar quebrar 26 templates funcionais. Arquitetura preparada para futura migracao Next.js.
2. **Drizzle sobre Prisma**: Mais leve para deploy self-hosted em VPS.
3. **MinIO sobre S3**: Storage S3-compativel auto-hospedado.
4. **Playwright sobre html2canvas**: Rendering profissional server-side com html-to-image como fallback client-side.
5. **CSS Cascade Layers**: Ordem de especificidade previsivel sem `!important`.

## Fluxo de Dados

```
Usuario seleciona template
  -> XState: idle -> editing
  -> Zustand: armazena dados do formulario
  -> IA gera texto/imagem (opcional)
  -> Validacao visual (overflow, contraste, safe area)
  -> Rendering (Playwright ou html-to-image)
  -> Export (PNG/JPEG/HTML/PPTX)
  -> XState: completed
```
