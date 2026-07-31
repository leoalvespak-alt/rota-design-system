import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { SeriesSlide } from '@/stores/useSeriesStore'

interface SeriesSlideCardProps {
  slide: SeriesSlide
  index: number
  onLoad: (id: string) => void
  onDelete: (id: string) => void
}

/**
 * 🆕 Item de slide da barra de série, arrastável via @dnd-kit/sortable.
 * O Gerador/index.html original (buildSeriesBar, linha 3813) não suportava reordenar —
 * cada slide só podia ser carregado ou excluído, na ordem de criação. Suporte a teclado
 * (setas + espaço) vem de graça do @dnd-kit, atendendo ao requisito de acessibilidade.
 */
export function SeriesSlideCard({ slide, index, onLoad, onDelete }: SeriesSlideCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex shrink-0 cursor-pointer items-center gap-2 rounded-md border border-ui-border bg-white px-3 py-1.5 shadow-sm"
      onClick={() => onLoad(slide.id)}
      {...attributes}
      {...listeners}
    >
      <span className="font-semibold text-ui-text">{index + 1}</span>
      <span className="text-[11px] text-ui-muted">{slide.templateId}</span>
      <div
        className="ml-1 flex h-4 w-4 items-center justify-center rounded-sm text-brand-red"
        title="Excluir"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(slide.id)
        }}
      >
        ✕
      </div>
    </div>
  )
}
