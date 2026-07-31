/**
 * Tipos base do motor de templates.
 * Espelha 1:1 a semântica do Gerador/index.html original:
 * - `format`/`filter` = mesmos valores usados em TEMPLATES no HTML.
 * - `Hideable<T>` = mesma semântica do `!== false` usado no HTML pra ocultar campo.
 */

export type CanvasFormat = 'square' | 'portrait'
export type FormatFilter = 'square' | 'portrait' | 'carousel'
export type CareerTag = 'fiscal' | 'policial' | 'tribunal' | 'motivacao'

/** Um campo hideable é o valor real, ou `false` quando o usuário oculta. */
export type Hideable<T> = T | false

export interface TemplateRenderProps<E> {
  elements: E
  dark: boolean
  /** true quando renderizado dentro do nó de export offscreen (Fase 7). */
  exportMode?: boolean
}

export interface TemplateControlsProps<E> {
  elements: E
}

export interface TemplateDefinition<E = Record<string, unknown>> {
  id: string
  name: string
  category: string
  filter: FormatFilter
  format: CanvasFormat
  tags: CareerTag[]
  defaults: E
  Render: React.FC<TemplateRenderProps<E>>
  Controls: React.FC<TemplateControlsProps<E>>
}

/** Item de estatística (sq-stats). */
export interface StatItem {
  num: string
  label: string
}
