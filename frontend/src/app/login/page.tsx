import { Suspense } from 'react'
import { LoginForm } from '@/components/features/auth/login-form'
import { Container } from '@/components/layout/container'

export default function LoginPage() {
  return (
    <Container className="flex flex-1 items-center justify-center py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </Container>
  )
}
