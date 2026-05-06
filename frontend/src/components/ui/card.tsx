import * as React from 'react'
import { cn } from '@/lib/utils'

type CardVariant = 'default' | 'interactive'

const variants: Record<CardVariant, string> = {
  default:
    'rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900',
  interactive:
    'rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-400 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500',
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'default', className, ...props },
  ref
) {
  return <div ref={ref} className={cn(variants[variant], className)} {...props} />
})
