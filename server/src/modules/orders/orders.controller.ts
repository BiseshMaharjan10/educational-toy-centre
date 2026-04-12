import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../utils/asyncHandler';
import * as ordersService from './orders.service';
import type {
  PlaceOrderInput,
  UpdateOrderStatusInput,
  OrderQueryInput,
} from './orders.validator';

export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await ordersService.placeOrder(userId, req.body as PlaceOrderInput);
  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: result.message,
    data: {
      orderId: result.orderId,
      status: result.status,
    },
  });
});

export const getUserOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await ordersService.getUserOrders(
    userId,
    req.query as unknown as OrderQueryInput
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    data: result,
  });
});

export const getUserOrderById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const orderId = req.params.id as string;
  const order = await ordersService.getUserOrderById(orderId, userId);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: { order },
  });
});

export const cancelUserOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const orderId = req.params.id as string;
  const result = await ordersService.cancelUserOrder(orderId, userId);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: result.message,
  });
});

export const getAdminOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await ordersService.getAdminOrders(
    req.query as unknown as OrderQueryInput
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    data: result,
  });
});

export const getAdminOrderById = asyncHandler(async (req: Request, res: Response) => {
  const orderId = req.params.id as string;
  const order = await ordersService.getAdminOrderById(orderId);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: { order },
  });
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const orderId = req.params.id as string;
  const result = await ordersService.updateOrderStatus(
    orderId,
    req.body as UpdateOrderStatusInput
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    message: result.message,
  });
});

export const getOrderStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await ordersService.getOrderStats();
  return res.status(StatusCodes.OK).json({
    success: true,
    data: stats,
  });
});