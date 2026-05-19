'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { GoalsMenu } from './goals-menu'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  function close() {
    setOpen(false)
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
          {open ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </>
          ) : (
            <>
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop — taps anywhere outside the panel close the drawer. */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="fixed inset-x-0 bottom-0 top-16 z-30 cursor-default bg-black/30 md:hidden"
          />
          <div
            id="mobile-nav-panel"
            className="absolute left-0 right-0 top-full z-40 border-b border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          >
            <nav className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
              <div>
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Goals
                </p>
                <GoalsMenu variant="list" onNavigate={close} />
              </div>

              <div className="flex flex-col gap-1">
                <Link
                  href="/products"
                  onClick={close}
                  className="rounded-lg px-3 py-2 text-base text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  All Products
                </Link>
                <Link
                  href="/confusion-resolver"
                  onClick={close}
                  className="rounded-lg px-3 py-2 text-base text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Confusion Resolver
                </Link>
              </div>

              <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
                {accessToken ? (
                  <div className="flex flex-col gap-1">
                    {user?.is_staff && (
                      <Link
                        href="/admin"
                        onClick={close}
                        className="rounded-lg px-3 py-2 text-base text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Admin
                      </Link>
                    )}
                    <Link
                      href="/account/orders"
                      onClick={close}
                      className="rounded-lg px-3 py-2 text-base text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Orders
                    </Link>
                    <Link
                      href="/account/profile"
                      onClick={close}
                      className="rounded-lg px-3 py-2 text-base text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        clearAuth()
                        close()
                      }}
                      className="rounded-lg px-3 py-2 text-left text-base text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <Link
                      href="/login"
                      onClick={close}
                      className="rounded-lg px-3 py-2 text-base text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      onClick={close}
                      className="rounded-lg px-3 py-2 text-base text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Create account
                    </Link>
                  </div>
                )}
              </div>

              <p className="border-t border-zinc-200 px-3 pt-3 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                Verified products · 2-hour Tashkent delivery
              </p>
            </nav>
          </div>
        </>
      )}
    </div>
  )
}
