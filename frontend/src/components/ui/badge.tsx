import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'verified'
  | 'stock'
  | 'goal'
  | 'discount'
  | 'out-of-stock'
  | 'neutral'

const variants: Record<BadgeVariant, string> = {
  verified:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  stock: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  goal: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  discount: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  'out-of-stock': 'bg-red-500 text-white',
  neutral: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ variant = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
