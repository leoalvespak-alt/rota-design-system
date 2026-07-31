import { create } from 'zustand'

export type AppTab = 'create' | 'brand' | 'ai-config' | 'renders' | 'history'
export type GalleryFilter = 'all' | 'square' | 'portrait' | 'carousel' | 'fiscal' | 'policial' | 'tribunal' | 'motivacao'

interface UiState {
  activeTab: AppTab
  galleryFilter: GalleryFilter
  setTab: (tab: AppTab) => void
  setGalleryFilter: (filter: GalleryFilter) => void
}

/** Espelha setTab()/activeFilter do Gerador/index.html original (linhas 3445, 2890). */
export const useUiStore = create<UiState>()((set) => ({
  activeTab: 'create',
  galleryFilter: 'all',
  setTab: (tab) => set({ activeTab: tab }),
  setGalleryFilter: (filter) => set({ galleryFilter: filter }),
}))
