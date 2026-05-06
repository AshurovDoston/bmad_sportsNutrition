import Link from 'next/link'
import { GOAL_CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface GoalsMenuProps {
  variant?: 'dropdown' | 'list'
  onNavigate?: () => void
}

export function GoalsMenu({ variant = 'dropdown', onNavigate }: GoalsMenuProps) {
  if (variant === 'list') {
    return (
      <ul className="flex flex-col gap-1">
        {GOAL_CATEGORIES.map((goal) => (
          <li key={goal.slug}>
            <Link
              href={`/products?goal=${goal.slug}`}
              onClick={onNavigate}
              className="block rounded-lg px-3 py-2 text-base text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {goal.label}
            </Link>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul
      className={cn(
        'flex w-56 flex-col rounded-lg border border-zinc-200 bg-white p-1 shadow-lg',
        'dark:border-zinc-700 dark:bg-zinc-900'
      )}
    >
      {GOAL_CATEGORIES.map((goal) => (
        <li key={goal.slug}>
          <Link
            href={`/products?goal=${goal.slug}`}
            onClick={onNavigate}
            className="block rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {goal.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
