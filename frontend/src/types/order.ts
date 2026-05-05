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
