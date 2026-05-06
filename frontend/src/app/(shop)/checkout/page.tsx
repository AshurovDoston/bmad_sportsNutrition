'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { createOrder } from '@/lib/api'
import CheckoutForm from '@/components/features/checkout/checkout-form'
import MockPaymentForm from '@/components/features/checkout/mock-payment-form'
import type { CheckoutFormData } from '@/components/features/checkout/checkout-form'
import type { MockPaymentData } from '@/components/features/checkout/mock-payment-form'
import type { ApiError } from '@/types/user'

export default function CheckoutPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const isAuth = useAuthStore((state) => state.accessToken !== null)
  const { serverCart, guestItems, fetchServerCart, clearCart, isLoading: cartLoading } = useCartStore()

  const [step, setStep] = useState<'address' | 'payment'>('address')
  const [checkoutData, setCheckoutData] = useState<CheckoutFormData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuth && !serverCart) {
      fetchServerCart()
    }
  }, [isAuth, serverCart, fetchServerCart])

  useEffect(() => {
    if (cartLoading) return
    const isEmpty = isAuth ? (serverCart?.items.length ?? 0) === 0 : guestItems.length === 0
    if (isEmpty) router.replace('/cart')
  }, [serverCart, guestItems, cartLoading, isAuth, router])

  function handleAddressSubmit(data: CheckoutFormData) {
    setCheckoutData(data)
    setStep('payment')
  }

  async function submitOrder(paymentData: MockPaymentData) {
    if (!checkoutData) return
    setIsLoading(true)
    setPaymentError(null)

    const items = isAuth
      ? (serverCart?.items ?? []).map((i) => ({ product_id: i.product.id, quantity: i.quantity }))
      : guestItems.map((i) => ({ product_id: i.productId, quantity: i.quantity }))

    if (isAuth) {
      try {
        const order = await createOrder({ delivery_address: checkoutData.delivery_address, items })
        clearCart()
        sessionStorage.setItem('sports-nutrition-last-order', JSON.stringify({ type: 'confirmed', order }))
        router.push(`/checkout/confirmation?order=${order.order_number}`)
      } catch (err: unknown) {
        const apiError = err as ApiError
        if (apiError?.code === 'product_out_of_stock') {
          setPaymentError('One or more items in your cart are out of stock. Please review your cart.')
        } else {
          setPaymentError('Something went wrong. Please try again.')
        }
      } finally {
        setIsLoading(false)
      }
    } else {
      const guestSubtotal = guestItems
        .reduce((sum, i) => sum + parseFloat(i.productPrice) * i.quantity, 0)
        .toFixed(2)
      sessionStorage.setItem(
        'sports-nutrition-last-order',
        JSON.stringify({
          type: 'pending',
          pendingOrder: { delivery_address: checkoutData.delivery_address, items, subtotal: guestSubtotal },
          guestData: { name: checkoutData.name, phone: checkoutData.phone },
        })
      )
      const tempOrderNumber = `PENDING-${Date.now()}`
      router.push(`/checkout/confirmation?order=${tempOrderNumber}`)
      setIsLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">Checkout</h1>

      {step === 'address' && (
        <CheckoutForm
          isGuest={!isAuth}
          defaultAddress={user?.delivery_address}
          onSubmit={handleAddressSubmit}
          isLoading={isLoading}
        />
      )}

      {step === 'payment' && (
        <MockPaymentForm
          onSubmit={submitOrder}
          onBack={() => setStep('address')}
          isLoading={isLoading}
          error={paymentError}
        />
      )}
    </main>
  )
}
