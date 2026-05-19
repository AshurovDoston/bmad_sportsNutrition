'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [inputValue, setInputValue] = useState(searchParams.get('search') ?? '')

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (inputValue) {
        params.set('search', inputValue)
      } else {
        params.delete('search')
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue])

  return (
    <div className="relative mb-4">
      <input
        type="text"
        placeholder="Search by name or brand..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 pr-10 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
      />
      {inputValue && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setInputValue('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 px-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          ×
        </Button>
      )}
    </div>
  )
}
