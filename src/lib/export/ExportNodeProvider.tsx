import { createContext, useRef, type ReactNode, type RefObject } from 'react'
import { ExportNode } from './ExportNode'

export const ExportNodeRefContext = createContext<RefObject<HTMLDivElement | null>>({ current: null })

/**
 * Monta o ExportNode uma única vez na raiz do app e disponibiliza sua ref via Context —
 * assim qualquer lugar (header, série, histórico) pode disparar uma captura sem precisar
 * prop-drill a ref por toda a árvore.
 */
export function ExportNodeProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <ExportNodeRefContext.Provider value={ref}>
      {children}
      <ExportNode ref={ref} />
    </ExportNodeRefContext.Provider>
  )
}
