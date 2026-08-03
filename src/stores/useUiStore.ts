import { create } from 'zustand'

export type AppTab = 'create' | 'brand' | 'ai-config' | 'renders' | 'history'
export type GalleryFilter = 'all' | 'square' | 'portrait' | 'carousel' | 'fiscal' | 'policial' | 'tribunal' | 'motivacao'

interface UiState {
  activeTab: AppTab
  galleryFilter: GalleryFilter
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  setTab: (tab: AppTab) => void
  setGalleryFilter: (filter: GalleryFilter) => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  closePanels: () => void
}

/** Espelha setTab()/activeFilter do Gerador/index.html original (linhas 3445, 2890). */
export const useUiStore = create<UiState>()((set) => ({
  activeTab: 'create',
  galleryFilter: 'all',
  leftPanelOpen: false,
  rightPanelOpen: false,
  setTab: (tab) => set({ activeTab: tab, leftPanelOpen: false, rightPanelOpen: false }),
  setGalleryFilter: (filter) => set({ galleryFilter: filter }),
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen, rightPanelOpen: false })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen, leftPanelOpen: false })),
  closePanels: () => set({ leftPanelOpen: false, rightPanelOpen: false }),
}))
