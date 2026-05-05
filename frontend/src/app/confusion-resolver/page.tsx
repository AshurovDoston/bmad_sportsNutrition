import { getConfusionEntries } from '@/lib/api'
import type { ConfusionEntry } from '@/types/content'
import Link from 'next/link'

export const dynamic = 'force-static'

export default async function ConfusionResolverPage() {
  let entries: ConfusionEntry[] = []
  try {
    entries = await getConfusionEntries()
  } catch {
    entries = []
  }

  if (entries.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Confusion Resolver</h1>
        <p className="text-zinc-500">Check back soon for expert answers</p>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Confusion Resolver</h1>
      <div className="space-y-4">
        {entries.map((entry) => (
          <details key={entry.id} className="border rounded-lg p-4">
            <summary className="cursor-pointer font-semibold text-lg">
              {entry.question}
            </summary>
            <div className="mt-3">
              <p className="text-zinc-700 dark:text-zinc-300 mb-4">{entry.answer}</p>
              {entry.recommended_products.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Recommended products:</p>
                  <div className="flex flex-wrap gap-2">
                    {entry.recommended_products.slice(0, 3).map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md text-sm hover:underline"
                      >
                        {product.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </main>
  )
}
