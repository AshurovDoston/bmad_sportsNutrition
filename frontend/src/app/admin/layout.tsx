'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)()

  useEffect(() => {
    if (!isAuthenticated || !user?.is_staff) {
      router.replace('/')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || !user?.is_staff) {
    return null
  }

  return <>{children}</>
}
