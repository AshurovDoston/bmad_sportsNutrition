'use client'

import { useEffect } from 'react'
import { refreshAccessToken } from '@/lib/auth'
import { useAuthStore } from '@/store/auth'
import { apiUrl, AUTH_ENDPOINTS } from '@/lib/api'
import type { User } from '@/types/user'

// Restores the in-memory access token from the HTTP-only refresh cookie
// on first client mount. Without this, a page refresh wipes the auth state
// and the user silently falls back to the guest checkout path.
export function AuthBootstrap() {
  useEffect(() => {
    let cancelled = false

    void (async () => {
      const token = await refreshAccessToken()
      if (cancelled || !token) return

      let user: User | null = null
      try {
        const res = await fetch(apiUrl(AUTH_ENDPOINTS.PROFILE), {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        })
        if (res.ok) user = (await res.json()) as User
      } catch {
        // Profile fetch failed — keep token; user stays null until next interaction.
      }

      if (!cancelled) useAuthStore.getState().setAuth(token, user)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
