import type { Product } from './product.types'

export interface CartItem {
  productId: string
  quantity: number
  product: Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'images' | 'stock'>
}

export interface CartState {
  items: CartItem[]
}