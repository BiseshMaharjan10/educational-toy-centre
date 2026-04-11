import { Router } from 'express';
import authRouter from './auth/auth.route';
import productsRouter from './products/products.route';


const router = Router();

router.use('/auth', authRouter);
router.use('/products', productsRouter);



export default router;