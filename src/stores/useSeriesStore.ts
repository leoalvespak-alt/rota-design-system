import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { TextureType, WatermarkPosition } from './useDecorStore'

export interface SeriesSlide {
  id: string
  templateId: string
  elements: Record<string, unknown>
  darkMode: boolean
  watermark: { enabled: boolean; text: string; position: WatermarkPosition; opacity: number }
  texture: { type: TextureType; enabled: boolean; opacity: number }
}

interface SeriesState {
  seriesMode: boolean
  slides: SeriesSlide[]
}

interface SeriesActions {
  toggleSeriesMode: () => void
  addSlide: (slide: Omit<SeriesSlide, 'id'>) => void
  loadSlide: (id: string) => SeriesSlide | undefined
  deleteSlide: (id: string) => void
  reorderSlides: (fromIndex: number, toIndex: number) => void
}

/**
 * Substitui state.seriesMode / state.seriesSlides do Gerador/index.html original
 * (linhas 1959-1960, funções toggleSeriesMode/addSlideToSeries/loadSlideFromSeries/
 * deleteSlideFromSeries, linhas 3770-3812).
 *
 * 🆕 reorderSlides não existia no HTML original — recurso novo da Fase 8 (drag-and-drop
 * via @dnd-kit/sortable), não substitui nenhum comportamento, só adiciona.
 */
export const useSeriesStore = create<SeriesState & SeriesActions>()(
  immer((set, get) => ({
    seriesMode: false,
    slides: [],

    toggleSeriesMode: () =>
      set((s) => {
        s.seriesMode = !s.seriesMode
      }),

    addSlide: (slide) =>
      set((s) => {
        s.slides.push({ id: Date.now().toString(), ...structuredClone(slide) })
      }),

    loadSlide: (id) => get().slides.find((sl) => sl.id === id),

    deleteSlide: (id) =>
      set((s) => {
        s.slides = s.slides.filter((sl) => sl.id !== id)
      }),

    reorderSlides: (fromIndex, toIndex) =>
      set((s) => {
        const [moved] = s.slides.splice(fromIndex, 1)
        if (moved) s.slides.splice(toIndex, 0, moved)
      }),
  })),
)
