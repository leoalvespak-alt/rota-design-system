import { useEditorStore, ZOOM_LEVELS } from '@/stores/useEditorStore'
import { useUiStore, type AppTab } from '@/stores/useUiStore'
import { useSeriesStore } from '@/stores/useSeriesStore'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HeaderPrimaryButton, HeaderSecondaryButton } from './HeaderButtons'
import { useSeriesExport } from '@/features/series/useSeriesExport'
import { ProjectSessionControls } from '@/features/projects/ProjectSessionControls'
import {
  Download,
  Layers3,
  Package,
  PanelLeft,
  PanelRight,
  Redo2,
  RotateCcw,
  Save,
  Undo2,
} from 'lucide-react'

const TABS: { id: AppTab; label: string }[] = [
  { id: 'create', label: 'Criar Arte' },
  { id: 'brand', label: 'Marca' },
  { id: 'ai-config', label: 'AI' },
  { id: 'renders', label: 'Renders' },
  { id: 'history', label: 'Historico' },
]

/** Espelha <header class="app-header"> do Gerador/index.html (linhas 1272-1318). */
export function AppHeader({ onDownload, onSave }: { onDownload: () => void; onSave: () => void }) {
  const activeTab = useUiStore((s) => s.activeTab)
  const setTab = useUiStore((s) => s.setTab)
  const toggleLeftPanel = useUiStore((s) => s.toggleLeftPanel)
  const toggleRightPanel = useUiStore((s) => s.toggleRightPanel)
  const format = useEditorStore((s) => s.format)
  const zoom = useEditorStore((s) => s.zoom)
  const setZoom = useEditorStore((s) => s.setZoom)
  const resetCard = useEditorStore((s) => s.resetCard)
  const undo = useEditorStore.temporal.getState().undo
  const redo = useEditorStore.temporal.getState().redo
  const seriesMode = useSeriesStore((s) => s.seriesMode)
  const toggleSeriesMode = useSeriesStore((s) => s.toggleSeriesMode)
  const seriesSlidesCount = useSeriesStore((s) => s.slides.length)
  const { exportSeriesZIP } = useSeriesExport()

  return (
    <header className="relative z-50 flex min-h-13 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-ui-border bg-ui-panel px-3 py-2 lg:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <svg viewBox="0 0 30 30" width={30} height={30} fill="none" className="shrink-0">
          <polygon points="15,2 28,28 2,28" fill="#C1121F" />
          <line x1="15" y1="10" x2="15" y2="26" stroke="white" strokeWidth="2" strokeDasharray="3 3" />
        </svg>
        <span className="font-heading text-lg leading-none font-bold tracking-[0.06em] text-white uppercase sm:text-xl">
          Rota de <span className="text-brand-red">Ataque</span>
        </span>
      </div>

      <div className="hidden h-6.5 w-px bg-ui-border md:block" />

      <ProjectSessionControls />

      <nav className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto" aria-label="Abas principais">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              'shrink-0 rounded-md px-3 py-1.5 font-sans text-[13px] font-medium whitespace-nowrap text-ui-muted transition-all hover:bg-ui-panel2 hover:text-ui-text lg:px-4',
              activeTab === tab.id && 'bg-ui-panel2 text-ui-text',
            )}
            onClick={() => setTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'create' && (
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2">
          <div className="flex items-center gap-1 xl:hidden">
            <HeaderSecondaryButton title="Abrir templates" aria-label="Abrir templates" onClick={toggleLeftPanel}>
              <PanelLeft className="size-4" />
            </HeaderSecondaryButton>
            <HeaderSecondaryButton title="Abrir controles" aria-label="Abrir controles" onClick={toggleRightPanel}>
              <PanelRight className="size-4" />
            </HeaderSecondaryButton>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <span className="rounded-full border border-ui-border bg-ui-panel2 px-3 py-1 text-xs whitespace-nowrap text-ui-muted">
              {format === 'portrait' ? 'Retrato 1080x1920' : 'Quadrado 1080x1080'}
            </span>
            <span className="text-xs text-ui-muted">Zoom</span>
            <Select value={String(zoom)} onValueChange={(v) => setZoom(Number(v) as never)}>
              <SelectTrigger className="w-20 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ZOOM_LEVELS.map((z) => (
                  <SelectItem key={z} value={String(z)}>
                    {Math.round(z * 100)}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <HeaderSecondaryButton
              active={seriesMode}
              title="Modo serie"
              className="hidden lg:inline-flex"
              onClick={toggleSeriesMode}
            >
              <Layers3 className="size-4" />
              <span className="hidden 2xl:inline">Modo Serie</span>
            </HeaderSecondaryButton>
            {seriesSlidesCount > 0 && (
              <HeaderPrimaryButton title="Exportar serie" onClick={exportSeriesZIP}>
                <Package className="size-4" />
                <span className="hidden 2xl:inline">Exportar Serie</span>
              </HeaderPrimaryButton>
            )}
            <HeaderSecondaryButton
              title="Desfazer (Ctrl+Z)"
              aria-label="Desfazer"
              className="hidden lg:inline-flex"
              onClick={() => undo()}
            >
              <Undo2 className="size-4" />
              <span className="hidden 2xl:inline">Desfazer</span>
            </HeaderSecondaryButton>
            <HeaderSecondaryButton
              title="Refazer (Ctrl+Y)"
              aria-label="Refazer"
              className="hidden lg:inline-flex"
              onClick={() => redo()}
            >
              <Redo2 className="size-4" />
              <span className="hidden 2xl:inline">Refazer</span>
            </HeaderSecondaryButton>
            <HeaderSecondaryButton
              title="Resetar arte"
              aria-label="Resetar arte"
              className="hidden lg:inline-flex"
              onClick={resetCard}
            >
              <RotateCcw className="size-4" />
              <span className="hidden 2xl:inline">Resetar</span>
            </HeaderSecondaryButton>
            <HeaderSecondaryButton title="Salvar arte" className="hidden sm:inline-flex" onClick={onSave}>
              <Save className="size-4" />
              <span className="hidden sm:inline">Salvar</span>
            </HeaderSecondaryButton>
            <HeaderPrimaryButton title="Baixar PNG" onClick={onDownload}>
              <Download className="size-4" />
              <span className="hidden sm:inline">PNG</span>
            </HeaderPrimaryButton>
          </div>
        </div>
      )}

      {activeTab === 'brand' && (
        <span className="ml-auto rounded-full border border-brand-red/30 bg-ui-panel2 px-3 py-1 text-xs text-brand-red">
          Guia de Identidade Visual
        </span>
      )}
    </header>
  )
}
