'use client'

import Image from 'next/image'

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
            <button
              onClick={() => quantity === 1 ? onRemove() : onQuantityChange(quantity - 1)}
              className="flex h-7 w-7 items-center justify-center rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={() => onQuantityChange(quantity + 1)}
              className="flex h-7 w-7 items-center justify-center rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">${linePrice}</span>
            <button
              onClick={onRemove}
              className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              aria-label="Remove item"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
