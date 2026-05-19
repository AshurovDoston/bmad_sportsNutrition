'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { CartItemRow } from '@/components/features/cart/cart-item-row'
import { CartSummary } from '@/components/features/cart/cart-summary'
import { Container } from '@/components/layout/container'

export default function CartPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
  const {
    serverCart,
    guestItems,
    isLoading,
    fetchServerCart,
    updateServerQuantity,
    removeServerItem,
    updateGuestQuantity,
    removeGuestItem,
  } = useCartStore()

  useEffect(() => {
    if (isAuthenticated) fetchServerCart()
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  const guestSubtotal = guestItems
    .reduce((sum, i) => sum + parseFloat(i.productPrice) * i.quantity, 0)
    .toFixed(2)

  const hasItems = isAuthenticated
    ? (serverCart?.items.length ?? 0) > 0
    : guestItems.length > 0

  if (isLoading) {
    return (
      <Container className="py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Your Cart</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
            ))}
          </div>
        </div>
      </Container>
    )
  }

  if (!hasItems) {
    return (
      <Container className="py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Your Cart</h1>
          <div className="py-16 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">Your cart is empty.</p>
            <Link href="/products" className="mt-4 inline-block underline text-zinc-700 dark:text-zinc-300">
              Continue Shopping
            </Link>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Your Cart</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {isAuthenticated && serverCart ? (
              serverCart.items.map((item) => (
                <CartItemRow
                  key={item.id}
                  name={item.product.name}
                  imageUrl={item.product.primary_image_url}
                  price={item.product.price}
                  quantity={item.quantity}
                  linePrice={item.line_price}
                  onQuantityChange={(q) => updateServerQuantity(item.id, q)}
                  onRemove={() => removeServerItem(item.id)}
                />
              ))
            ) : (
              guestItems.map((item) => (
                <CartItemRow
                  key={item.productId}
                  name={item.productName}
                  imageUrl={item.productImageUrl}
                  price={item.productPrice}
                  quantity={item.quantity}
                  linePrice={(parseFloat(item.productPrice) * item.quantity).toFixed(2)}
                  onQuantityChange={(q) => updateGuestQuantity(item.productId, q)}
                  onRemove={() => removeGuestItem(item.productId)}
                />
              ))
            )}
          </div>

          <div className="lg:col-span-1">
            <CartSummary
              subtotal={isAuthenticated && serverCart ? serverCart.subtotal : guestSubtotal}
            />
          </div>
        </div>
      </div>
    </Container>
  )
}
