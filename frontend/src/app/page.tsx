import { GoalSelector } from '@/components/features/products/goal-selector'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          What&apos;s your fitness goal?
        </h1>
        <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">
          Choose a goal and discover products curated just for you.
        </p>
      </div>
      <GoalSelector />
    </main>
  )
}
