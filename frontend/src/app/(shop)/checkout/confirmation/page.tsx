'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import OrderSummary from '@/components/features/checkout/order-summary'
import GuestRegisterPrompt from '@/components/features/checkout/guest-register-prompt'
import type { OrderResponse, PendingGuestOrder } from '@/types/order'
import { Container } from '@/components/layout/container'
import { buttonClasses } from '@/components/ui/button'

type StoredOrder =
  | { type: 'confirmed'; order: OrderResponse }
  | { type: 'pending'; pendingOrder: PendingGuestOrder; guestData: { name: string; phone: string } }

function readStoredOrder(): StoredOrder | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem('sports-nutrition-last-order')
  if (!raw) return null
  sessionStorage.removeItem('sports-nutrition-last-order')
  try {
    return JSON.parse(raw) as StoredOrder
  } catch {
    return null
  }
}

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const isAuth = useAuthStore((state) => state.accessToken !== null)

  // Read stored order on mount only — avoids SSR/client divergence and the
  // resulting hydration mismatch. Page renders a placeholder until hydrated.
  const [hydrated, setHydrated] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState<OrderResponse | null>(null)
  const [pendingOrder, setPendingOrder] = useState<PendingGuestOrder | null>(null)
  const [guestData, setGuestData] = useState<{ name: string; phone: string } | null>(null)

  /* eslint-disable react-hooks/set-state-in-effect --
     sessionStorage is only available after hydration; populating state from it
     in an effect is the correct pattern to avoid SSR/client divergence. */
  useEffect(() => {
    const stored = readStoredOrder()
    if (stored?.type === 'confirmed') {
      setConfirmedOrder(stored.order)
    } else if (stored?.type === 'pending') {
      setPendingOrder(stored.pendingOrder)
      setGuestData(stored.guestData)
    }
    setHydrated(true)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleOrderConfirmed(order: OrderResponse) {
    setConfirmedOrder(order)
    setPendingOrder(null)
    setGuestData(null)
  }

  if (!hydrated) {
    return (
      <Container className="py-12">
        <div className="mx-auto max-w-2xl text-center text-zinc-500 dark:text-zinc-400">
          Loading...
        </div>
      </Container>
    )
  }

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        {confirmedOrder ? (
          <>
            <OrderSummary order={confirmedOrder} />
            {isAuth ? (
              <div className="flex flex-col gap-3 text-center">
                <Link
                  href="/"
                  className={buttonClasses({ variant: 'primary', size: 'md', className: 'w-full' })}
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
              className={buttonClasses({ variant: 'primary', size: 'md', className: 'mt-4 inline-flex' })}
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </Container>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-12">
          <div className="mx-auto max-w-2xl text-center">Loading...</div>
        </Container>
      }
    >
      <ConfirmationContent />
    </Suspense>
  )
}
