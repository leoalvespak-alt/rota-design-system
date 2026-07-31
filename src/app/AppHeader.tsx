import { useEditorStore, ZOOM_LEVELS } from '@/stores/useEditorStore'
import { useUiStore, type AppTab } from '@/stores/useUiStore'
import { useSeriesStore } from '@/stores/useSeriesStore'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HeaderPrimaryButton, HeaderSecondaryButton } from './HeaderButtons'
import { useSeriesExport } from '@/features/series/useSeriesExport'

const TABS: { id: AppTab; label: string }[] = [
  { id: 'create', label: 'Criar Arte' },
  { id: 'brand', label: 'Marca' },
  { id: 'ai-config', label: '⚙ AI' },
  { id: 'renders', label: 'Renders' },
  { id: 'history', label: 'Histórico' },
]

/** Espelha <header class="app-header"> do Gerador/index.html (linhas 1272-1318). */
export function AppHeader({ onDownload, onSave }: { onDownload: () => void; onSave: () => void }) {
  const activeTab = useUiStore((s) => s.activeTab)
  const setTab = useUiStore((s) => s.setTab)
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
    <header className="flex h-13 shrink-0 items-center gap-4 border-b border-ui-border bg-ui-panel px-5">
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 30 30" width={30} height={30} fill="none">
          <polygon points="15,2 28,28 2,28" fill="#C1121F" />
          <line x1="15" y1="10" x2="15" y2="26" stroke="white" strokeWidth="2" strokeDasharray="3 3" />
        </svg>
        <span className="font-heading text-xl font-bold tracking-[0.06em] text-white uppercase">
          Rota de <span className="text-brand-red">Ataque</span>
        </span>
      </div>
      <div className="h-6.5 w-px bg-ui-border" />
      <div className="flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              'rounded-md px-4 py-1.5 font-sans text-[13px] font-medium text-ui-muted transition-all hover:bg-ui-panel2 hover:text-ui-text',
              activeTab === tab.id && 'bg-ui-panel2 text-ui-text',
            )}
            onClick={() => setTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'create' && (
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-full border border-ui-border bg-ui-panel2 px-3 py-1 text-xs text-ui-muted">
            {format === 'portrait' ? 'Retrato 1080×1920' : 'Quadrado 1080×1080'}
          </span>
          <div className="flex items-center gap-2">
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
          <HeaderSecondaryButton active={seriesMode} onClick={toggleSeriesMode}>
            ☰ Modo Série
          </HeaderSecondaryButton>
          {seriesSlidesCount > 0 && (
            <HeaderPrimaryButton onClick={exportSeriesZIP}>📦 Exportar Série</HeaderPrimaryButton>
          )}
          <HeaderSecondaryButton title="Desfazer (Ctrl+Z)" onClick={() => undo()}>
            ↩ Desfazer
          </HeaderSecondaryButton>
          <HeaderSecondaryButton title="Refazer (Ctrl+Y)" onClick={() => redo()}>
            ↪ Refazer
          </HeaderSecondaryButton>
          <HeaderSecondaryButton onClick={resetCard}>↺ Resetar</HeaderSecondaryButton>
          <HeaderSecondaryButton onClick={onSave}>💾 Salvar Arte</HeaderSecondaryButton>
          <HeaderPrimaryButton onClick={onDownload}>⬇ Baixar PNG</HeaderPrimaryButton>
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
