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
