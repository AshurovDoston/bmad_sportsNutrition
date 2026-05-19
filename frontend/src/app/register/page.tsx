import { RegisterForm } from '@/components/features/auth/register-form'
import { Container } from '@/components/layout/container'

export default function RegisterPage() {
  return (
    <Container className="flex flex-1 items-center justify-center py-12">
      <RegisterForm />
    </Container>
  )
}
