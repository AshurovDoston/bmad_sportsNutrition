'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Container } from './container'
import { CartBadge } from './cart-badge'
import { GoalsMenu } from './goals-menu'
import { AccountMenu } from './account-menu'
import { MobileNav } from './mobile-nav'

function NavLink({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-10 items-center rounded-lg px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
        active
          ? 'text-emerald-600 font-semibold'
          : 'text-zinc-700 font-medium hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
      )}
    >
      {label}
    </Link>
  )
}

export function SiteHeader() {
  const pathname = usePathname() ?? ''
  const isProducts = pathname === '/products' || pathname.startsWith('/products/')
  const isResolver = pathname === '/confusion-resolver'
  const [goalsOpen, setGoalsOpen] = useState(false)
  const goalsRef = useRef<HTMLDivElement>(null)

  // Click-outside + Escape to close. Route-change closure happens via the
  // onNavigate callback wired into each goal link below.
  useEffect(() => {
    if (!goalsOpen) return
    function onClickAway(e: MouseEvent) {
      if (goalsRef.current && !goalsRef.current.contains(e.target as Node)) {
        setGoalsOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setGoalsOpen(false)
    }
    document.addEventListener('mousedown', onClickAway)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClickAway)
      document.removeEventListener('keydown', onKey)
    }
  }, [goalsOpen])

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 dark:border-zinc-800 dark:bg-zinc-950/90 dark:supports-[backdrop-filter]:bg-zinc-950/75">
      <Container>
        <div className="relative flex h-16 items-center justify-between gap-4">
          {/* Left: wordmark + mobile drawer */}
          <div className="flex items-center gap-2">
            <MobileNav />
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-zinc-900 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-zinc-50"
            >
              Sports Nutrition
            </Link>
          </div>

          {/* Center desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <div ref={goalsRef} className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={goalsOpen}
                onClick={() => setGoalsOpen((v) => !v)}
                className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Goals
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn('h-3.5 w-3.5 transition-transform', goalsOpen && 'rotate-180')}
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {goalsOpen && (
                <div className="absolute left-0 top-full pt-2">
                  <GoalsMenu variant="dropdown" onNavigate={() => setGoalsOpen(false)} />
                </div>
              )}
            </div>

            <NavLink href="/products" label="All Products" active={isProducts} />
            <NavLink
              href="/confusion-resolver"
              label="Confusion Resolver"
              active={isResolver}
            />
          </nav>

          {/* Right: search placeholder, cart, account */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Search"
              className="hidden h-10 w-10 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:inline-flex"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            <CartBadge />
            <AccountMenu />
          </div>
        </div>
      </Container>
    </header>
  )
}
