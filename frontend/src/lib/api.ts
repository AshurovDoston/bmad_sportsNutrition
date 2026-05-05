import { useAuthStore } from '@/store/auth'
import { refreshAccessToken } from '@/lib/auth'
import type { GoalCategory, ProductListItem, ProductDetailItem, PaginatedResponse, ProductsQueryParams } from '@/types/product'
import type { ConfusionEntry } from '@/types/content'
import type { ServerCart } from '@/types/order'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`

export default API_BASE_URL

export const AUTH_ENDPOINTS = {
  REGISTER: '/api/v1/auth/register/',
  LOGIN: '/api/v1/auth/login/',
  LOGOUT: '/api/v1/auth/logout/',
  REFRESH: '/api/v1/auth/token/refresh/',
  PROFILE: '/api/v1/auth/profile/',
} as const

export async function apiFetch(
  path: string,
  options?: RequestInit,
  retry = true
): Promise<Response> {
  const token = useAuthStore.getState().accessToken
  const res = await fetch(apiUrl(path), {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      useAuthStore.getState().setAuth(newToken, useAuthStore.getState().user)
      return apiFetch(path, options, false)
    }
    useAuthStore.getState().clearAuth()
    window.location.href = '/login'
  }
  return res
}

export async function logoutUser(): Promise<void> {
  await apiFetch(AUTH_ENDPOINTS.LOGOUT, { method: 'POST' })
  useAuthStore.getState().clearAuth()
  window.location.href = '/login'
}

export const PRODUCT_ENDPOINTS = {
  GOALS: '/api/v1/goals/',
  PRODUCTS: '/api/v1/products/',
  PRODUCT_DETAIL: (slug: string) => `/api/v1/products/${slug}/`,
} as const

export async function getGoals(): Promise<GoalCategory[]> {
  const res = await apiFetch(PRODUCT_ENDPOINTS.GOALS)
  if (!res.ok) throw new Error('Failed to fetch goals')
  return res.json() as Promise<GoalCategory[]>
}

const serverApiBase = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const publicApiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Django builds absolute image URLs using the request host (serverApiBase).
// Rewrite them to the public host so the browser can load them.
function toPublicUrl(url: string | null): string | null {
  if (!url || serverApiBase === publicApiBase) return url
  return url.replace(serverApiBase, publicApiBase)
}

export async function getProductDetail(slug: string): Promise<ProductDetailItem> {
  const res = await fetch(`${serverApiBase}${PRODUCT_ENDPOINTS.PRODUCT_DETAIL(slug)}`, {
    cache: 'no-store',
  })
  if (res.status === 404) throw new Error('NOT_FOUND')
  if (!res.ok) throw new Error('Failed to fetch product detail')
  const data = await res.json() as ProductDetailItem
  return {
    ...data,
    primary_image_url: toPublicUrl(data.primary_image_url),
    certificate_url: toPublicUrl(data.certificate_url),
    images: data.images.map((img) => ({ ...img, image_url: toPublicUrl(img.image_url) })),
  }
}

export const CONTENT_ENDPOINTS = {
  CONFUSION: '/api/v1/confusion/',
} as const

export async function getConfusionEntries(): Promise<ConfusionEntry[]> {
  const res = await fetch(`${serverApiBase}${CONTENT_ENDPOINTS.CONFUSION}`, {
    cache: 'force-cache',
  })
  if (!res.ok) throw new Error('Failed to fetch confusion entries')
  return res.json() as Promise<ConfusionEntry[]>
}

export const CART_ENDPOINTS = {
  CART: '/api/v1/cart/',
  ITEMS: '/api/v1/cart/items/',
  ITEM: (id: number) => `/api/v1/cart/items/${id}/`,
  MERGE: '/api/v1/cart/merge/',
} as const

export async function getServerCart(): Promise<ServerCart> {
  const res = await apiFetch(CART_ENDPOINTS.CART)
  if (!res.ok) throw new Error('Failed to fetch cart')
  return res.json() as Promise<ServerCart>
}

export async function addServerCartItem(productId: number, quantity: number): Promise<ServerCart> {
  const res = await apiFetch(CART_ENDPOINTS.ITEMS, {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, quantity }),
  })
  if (!res.ok) throw new Error('Failed to add item')
  return res.json() as Promise<ServerCart>
}

export async function updateServerCartItem(itemId: number, quantity: number): Promise<ServerCart> {
  const res = await apiFetch(CART_ENDPOINTS.ITEM(itemId), {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  })
  if (!res.ok) throw new Error('Failed to update item')
  return res.json() as Promise<ServerCart>
}

export async function removeServerCartItem(itemId: number): Promise<ServerCart> {
  const res = await apiFetch(CART_ENDPOINTS.ITEM(itemId), { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to remove item')
  return res.json() as Promise<ServerCart>
}

export async function mergeServerCart(
  items: Array<{ product_id: number; quantity: number }>
): Promise<ServerCart> {
  const res = await apiFetch(CART_ENDPOINTS.MERGE, {
    method: 'POST',
    body: JSON.stringify(items),
  })
  if (!res.ok) throw new Error('Failed to merge cart')
  return res.json() as Promise<ServerCart>
}

export async function getProducts(params?: ProductsQueryParams): Promise<PaginatedResponse<ProductListItem>> {
  const query = new URLSearchParams()
  if (params?.goal) query.set('goal', params.goal)
  if (params?.search) query.set('search', params.search)
  if (params?.brand) query.set('brand', params.brand)
  if (params?.min_price != null) query.set('min_price', String(params.min_price))
  if (params?.max_price != null) query.set('max_price', String(params.max_price))
  if (params?.page != null) query.set('page', String(params.page))
  const path = query.toString() ? `${PRODUCT_ENDPOINTS.PRODUCTS}?${query}` : PRODUCT_ENDPOINTS.PRODUCTS
  const res = await apiFetch(path)
  if (!res.ok) throw new Error('Failed to fetch products')
  return res.json() as Promise<PaginatedResponse<ProductListItem>>
}
