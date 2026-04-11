import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.string().refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      'Price must be a positive number'
    ),
    category: z.string().min(1, 'Category is required'),
    ageGroup: z.string().min(1, 'Age group is required'),
    material: z.string().default('Wood'),
    stock: z.string().refine(
      (val) => !isNaN(parseInt(val)) && parseInt(val) >= 0,
      'Stock must be a non-negative number'
    ),
    isFeatured: z.string().optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    price: z.string().refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      'Price must be a positive number'
    ).optional(),
    category: z.string().optional(),
    ageGroup: z.string().optional(),
    material: z.string().optional(),
    stock: z.string().refine(
      (val) => !isNaN(parseInt(val)) && parseInt(val) >= 0,
      'Stock must be a non-negative number'
    ).optional(),
    isFeatured: z.string().optional(),
    isActive: z.string().optional(),
  }),
});

export const productQuerySchema = z.object({
  query: z.object({
    page: z.string().default('1'),
    limit: z.string().default('12'),
    category: z.string().optional(),
    ageGroup: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    search: z.string().optional(),
    sort: z.enum(['newest', 'price-asc', 'price-desc', 'featured']).default('newest'),
  }),
});

export const stockUpdateSchema = z.object({
  body: z.object({
    stock: z.coerce.number().int('Stock must be an integer').min(0, 'Stock must be a non-negative number'),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type ProductQueryInput = z.infer<typeof productQuerySchema>['query'];
export type StockUpdateInput = z.infer<typeof stockUpdateSchema>['body'];