'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { useCartStore } from '@/store/cart'

function getSnapshot(): number {
  return useCartStore.getState().itemCount()
}

function getServerSnapshot(): number {
  // SSR returns 0 so the badge is hidden until hydration; avoids mismatch
  // because the persisted Zustand state is only available client-side.
  return 0
}

function subscribe(onChange: () => void): () => void {
  return useCartStore.subscribe(onChange)
}

export function CartBadge() {
  const count = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const showBadge = count > 0
  const display = count >= 100 ? '99+' : String(count)

  return (
    <Link
      href="/cart"
      aria-label={`Cart${showBadge ? `, ${count} item${count === 1 ? '' : 's'}` : ''}`}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
      </svg>
      {showBadge && (
        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold leading-none text-white">
          {display}
        </span>
      )}
    </Link>
  )
}
