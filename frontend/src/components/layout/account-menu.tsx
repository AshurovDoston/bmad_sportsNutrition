'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/store/auth'

export function AccountMenu() {
  const [open, setOpen] = useState(false)
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  // Auth state is not persisted; SSR and first-client render both see no token,
  // so rendering directly off the store is hydration-safe.
  if (!accessToken) {
    return (
      <Link
        href="/login"
        className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Sign in
      </Link>
    )
  }

  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? 'U'

  function handleSignOut() {
    clearAuth()
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-emerald-900 dark:text-emerald-300"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {user?.is_staff && (
            <Link
              role="menuitem"
              href="/admin"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Admin
            </Link>
          )}
          <Link
            role="menuitem"
            href="/account/orders"
            onClick={() => setOpen(false)}
            className="block rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Orders
          </Link>
          <Link
            role="menuitem"
            href="/account/profile"
            onClick={() => setOpen(false)}
            className="block rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Profile
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={handleSignOut}
            className="block w-full rounded-md px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
