'use client'

import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getProducts } from '@/lib/api'
import { ProductCard } from './product-card'

export function ProductList() {
  const searchParams = useSearchParams()
  const goal = searchParams.get('goal') ?? undefined

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', { goal }],
    queryFn: () => getProducts({ goal }),
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-center text-zinc-500">
        Could not load products. Please try again.
      </p>
    )
  }

  if (!data || data.results.length === 0) {
    return (
      <p className="text-center text-zinc-500">
        No products found — try a different goal or filter
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {data.results.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
