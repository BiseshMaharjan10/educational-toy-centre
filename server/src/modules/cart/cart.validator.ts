import { z } from 'zod';

const cartItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const syncCartSchema = z.object({
  body: z.object({
    items: z.array(cartItemSchema),
  }),
});

export const updateCartSchema = z.object({
  body: z.object({
    items: z.array(cartItemSchema),
  }),
});

export type SyncCartInput = z.infer<typeof syncCartSchema>['body'];
export type UpdateCartInput = z.infer<typeof updateCartSchema>['body'];