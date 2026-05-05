import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProductList } from '@/components/features/products/product-list'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: (key: string) => (key === 'goal' ? 'muscle_gain' : null) }),
}))

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

const mockProduct = {
  id: 1,
  name: 'Gold Standard Whey',
  slug: 'gold-standard-100-whey',
  price: '29.99',
  is_in_stock: true,
  goal_categories: ['muscle_gain'],
  primary_image_url: null,
  certificate_url: null,
  delivery_hours: 2,
  why_this_works: 'Whey protein rapidly delivers amino acids.',
}

describe('ProductList', () => {
  it('renders loading skeleton while fetching', () => {
    server.use(
      http.get('http://localhost:8000/api/v1/products/', async () => {
        await new Promise(() => {})
      })
    )
    renderWithQuery(<ProductList />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders product cards after fetch', async () => {
    server.use(
      http.get('http://localhost:8000/api/v1/products/', () =>
        HttpResponse.json({ count: 2, next: null, previous: null, results: [
          mockProduct,
          { ...mockProduct, id: 2, name: 'Creatine Monohydrate' },
        ]})
      )
    )
    renderWithQuery(<ProductList />)
    await waitFor(() => {
      expect(screen.getByText('Gold Standard Whey')).toBeInTheDocument()
      expect(screen.getByText('Creatine Monohydrate')).toBeInTheDocument()
    })
  })

  it('renders out-of-stock badge and disables button for unavailable products', async () => {
    server.use(
      http.get('http://localhost:8000/api/v1/products/', () =>
        HttpResponse.json({ count: 1, next: null, previous: null, results: [
          { ...mockProduct, is_in_stock: false },
        ]})
      )
    )
    renderWithQuery(<ProductList />)
    await waitFor(() => {
      const outOfStockElements = screen.getAllByText('Out of Stock')
      expect(outOfStockElements.length).toBeGreaterThan(0)
    })
    const buttons = screen.getAllByRole('button', { name: /out of stock/i })
    expect(buttons[0]).toBeDisabled()
  })

  it('renders empty state when no products match goal', async () => {
    server.use(
      http.get('http://localhost:8000/api/v1/products/', () =>
        HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
      )
    )
    renderWithQuery(<ProductList />)
    await waitFor(() => {
      expect(
        screen.getByText(/no products found — try a different goal or filter/i)
      ).toBeInTheDocument()
    })
  })
})
