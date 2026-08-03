import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AppHeader } from './AppHeader'
import { Gallery } from '@/features/editor/Gallery/Gallery'
import { Canvas } from '@/features/editor/Canvas/Canvas'
import { ControlPanel } from '@/features/editor/ControlPanel/ControlPanel'
import { SeriesBar } from '@/features/series/SeriesBar'
import { useUiStore, type AppTab } from '@/stores/useUiStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { TEMPLATES } from '@/features/templates/registry'
import { useExportCard } from '@/lib/export/useExportCard'
import { useSaveArt } from '@/features/history/useSaveArt'
import { BrandView } from '@/features/brand/BrandView'
import { AIConfigView } from '@/features/ai/AIConfigView'
import { RendersView } from '@/features/renders/RendersView'
import { HistoryView } from '@/features/history/HistoryView'
import { cn } from '@/lib/utils'
import { CommandPalette } from '@/features/commands/CommandPalette'

const TAB_ORDER: AppTab[] = ['create', 'brand', 'ai-config', 'renders', 'history']

/** Espelha <div class="app-body"> + as 5 abas do Gerador/index.html (linhas 1270-1855). */
export function AppShell() {
  const activeTab = useUiStore((s) => s.activeTab)
  const setTab = useUiStore((s) => s.setTab)
  const leftPanelOpen = useUiStore((s) => s.leftPanelOpen)
  const rightPanelOpen = useUiStore((s) => s.rightPanelOpen)
  const closePanels = useUiStore((s) => s.closePanels)
  const activeTemplateId = useEditorStore((s) => s.activeTemplateId)
  const selectTemplate = useEditorStore((s) => s.selectTemplate)
  const undo = () => useEditorStore.temporal.getState().undo()
  const redo = () => useEditorStore.temporal.getState().redo()
  const { downloadPNG } = useExportCard()
  const { saveCurrentArt } = useSaveArt()

  // Espelha init(): seleciona o primeiro template por padrão (linha 3544).
  useEffect(() => {
    if (!activeTemplateId && TEMPLATES.length > 0) {
      selectTemplate(TEMPLATES[0]!.id)
    }
  }, [activeTemplateId, selectTemplate])

  // Ganchos de teste E2E (FASE 13 — diff visual contra o baseline do HTML original).
  // Só existem em dev; não fazem parte do bundle de produção (tree-shaken pelo `if (import.meta.env.DEV)`).
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as Record<string, unknown>).__testSelectTemplate = (id: string) =>
      useEditorStore.getState().selectTemplate(id)
    ;(window as unknown as Record<string, unknown>).__testSetDarkMode = (dark: boolean) =>
      useEditorStore.setState({ darkMode: dark })
    ;(window as unknown as Record<string, unknown>).__testSetZoom = (zoom: number) =>
      useEditorStore.setState({ zoom: zoom as never })
  }, [])

  // Espelha os atalhos globais de teclado (linhas 3550-3559) + 🆕 atalhos extras da Fase 12
  // (Ctrl+S salvar, Ctrl+E exportar, 1..5 trocar de aba) — não existiam no app original.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isTypingTarget =
        e.target instanceof HTMLElement &&
        (e.target.isContentEditable || ['INPUT', 'TEXTAREA'].includes(e.target.tagName))

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        void saveCurrentArt()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault()
        void downloadPNG()
        return
      }
      if (!isTypingTarget && !e.ctrlKey && !e.metaKey && /^[1-5]$/.test(e.key)) {
        const tab = TAB_ORDER[Number(e.key) - 1]
        if (tab) setTab(tab)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [saveCurrentArt, downloadPNG, setTab])

  return (
    <div className="flex h-screen flex-col">
      <AppHeader onDownload={downloadPNG} onSave={saveCurrentArt} />
      <CommandPalette onTab={setTab} onSave={() => { void saveCurrentArt() }} onExport={() => { void downloadPNG() }} />

      <AnimatePresence mode="wait">
        {activeTab === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative flex flex-1 overflow-hidden"
          >
            <div className="hidden xl:flex">
              <Gallery />
            </div>
            {(leftPanelOpen || rightPanelOpen) && (
              <button
                aria-label="Fechar painéis"
                className="fixed inset-0 z-30 bg-black/60 xl:hidden"
                onClick={closePanels}
              />
            )}
            <div
              className={cn(
                'fixed top-[96px] bottom-0 left-0 z-40 flex max-w-[88vw] shadow-2xl transition-transform duration-200 md:top-13 xl:hidden',
                leftPanelOpen ? 'translate-x-0' : '-translate-x-full',
              )}
            >
              <Gallery />
            </div>
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <SeriesBar />
              <Canvas />
            </div>
            <div className="hidden xl:flex">
              <ControlPanel />
            </div>
            <div
              className={cn(
                'fixed top-[96px] right-0 bottom-0 z-40 flex max-w-[88vw] shadow-2xl transition-transform duration-200 md:top-13 xl:hidden',
                rightPanelOpen ? 'translate-x-0' : 'translate-x-full',
              )}
            >
              <ControlPanel />
            </div>
          </motion.div>
        )}
        {activeTab === 'brand' && (
          <motion.div
            key="brand"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 overflow-hidden"
          >
            <BrandView />
          </motion.div>
        )}
        {activeTab === 'ai-config' && (
          <motion.div
            key="ai-config"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 overflow-hidden"
          >
            <AIConfigView />
          </motion.div>
        )}
        {activeTab === 'renders' && (
          <motion.div
            key="renders"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 overflow-hidden"
          >
            <RendersView />
          </motion.div>
        )}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 overflow-hidden"
          >
            <HistoryView />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
