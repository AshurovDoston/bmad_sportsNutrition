import * as React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800',
  ghost:
    'text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed dark:text-zinc-300 dark:hover:bg-zinc-800',
  danger:
    'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
})

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: Variant
  size?: Size
  className?: string
} = {}): string {
  return cn(base, variants[variant], sizes[size], className)
}
