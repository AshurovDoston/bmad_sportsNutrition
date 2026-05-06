'use client'

import { useState } from 'react'

export interface CheckoutFormData {
  name?: string
  phone?: string
  delivery_address: string
}

interface CheckoutFormProps {
  isGuest: boolean
  defaultAddress?: string | null
  onSubmit: (data: CheckoutFormData) => void
  isLoading: boolean
}

export default function CheckoutForm({ isGuest, defaultAddress, onSubmit, isLoading }: CheckoutFormProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState(defaultAddress ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (isGuest) {
      if (!name.trim()) next.name = 'Name is required'
      if (!phone.trim()) next.phone = 'Phone is required'
    }
    if (!address.trim()) next.address = 'Delivery address is required'
    else if (address.trim().length < 5) next.address = 'Address must be at least 5 characters'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const data: CheckoutFormData = { delivery_address: address.trim() }
    if (isGuest) {
      data.name = name.trim()
      data.phone = phone.trim()
    }
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Delivery Details</h2>

      {isGuest && (
        <>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              placeholder="Your full name"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              placeholder="998901234567"
            />
            {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
          </div>
        </>
      )}

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Delivery Address
        </label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          placeholder="123 Tashkent St, Tashkent"
        />
        {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50"
      >
        Continue to Payment
      </button>
    </form>
  )
}
