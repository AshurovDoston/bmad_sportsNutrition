'use client'

import Image from 'next/image'
import { DELIVERY_TIME_HOURS } from '@/lib/constants'
import { useCartStore } from '@/store/cart'
import type { ProductListItem } from '@/types/product'

interface ProductCardProps {
  product: ProductListItem
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore()
  const goalBadge = product.goal_categories[0] ?? ''

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800">
        {product.primary_image_url ? (
          <Image
            src={product.primary_image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400 text-sm">
            No image
          </div>
        )}
        {!product.is_in_stock && (
          <span className="absolute left-2 top-2 rounded bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
            Out of Stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-2">
          {product.name}
        </h3>

        {goalBadge && (
          <span className="w-fit rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {goalBadge.replace(/_/g, ' ')}
          </span>
        )}

        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
          {product.why_this_works}
        </p>

        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Delivers in {DELIVERY_TIME_HOURS} hours
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            ${product.price}
          </span>
          <button
            onClick={() => addItem(product.id)}
            disabled={!product.is_in_stock}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {product.is_in_stock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  )
}
