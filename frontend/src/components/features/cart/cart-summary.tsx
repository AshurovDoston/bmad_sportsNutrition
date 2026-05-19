import Link from 'next/link'
import { DELIVERY_TIME_HOURS } from '@/lib/constants'
import { buttonClasses } from '@/components/ui/button'

interface CartSummaryProps {
  subtotal: string
}

export function CartSummary({ subtotal }: CartSummaryProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Order Summary</h2>

      <div className="flex justify-between text-sm text-zinc-700 dark:text-zinc-300">
        <span>Subtotal</span>
        <span className="font-semibold">${subtotal}</span>
      </div>

      <div className="mt-2 flex justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span>Estimated delivery</span>
        <span>{DELIVERY_TIME_HOURS} hours</span>
      </div>

      <Link
        href="/checkout"
        className={buttonClasses({ variant: 'primary', size: 'lg', className: 'mt-6 w-full' })}
      >
        Proceed to Checkout
      </Link>
    </div>
  )
}
