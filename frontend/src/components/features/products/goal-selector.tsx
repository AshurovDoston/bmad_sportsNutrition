'use client'

import Link from 'next/link'
import { GOAL_CATEGORIES } from '@/lib/constants'
import { Card } from '@/components/ui/card'

export function GoalSelector() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {GOAL_CATEGORIES.map((goal) => (
        <Card key={goal.slug} variant="interactive">
          <Link
            href={`/products?goal=${goal.slug}`}
            aria-label={goal.label}
            className="flex items-center justify-center p-6 text-center font-semibold text-zinc-800 dark:text-zinc-100"
          >
            {goal.label}
          </Link>
        </Card>
      ))}
    </div>
  )
}
