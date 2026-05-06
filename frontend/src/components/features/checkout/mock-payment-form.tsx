'use client'

import { useState } from 'react'

export interface MockPaymentData {
  card_number: string
  expiry: string
  cvv: string
}

interface MockPaymentFormProps {
  onSubmit: (data: MockPaymentData) => void
  onBack: () => void
  isLoading: boolean
  error?: string | null
}

export default function MockPaymentForm({ onSubmit, onBack, isLoading, error }: MockPaymentFormProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!cardNumber.trim()) next.cardNumber = 'Card number is required'
    if (!expiry.trim()) next.expiry = 'Expiry is required'
    if (!cvv.trim()) next.cvv = 'CVV is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ card_number: cardNumber.trim(), expiry: expiry.trim(), cvv: cvv.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Payment Details</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        This is a demo — no real payment is processed.
      </p>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="card_number" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Card Number
        </label>
        <input
          id="card_number"
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          placeholder="1234 5678 9012 3456"
        />
        {errors.cardNumber && <p className="text-red-600 text-sm mt-1">{errors.cardNumber}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="expiry" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Expiry
          </label>
          <input
            id="expiry"
            type="text"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            placeholder="MM/YY"
          />
          {errors.expiry && <p className="text-red-600 text-sm mt-1">{errors.expiry}</p>}
        </div>
        <div>
          <label htmlFor="cvv" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            CVV
          </label>
          <input
            id="cvv"
            type="text"
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            placeholder="123"
          />
          {errors.cvv && <p className="text-red-600 text-sm mt-1">{errors.cvv}</p>}
        </div>
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
        Place Order
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm text-zinc-600 dark:text-zinc-400 hover:underline"
      >
        ← Back
      </button>
    </form>
  )
}
