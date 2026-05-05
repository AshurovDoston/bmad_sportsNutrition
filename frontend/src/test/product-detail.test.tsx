import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductDetailView } from '@/components/features/products/product-detail'
import type { ProductDetailItem } from '@/types/product'
import { DELIVERY_TIME_HOURS } from '@/lib/constants'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={String(props.alt ?? '')} src={String(props.src ?? '')} />
  ),
}))

const mockProduct: ProductDetailItem = {
  id: 1,
  name: 'Gold Standard Whey',
  slug: 'gold-standard-whey',
  price: '29.99',
  is_in_stock: true,
  goal_categories: ['muscle_gain'],
  primary_image_url: null,
  certificate_url: 'http://localhost:8000/media/cert.pdf',
  delivery_hours: 2,
  why_this_works: 'Whey protein rapidly delivers amino acids.',
  description: 'A premium whey protein supplement.',
  nutrition_facts: { Protein: '25g', Calories: '130 kcal' },
  images: [],
  reviews: [
    {
      id: 1,
      reviewer_name: 'Aziz K.',
      rating: 5,
      review_text: 'Great product!',
      is_verified: true,
      photo_url: null,
    },
  ],
}

describe('ProductDetailView', () => {
  it('renders product name, price, and description', () => {
    render(<ProductDetailView product={mockProduct} />)
    expect(screen.getByText('Gold Standard Whey')).toBeInTheDocument()
    expect(screen.getByText('$29.99')).toBeInTheDocument()
    expect(screen.getByText('A premium whey protein supplement.')).toBeInTheDocument()
  })

  it('renders "View Verified Certificate" link when certificate_url is present', () => {
    render(<ProductDetailView product={mockProduct} />)
    const link = screen.getByRole('link', { name: /view verified certificate/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'http://localhost:8000/media/cert.pdf')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders nothing for certificate when certificate_url is null', () => {
    render(<ProductDetailView product={{ ...mockProduct, certificate_url: null }} />)
    expect(screen.queryByRole('link', { name: /view verified certificate/i })).not.toBeInTheDocument()
  })

  it('renders delivery timer using DELIVERY_TIME_HOURS constant', () => {
    render(<ProductDetailView product={mockProduct} />)
    expect(screen.getByText(`Delivers in ${DELIVERY_TIME_HOURS} hours`)).toBeInTheDocument()
  })

  it('renders reviews with reviewer name and stars', () => {
    render(<ProductDetailView product={mockProduct} />)
    expect(screen.getByText('Aziz K.')).toBeInTheDocument()
    expect(screen.getByText('Great product!')).toBeInTheDocument()
    expect(screen.getByLabelText('5 out of 5 stars')).toBeInTheDocument()
    expect(screen.getByText('Verified Purchase')).toBeInTheDocument()
  })

  it('disables add-to-cart button and shows out-of-stock styling when is_in_stock is false', async () => {
    render(<ProductDetailView product={{ ...mockProduct, is_in_stock: false }} />)
    const button = screen.getByRole('button', { name: /out of stock/i })
    expect(button).toBeDisabled()
    expect(button.className).toContain('disabled:opacity-50')
    expect(button.className).toContain('disabled:cursor-not-allowed')
  })

  it('renders nutrition facts key-value pairs', () => {
    render(<ProductDetailView product={mockProduct} />)
    expect(screen.getByText('Nutrition Facts')).toBeInTheDocument()
    expect(screen.getByText('Protein')).toBeInTheDocument()
    expect(screen.getByText('25g')).toBeInTheDocument()
    expect(screen.getByText('Calories')).toBeInTheDocument()
    expect(screen.getByText('130 kcal')).toBeInTheDocument()
  })
})
