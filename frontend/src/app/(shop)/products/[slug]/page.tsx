import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProductDetail } from '@/lib/api'
import { ProductDetailView } from '@/components/features/products/product-detail'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let product
  try {
    product = await getProductDetail(slug)
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      notFound()
    }
    throw err
  }

  return (
    <main>
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <Link
          href="/products"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to Products
        </Link>
      </div>
      <ProductDetailView product={product} />
    </main>
  )
}
