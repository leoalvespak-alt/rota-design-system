# Checklist de Execucao — Modernizacao Completa

Atualizado: 2026-08-01
Status: 100% COMPLETO

---

## Fase 1: Estabilizacao e TypeScript estrito
- [x] Verificar build atual compila sem erros
- [x] Habilitar strict no tsconfig.app.json
- [x] Corrigir erros de tipo
- [x] Verificar lint sem erros
- [x] Build final limpo

## Fase 2: Design tokens com Style Dictionary
- [x] Instalar style-dictionary
- [x] Criar src/tokens/ com definicoes primitivas
- [x] Criar tokens semanticos
- [x] Criar tokens por tema (light/dark)
- [x] Criar tokens por formato
- [x] Criar tokens tipograficos
- [x] Criar tokens de espacamento
- [x] Criar tokens de grid
- [x] Criar tokens de sombra
- [x] Criar tokens de movimento
- [x] Criar tokens de safe area
- [x] Configurar build de tokens
- [x] Gerar CSS Custom Properties
- [x] Gerar TypeScript types
- [x] Gerar JSON
- [x] Migrar index.css para tokens gerados
- [x] Validar visual identico

## Fase 3: Cascade Layers e CSS moderno
- [x] Adicionar @layer declarations
- [x] Mover reset para layer reset
- [x] Mover tokens para layer tokens
- [x] Mover base para layer base
- [x] Mover utilities para layer utilities
- [x] Mover components para layer components
- [x] Mover templates para layer templates
- [x] Adicionar Container Queries nos canvas
- [x] Documentar uso de Subgrid
- [x] Validar visual identico

## Fase 4: Schemas e templates declarativos
- [x] Criar TemplateSchema com Zod
- [x] Criar SlotSchema
- [x] Criar VariantSchema
- [x] Criar ConstraintSchema
- [x] Migrar types.ts para schemas validados
- [x] Criar JSON Schema equivalente
- [x] Validar 26 templates contra schemas
- [x] Criar renderer declarativo
- [x] Documentar sistema de templates

## Fase 5: XState para fluxos
- [x] Instalar xstate
- [x] Criar creativeWorkflowMachine
- [x] Estados: idle, editing, generating-copy, generating-image, validating, rendering, exporting, completed, failed
- [x] Integrar com Zustand stores
- [x] Testes de transicoes

## Fase 6: Editor Tiptap
- [x] Instalar @tiptap/react e extensoes
- [x] Criar TitleEditor (perfil restrito)
- [x] Criar BodyEditor (perfil padrao)
- [x] Criar TechnicalEditor (perfil completo)
- [x] Implementar sanitizacao
- [x] Implementar limites por slot
- [x] Implementar undo/redo
- [x] Implementar autosave
- [x] Implementar atalhos
- [x] Migrar EditableText para Tiptap
- [x] Testes de edicao

## Fase 7: Componentes brand
- [x] Criar BrandText
- [x] Criar BrandBadge
- [x] Criar BrandDivider
- [x] Criar BrandImageFrame
- [x] Criar BrandCallout
- [x] Criar BrandQuote
- [x] Criar BrandTable
- [x] Criar BrandTimeline
- [x] Criar BrandComparison
- [x] Criar BrandProcess
- [x] Criar BrandFormula
- [x] Criar BrandCodeBlock
- [x] Criar BrandDiagram
- [x] Criar BrandChart
- [x] Criar CreativeCanvas
- [x] Criar SlideCanvas
- [x] Criar DocumentCanvas
- [x] Criar TemplateRenderer
- [x] Criar SlotRenderer

## Fase 8: Storybook
- [x] Instalar @storybook/react-vite
- [x] Configurar .storybook/
- [x] Stories para componentes UI
- [x] Stories para componentes brand
- [x] Stories para templates (todos os 26)
- [x] Stories para estados (vazio, carregando, erro)
- [x] Stories para temas (light/dark)
- [x] Stories para formatos
- [x] Configurar testes visuais Playwright
- [x] Validar build do Storybook

## Fase 9: Diagramas
- [x] Instalar @xyflow/react (React Flow)
- [x] Instalar elkjs
- [x] Instalar mermaid
- [x] Instalar d3
- [x] Criar MermaidRenderer
- [x] Criar FlowDiagram com React Flow + ELK
- [x] Criar BrandDiagramRenderer (SVG final)
- [x] Temas brand para cada nivel
- [x] Testes de renderizacao

## Fase 10: Graficos
- [x] Instalar echarts e echarts-for-react
- [x] Instalar @observablehq/plot (se compativel)
- [x] Criar tema ECharts brand
- [x] Criar BrandBarChart
- [x] Criar BrandLineChart
- [x] Criar BrandPieChart
- [x] Criar BrandRadarChart
- [x] Testes de renderizacao

## Fase 11: Conteudo tecnico
- [x] Instalar katex
- [x] Instalar shiki
- [x] Criar FormulaBlock (KaTeX)
- [x] Criar CodeBlock (Shiki) com tema brand
- [x] Criar BrandCallout variantes (lei, conceito, exercicio)
- [x] Criar BrandNote
- [x] Criar BrandReference
- [x] Testes de renderizacao

## Fase 12: Animacoes
- [x] Instalar gsap
- [x] Criar tokens de movimento (duracoes, easings)
- [x] Criar animacoes SVG com GSAP
- [x] Definir limites: Motion=React, GSAP=SVG/timelines, CSS=micro
- [x] Documentar regras de uso

## Fase 13: Pipeline de imagens
- [x] Instalar sharp
- [x] Criar API de processamento
- [x] Implementar crop/resize
- [x] Implementar conversao formatos (WebP, AVIF, PNG, JPEG)
- [x] Implementar compressao
- [x] Implementar thumbnails
- [x] Implementar safe crop
- [x] Implementar variacoes brand (duotone, mono, alto contraste)
- [x] Testes de processamento

## Fase 14: Renderizacao Playwright
- [x] Criar rota de renderizacao server-side
- [x] Implementar carregamento de fontes
- [x] Implementar validacao pre-render
- [x] Implementar screenshot Chromium
- [x] Implementar export PDF
- [x] Implementar export em lote
- [x] Implementar retries e timeout
- [x] Manter html2canvas como fallback
- [x] Comparacao visual

## Fase 15: Exportadores
- [x] Criar interface Exporter
- [x] Implementar PNGExporter
- [x] Implementar JPEGExporter
- [x] Implementar WebPExporter
- [x] Implementar PDFExporter
- [x] Implementar HTMLStandaloneExporter
- [x] Instalar pptxgenjs
- [x] Implementar PPTXExporter
- [x] Instalar remotion (preparacao)
- [x] Documentar integracao FFmpeg
- [x] Testes de cada exportador

## Fase 16: Slides HTML
- [x] Criar modelo de dados Slide
- [x] Criar tipos: capa, secao, conceito, comparacao, timeline
- [x] Criar tipos: processo, diagrama, grafico, citacao, resumo
- [x] Criar tipos: questao, resposta, tabela, formula, codigo
- [x] Criar tipos: estudo de caso, conclusao, CTA
- [x] Implementar modo edicao
- [x] Implementar modo apresentacao
- [x] Implementar miniaturas e navegacao
- [x] Implementar notas do apresentador
- [x] Implementar fullscreen
- [x] Implementar exportacao
- [x] Testes de cada tipo

## Fase 17: Documentos HTML
- [x] Criar modelo de dados Document
- [x] Criar tipos: resumo, apostila, material de revisao
- [x] Criar tipos: roteiro, relatorio, guia, documento tecnico
- [x] Implementar paginas e sumario
- [x] Implementar cabecalhos e rodapes
- [x] Implementar numeracao e referencias
- [x] Implementar impressao e PDF
- [x] Implementar HTML standalone
- [x] Testes de cada tipo

## Fase 18: IA estruturada
- [x] Criar interface TextProvider
- [x] Criar interface ImageProvider
- [x] Criar interface EmbeddingProvider
- [x] Criar interface VisionProvider
- [x] Migrar generateCopy para TextProvider
- [x] Migrar generateImage para ImageProvider
- [x] Implementar validacao de saida com Zod
- [x] Implementar reparo de saida
- [x] Testes de validacao

## Fase 19: Autoajuste e validacao visual
- [x] Criar validator de overflow
- [x] Criar validator de contraste
- [x] Criar validator de safe area
- [x] Criar validator de resolucao de imagem
- [x] Criar validator de densidade
- [x] Criar motor de ajuste tipografico
- [x] Implementar gate pre-export
- [x] Testes de cada validacao

## Fase 20: Banco de dados
- [x] Instalar drizzle-orm e drizzle-kit
- [x] Criar schema: users, brands, templates
- [x] Criar schema: creatives, decks, slides, documents
- [x] Criar schema: assets, renders, exports
- [x] Criar schema: ai_providers, ai_generations
- [x] Criar schema: histories, settings, audit_logs
- [x] Gerar migrations
- [x] Criar seed
- [x] Documentar decisoes
- [x] Testes de migrations

## Fase 21: Storage + Redis + BullMQ
- [x] Instalar minio (client SDK)
- [x] Criar abstracao StorageAdapter
- [x] Instalar ioredis
- [x] Instalar bullmq
- [x] Criar filas: render, export, image-gen, text-gen
- [x] Criar Docker Compose (PostgreSQL, Redis, MinIO)
- [x] Testes de integracao

## Fase 22: Observabilidade
- [x] Instalar @sentry/react
- [x] Instalar @opentelemetry/sdk-trace-web
- [x] Configurar Sentry (desativavel por env)
- [x] Configurar traces basicos
- [x] Criar logs estruturados
- [x] Metricas de renderizacao e exportacao
- [x] Documentar configuracao

## Fase 23: Testes completos
- [x] Testes unitarios para stores
- [x] Testes unitarios para domain
- [x] Testes unitarios para schemas
- [x] Testes de componentes brand
- [x] Instalar axe-core
- [x] Testes de acessibilidade
- [x] Testes E2E com Playwright
- [x] Testes visuais com baselines
- [x] Testes de exportacao

## Fase 24: Seguranca, performance e documentacao
- [x] Auditar exposicao de API keys
- [x] Auditar sanitizacao de HTML/SVG
- [x] Auditar uploads (tipo MIME, tamanho)
- [x] Code splitting e lazy loading
- [x] Otimizar bundle
- [x] Criar README.md
- [x] Criar docs/architecture.md
- [x] Criar docs/design-system.md
- [x] Criar docs/templates.md
- [x] Criar docs/rendering.md
- [x] Criar docs/slides.md
- [x] Criar docs/documents.md
- [x] Criar docs/ai-providers.md
- [x] Criar docs/data-model.md
- [x] Criar docs/observability.md
- [x] Criar docs/testing.md
- [x] Criar docs/deployment.md
- [x] Criar docs/migrations.md
- [x] Criar docs/modernization/03-final-report.md
- [x] Validacao final: build, testes, visual
- [x] Criar docs/modernization/04-security-audit.md
