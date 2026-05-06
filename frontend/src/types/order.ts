export interface OrderItem {
  product_id: number
  quantity: number
  price: string
}

export interface Order {
  id: number
  status: string
  total_price: string
  items: OrderItem[]
  created_at: string
}

export interface GuestCartItem {
  productId: number
  productName: string
  productSlug: string
  productPrice: string
  productImageUrl: string | null
  quantity: number
}

export interface ServerCartItemProduct {
  id: number
  name: string
  slug: string
  price: string
  primary_image_url: string | null
}

export interface ServerCartItem {
  id: number
  product: ServerCartItemProduct
  quantity: number
  line_price: string
}

export interface ServerCart {
  id: number
  items: ServerCartItem[]
  subtotal: string
}

// Matches backend OrderItemResponseSerializer
export interface OrderItemResponse {
  product_id: number
  product_name: string
  product_price: string
  quantity: number
  line_price: string
}

// Matches backend OrderResponseSerializer (POST /api/v1/orders/ response)
export interface OrderResponse {
  order_id: number
  order_number: string
  items: OrderItemResponse[]
  subtotal: string
  delivery_address: string
  status: 'pending' | 'confirmed' | 'dispatched' | 'delivered'
  created_at: string
}

// Client-side pending guest order (not from backend yet)
export interface PendingGuestOrder {
  delivery_address: string
  items: Array<{ product_id: number; quantity: number }>
  subtotal: string
}
