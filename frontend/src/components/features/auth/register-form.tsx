'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiFetch, AUTH_ENDPOINTS } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { RegisterResponse, LoginResponse, ApiError } from '@/types/user'

interface FieldErrors {
  name?: string
  phone?: string
  password?: string
}

export function RegisterForm() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const registerRes = await apiFetch(AUTH_ENDPOINTS.REGISTER, {
        method: 'POST',
        body: JSON.stringify({ name, phone, password }),
      })
      const registerData = await registerRes.json()

      if (!registerRes.ok) {
        const err = registerData as ApiError
        throw err
      }

      const registerBody = registerData as RegisterResponse

      const loginRes = await apiFetch(AUTH_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      })
      const loginData = await loginRes.json()

      if (!loginRes.ok) {
        const err = loginData as ApiError
        throw err
      }

      return { register: registerBody, login: loginData as LoginResponse }
    },
    onSuccess: ({ register, login }) => {
      setAuth(login.access_token, {
        id: register.id,
        name: register.name,
        phone: register.phone,
        is_staff: false,
        delivery_address: null,
      })
      router.push('/')
    },
    onError: (err: unknown) => {
      setFieldErrors({})
      setFormError(null)
      const apiErr = err as ApiError
      if (apiErr.code === 'phone_already_registered') {
        setFieldErrors({ phone: 'This phone number is already registered.' })
      } else if (apiErr.code === 'validation_error' && apiErr.details) {
        const mapped: FieldErrors = {}
        for (const [key, msgs] of Object.entries(apiErr.details)) {
          mapped[key as keyof FieldErrors] = msgs[0]
        }
        setFieldErrors(mapped)
      } else if (apiErr.code === 'rate_limit_exceeded') {
        setFormError('Too many attempts. Try again later.')
      } else {
        setFormError(apiErr.error || 'Registration failed. Please try again.')
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setFormError(null)
    mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <h1 className="text-2xl font-bold">Create account</h1>

      {formError && (
        <p className="text-red-600 text-sm" role="alert">
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Full name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border rounded px-3 py-2 text-sm"
        />
        {fieldErrors.name && (
          <p className="text-red-600 text-sm">{fieldErrors.name}</p>
        )}
      </div>

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
        {fieldErrors.phone && (
          <p className="text-red-600 text-sm">{fieldErrors.phone}</p>
        )}
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
        {fieldErrors.password && (
          <p className="text-red-600 text-sm">{fieldErrors.password}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-black text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {isPending ? 'Creating account...' : 'Register'}
      </button>

      <p className="text-sm text-center">
        Already have an account?{' '}
        <a href="/login" className="underline">
          Log in
        </a>
      </p>
    </form>
  )
}
