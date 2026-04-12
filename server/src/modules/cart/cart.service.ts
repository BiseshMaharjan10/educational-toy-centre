import { StatusCodes } from 'http-status-codes';
import type { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { SyncCartInput, UpdateCartInput } from './cart.validator';

interface CartItem {
  productId: string;
  quantity: number;
}

const isCartItem = (value: unknown): value is CartItem => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as { productId?: unknown; quantity?: unknown };
  return (
    typeof item.productId === 'string' &&
    typeof item.quantity === 'number' &&
    Number.isInteger(item.quantity) &&
    item.quantity >= 1
  );
};

const parseCartItems = (value: unknown): CartItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isCartItem);
};

const toJsonValue = (items: CartItem[]): Prisma.InputJsonValue => {
  return items as unknown as Prisma.InputJsonValue;
};

export const getCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    return { items: [] };
  }

  const items = parseCartItems(cart.items);

  if (items.length === 0) {
    return { items: [] };
  }

  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      images: true,
      stock: true,
    },
  });

  const enrichedItems = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      return {
        productId: item.productId,
        quantity: Math.min(item.quantity, product.stock),
        product,
      };
    })
    .filter(Boolean);

  return { items: enrichedItems };
};

export const syncCart = async (userId: string, data: SyncCartInput) => {
  const existingCart = await prisma.cart.findUnique({
    where: { userId },
  });

  const existingItems = parseCartItems(existingCart?.items);
  const incomingItems = data.items;

  const mergedMap = new Map<string, number>();

  for (const item of existingItems) {
    mergedMap.set(item.productId, item.quantity);
  }

  for (const item of incomingItems) {
    const existing = mergedMap.get(item.productId);
    if (existing !== undefined) {
      mergedMap.set(item.productId, Math.max(existing, item.quantity));
    } else {
      mergedMap.set(item.productId, item.quantity);
    }
  }

  const productIds = Array.from(mergedMap.keys());
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, stock: true },
  });

  const validatedItems: CartItem[] = [];
  for (const [productId, quantity] of mergedMap) {
    const product = products.find((p) => p.id === productId);
    if (!product) continue;
    validatedItems.push({
      productId,
      quantity: Math.min(quantity, product.stock),
    });
  }

  const cart = await prisma.cart.upsert({
    where: { userId },
    create: { userId, items: toJsonValue(validatedItems) },
    update: { items: toJsonValue(validatedItems) },
  });

  return { message: 'Cart synced successfully', items: cart.items };
};

export const updateCart = async (userId: string, data: UpdateCartInput) => {
  if (data.items.length === 0) {
    await prisma.cart.upsert({
      where: { userId },
      create: { userId, items: [] },
      update: { items: [] },
    });
    return { message: 'Cart cleared', items: [] };
  }

  const productIds = data.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, stock: true, name: true },
  });

  if (products.length !== productIds.length) {
    throw new AppError(
      'One or more products are unavailable',
      StatusCodes.BAD_REQUEST
    );
  }

  const stockErrors: string[] = [];
  const validatedItems: CartItem[] = [];

  for (const item of data.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;

    if (item.quantity > product.stock) {
      stockErrors.push(
        `"${product.name}" only has ${product.stock} available`
      );
    } else {
      validatedItems.push(item);
    }
  }

  if (stockErrors.length > 0) {
    throw new AppError(stockErrors.join('. '), StatusCodes.BAD_REQUEST);
  }

  const cart = await prisma.cart.upsert({
    where: { userId },
    create: { userId, items: toJsonValue(validatedItems) },
    update: { items: toJsonValue(validatedItems) },
  });

  return { message: 'Cart updated successfully', items: cart.items };
};

export const clearCart = async (userId: string) => {
  await prisma.cart.upsert({
    where: { userId },
    create: { userId, items: [] },
    update: { items: [] },
  });

  return { message: 'Cart cleared successfully' };
};