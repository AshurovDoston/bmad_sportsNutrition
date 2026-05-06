'use client'

import { useState } from 'react'
import { apiUrl, AUTH_ENDPOINTS, createOrder } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import type { User } from '@/types/user'
import type { OrderResponse } from '@/types/order'

interface GuestRegisterPromptProps {
  pendingOrderItems: Array<{ product_id: number; quantity: number }>
  deliveryAddress: string
  subtotal: string
  defaultName?: string
  defaultPhone?: string
  onOrderConfirmed: (order: OrderResponse) => void
}

export default function GuestRegisterPrompt({
  pendingOrderItems,
  deliveryAddress,
  subtotal,
  defaultName = '',
  defaultPhone = '',
  onOrderConfirmed,
}: GuestRegisterPromptProps) {
  const [name, setName] = useState(defaultName)
  const [phone, setPhone] = useState(defaultPhone)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Register
      const regRes = await fetch(apiUrl(AUTH_ENDPOINTS.REGISTER), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password }),
      })
      if (!regRes.ok) {
        const err = await regRes.json() as { details?: { phone?: string[] }; error?: string }
        if (err.details?.phone) {
          setError('This phone is already registered — please log in.')
        } else {
          setError('Registration failed. Please try again.')
        }
        return
      }

      // Step 2: Login to get token
      const loginRes = await fetch(apiUrl(AUTH_ENDPOINTS.LOGIN), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      if (!loginRes.ok) {
        setError('Login after registration failed.')
        return
      }
      const { access_token } = await loginRes.json() as { access_token: string }

      // Fetch user profile (LoginView only returns access_token)
      const profileRes = await fetch(apiUrl(AUTH_ENDPOINTS.PROFILE), {
        headers: { Authorization: `Bearer ${access_token}` },
        credentials: 'include',
      })
      if (!profileRes.ok) {
        setError('Something went wrong. Please try again.')
        return
      }
      const userProfile = await profileRes.json() as User

      // Step 3: Set auth in Zustand
      useAuthStore.getState().setAuth(access_token, userProfile)

      // Step 4: Create the order
      const order = await createOrder({ delivery_address: deliveryAddress, items: pendingOrderItems })

      // Step 5: Clear cart
      useCartStore.getState().clearCart()

      // Step 6: Update sessionStorage with confirmed order and notify parent
      sessionStorage.setItem('sports-nutrition-last-order', JSON.stringify({ type: 'confirmed', order }))
      onOrderConfirmed(order)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Create an account to track your order
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Order total: {subtotal}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="guest-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Full Name
          </label>
          <input
            id="guest-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </div>

        <div>
          <label htmlFor="guest-phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Phone Number
          </label>
          <input
            id="guest-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </div>

        <div>
          <label htmlFor="guest-password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Password
          </label>
          <input
            id="guest-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          Create Account & Confirm Order
        </button>
      </form>
    </div>
  )
}
