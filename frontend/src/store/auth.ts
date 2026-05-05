import { create } from 'zustand'
import { User } from '@/types/user'

interface AuthStore {
  accessToken: string | null
  user: User | null
  setAuth: (token: string, user: User | null) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  accessToken: null,
  user: null,
  setAuth: (token, user) => set({ accessToken: token, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
  isAuthenticated: () => get().accessToken !== null,
}))
