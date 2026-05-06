'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getOrderDetail } from '@/lib/api'
import type { OrderResponse } from '@/types/order'
import { Container } from '@/components/layout/container'

const STATUS_STYLES: Record<OrderResponse['status'], string> = {
  pending: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  dispatched: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

function StatusBadge({ status }: { status: OrderResponse['status'] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const id = Number(params.id)
  const isValidId = !Number.isNaN(id) && id > 0

  const { data: order, isLoading, isError, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderDetail(id),
    enabled: isValidId,
    retry: false,
  })

  if (!isValidId) {
    return (
      <Container className="py-12">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-red-600 dark:text-red-400">Invalid order id.</p>
          <Link
            href="/account/orders"
            className="mt-4 inline-block text-sm text-zinc-600 dark:text-zinc-400 hover:underline"
          >
            ← Back to Orders
          </Link>
        </div>
      </Container>
    )
  }

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-3xl">
      <Link
        href="/account/orders"
        className="mb-6 inline-block text-sm text-zinc-600 dark:text-zinc-400 hover:underline"
      >
        ← Back to Orders
      </Link>

      {isLoading && (
        <div className="space-y-4">
          <div className="h-8 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-32 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-32 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error instanceof Error && error.message === 'Failed to fetch order'
            ? 'Order not found.'
            : 'Could not load this order. Please try again.'}
        </p>
      )}

      {!isLoading && !isError && order && (
        <article className="space-y-8">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Order #{order.order_number}
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Placed on {formatDate(order.created_at)}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </header>

          <section className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Items</h2>
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {order.items.map((item) => (
                <li key={item.product_id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.product_name}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {item.quantity} × {item.product_price} UZS
                    </p>
                  </div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {item.line_price} UZS
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-zinc-200 dark:border-zinc-700 pt-3">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Subtotal</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{order.subtotal} UZS</p>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Delivery Address</h2>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
              {order.delivery_address}
            </p>
          </section>
        </article>
      )}
      </div>
    </Container>
  )
}
