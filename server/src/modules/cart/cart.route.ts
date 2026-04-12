import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { verifyToken } from '../../middleware/auth';
import { syncCartSchema, updateCartSchema } from './cart.validator';
import * as cartController from './cart.controller';

const router = Router();

router.get('/', verifyToken, cartController.getCart);

router.post('/sync', verifyToken, validate(syncCartSchema), cartController.syncCart);

router.put('/', verifyToken, validate(updateCartSchema), cartController.updateCart);

router.delete('/', verifyToken, cartController.clearCart);

export default router;