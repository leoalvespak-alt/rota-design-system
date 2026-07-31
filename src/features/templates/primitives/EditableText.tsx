import { useEffect, useLayoutEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { useEditorStore } from '@/stores/useEditorStore'

interface EditableTextProps {
  /** Caminho no state.elements, ex: "title", "stats.0.num", "rows.1.2". */
  path: string
  value: string
  as?: 'div' | 'span'
  style?: CSSProperties
  className?: string
}

/**
 * Substitui o padrão `contenteditable="true" data-field="..."` usado em todo template
 * do Gerador/index.html original, e o listener genérico em renderCanvas() (linhas 2980-2985)
 * que fazia `state.elements[field] = el.innerHTML`.
 *
 * FASE 5 — ponto de risco #1 do plano de migração: um contentEditable controlado pelo
 * ciclo normal de render do React reseta o cursor pro início a cada atualização. A solução
 * aqui é tratar o elemento como uma "ilha não-controlada": o React NUNCA reconcilia seus
 * filhos depois da montagem (não há `children`/`dangerouslySetInnerHTML` reativo) —
 * todo o conteúdo é escrito via `innerHTML` imperativo, e só quando:
 *   (a) o elemento acabou de montar, OU
 *   (b) o valor mudou externamente (undo/redo, resetCard, IA, troca de template) E o
 *       elemento não está focado — nunca sobrescreve o que o usuário está digitando.
 *
 * Isso também fecha os itens 1-2 da auditoria: como `path` vem tipado a partir do próprio
 * template (nunca inventado solto num atributo HTML), não existe mais como gravar em uma
 * chave que nenhum outro código lê de volta.
 */
export function EditableText({ path, value, as = 'div', style, className }: EditableTextProps) {
  const ref = useRef<HTMLDivElement & HTMLSpanElement>(null)
  const setElementField = useEditorStore((s) => s.setElementField)
  const isFocused = useRef(false)

  // Montagem: escreve o valor inicial uma única vez.
  useLayoutEffect(() => {
    const el = ref.current
    if (el) el.innerHTML = value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Atualizações externas: só aplica se o elemento não estiver focado.
  useEffect(() => {
    const el = ref.current
    if (!el || isFocused.current) return
    if (el.innerHTML !== value) el.innerHTML = value
  }, [value])

  const pathSegments = path.split('.').map((seg) => (/^\d+$/.test(seg) ? Number(seg) : seg))

  const handleInput = () => {
    const el = ref.current
    if (!el) return
    setElementField(pathSegments, el.innerHTML)
  }

  const Tag = as
  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-field={path}
      className={className}
      style={style}
      onFocus={() => {
        isFocused.current = true
      }}
      onBlur={() => {
        isFocused.current = false
        handleInput()
      }}
      onInput={handleInput}
    />
  )
}
