# Plano Mestre de Implementacao — Modernizacao Completa

Data: 2026-08-01

---

## Decisoes arquiteturais

### Migracao Vite -> Next.js
**Decisao:** Manter Vite como bundler principal nesta fase. O projeto e 100% client-side e funciona bem com Vite 8. A migracao para Next.js sera preparada arquiteturalmente (API routes, server components) mas executada como fase posterior quando o backend for necessario para renderizacao Playwright e processamento de imagens.

**Motivo:** Migracao cega para Next.js causaria regressao nas 26 templates funcionais sem beneficio imediato. A prioridade e adicionar capacidades, nao mudar bundler.

### ORM principal
**Decisao:** Drizzle como ORM principal. Prisma disponivel como alternativa para introspeccao e geracao de tipos quando necessario.

**Motivo:** Drizzle e mais leve, SQL-first, melhor para VPS self-hosted.

### Storage
**Decisao:** MinIO para storage S3-compatible self-hosted.

**Motivo:** Projeto roda em VPS propria, MinIO nao requer servicos pagos.

---

## Fase 1: Estabilizacao e TypeScript estrito

**Objetivo:** Garantir build limpo, lint sem erros, TypeScript strict completo.

**Arquivos afetados:** tsconfig.app.json, tsconfig.json, todos os .ts/.tsx
**Dependencias:** Nenhuma
**Risco:** Baixo
**Estrategia:** Habilitar strict incrementalmente, corrigir erros de tipo
**Testes:** `tsc -b && vite build` sem erros
**Criterios de aceite:** Build limpo, zero erros TS, lint ok
**Rollback:** Reverter tsconfig
**Ordem:** 1

---

## Fase 2: Design tokens com Style Dictionary

**Objetivo:** Criar fonte unica de verdade para tokens, gerando CSS Custom Properties, TypeScript e JSON.

**Arquivos afetados:** Novo: src/tokens/, style-dictionary.config.ts. Modificado: index.css
**Dependencias:** Fase 1
**Risco:** Medio (substituicao de CSS vars existentes)
**Estrategia:** Gerar tokens que mapeiam 1:1 para vars existentes, depois migrar
**Testes:** Tokens gerados iguais aos atuais
**Criterios de aceite:** Todos os tokens em Style Dictionary, CSS gerado, TS types gerados
**Rollback:** Remover src/tokens/, restaurar index.css
**Ordem:** 2

Tokens a criar:
- Primitivos: cores, espacamentos, radii, fontes, pesos, tamanhos
- Semanticos: brand, surface, text, border, accent
- Por tema: light, dark
- Por formato: square, portrait, carousel
- Tipograficos: scale, leading, tracking
- Grid: base unit, columns, gutters
- Sombras: elevation levels
- Movimento: duracoes, easings
- Safe areas: por formato

---

## Fase 3: Cascade Layers e CSS moderno

**Objetivo:** Organizar CSS com @layer, adicionar Container Queries e Subgrid.

**Arquivos afetados:** index.css, componentes que usam CSS
**Dependencias:** Fase 2
**Risco:** Medio (ordem de cascade afeta visual)
**Estrategia:** Adicionar layers sem alterar visual existente
**Testes:** Visual regression com baselines existentes
**Criterios de aceite:** CSS organizado em layers, Container Queries nos canvas
**Rollback:** Remover @layer declarations
**Ordem:** 3

Layers:
```css
@layer reset, tokens, base, utilities, components, templates, overrides;
```

---

## Fase 4: Schemas e templates declarativos

**Objetivo:** Sistema de templates totalmente declarativo com Zod schemas.

**Arquivos afetados:** features/templates/types.ts, registry.ts, novo: schemas/
**Dependencias:** Fase 2
**Risco:** Alto (26 templates funcionais)
**Estrategia:** Criar schema declarativo sem alterar renderizacao existente
**Testes:** Schemas validam todos os 26 templates existentes
**Criterios de aceite:** TemplateDefinition tipado, slots validados, variantes controladas
**Rollback:** Manter registry.ts original
**Ordem:** 4

---

## Fase 5: XState para fluxos complexos

**Objetivo:** Maquina de estados para workflow completo.

**Arquivos afetados:** Novo: src/machines/. Modificado: stores
**Dependencias:** Fase 1
**Risco:** Baixo (aditivo)
**Estrategia:** Criar maquina paralela ao estado Zustand, migrar gradualmente
**Testes:** Testes de transicoes de estado
**Criterios de aceite:** Fluxo idle->editing->generating->rendering->exporting funcional
**Rollback:** Remover machines/
**Ordem:** 5

---

## Fase 6: Editor Tiptap estruturado

**Objetivo:** Substituir contenteditable basico por Tiptap com perfis.

**Arquivos afetados:** Novo: src/features/editor/tiptap/. Modificado: EditableText
**Dependencias:** Fase 4 (schemas definem limites por slot)
**Risco:** Alto (edicao de texto e funcionalidade core)
**Estrategia:** Criar Tiptap ao lado do EditableText, migrar por template
**Testes:** Testes de edicao, sanitizacao, limites
**Criterios de aceite:** 3 perfis (titulo, corpo, tecnico), undo/redo, sanitizacao
**Rollback:** Manter EditableText original
**Ordem:** 6

---

## Fase 7: Componentes brand

**Objetivo:** Criar componentes visuais proprios da marca.

**Arquivos afetados:** Novo: src/components/brand/
**Dependencias:** Fase 2, Fase 3
**Risco:** Baixo (aditivo)
**Estrategia:** Criar componentes novos usando design tokens
**Testes:** Storybook stories, testes visuais
**Criterios de aceite:** BrandText, BrandBadge, BrandDivider, BrandChart, etc.
**Rollback:** Remover components/brand/
**Ordem:** 7

---

## Fase 8: Storybook

**Objetivo:** Documentacao visual de componentes e templates.

**Arquivos afetados:** Novo: .storybook/, stories para cada componente
**Dependencias:** Fase 7
**Risco:** Baixo (aditivo)
**Estrategia:** Instalar e configurar Storybook 8
**Testes:** Stories renderizam sem erros
**Criterios de aceite:** Stories para componentes, templates, estados
**Rollback:** Remover .storybook/
**Ordem:** 8

---

## Fase 9: Diagramas

**Objetivo:** 3 niveis de diagramas com identidade visual.

**Arquivos afetados:** Novo: src/features/diagrams/
**Dependencias:** Fase 2, Fase 7
**Risco:** Baixo (aditivo)
**Estrategia:** Instalar React Flow, ELK.js, Mermaid, D3
**Testes:** Renderizacao de cada tipo de diagrama
**Criterios de aceite:** Mermaid basico, React Flow interativo, SVG final com brand
**Rollback:** Remover features/diagrams/
**Ordem:** 9

---

## Fase 10: Graficos

**Objetivo:** Motor de graficos com temas brand.

**Arquivos afetados:** Novo: src/features/charts/
**Dependencias:** Fase 2
**Risco:** Baixo (aditivo)
**Estrategia:** Instalar ECharts, criar tema brand
**Testes:** Graficos renderizam com tokens corretos
**Criterios de aceite:** ECharts com tema brand, D3 para custom
**Rollback:** Remover features/charts/
**Ordem:** 10

---

## Fase 11: Conteudo tecnico

**Objetivo:** Formulas, codigo, tabelas especializadas.

**Arquivos afetados:** Novo: src/features/technical/
**Dependencias:** Fase 7
**Risco:** Baixo (aditivo)
**Estrategia:** Instalar KaTeX e Shiki
**Testes:** Renderizacao de formulas e codigo
**Criterios de aceite:** KaTeX funcional, Shiki com tema brand
**Rollback:** Remover features/technical/
**Ordem:** 11

---

## Fase 12: Animacoes (GSAP)

**Objetivo:** Complementar Motion com GSAP para SVG avancado.

**Arquivos afetados:** Novo: src/lib/animation/
**Dependencias:** Fase 2
**Risco:** Baixo (aditivo)
**Estrategia:** GSAP para timelines SVG, Motion para React, CSS para micro
**Testes:** Animacoes executam sem conflito
**Criterios de aceite:** Tokens de movimento, GSAP configurado
**Rollback:** Remover lib/animation/
**Ordem:** 12

---

## Fase 13: Pipeline de imagens

**Objetivo:** Processamento server-side com Sharp.

**Arquivos afetados:** Novo: src/server/images/ ou api/images/
**Dependencias:** Backend/API routes
**Risco:** Medio (requer servidor)
**Estrategia:** Criar API routes com Express ou preparar para Next.js API
**Testes:** Testes de processamento de imagem
**Criterios de aceite:** Crop, resize, WebP, composicao, variacoes brand
**Rollback:** Funcionalidade client-side mantida
**Ordem:** 13

---

## Fase 14: Renderizacao Playwright

**Objetivo:** Renderizacao profissional server-side.

**Arquivos afetados:** Novo: src/server/render/
**Dependencias:** Fase 13
**Risco:** Alto (substituicao do motor de export)
**Estrategia:** Criar rota de renderizacao, manter html2canvas como fallback
**Testes:** Comparacao visual html2canvas vs Playwright
**Criterios de aceite:** Screenshots Playwright identicos ou superiores
**Rollback:** html2canvas continua funcionando
**Ordem:** 14

---

## Fase 15: Exportadores

**Objetivo:** Multiplos formatos de exportacao.

**Arquivos afetados:** Novo: src/lib/export/exporters/
**Dependencias:** Fase 14
**Risco:** Medio
**Estrategia:** Criar interface de exportador, implementar por formato
**Testes:** Exportacao em cada formato
**Criterios de aceite:** PNG, JPEG, WebP, PDF, HTML standalone, PPTX
**Rollback:** Export PNG atual mantido
**Ordem:** 15

---

## Fase 16: Slides HTML

**Objetivo:** Modulo completo de slides com 18 tipos.

**Arquivos afetados:** Novo: src/features/slides/
**Dependencias:** Fase 7, Fase 4
**Risco:** Medio (funcionalidade nova grande)
**Estrategia:** Reutilizar design tokens e componentes brand
**Testes:** Renderizacao de cada tipo de slide
**Criterios de aceite:** 18 tipos, modo edicao/apresentacao, navegacao, export
**Rollback:** Remover features/slides/
**Ordem:** 16

---

## Fase 17: Documentos HTML

**Objetivo:** Documentos estruturados reutilizando design system.

**Arquivos afetados:** Novo: src/features/documents/
**Dependencias:** Fase 16, Fase 6
**Risco:** Medio
**Estrategia:** Reutilizar componentes de slides e brand
**Testes:** Renderizacao de cada tipo de documento
**Criterios de aceite:** Tipos documentados, paginacao, PDF, impressao
**Rollback:** Remover features/documents/
**Ordem:** 17

---

## Fase 18: IA estruturada

**Objetivo:** Camada de provedores com validacao de saida.

**Arquivos afetados:** Modificado: src/lib/ai/. Novo: src/lib/ai/providers/
**Dependencias:** Fase 4
**Risco:** Medio (integracao IA existente)
**Estrategia:** Abstrair provedores sem quebrar integracao atual
**Testes:** Testes de validacao de output
**Criterios de aceite:** TextProvider, ImageProvider abstratos, validacao Zod
**Rollback:** Manter ai/ atual
**Ordem:** 18

---

## Fase 19: Autoajuste e validacao visual

**Objetivo:** Motor de validacao e ajuste tipografico automatico.

**Arquivos afetados:** Novo: src/lib/validation/visual/
**Dependencias:** Fase 4
**Risco:** Baixo (aditivo)
**Estrategia:** Validacoes executam pre-export
**Testes:** Testes de cada regra de validacao
**Criterios de aceite:** Overflow, contraste, safe area, ajuste tipografico
**Rollback:** Desabilitar validacoes
**Ordem:** 19

---

## Fase 20: Banco de dados

**Objetivo:** PostgreSQL com Drizzle ORM.

**Arquivos afetados:** Novo: src/db/, drizzle.config.ts, migrations/
**Dependencias:** Backend
**Risco:** Medio (nova infraestrutura)
**Estrategia:** Schema declarativo, migrations versionadas
**Testes:** Testes de migration
**Criterios de aceite:** Schema completo, migrations, seed
**Rollback:** App funciona sem banco (IndexedDB fallback)
**Ordem:** 20

---

## Fase 21: Storage + Redis + BullMQ

**Objetivo:** MinIO para assets, Redis para cache/filas.

**Arquivos afetados:** Novo: src/server/storage/, src/server/queue/
**Dependencias:** Fase 20
**Risco:** Medio
**Estrategia:** Abstracao de storage, Docker Compose para servicos
**Testes:** Upload/download, enqueue/process
**Criterios de aceite:** MinIO configurado, BullMQ funcional
**Rollback:** localStorage/IndexedDB mantidos
**Ordem:** 21

---

## Fase 22: Observabilidade

**Objetivo:** Sentry + OpenTelemetry + logs estruturados.

**Arquivos afetados:** Novo: src/lib/observability/
**Dependencias:** Fase 1
**Risco:** Baixo (aditivo)
**Estrategia:** Desativavel por ambiente
**Testes:** Logs emitem corretamente
**Criterios de aceite:** Sentry configurado, traces, metricas basicas
**Rollback:** Desabilitar via env
**Ordem:** 22

---

## Fase 23: Testes completos

**Objetivo:** Cobertura de testes significativa.

**Arquivos afetados:** Novo: testes para cada modulo
**Dependencias:** Todas as fases anteriores
**Risco:** Baixo
**Estrategia:** Unitarios > Integracao > E2E > Visual > A11y
**Testes:** Suite completa passa
**Criterios de aceite:** Testes criticos para cada funcionalidade
**Rollback:** N/A
**Ordem:** 23

---

## Fase 24: Seguranca, performance e documentacao

**Objetivo:** Auditoria final, otimizacao, docs completos.

**Arquivos afetados:** Todos os docs/, README.md
**Dependencias:** Todas as fases
**Risco:** Baixo
**Estrategia:** Checklist de seguranca, lighthouse, docs
**Testes:** Build final ok
**Criterios de aceite:** Docs completos, build otimizado, sem segredos expostos
**Rollback:** N/A
**Ordem:** 24
