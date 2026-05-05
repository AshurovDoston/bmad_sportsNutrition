export interface User {
  id: number
  name: string
  phone: string
  is_staff: boolean
  delivery_address: string | null
}

export interface ProfileUpdatePayload {
  name?: string
  phone?: string
  delivery_address?: string | null
}

export interface LoginResponse {
  access_token: string
}

export interface RegisterResponse {
  id: number
  name: string
  phone: string
}

export interface ApiError {
  error: string
  code: string
  details: Record<string, string[]>
}
