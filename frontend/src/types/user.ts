export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
}

export interface AuthTokens {
  access: string
  refresh: string
}
