import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RegisterForm } from '@/components/features/auth/register-form'
import { useAuthStore } from '@/store/auth'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  useAuthStore.getState().clearAuth()
  mockPush.mockReset()
})

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('RegisterForm', () => {
  it('calls setAuth and redirects to / on successful registration', async () => {
    server.use(
      http.post('http://localhost:8000/api/v1/auth/register/', () =>
        HttpResponse.json({ id: 1, name: 'Test User', phone: '+1234567890' }, { status: 201 })
      ),
      http.post('http://localhost:8000/api/v1/auth/login/', () =>
        HttpResponse.json({ access_token: 'access-token-123' })
      )
    )

    renderWithQuery(<RegisterForm />)
    await userEvent.type(screen.getByLabelText(/full name/i), 'Test User')
    await userEvent.type(screen.getByLabelText(/phone/i), '+1234567890')
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe('access-token-123')
    })
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('shows inline error on duplicate phone', async () => {
    server.use(
      http.post('http://localhost:8000/api/v1/auth/register/', () =>
        HttpResponse.json(
          { error: 'Phone already registered', code: 'phone_already_registered', details: {} },
          { status: 400 }
        )
      )
    )

    renderWithQuery(<RegisterForm />)
    await userEvent.type(screen.getByLabelText(/full name/i), 'Test User')
    await userEvent.type(screen.getByLabelText(/phone/i), '+1234567890')
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/this phone number is already registered/i)
      ).toBeInTheDocument()
    })
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('shows form-level banner on rate_limit_exceeded', async () => {
    server.use(
      http.post('http://localhost:8000/api/v1/auth/register/', () =>
        HttpResponse.json(
          { error: 'Rate limit exceeded', code: 'rate_limit_exceeded', details: {} },
          { status: 429 }
        )
      )
    )

    renderWithQuery(<RegisterForm />)
    await userEvent.type(screen.getByLabelText(/full name/i), 'Test User')
    await userEvent.type(screen.getByLabelText(/phone/i), '+1234567890')
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/too many attempts/i)).toBeInTheDocument()
    })
  })
})
