import { Suspense } from 'react'
import { GoalSelector } from '@/components/features/products/goal-selector'
import { ProductList } from '@/components/features/products/product-list'
import { SearchBar } from '@/components/features/products/search-bar'
import { FilterPanel } from '@/components/features/products/filter-panel'

export const revalidate = 60

export default function ProductsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">Products</h1>
      <div className="mb-8">
        <GoalSelector />
      </div>
      <Suspense fallback={<div className="animate-pulse text-zinc-400">Loading...</div>}>
        <SearchBar />
        <FilterPanel />
        <ProductList />
      </Suspense>
    </main>
  )
}
