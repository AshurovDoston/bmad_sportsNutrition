'use client'

import type { OrderResponse } from '@/types/order'

interface OrderSummaryProps {
  order: OrderResponse
}

export default function OrderSummary({ order }: OrderSummaryProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-600 dark:text-green-400">Your order is confirmed</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Order #{order.order_number}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 divide-y divide-zinc-200 dark:divide-zinc-700">
        {order.items.map((item) => (
          <div key={item.product_id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.product_name}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {item.quantity} × {item.product_price}
              </p>
            </div>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.line_price}</span>
          </div>
        ))}

        <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Subtotal</span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{order.subtotal}</span>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-3">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
          Delivery Address
        </p>
        <p className="text-sm text-zinc-900 dark:text-zinc-50">{order.delivery_address}</p>
      </div>
    </div>
  )
}
