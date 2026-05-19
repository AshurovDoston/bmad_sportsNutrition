'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface CartItemRowProps {
  name: string
  imageUrl: string | null
  price: string
  quantity: number
  linePrice: string
  onQuantityChange: (q: number) => void
  onRemove: () => void
}

export function CartItemRow({
  name,
  imageUrl,
  price,
  quantity,
  linePrice,
  onQuantityChange,
  onRemove,
}: CartItemRowProps) {
  return (
    <div className="flex gap-4 py-4 border-b border-zinc-200 dark:border-zinc-700">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400 text-xs">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <p className="font-medium text-zinc-900 dark:text-zinc-50 line-clamp-2">{name}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">${price} each</p>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => (quantity === 1 ? onRemove() : onQuantityChange(quantity - 1))}
              aria-label="Decrease quantity"
              className="h-7 w-7 px-0"
            >
              −
            </Button>
            <span className="w-6 text-center text-sm font-medium">{quantity}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onQuantityChange(quantity + 1)}
              aria-label="Increase quantity"
              className="h-7 w-7 px-0"
            >
              +
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">${linePrice}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              aria-label="Remove item"
              className="text-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
            >
              Remove
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
