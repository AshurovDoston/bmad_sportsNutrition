import Link from 'next/link'
import { GOAL_CATEGORIES } from '@/lib/constants'
import { Container } from './container'

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="bg-emerald-600 text-white">
        <Container>
          <p className="py-3 text-center text-sm font-medium">
            Verified products · 2-hour Tashkent delivery · Real reviews from real lifters.
          </p>
        </Container>
      </div>

      <Container>
        <div className="grid grid-cols-1 gap-8 py-10 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Shop
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {GOAL_CATEGORIES.map((goal) => (
                <li key={goal.slug}>
                  <Link
                    href={`/products?goal=${goal.slug}`}
                    className="text-sm text-zinc-700 hover:text-emerald-600 dark:text-zinc-300"
                  >
                    {goal.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/products"
                  className="text-sm text-zinc-700 hover:text-emerald-600 dark:text-zinc-300"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/confusion-resolver"
                  className="text-sm text-zinc-700 hover:text-emerald-600 dark:text-zinc-300"
                >
                  Confusion Resolver
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Account
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              <li>
                <Link
                  href="/login"
                  className="text-sm text-zinc-700 hover:text-emerald-600 dark:text-zinc-300"
                >
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-sm text-zinc-700 hover:text-emerald-600 dark:text-zinc-300"
                >
                  Register
                </Link>
              </li>
              <li>
                <Link
                  href="/account/orders"
                  className="text-sm text-zinc-700 hover:text-emerald-600 dark:text-zinc-300"
                >
                  Orders
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-2 border-t border-zinc-200 py-6 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 sm:flex-row sm:items-center">
          <p>&copy; {year} Sports Nutrition. All rights reserved.</p>
          <p>Tashkent, Uzbekistan</p>
        </div>
      </Container>
    </footer>
  )
}
