import { Router } from 'express';
import authRouter from './auth/auth.route';
import productsRouter from './products/products.route';
import ordersRouter from './orders/orders.route';
import cartRouter from './cart/cart.route';
import messagesRouter from './messages/messages.route';


const router = Router();

router.use('/auth', authRouter);
router.use('/products', productsRouter);
router.use('/orders', ordersRouter);
router.use('/cart', cartRouter);
router.use('/messages', messagesRouter);



export default router;