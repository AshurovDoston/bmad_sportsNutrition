import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProfileForm } from '@/components/features/auth/profile-form'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

const PROFILE_URL = 'http://localhost:8000/api/v1/auth/profile/'

const mockProfile = {
  id: 1,
  name: 'Test User',
  phone: '1234567890',
  delivery_address: '123 St',
  is_staff: false,
}

const server = setupServer(
  http.get(PROFILE_URL, () => HttpResponse.json(mockProfile))
)

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('ProfileForm', () => {
  it('renders with pre-filled values from API response', async () => {
    renderWithQuery(<ProfileForm />)

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toHaveValue('Test User')
    })
    expect(screen.getByLabelText(/phone/i)).toHaveValue('1234567890')
    expect(screen.getByLabelText(/delivery address/i)).toHaveValue('123 St')
  })

  it('shows success message after submitting valid data', async () => {
    server.use(
      http.patch(PROFILE_URL, () =>
        HttpResponse.json({ ...mockProfile, name: 'Updated Name' })
      )
    )

    renderWithQuery(<ProfileForm />)

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toHaveValue('Test User')
    })

    await userEvent.clear(screen.getByLabelText(/full name/i))
    await userEvent.type(screen.getByLabelText(/full name/i), 'Updated Name')
    await userEvent.click(screen.getByRole('button', { name: /save profile/i }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Profile saved.')
    })
  })

  it('shows field-level error on invalid phone and preserves other field values', async () => {
    server.use(
      http.patch(PROFILE_URL, () =>
        HttpResponse.json(
          {
            error: 'Validation failed',
            code: 'validation_error',
            details: {
              phone: [{ error: 'Phone already registered', code: 'phone_already_registered', details: {} }],
            },
          },
          { status: 400 }
        )
      )
    )

    renderWithQuery(<ProfileForm />)

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toHaveValue('Test User')
    })

    await userEvent.clear(screen.getByLabelText(/phone/i))
    await userEvent.type(screen.getByLabelText(/phone/i), '9999999999')
    await userEvent.click(screen.getByRole('button', { name: /save profile/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/full name/i)).toHaveValue('Test User')
    expect(screen.getByLabelText(/delivery address/i)).toHaveValue('123 St')
  })
})
