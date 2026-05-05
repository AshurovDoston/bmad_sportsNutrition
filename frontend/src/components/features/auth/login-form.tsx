'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiFetch, AUTH_ENDPOINTS } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { LoginResponse, ApiError } from '@/types/user'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [credentialsError, setCredentialsError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(AUTH_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw data as ApiError
      }
      return data as LoginResponse
    },
    onSuccess: (data) => {
      setAuth(data.access_token, null)
      const next = searchParams.get('next') || '/'
      router.push(next)
    },
    onError: (err: unknown) => {
      setCredentialsError(null)
      setFormError(null)
      const apiErr = err as ApiError
      if (apiErr.code === 'invalid_credentials') {
        setCredentialsError('Invalid phone number or password.')
      } else if (apiErr.code === 'rate_limit_exceeded') {
        setFormError('Too many attempts. Try again later.')
      } else {
        setFormError(apiErr.error || 'Login failed. Please try again.')
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCredentialsError(null)
    setFormError(null)
    mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <h1 className="text-2xl font-bold">Log in</h1>

      {formError && (
        <p className="text-red-600 text-sm" role="alert">
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium">
          Phone number
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="border rounded px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border rounded px-3 py-2 text-sm"
        />
        {credentialsError && (
          <p className="text-red-600 text-sm" role="alert">
            {credentialsError}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-black text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {isPending ? 'Logging in...' : 'Log in'}
      </button>

      <p className="text-sm text-center">
        Don&apos;t have an account?{' '}
        <a href="/register" className="underline">
          Register
        </a>
      </p>
    </form>
  )
}
