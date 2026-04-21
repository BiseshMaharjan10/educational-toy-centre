export interface DeliveryAddress {
  fullName: string
  phone: string
  address: string
  city: string
  landmark?: string
}

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: string
  product: {
    name: string
    images: string[]
    slug: string
  }
}

export interface Order {
  id: string
  userId: string
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  deliveryAddress: DeliveryAddress
  specialInstructions?: string
  adminNote?: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface PlaceOrderInput {
  items: { productId: string; quantity: number }[]
  deliveryAddress: DeliveryAddress
  specialInstructions?: string
}