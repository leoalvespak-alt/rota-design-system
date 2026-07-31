import { CanvasFrame } from '@/features/templates/primitives'
import type { TemplateDefinition } from '@/features/templates/types'

interface TemplateThumbProps {
  template: TemplateDefinition<never>
}

/**
 * 🆕 Resolve a dívida D1 da análise do projeto: no Gerador/index.html original,
 * `buildThumbHtml()` era um dicionário manual que cobria só 12 dos 26 templates —
 * os outros 14 caíam num fallback vazio (só a barra vermelha, sem nenhum preview real).
 *
 * Aqui a miniatura é sempre o próprio `Render` do template, renderizado em escala
 * reduzida via CSS transform (`pointer-events: none` para não ser editável na galeria) —
 * cobertura automática de 26/26, e nunca fica dessincronizada de como o template
 * realmente se parece (uma fonte de verdade, não uma segunda representação para manter).
 */
export function TemplateThumb({ template }: TemplateThumbProps) {
  const { Render, defaults, format } = template
  const scale = format === 'portrait' ? 260 / 1920 : 260 / 1080

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: '100%', aspectRatio: format === 'portrait' ? '9 / 16' : '1 / 1' }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}
      >
        <CanvasFrame format={format} dark={false}>
          <Render elements={defaults} dark={false} />
        </CanvasFrame>
      </div>
    </div>
  )
}
