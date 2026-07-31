import type { ButtonHTMLAttributes } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { cn } from '@/lib/utils'

type MotionButtonProps = HTMLMotionProps<'button'> & ButtonHTMLAttributes<HTMLButtonElement>

/**
 * Espelha .btn-primary do Gerador/index.html original (linha 134).
 * 🆕 FASE 12: física de mola via `motion` — spec exata do Base/MARCA.md ("Botões
 * possuem física de mola (spring). Scale 1.02 no hover, 0.95 no clique — é a
 * interação assinatura do sistema"). O CSS original só tinha `transform: scale()`
 * num `transition` linear comum, sem spring de verdade.
 */
export function HeaderPrimaryButton({ className, disabled, ...props }: MotionButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg bg-brand-red px-5 py-2 font-heading text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-brand-red-hover active:bg-brand-red-pressed disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      {...props}
    />
  )
}

/** Espelha .btn-secondary do Gerador/index.html original (linha 155). */
export function HeaderSecondaryButton({
  className,
  active,
  disabled,
  ...props
}: MotionButtonProps & { active?: boolean }) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border border-ui-border bg-ui-panel2 px-4 py-1.5 text-[13px] text-ui-text transition-colors hover:border-brand-red hover:text-brand-red disabled:cursor-not-allowed disabled:opacity-40',
        active && 'border-brand-red text-brand-red',
        className,
      )}
      {...props}
    />
  )
}
