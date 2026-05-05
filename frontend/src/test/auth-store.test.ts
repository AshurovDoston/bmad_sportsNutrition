import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/store/auth'
import { User } from '@/types/user'

const mockUser: User = { id: 1, name: 'Test User', phone: '+1234567890', is_staff: false }

beforeEach(() => {
  useAuthStore.getState().clearAuth()
})

describe('useAuthStore', () => {
  it('starts with null token and user', () => {
    const { accessToken, user } = useAuthStore.getState()
    expect(accessToken).toBeNull()
    expect(user).toBeNull()
  })

  it('setAuth stores token and user', () => {
    useAuthStore.getState().setAuth('test-token', mockUser)
    const { accessToken, user } = useAuthStore.getState()
    expect(accessToken).toBe('test-token')
    expect(user).toEqual(mockUser)
  })

  it('setAuth accepts null user', () => {
    useAuthStore.getState().setAuth('token-only', null)
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().accessToken).toBe('token-only')
  })

  it('clearAuth nulls both token and user', () => {
    useAuthStore.getState().setAuth('some-token', mockUser)
    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('isAuthenticated returns false when no token', () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false)
  })

  it('isAuthenticated returns true when token is set', () => {
    useAuthStore.getState().setAuth('token', null)
    expect(useAuthStore.getState().isAuthenticated()).toBe(true)
  })

  it('isAuthenticated returns false after clearAuth', () => {
    useAuthStore.getState().setAuth('token', null)
    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().isAuthenticated()).toBe(false)
  })
})
