export interface BlogArticle {
  id: number
  title: string
  slug: string
  body: string
  published_at: string
}

export interface ConfusionRecommendedProduct {
  id: number
  name: string
  slug: string
  price: string
}

export interface ConfusionEntry {
  id: number
  question: string
  answer: string
  recommended_products: ConfusionRecommendedProduct[]
}
