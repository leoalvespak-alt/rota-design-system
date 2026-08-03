# Auditoria do Estado Atual — Rota de Ataque Design System

Data: 2026-08-01

---

## 1. Visao geral da arquitetura atual

| Aspecto | Estado atual |
|---|---|
| Framework | React 19.2.8 (SPA) |
| Bundler | Vite 8.2.0 |
| Linguagem | TypeScript 6.0.2 |
| Frontend | React + Tailwind CSS 4.3.3 + shadcn/ui + Radix UI |
| Backend | Nenhum (100% client-side) |
| Banco | Nenhum (IndexedDB via idb-keyval para persistencia local) |
| Armazenamento | localStorage + IndexedDB |
| Autenticacao | Nenhuma |
| Estado | Zustand 5.0.14 + Immer + Zundo (undo/redo) |
| Renderizacao | html2canvas-pro 2.3.3 |
| IA | DeepSeek API + Claude API + fal.ai FLUX/schnell |
| Deploy | VPS manual via PowerShell script + nginx |
| CI/CD | Nenhum |
| Monitoramento | Nenhum |
| Testes | Vitest + Testing Library + Playwright (parcial) |

---

## 2. Inventario de dependencias

### Dependencias de producao

| Pacote | Versao | Funcao | Onde e usado | Atualizado | Manter | Substituir | Riscos |
|---|---|---|---|---|---|---|---|
| react | 19.2.8 | UI framework | Todo o app | Sim | Sim | Nao | - |
| react-dom | 19.2.8 | DOM renderer | main.tsx | Sim | Sim | Nao | - |
| tailwindcss | 4.3.3 | Utilitarios CSS | index.css, componentes | Sim | Sim | Nao | - |
| @tailwindcss/vite | 4.3.3 | Plugin Vite | vite.config.ts | Sim | Sim | Nao | - |
| zustand | 5.0.14 | Estado global | 7 stores | Sim | Sim | Nao | - |
| immer | 11.1.15 | Updates imutaveis | Middleware Zustand | Sim | Sim | Nao | - |
| zundo | 2.3.0 | Undo/redo | useEditorStore | Sim | Sim | Nao | - |
| zod | 4.4.3 | Validacao schemas | domain/, forms | Sim | Sim | Nao | - |
| html2canvas-pro | 2.3.3 | Export PNG | ExportEngine.ts | Sim | Temporario | Playwright | Limitacoes de fidelidade |
| jszip | 3.10.1 | Export ZIP carousel | useSeriesExport.ts | Sim | Sim | Nao | - |
| motion | 12.43.0 | Animacoes React | Componentes UI | Sim | Sim | Nao | - |
| radix-ui | 1.6.7 | Primitivas acessiveis | Componentes UI | Sim | Sim | Nao | - |
| shadcn | 4.16.1 | Componentes UI | components/ui/ | Sim | Sim | Nao | - |
| lucide-react | 1.28.0 | Icones | Todo o app | Sim | Sim | Nao | - |
| react-hook-form | 7.83.0 | Formularios | Editor forms | Sim | Sim | Nao | - |
| @hookform/resolvers | 5.5.7 | Zod resolver | Forms + Zod | Sim | Sim | Nao | - |
| react-dropzone | 19.1.1 | Upload arquivos | ImageUploadField | Sim | Sim | Nao | - |
| @dnd-kit/core | 6.3.1 | Drag-and-drop | Carousel reorder | Sim | Sim | Nao | - |
| @dnd-kit/sortable | 10.0.0 | Sortable list | SeriesBar | Sim | Sim | Nao | - |
| idb-keyval | 6.3.0 | IndexedDB adapter | Library store | Sim | Sim | Nao | - |
| sonner | 2.0.7 | Toast notifications | Feedback UI | Sim | Sim | Nao | - |
| @fontsource/ibm-plex-sans | 5.3.0 | Fonte body | index.css | Sim | Sim | Nao | - |
| @fontsource/rajdhani | 5.3.0 | Fonte headings | index.css | Sim | Sim | Nao | - |
| @fontsource/space-grotesk | 5.3.0 | Fonte numerais | index.css | Sim | Sim | Nao | - |

### Dependencias de desenvolvimento

| Pacote | Versao | Funcao | Atualizado | Manter |
|---|---|---|---|---|
| vite | 8.2.0 | Bundler | Sim | Sim (migrar para Next.js) |
| typescript | 6.0.2 | Tipagem | Sim | Sim |
| vitest | 4.1.10 | Testes unitarios | Sim | Sim |
| @vitest/ui | 4.1.10 | UI de testes | Sim | Sim |
| @testing-library/react | 16.3.2 | Testes componentes | Sim | Sim |
| @testing-library/jest-dom | 7.0.0 | Matchers DOM | Sim | Sim |
| @testing-library/user-event | 14.6.1 | Simulacao usuario | Sim | Sim |
| @playwright/test | 1.62.1 | E2E + visual | Sim | Sim |
| eslint | 10.8.0 | Linting | Sim | Sim |
| prettier | 3.9.6 | Formatacao | Sim | Sim |
| class-variance-authority | 0.7.1 | Variantes CSS | Sim | Sim |
| clsx | 2.1.1 | Classes condicionais | Sim | Sim |
| tailwind-merge | 3.6.0 | Merge Tailwind | Sim | Sim |
| tw-animate-css | 1.4.0 | Animacoes Tailwind | Sim | Sim |

---

## 3. Inventario de funcionalidades

| Funcionalidade | Status | Detalhes |
|---|---|---|
| Criacao de criativos | Funcional | 26 templates em 3 formatos |
| Templates quadrados | Funcional | 12 templates (1080x1080) |
| Templates portrait/story | Funcional | 6 templates (1080x1920) |
| Templates carousel | Funcional | 8 templates (1080x1080) |
| Edicao de texto | Funcional | EditableText com contenteditable |
| Geracao de copy (IA) | Funcional | DeepSeek + Claude + OpenAI-compat |
| Geracao de imagens (IA) | Funcional | fal.ai FLUX/schnell |
| Biblioteca de renders | Funcional | IndexedDB, max 20 itens |
| Marca/Brand view | Funcional | Paleta de cores copiavel |
| Config IA | Funcional | API keys, modelos customizados |
| Historico | Funcional | Salvar/carregar artes |
| Exportacao PNG | Funcional | html2canvas-pro 2x |
| Exportacao ZIP carousel | Funcional | JSZip com todos os slides |
| Dark mode cards | Funcional | Toggle light/dark nos criativos |
| Texturas SVG | Funcional | Organic, noise, hatching |
| Watermark | Funcional | Overlay configuravel |
| Background library | Funcional | Selecao de backgrounds |
| Command palette | Funcional | Ctrl+K |
| Zoom canvas | Funcional | Zoom in/out do preview |
| Undo/redo | Funcional | Zundo, 30 estados |
| Series/carousel mode | Funcional | Modo series com reordenacao |
| Project sessions | Parcial | Provider criado, feature flag off |
| Campaigns | Parcial | Domain model, feature flag off |
| Workflow approvals | Parcial | State machine, feature flag off |
| Batch import | Parcial | CSV import, feature flag off |
| Multiformat conversion | Parcial | Domain logic, feature flag off |
| Presets | Parcial | Domain logic, feature flag off |
| Responsividade | Parcial | UI basica, sem otimizacao mobile |
| Permissoes | Ausente | Nenhum sistema de auth |
| Seguranca | Basica | Keys em localStorage |

---

## 4. Inventario do design system

| Elemento | Status | Detalhes |
|---|---|---|
| Cores primarias | Definido | Red #C1121F, Gold #D4A017 |
| Cores neutras | Definido | Gray scale puro (sem blue cast) |
| Cores semanticas | Definido | Success, Warning, Danger, Info |
| Fonte headings | Definido | Rajdhani 600/700 |
| Fonte body | Definido | IBM Plex Sans 300-600 |
| Fonte numerais | Definido | Space Grotesk 400/500/700 |
| Escalas tipograficas | Parcial | Hardcoded em templates, nao tokenizado |
| Espacamentos | Parcial | Array em brand.ts [4,8,12,16,24,32,48,64], nao como tokens CSS |
| Grids | Ausente | Grid 40px mencionado no MARCA.md, nao implementado como sistema |
| Bordas/radii | Definido | 5 niveis de radius em CSS vars |
| Sombras | Ausente | Nao tokenizadas |
| Texturas | Funcional | 3 tipos SVG (organic, noise, hatching) |
| Icones | Funcional | Lucide React |
| Componentes UI | Funcional | 11 shadcn/ui primitivas |
| Templates criativos | Funcional | 26 templates com primitivas compartilhadas |
| Variantes | Parcial | Carreiras (fiscal, policial, tribunal, motivacao) |
| Formatos | Funcional | Square, portrait, carousel |
| Dark mode | Funcional | CSS vars light/dark |
| Regras de marca | Documentado | MARCA.md completo |
| Tokens centralizados | Parcial | CSS vars em index.css, sem Style Dictionary |
| Safe areas | Ausente | Nao implementado |
| Densidade | Ausente | Nao implementado |
| Proporcoes | Parcial | Definidas por formato, nao como sistema |

---

## 5. Inventario dos documentos Markdown

### MARCA.md (Base/)
- Identidade completa da marca Rota de Ataque
- Tom de voz: sargento tatico, imperativo, metaforas militares
- Paleta de cores completa com modos light/dark
- Tipografia com 3 familias e regras de uso
- Estilo visual: console tatico, grid 40px, spring physics
- Iconografia: Tabler (app), Lucide (marketing)
- Distincao produto vs marketing

### DEPLOY.md (deploy/)
- App 100% client-side
- VPS compartilho 187.127.249.22
- Dominio design.rotadeataque.com.br
- Deploy via SCP + nginx

### SKILL.md (social-cards-skill)
- Skill Claude para geracao de social cards via Python/Pillow
- Pipeline de renderizacao completo
- Tipos de card, texturas, regras de texto
- Paleta brand para light/dark

### Documentos existentes no Gerador-React/
- AUDITORIA_22_RECURSOS.md - Auditoria anterior de 22 feature flags
- PLANO_IMPLEMENTACAO_22_RECURSOS.md - Plano de implementacao dos 22 recursos
- PLANO_CONEXAO_FINALIZACAO.md - Plano de conexao e finalizacao

---

## 6. Problemas encontrados

### Critico
- Nenhum backend server — toda logica roda no cliente, limitando capacidades futuras (renderizacao Playwright, processamento de imagens, filas)

### Alto
- API keys armazenadas em localStorage sem criptografia
- Nenhum CI/CD — deploy manual propenso a erros
- Nenhum sistema de autenticacao
- html2canvas-pro tem limitacoes de fidelidade para producao profissional
- Design tokens dispersos (CSS vars + brand.ts), sem fonte unica de verdade

### Medio
- 22 feature flags todas desabilitadas — domain layer extenso sem UI
- Nenhum teste E2E escrito (config existe, testes nao)
- Testes unitarios existem mas cobertura limitada
- Espacamentos e tipografia hardcoded nos templates em vez de usar tokens
- Nenhum Docker para ambiente reproduzivel
- Nenhum error boundary no app

### Baixo
- deploy/.env commitado (contem apenas IP do VPS, sem segredos criticos)
- Sem README.md no root do projeto
- OxLint configurado mas nao integrado ao script de lint

### Oportunidade
- Domain layer bem projetado, pronto para ativar com backend
- 26 templates cobrem bom range de formatos
- Marca bem documentada em MARCA.md
- Arquitetura de stores bem organizada

---

## 7. Matriz de aderencia tecnologica

| Tecnologia | Status | Notas |
|---|---|---|
| **Aplicacao** | | |
| Next.js | Ausente | Atualmente Vite SPA |
| React | Existente | v19.2.8 |
| TypeScript | Existente | v6.0.2, strict parcial |
| **Estilo** | | |
| Tailwind CSS | Existente | v4.3.3 |
| Style Dictionary | Ausente | Tokens em CSS vars manuais |
| CSS Custom Properties | Existente | Usado extensivamente |
| CSS Grid | Parcial | Usado em templates, nao sistematico |
| Container Queries | Ausente | Nao utilizado |
| Subgrid | Ausente | Nao utilizado |
| Cascade Layers | Ausente | CSS nao organizado em layers |
| **Interface** | | |
| Radix UI | Existente | v1.6.7 |
| shadcn/ui | Existente | 11 componentes |
| Componentes proprios | Existente | Primitivas de template |
| **Documentacao** | | |
| Storybook | Ausente | Nenhuma configuracao |
| Testes visuais Playwright | Parcial | Baselines existem, testes nao |
| Tokens versionados | Ausente | Sem versionamento |
| **Editor e estado** | | |
| Tiptap | Ausente | Usando contenteditable basico |
| Zustand | Existente | v5.0.14 |
| Immer | Existente | v11.1.15 |
| XState | Ausente | Nenhum |
| **Schemas** | | |
| JSON Schema | Ausente | Nao utilizado |
| Zod | Existente | v4.4.3 |
| Renderer declarativo | Parcial | Registry existe, nao totalmente declarativo |
| Slots tipados | Parcial | FieldDef existe |
| **Diagramas** | | |
| SVG proprio | Existente | Texturas SVG |
| React Flow | Ausente | |
| ELK.js | Ausente | |
| Mermaid | Ausente | |
| D3 | Ausente | |
| **Graficos** | | |
| Apache ECharts | Ausente | |
| D3 | Ausente | |
| Observable Plot | Ausente | |
| **Conteudo tecnico** | | |
| KaTeX | Ausente | |
| MathML | Ausente | |
| Shiki | Ausente | |
| **Animacao** | | |
| Motion | Existente | v12.43.0 |
| GSAP | Ausente | |
| CSS animations | Parcial | tw-animate-css |
| **Imagens** | | |
| Sharp | Ausente | Sem backend |
| Pipeline processamento | Ausente | |
| Mascaras SVG | Ausente | |
| Filtros SVG | Ausente | |
| **Renderizacao** | | |
| Playwright | Parcial | Instalado para testes, nao para render |
| html-to-image | Ausente | |
| html2canvas | Existente | html2canvas-pro (temporario) |
| **Exportacao** | | |
| PNG | Existente | Via html2canvas |
| JPEG | Ausente | |
| WebP | Ausente | |
| PDF | Ausente | |
| HTML standalone | Ausente | |
| PptxGenJS | Ausente | |
| Remotion | Ausente | |
| FFmpeg | Ausente | |
| **Dados** | | |
| PostgreSQL | Ausente | |
| Drizzle | Ausente | |
| Prisma | Ausente | |
| S3/R2/MinIO | Ausente | |
| Redis | Ausente | |
| BullMQ | Ausente | |
| **Qualidade** | | |
| Vitest | Existente | v4.1.10 |
| Testing Library | Existente | v16.3.2 |
| Playwright | Existente | v1.62.1 |
| axe-core | Ausente | |
| Sentry SDK | Ausente | |
| OpenTelemetry SDK | Ausente | |
