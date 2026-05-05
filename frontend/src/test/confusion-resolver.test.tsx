import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/api', () => ({
  getConfusionEntries: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

import { getConfusionEntries } from '@/lib/api'
import ConfusionResolverPage from '@/app/confusion-resolver/page'
import React from 'react'

describe('ConfusionResolverPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders questions and answer previews', async () => {
    vi.mocked(getConfusionEntries).mockResolvedValue([
      {
        id: 1,
        question: 'Do I need protein powder?',
        answer: 'Not necessarily...',
        recommended_products: [{ id: 1, name: 'Whey Protein', slug: 'whey', price: '29.99' }],
      },
    ])
    render(await ConfusionResolverPage())
    expect(screen.getByText('Do I need protein powder?')).toBeInTheDocument()
    expect(screen.getByText('Not necessarily...')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Whey Protein' })).toHaveAttribute('href', '/products/whey')
  })

  it('renders empty state when no entries', async () => {
    vi.mocked(getConfusionEntries).mockResolvedValue([])
    render(await ConfusionResolverPage())
    expect(screen.getByText('Check back soon for expert answers')).toBeInTheDocument()
  })

  it('links recommended products to product detail pages', async () => {
    vi.mocked(getConfusionEntries).mockResolvedValue([
      {
        id: 1,
        question: 'Test question',
        answer: 'Test answer',
        recommended_products: [
          { id: 1, name: 'Product A', slug: 'product-a', price: '10.00' },
          { id: 2, name: 'Product B', slug: 'product-b', price: '20.00' },
        ],
      },
    ])
    render(await ConfusionResolverPage())
    expect(screen.getByRole('link', { name: 'Product A' })).toHaveAttribute('href', '/products/product-a')
    expect(screen.getByRole('link', { name: 'Product B' })).toHaveAttribute('href', '/products/product-b')
  })
})
