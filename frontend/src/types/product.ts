export interface GoalCategory {
  id: number
  name: string
  slug: string
  why_it_works: string
}

export interface ProductListItem {
  id: number
  name: string
  slug: string
  price: string
  is_in_stock: boolean
  goal_categories: string[]
  primary_image_url: string | null
  certificate_url: string | null
  delivery_hours: number
  why_this_works: string
}

export interface ProductDetailItem extends ProductListItem {
  description: string
  nutrition_facts: Record<string, unknown>
  images: { id: number; image_url: string | null; is_primary: boolean }[]
  reviews: {
    id: number
    reviewer_name: string
    rating: number
    review_text: string
    is_verified: boolean
    photo_url: string | null
  }[]
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ProductsQueryParams {
  goal?: string
  brand?: string
  min_price?: number
  max_price?: number
  page?: number
}
