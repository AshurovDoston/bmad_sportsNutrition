'use client'

import Image from 'next/image'
import { useState } from 'react'
import { DELIVERY_TIME_HOURS } from '@/lib/constants'
import { useCartStore } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ProductDetailItem } from '@/types/product'

interface Props {
  product: ProductDetailItem
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} className="text-amber-400">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export function ProductDetailView({ product }: Props) {
  const { addItem } = useCartStore()
  const [added, setAdded] = useState(false)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Left: images */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
            {product.primary_image_url ? (
              <Image
                src={product.primary_image_url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-400 text-sm">
                No image
              </div>
            )}
          </div>

          {product.images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  {img.image_url ? (
                    <Image
                      src={img.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="25vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-400 text-xs">
                      No image
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: details */}
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{product.name}</h1>

          <div className="flex flex-wrap gap-2">
            {product.goal_categories.map((slug) => (
              <Badge key={slug} variant="goal">
                {slug.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">${product.price}</span>
            {!product.is_in_stock && (
              <Badge variant="out-of-stock" className="px-2 py-0.5 font-semibold">
                Out of Stock
              </Badge>
            )}
          </div>

          <p className="text-sm text-zinc-500 dark:text-zinc-400">{product.why_this_works}</p>

          <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-line">{product.description}</p>

          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Delivers in {DELIVERY_TIME_HOURS} hours
          </p>

          {product.certificate_url && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Verified Certificate:</span>
              <a
                href={product.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 underline hover:text-blue-500 dark:text-blue-400"
              >
                View Verified Certificate
              </a>
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            className="w-full"
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
      </div>

      {/* Nutrition Facts */}
      {Object.keys(product.nutrition_facts).length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Nutrition Facts</h2>
          <dl className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
            {Object.entries(product.nutrition_facts).map(([key, val]) => (
              <div key={key} className="flex justify-between px-4 py-2">
                <dt className="font-medium text-zinc-700 dark:text-zinc-300">{key}</dt>
                <dd className="text-right text-zinc-600 dark:text-zinc-400">{String(val)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Reviews */}
      {product.reviews.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Reviews</h2>
          <div className="flex flex-col gap-4">
            {product.reviews.map((review) => (
              <div key={review.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{review.reviewer_name}</span>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    {review.is_verified && (
                      <Badge variant="verified">Verified Purchase</Badge>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{review.review_text}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
