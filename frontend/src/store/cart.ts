import { create } from 'zustand'

interface CartState {
  items: Array<{ productId: number; quantity: number }>
  addItem: (productId: number, quantity?: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (productId, quantity = 1) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === productId)
      if (existing) {
        return { items: state.items.map((i) => i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i) }
      }
      return { items: [...state.items, { productId, quantity }] }
    }),
  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
  clearCart: () => set({ items: [] }),
}))
