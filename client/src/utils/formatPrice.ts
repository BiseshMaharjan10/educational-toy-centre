export const formatPrice = (price: number | string): string => {
  const num = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(num)) return 'NPR -'
  return `NPR ${num.toLocaleString('en-NP')}`
}