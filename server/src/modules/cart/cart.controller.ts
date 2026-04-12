import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../utils/asyncHandler';
import * as cartService from './cart.service';
import type { SyncCartInput, UpdateCartInput } from './cart.validator';

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const cart = await cartService.getCart(userId);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: cart,
  });
});

export const syncCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await cartService.syncCart(userId, req.body as SyncCartInput);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: result.message,
    data: { items: result.items },
  });
});

export const updateCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await cartService.updateCart(userId, req.body as UpdateCartInput);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: result.message,
    data: { items: result.items },
  });
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await cartService.clearCart(userId);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: result.message,
  });
});