'use client'

import { ProfileForm } from '@/components/features/auth/profile-form'
import { Container } from '@/components/layout/container'

export default function ProfilePage() {
  return (
    <Container className="flex items-start justify-center pt-16 pb-12">
      <ProfileForm />
    </Container>
  )
}
