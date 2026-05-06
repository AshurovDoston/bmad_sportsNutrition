'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function FilterPanel() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [brandValue, setBrandValue] = useState(searchParams.get('brand') ?? '')
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') ?? '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') ?? '')

  const hasActiveFilters = !!(
    searchParams.get('search') ||
    searchParams.get('brand') ||
    searchParams.get('min_price') ||
    searchParams.get('max_price')
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (brandValue) {
        params.set('brand', brandValue)
      } else {
        params.delete('brand')
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandValue])

  function handleMinPriceChange(value: string) {
    setMinPrice(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('min_price', value)
    } else {
      params.delete('min_price')
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function handleMaxPriceChange(value: string) {
    setMaxPrice(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('max_price', value)
    } else {
      params.delete('max_price')
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function handleClearFilters() {
    setBrandValue('')
    setMinPrice('')
    setMaxPrice('')
    const goal = searchParams.get('goal')
    if (goal) {
      router.replace(`${pathname}?goal=${goal}`, { scroll: false })
    } else {
      router.replace(pathname, { scroll: false })
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Brand</label>
        <input
          type="text"
          placeholder="e.g. Optimum"
          value={brandValue}
          onChange={(e) => setBrandValue(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Min Price ($)</label>
        <input
          type="number"
          placeholder="0"
          value={minPrice}
          onChange={(e) => handleMinPriceChange(e.target.value)}
          onBlur={(e) => handleMinPriceChange(e.target.value)}
          min={0}
          className="w-28 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Max Price ($)</label>
        <input
          type="number"
          placeholder="999"
          value={maxPrice}
          onChange={(e) => handleMaxPriceChange(e.target.value)}
          onBlur={(e) => handleMaxPriceChange(e.target.value)}
          min={0}
          className="w-28 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
        />
      </div>
      {hasActiveFilters && (
        <Button variant="secondary" size="md" onClick={handleClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
