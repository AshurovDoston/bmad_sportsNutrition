export interface Product {
  id: number
  name: string
  slug: string
  description: string
  price: string
  image: string | null
  goal_tags: string[]
  is_active: boolean
}
