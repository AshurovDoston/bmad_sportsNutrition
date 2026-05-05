'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiFetch, AUTH_ENDPOINTS } from '@/lib/api'
import { User, ProfileUpdatePayload, ApiError } from '@/types/user'

interface FieldErrors {
  name?: string
  phone?: string
  delivery_address?: string
}

export function ProfileForm() {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { data: profile, isLoading } = useQuery<User>({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await apiFetch(AUTH_ENDPOINTS.PROFILE)
      if (!res.ok) throw new Error('Failed to load profile')
      return res.json() as Promise<User>
    },
  })

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')

  const nameValue = name !== '' ? name : (profile?.name ?? '')
  const phoneValue = phone !== '' ? phone : (profile?.phone ?? '')
  const addressValue = deliveryAddress !== '' ? deliveryAddress : (profile?.delivery_address ?? '')

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: ProfileUpdatePayload) => {
      const res = await apiFetch(AUTH_ENDPOINTS.PROFILE, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw err as ApiError
      }
      return res.json() as Promise<User>
    },
    onSuccess: (data) => {
      setFieldErrors({})
      setFormError(null)
      setSuccessMessage('Profile saved.')
      setName(data.name)
      setPhone(data.phone)
      setDeliveryAddress(data.delivery_address ?? '')
    },
    onError: (err: unknown) => {
      setSuccessMessage(null)
      setFieldErrors({})
      setFormError(null)
      const apiErr = err as ApiError
      if (apiErr.code === 'validation_error' && apiErr.details) {
        const mapped: FieldErrors = {}
        for (const [key, msgs] of Object.entries(apiErr.details)) {
          const msg = Array.isArray(msgs) ? msgs[0] : String(msgs)
          mapped[key as keyof FieldErrors] = typeof msg === 'object' ? (msg as { error?: string }).error ?? JSON.stringify(msg) : msg
        }
        setFieldErrors(mapped)
      } else {
        setFormError(apiErr.error || 'Failed to save profile. Please try again.')
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setFormError(null)
    setSuccessMessage(null)
    const payload: ProfileUpdatePayload = {
      name: nameValue,
      phone: phoneValue,
      delivery_address: addressValue || null,
    }
    mutate(payload)
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading profile...</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <h1 className="text-2xl font-bold">My Profile</h1>

      {formError && (
        <p className="text-red-600 text-sm" role="alert">
          {formError}
        </p>
      )}

      {successMessage && (
        <p className="text-green-600 text-sm" role="status">
          {successMessage}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Full name
        </label>
        <input
          id="name"
          type="text"
          value={nameValue}
          onChange={(e) => setName(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-full"
        />
        {fieldErrors.name && (
          <p className="text-red-600 text-sm" role="alert">
            {fieldErrors.name}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium">
          Phone number
        </label>
        <input
          id="phone"
          type="tel"
          value={phoneValue}
          onChange={(e) => setPhone(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-full"
        />
        {fieldErrors.phone && (
          <p className="text-red-600 text-sm" role="alert">
            {fieldErrors.phone}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="delivery_address" className="text-sm font-medium">
          Delivery address
        </label>
        <textarea
          id="delivery_address"
          value={addressValue}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          rows={3}
          className="border rounded px-3 py-2 text-sm w-full"
        />
        {fieldErrors.delivery_address && (
          <p className="text-red-600 text-sm" role="alert">
            {fieldErrors.delivery_address}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-black text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Save profile'}
      </button>
    </form>
  )
}
