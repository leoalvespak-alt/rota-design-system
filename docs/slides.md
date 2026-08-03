# Modulo de Slides HTML

## Tipos de Slide

18 tipos disponiveis em `src/features/slides/types.ts`:

cover, section, concept, comparison, timeline, process, diagram, chart, quote, summary, question, answer, table, formula, code, case-study, conclusion, cta

## Modelo de Dados

```typescript
interface SlideData {
  id: string
  type: SlideType
  title?: string
  subtitle?: string
  content?: string
  items?: string[]
  notes?: string
  dark?: boolean
  data?: Record<string, unknown>
}

interface DeckData {
  id: string
  title: string
  slides: SlideData[]
  dark?: boolean
}
```

## Componentes

### SlideRenderer

Renderiza um slide individual baseado no tipo. Usa componentes brand (BrandText, BrandCallout, BrandTable, etc.) para consistencia visual.

### DeckPresenter

Gerenciador de apresentacao com 3 modos:

- **edit** — Edicao de slides com thumbnails laterais
- **present** — Modo apresentacao fullscreen com navegacao por teclado
- **overview** — Grid de thumbnails para visao geral

Funcionalidades:
- Navegacao: setas, Page Up/Down, Home/End
- Fullscreen nativo
- Notas do apresentador
- Thumbnails clicaveis

## Canvas

`SlideCanvas` renderiza no formato 1920x1080 (16:9) com zoom automatico.
