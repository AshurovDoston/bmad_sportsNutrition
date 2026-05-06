import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from '@/store/auth'
import {
  getServerCart,
  addServerCartItem,
  updateServerCartItem,
  removeServerCartItem,
  mergeServerCart,
} from '@/lib/api'
import type { GuestCartItem, ServerCart } from '@/types/order'

interface CartStore {
  guestItems: GuestCartItem[]
  serverCart: ServerCart | null
  isLoading: boolean
  addItem: (
    product: { id: number; name: string; slug: string; price: string; primary_image_url: string | null },
    quantity?: number
  ) => Promise<void>
  updateGuestQuantity: (productId: number, quantity: number) => void
  removeGuestItem: (productId: number) => void
  fetchServerCart: () => Promise<void>
  updateServerQuantity: (itemId: number, quantity: number) => Promise<void>
  removeServerItem: (itemId: number) => Promise<void>
  mergeGuestCart: () => Promise<void>
  clearCart: () => void
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      guestItems: [],
      serverCart: null,
      isLoading: false,

      addItem: async (product, quantity = 1) => {
        if (useAuthStore.getState().isAuthenticated()) {
          set({ isLoading: true })
          try {
            const cart = await addServerCartItem(product.id, quantity)
            set({ serverCart: cart })
          } finally {
            set({ isLoading: false })
          }
        } else {
          set((state) => {
            const existing = state.guestItems.find((i) => i.productId === product.id)
            if (existing) {
              return {
                guestItems: state.guestItems.map((i) =>
                  i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i
                ),
              }
            }
            return {
              guestItems: [
                ...state.guestItems,
                {
                  productId: product.id,
                  productName: product.name,
                  productSlug: product.slug,
                  productPrice: product.price,
                  productImageUrl: product.primary_image_url,
                  quantity,
                },
              ],
            }
          })
        }
      },

      updateGuestQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeGuestItem(productId)
          return
        }
        set((state) => ({
          guestItems: state.guestItems.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }))
      },

      removeGuestItem: (productId) =>
        set((state) => ({
          guestItems: state.guestItems.filter((i) => i.productId !== productId),
        })),

      fetchServerCart: async () => {
        set({ isLoading: true })
        try {
          const cart = await getServerCart()
          set({ serverCart: cart })
        } finally {
          set({ isLoading: false })
        }
      },

      updateServerQuantity: async (itemId, quantity) => {
        set({ isLoading: true })
        try {
          const cart = await updateServerCartItem(itemId, quantity)
          set({ serverCart: cart })
        } finally {
          set({ isLoading: false })
        }
      },

      removeServerItem: async (itemId) => {
        set({ isLoading: true })
        try {
          const cart = await removeServerCartItem(itemId)
          set({ serverCart: cart })
        } finally {
          set({ isLoading: false })
        }
      },

      mergeGuestCart: async () => {
        const { guestItems } = get()
        const payload = guestItems.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        }))
        try {
          const cart = await mergeServerCart(payload)
          set({ serverCart: cart, guestItems: [] })
        } catch {
          // Merge failed — clear guest items; cart page will re-fetch on mount
          set({ guestItems: [] })
        }
      },

      clearCart: () => set({ guestItems: [], serverCart: null }),

      itemCount: () => {
        const { serverCart, guestItems } = get()
        if (serverCart) return serverCart.items.reduce((s, i) => s + i.quantity, 0)
        return guestItems.reduce((s, i) => s + i.quantity, 0)
      },
    }),
    {
      name: 'sports-nutrition-cart',
      partialize: (state) => ({ guestItems: state.guestItems }),
    }
  )
)
