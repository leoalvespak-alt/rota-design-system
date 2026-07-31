import { useEditorStore } from '@/stores/useEditorStore'
import { getTemplateById } from '@/features/templates/registry'
import { TextureControls } from './TextureControls'
import { WatermarkControls } from './WatermarkControls'
import { BgLibraryControls } from './BgLibraryControls'
import { AICopyControls } from './AICopyControls'
import { AIImageControls } from './AIImageControls'

/**
 * Espelha buildRightPanel() do Gerador/index.html original (linha 3305).
 * Ordem preservada: controles do template -> IA copy/imagem (Fase 10) -> textura ->
 * marca d'água -> fundo da biblioteca.
 */
export function ControlPanel() {
  const activeTemplateId = useEditorStore((s) => s.activeTemplateId)
  const elements = useEditorStore((s) => s.elements)

  const tpl = activeTemplateId ? getTemplateById(activeTemplateId) : undefined

  if (!tpl) {
    return (
      <aside className="w-70 shrink-0 overflow-y-auto border-l border-ui-border bg-ui-panel">
        <div className="p-10 text-center text-[13px] text-ui-muted">
          Selecione um template
          <br />
          para ver as opções
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-70 shrink-0 overflow-y-auto border-l border-ui-border bg-ui-panel">
      <div className="border-b border-ui-border px-4 pt-4 pb-3.5">
        <div className="text-[10px] font-semibold tracking-[0.1em] text-ui-muted uppercase">
          Editando: {tpl.name}
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-ui-muted">
          Clique sobre qualquer texto no card para editar diretamente.
        </p>
      </div>
      <tpl.Controls elements={elements as never} />
      <AICopyControls />
      <AIImageControls />
      <TextureControls />
      <WatermarkControls />
      <BgLibraryControls />
    </aside>
  )
}
