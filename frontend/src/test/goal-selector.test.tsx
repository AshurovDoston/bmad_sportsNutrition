import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoalSelector } from '@/components/features/products/goal-selector'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}))

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('GoalSelector', () => {
  it('renders 4 goal cards', () => {
    renderWithQuery(<GoalSelector />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(4)
  })

  it('each goal card links to correct URL with underscore slugs', () => {
    renderWithQuery(<GoalSelector />)
    expect(screen.getByRole('link', { name: /muscle gain/i })).toHaveAttribute(
      'href',
      '/products?goal=muscle_gain'
    )
    expect(screen.getByRole('link', { name: /fat loss/i })).toHaveAttribute(
      'href',
      '/products?goal=fat_loss'
    )
    expect(screen.getByRole('link', { name: /endurance/i })).toHaveAttribute(
      'href',
      '/products?goal=endurance'
    )
    expect(screen.getByRole('link', { name: /general health/i })).toHaveAttribute(
      'href',
      '/products?goal=general_health'
    )
  })
})
