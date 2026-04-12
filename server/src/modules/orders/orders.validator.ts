import { z } from 'zod';

const deliveryAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(7, 'Valid phone number is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  landmark: z.string().optional(),
});

const orderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const placeOrderSchema = z.object({
  body: z.object({
    items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
    deliveryAddress: deliveryAddressSchema,
    specialInstructions: z.string().max(500).optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ]),
    adminNote: z.string().max(500).optional(),
  }),
});

export const orderQuerySchema = z.object({
  query: z.object({
    page: z.string().default('1'),
    limit: z.string().default('10'),
    status: z.enum([
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ]).optional(),
  }),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>['body'];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>['body'];
export type OrderQueryInput = z.infer<typeof orderQuerySchema>['query'];