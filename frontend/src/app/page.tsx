import { GoalSelector } from '@/components/features/products/goal-selector'
import { Container } from '@/components/layout/container'

export default function Home() {
  return (
    <Container as="section" className="py-16">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          What&apos;s your fitness goal?
        </h1>
        <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">
          Choose a goal and discover products curated just for you.
        </p>
      </div>
      <GoalSelector />
    </Container>
  )
}
