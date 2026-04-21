export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: string
  category: string
  ageGroup: string
  material: string
  stock: number
  images: string[]
  isFeatured: boolean
  isActive?: boolean
  createdAt: string
}

export interface ProductQuery {
  page?: string
  limit?: string
  category?: string
  ageGroup?: string
  minPrice?: string
  maxPrice?: string
  search?: string
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'featured'
}

export interface PaginatedProducts {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}