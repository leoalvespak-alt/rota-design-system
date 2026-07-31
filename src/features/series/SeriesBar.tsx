import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useSeriesStore } from '@/stores/useSeriesStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { useDecorStore } from '@/stores/useDecorStore'
import { SeriesSlideCard } from './SeriesSlideCard'
import { HeaderSecondaryButton } from '@/app/HeaderButtons'

/**
 * Espelha buildSeriesBar() do Gerador/index.html original (linha 3813), com
 * 🆕 reordenação por drag-and-drop (@dnd-kit/sortable) — recurso novo, não existia
 * no app original (que só permitia add/load/delete, sempre na ordem de criação).
 */
export function SeriesBar() {
  const seriesMode = useSeriesStore((s) => s.seriesMode)
  const slides = useSeriesStore((s) => s.slides)
  const addSlide = useSeriesStore((s) => s.addSlide)
  const deleteSlide = useSeriesStore((s) => s.deleteSlide)
  const reorderSlides = useSeriesStore((s) => s.reorderSlides)

  const activeTemplateId = useEditorStore((s) => s.activeTemplateId)
  const elements = useEditorStore((s) => s.elements)
  const darkMode = useEditorStore((s) => s.darkMode)
  const selectTemplate = useEditorStore((s) => s.selectTemplate)
  const replaceElements = useEditorStore((s) => s.replaceElements)
  const watermark = useDecorStore((s) => s.watermark)
  const texture = useDecorStore((s) => s.texture)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (!seriesMode) return null

  const handleAddCurrentSlide = () => {
    if (!activeTemplateId) return
    addSlide({
      templateId: activeTemplateId,
      elements: structuredClone(elements),
      darkMode,
      watermark: structuredClone(watermark),
      texture: structuredClone(texture),
    })
  }

  const handleLoadSlide = (id: string) => {
    const slide = useSeriesStore.getState().slides.find((s) => s.id === id)
    if (!slide) return
    replaceElements(structuredClone(slide.elements), { darkMode: slide.darkMode })
    useDecorStore.setState({
      watermark: structuredClone(slide.watermark),
      texture: structuredClone(slide.texture),
    })
    selectTemplate(slide.templateId, { keepElements: true })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = slides.findIndex((s) => s.id === active.id)
    const toIndex = slides.findIndex((s) => s.id === over.id)
    if (fromIndex === -1 || toIndex === -1) return
    reorderSlides(fromIndex, toIndex)
  }

  return (
    <div className="flex items-center gap-4 overflow-x-auto border-b border-ui-border bg-ui-panel px-6 py-3">
      <HeaderSecondaryButton onClick={handleAddCurrentSlide}>+ Adicionar slide atual</HeaderSecondaryButton>
      <div className="h-6 w-px shrink-0 bg-ui-border" />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slides.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex items-center gap-2">
            {slides.map((slide, i) => (
              <SeriesSlideCard
                key={slide.id}
                slide={slide}
                index={i}
                onLoad={handleLoadSlide}
                onDelete={deleteSlide}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
