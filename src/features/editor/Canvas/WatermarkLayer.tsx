import type { CSSProperties } from 'react'
import { useDecorStore } from '@/stores/useDecorStore'

/** Espelha applyWatermark() do Gerador/index.html original (linha 3069). */
export function WatermarkLayer() {
  const watermark = useDecorStore((s) => s.watermark)

  if (!watermark.enabled) return null

  const pad = '24px'
  const positionStyle: CSSProperties =
    watermark.position === 'bottom-right'
      ? { bottom: pad, right: pad }
      : watermark.position === 'bottom-left'
        ? { bottom: pad, left: pad }
        : { bottom: pad, left: '50%', transform: 'translateX(-50%)' }

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 10,
        pointerEvents: 'none',
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 700,
        fontSize: 28,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#fff',
        opacity: watermark.opacity,
        ...positionStyle,
      }}
    >
      {watermark.text}
    </div>
  )
}
