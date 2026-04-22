import { useAppSelector, useAppDispatch } from '../app/hooks'
import { addItem, removeItem, updateQuantity, clearCart } from '../features/cart/cartSlice'
import type { CartItem } from '../types/cart.types'

export const useCart = () => {
  const dispatch = useAppDispatch()
  const { items } = useAppSelector((state) => state.cart)

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const cartTotal = items.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  )

  const addToCart = (item: CartItem) => dispatch(addItem(item))
  const removeFromCart = (productId: string) => dispatch(removeItem(productId))
  const updateItemQuantity = (productId: string, quantity: number) =>
    dispatch(updateQuantity({ productId, quantity }))
  const emptyCart = () => dispatch(clearCart())

  return {
    items,
    cartCount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateItemQuantity,
    emptyCart,
  }
}