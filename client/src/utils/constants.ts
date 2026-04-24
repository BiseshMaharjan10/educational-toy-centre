export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

export const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-orange-100 text-orange-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export const STOCK_LABELS = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
}

export const getStockStatus = (stock: number) => {
  if (stock === 0) return { label: 'Out of Stock', color: 'bg-gray-100 text-gray-500' }
  if (stock <= 5) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-600' }
  return { label: 'In Stock', color: 'bg-green-100 text-green-600' }
}