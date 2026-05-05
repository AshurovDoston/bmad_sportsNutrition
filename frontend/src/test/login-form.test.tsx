import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginForm } from '@/components/features/auth/login-form'
import { useAuthStore } from '@/store/auth'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}))

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  useAuthStore.getState().clearAuth()
})

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('LoginForm', () => {
  it('calls setAuth with access_token on successful login', async () => {
    server.use(
      http.post('http://localhost:8000/api/v1/auth/login/', () =>
        HttpResponse.json({ access_token: 'test-token' })
      )
    )

    renderWithQuery(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/phone/i), '+1234567890')
    await userEvent.type(screen.getByLabelText(/password/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe('test-token')
    })
  })

  it('shows inline error on invalid_credentials', async () => {
    server.use(
      http.post('http://localhost:8000/api/v1/auth/login/', () =>
        HttpResponse.json(
          { error: 'Invalid credentials', code: 'invalid_credentials', details: {} },
          { status: 401 }
        )
      )
    )

    renderWithQuery(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/phone/i), '+1234567890')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/invalid phone number or password/i)
      ).toBeInTheDocument()
    })
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('shows form-level banner on rate_limit_exceeded', async () => {
    server.use(
      http.post('http://localhost:8000/api/v1/auth/login/', () =>
        HttpResponse.json(
          { error: 'Rate limit exceeded', code: 'rate_limit_exceeded', details: {} },
          { status: 429 }
        )
      )
    )

    renderWithQuery(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/phone/i), '+1234567890')
    await userEvent.type(screen.getByLabelText(/password/i), 'pass')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByText(/too many attempts/i)).toBeInTheDocument()
    })
  })
})
