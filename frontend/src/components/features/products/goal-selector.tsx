'use client'

import Link from 'next/link'
import { GOAL_CATEGORIES } from '@/lib/constants'

export function GoalSelector() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {GOAL_CATEGORIES.map((goal) => (
        <Link
          key={goal.slug}
          href={`/products?goal=${goal.slug}`}
          aria-label={goal.label}
          className="flex items-center justify-center rounded-xl border border-zinc-200 bg-white p-6 text-center font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500"
        >
          {goal.label}
        </Link>
      ))}
    </div>
  )
}
