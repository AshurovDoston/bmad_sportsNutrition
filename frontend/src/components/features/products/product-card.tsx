'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { DELIVERY_TIME_HOURS } from '@/lib/constants'
import { useCartStore } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ProductListItem } from '@/types/product'

interface ProductCardProps {
  product: ProductListItem
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore()
  const goalBadge = product.goal_categories[0] ?? ''
  const [added, setAdded] = useState(false)

  return (
    <Card variant="interactive" className="flex w-full flex-col overflow-hidden">
      <Link href={`/products/${product.slug}`} className="contents">
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
            <Badge variant="out-of-stock" className="absolute left-2 top-2 px-2 py-0.5 font-semibold">
              Out of Stock
            </Badge>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-2">
            {product.name}
          </h3>

          {goalBadge && (
            <Badge variant="goal" className="w-fit">
              {goalBadge.replace(/_/g, ' ')}
            </Badge>
          )}

          <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
            {product.why_this_works}
          </p>

          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Delivers in {DELIVERY_TIME_HOURS} hours
          </p>

          <div className="mt-auto pt-2">
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              ${product.price}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-end px-4 pb-4">
        <Button
          variant="primary"
          size="sm"
          onClick={async () => {
            await addItem(product)
            setAdded(true)
            setTimeout(() => setAdded(false), 2000)
          }}
          disabled={!product.is_in_stock}
        >
          {added ? 'Added!' : product.is_in_stock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </div>
    </Card>
  )
}
