import { TEMPLATES } from '@/features/templates/registry'
import { useEditorStore } from '@/stores/useEditorStore'
import { useUiStore, type GalleryFilter } from '@/stores/useUiStore'
import { TemplateThumb } from './TemplateThumb'
import { cn } from '@/lib/utils'

const FORMAT_FILTERS: { id: GalleryFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'square', label: 'Quadrado' },
  { id: 'portrait', label: 'Story' },
  { id: 'carousel', label: 'Carrossel' },
]

const TAG_FILTERS: { id: GalleryFilter; label: string }[] = [
  { id: 'fiscal', label: 'Fiscal' },
  { id: 'policial', label: 'Policial' },
  { id: 'tribunal', label: 'Tribunal' },
  { id: 'motivacao', label: 'Motivação' },
]

const FORMAT_FILTER_IDS = new Set(FORMAT_FILTERS.map((f) => f.id))

/** Espelha .left-panel (galeria de templates) do Gerador/index.html (linhas 1323-1356). */
export function Gallery() {
  const activeTemplateId = useEditorStore((s) => s.activeTemplateId)
  const selectTemplate = useEditorStore((s) => s.selectTemplate)
  const galleryFilter = useUiStore((s) => s.galleryFilter)
  const setGalleryFilter = useUiStore((s) => s.setGalleryFilter)

  const filtered =
    galleryFilter === 'all'
      ? TEMPLATES
      : FORMAT_FILTER_IDS.has(galleryFilter)
        ? TEMPLATES.filter((t) => t.filter === galleryFilter)
        : TEMPLATES.filter((t) => t.tags.includes(galleryFilter as never))

  const categories = [...new Set(filtered.map((t) => t.category))]

  return (
    <aside className="flex w-65 shrink-0 flex-col overflow-hidden border-r border-ui-border bg-ui-panel">
      <div className="grid grid-cols-2 gap-1.5 border-b border-ui-border p-3">
        {FORMAT_FILTERS.map((f) => (
          <FilterButton key={f.id} active={galleryFilter === f.id} onClick={() => setGalleryFilter(f.id)}>
            {f.label}
          </FilterButton>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5 border-b border-ui-border p-3">
        {TAG_FILTERS.map((f) => (
          <FilterButton key={f.id} active={galleryFilter === f.id} onClick={() => setGalleryFilter(f.id)}>
            {f.label}
          </FilterButton>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 && (
          <div className="p-7.5 text-center text-xs text-ui-muted">Nenhum template nesta categoria</div>
        )}
        {categories.map((cat) => (
          <div key={cat} className="mb-4">
            <div className="mb-1.5 flex items-center gap-1.5 px-1.5 text-[10px] font-semibold tracking-[0.08em] text-ui-muted uppercase">
              {cat}
              <div className="h-px flex-1 bg-ui-border" />
            </div>
            {filtered
              .filter((t) => t.category === cat)
              .map((tpl) => (
                <div
                  key={tpl.id}
                  className={cn(
                    'relative mb-1.5 cursor-pointer overflow-hidden rounded-lg border-2 border-transparent bg-ui-panel2 transition-all hover:border-ui-border',
                    activeTemplateId === tpl.id && 'border-brand-red',
                  )}
                  onClick={() => selectTemplate(tpl.id)}
                >
                  <TemplateThumb template={tpl} />
                  <div className="px-2 py-1.5 text-[11px] font-medium text-ui-text">{tpl.name}</div>
                  {activeTemplateId === tpl.id && (
                    <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-red text-[10px] text-white">
                      ✓
                    </div>
                  )}
                </div>
              ))}
          </div>
        ))}
      </div>
    </aside>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      className={cn(
        'flex items-center justify-center gap-1.5 rounded-md border border-ui-border bg-ui-panel px-1.5 py-2 text-[11px] font-medium text-ui-muted transition-all hover:border-brand-red hover:text-brand-red',
        active && 'border-brand-red/40 bg-brand-red/12 font-semibold text-brand-red',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
