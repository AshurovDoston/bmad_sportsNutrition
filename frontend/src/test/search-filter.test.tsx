import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { SearchBar } from '@/components/features/products/search-bar'
import { FilterPanel } from '@/components/features/products/filter-panel'
import { ProductList } from '@/components/features/products/product-list'

const mockReplace = vi.fn()
const mockGet = vi.fn((key: string) => {
  const params: Record<string, string> = { search: 'whey' }
  return params[key] ?? null
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/products',
  useSearchParams: () => ({
    get: mockGet,
    toString: () => 'search=whey',
  }),
}))

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  mockReplace.mockClear()
})

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('SearchBar', () => {
  it('initializes from URL search param', () => {
    mockGet.mockImplementation((key: string) => (key === 'search' ? 'whey' : null))
    renderWithQuery(<SearchBar />)
    const input = screen.getByPlaceholderText(/search by name or brand/i) as HTMLInputElement
    expect(input.value).toBe('whey')
  })

  it('renders with empty input when no search param', () => {
    mockGet.mockImplementation(() => null)
    renderWithQuery(<SearchBar />)
    const input = screen.getByPlaceholderText(/search by name or brand/i) as HTMLInputElement
    expect(input.value).toBe('')
  })
})

describe('FilterPanel', () => {
  it('shows clear button only when filters are active', () => {
    mockGet.mockImplementation((key: string) => (key === 'search' ? 'whey' : null))
    renderWithQuery(<FilterPanel />)
    expect(screen.getByText('Clear filters')).toBeInTheDocument()
  })

  it('does not show clear button when no filters are active', () => {
    mockGet.mockImplementation(() => null)
    renderWithQuery(<FilterPanel />)
    expect(screen.queryByText('Clear filters')).not.toBeInTheDocument()
  })
})

describe('ProductList with search and filter params', () => {
  const mockProduct = {
    id: 1,
    name: 'Gold Standard Whey',
    slug: 'gold-standard-whey',
    price: '29.99',
    is_in_stock: true,
    goal_categories: ['muscle_gain'],
    primary_image_url: null,
    certificate_url: null,
    delivery_hours: 2,
    why_this_works: 'Whey protein rapidly delivers amino acids.',
  }

  it('passes search param to getProducts query', async () => {
    mockGet.mockImplementation((key: string) => (key === 'search' ? 'whey' : null))
    let capturedUrl = ''
    server.use(
      http.get('http://localhost:8000/api/v1/products/', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({
          count: 1, next: null, previous: null,
          results: [mockProduct],
        })
      })
    )
    renderWithQuery(<ProductList />)
    await waitFor(() => {
      expect(capturedUrl).toContain('search=whey')
    })
  })

  it('passes brand and price params to getProducts query', async () => {
    mockGet.mockImplementation((key: string) => {
      const params: Record<string, string> = { brand: 'Optimum', min_price: '10', max_price: '50' }
      return params[key] ?? null
    })
    let capturedUrl = ''
    server.use(
      http.get('http://localhost:8000/api/v1/products/', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({
          count: 1, next: null, previous: null,
          results: [mockProduct],
        })
      })
    )
    renderWithQuery(<ProductList />)
    await waitFor(() => {
      expect(capturedUrl).toContain('brand=Optimum')
    })
  })
})
