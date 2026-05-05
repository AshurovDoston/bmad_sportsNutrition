import { useAuthStore } from '@/store/auth'
import { refreshAccessToken } from '@/lib/auth'
import type { GoalCategory, ProductListItem, PaginatedResponse, ProductsQueryParams } from '@/types/product'

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

export async function getProducts(params?: ProductsQueryParams): Promise<PaginatedResponse<ProductListItem>> {
  const query = new URLSearchParams()
  if (params?.goal) query.set('goal', params.goal)
  if (params?.brand) query.set('brand', params.brand)
  if (params?.min_price != null) query.set('min_price', String(params.min_price))
  if (params?.max_price != null) query.set('max_price', String(params.max_price))
  if (params?.page != null) query.set('page', String(params.page))
  const path = query.toString() ? `${PRODUCT_ENDPOINTS.PRODUCTS}?${query}` : PRODUCT_ENDPOINTS.PRODUCTS
  const res = await apiFetch(path)
  if (!res.ok) throw new Error('Failed to fetch products')
  return res.json() as Promise<PaginatedResponse<ProductListItem>>
}
