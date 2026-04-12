import { Router } from 'express';
import authRouter from './auth/auth.route';
import productsRouter from './products/products.route';
import ordersRouter from './orders/orders.route';


const router = Router();

router.use('/auth', authRouter);
router.use('/products', productsRouter);
router.use('/orders', ordersRouter);



export default router;