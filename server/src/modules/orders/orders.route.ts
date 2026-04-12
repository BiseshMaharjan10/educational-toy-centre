import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { verifyToken, verifyAdmin } from '../../middleware/auth';
import {
  placeOrderSchema,
  updateOrderStatusSchema,
  orderQuerySchema,
} from './orders.validator';
import * as ordersController from './orders.controller';

const router = Router();

router.post(
  '/',
  verifyToken,
  validate(placeOrderSchema),
  ordersController.placeOrder
);

router.get(
  '/mine',
  verifyToken,
  validate(orderQuerySchema),
  ordersController.getUserOrders
);

router.get(
  '/mine/:id',
  verifyToken,
  ordersController.getUserOrderById
);

router.delete(
  '/mine/:id',
  verifyToken,
  ordersController.cancelUserOrder
);

router.get(
  '/admin',
  verifyToken,
  verifyAdmin,
  validate(orderQuerySchema),
  ordersController.getAdminOrders
);

router.get(
  '/admin/stats',
  verifyToken,
  verifyAdmin,
  ordersController.getOrderStats
);

router.get(
  '/admin/:id',
  verifyToken,
  verifyAdmin,
  ordersController.getAdminOrderById
);

router.patch(
  '/admin/:id/status',
  verifyToken,
  verifyAdmin,
  validate(updateOrderStatusSchema),
  ordersController.updateOrderStatus
);

export default router;