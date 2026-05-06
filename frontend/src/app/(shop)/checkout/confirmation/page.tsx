'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import OrderSummary from '@/components/features/checkout/order-summary'
import GuestRegisterPrompt from '@/components/features/checkout/guest-register-prompt'
import type { OrderResponse, PendingGuestOrder } from '@/types/order'

type StoredOrder =
  | { type: 'confirmed'; order: OrderResponse }
  | { type: 'pending'; pendingOrder: PendingGuestOrder; guestData: { name: string; phone: string } }

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const [confirmedOrder, setConfirmedOrder] = useState<OrderResponse | null>(null)
  const [pendingOrder, setPendingOrder] = useState<PendingGuestOrder | null>(null)
  const [guestData, setGuestData] = useState<{ name: string; phone: string } | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('sports-nutrition-last-order')
    if (!raw) return
    sessionStorage.removeItem('sports-nutrition-last-order')
    try {
      const stored = JSON.parse(raw) as StoredOrder
      if (stored.type === 'confirmed') {
        setConfirmedOrder(stored.order)
      } else {
        setPendingOrder(stored.pendingOrder)
        setGuestData(stored.guestData)
      }
    } catch {
      // Malformed data — show generic confirmation
    }
  }, [])

  function handleOrderConfirmed(order: OrderResponse) {
    setConfirmedOrder(order)
    setPendingOrder(null)
    setGuestData(null)
  }

  const isAuth = isAuthenticated()

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 space-y-8">
      {confirmedOrder ? (
        <>
          <OrderSummary order={confirmedOrder} />
          {isAuth ? (
            <div className="flex flex-col gap-3 text-center">
              <Link
                href="/"
                className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Continue Shopping
              </Link>
              <Link
                href="/account/orders"
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:underline"
              >
                View your orders
              </Link>
            </div>
          ) : null}
        </>
      ) : pendingOrder ? (
        <>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-green-600 dark:text-green-400">Your order is confirmed</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Order #{orderNumber}</p>
          </div>
          <GuestRegisterPrompt
            pendingOrderItems={pendingOrder.items}
            deliveryAddress={pendingOrder.delivery_address}
            subtotal={pendingOrder.subtotal}
            defaultName={guestData?.name ?? ''}
            defaultPhone={guestData?.phone ?? ''}
            onOrderConfirmed={handleOrderConfirmed}
          />
        </>
      ) : (
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-green-600 dark:text-green-400">Your order is confirmed</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Order #{orderNumber}</p>
          <Link
            href="/"
            className="inline-block mt-4 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Continue Shopping
          </Link>
        </div>
      )}
    </main>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-12 text-center">Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  )
}
