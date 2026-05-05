import { useAuthStore } from '@/store/auth'
import { refreshAccessToken } from '@/lib/auth'

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
