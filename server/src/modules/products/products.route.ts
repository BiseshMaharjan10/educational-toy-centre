import { Router } from 'express';
import multer from 'multer';
import { validate } from '../../middleware/validate';
import { verifyToken, verifyAdmin } from '../../middleware/auth';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  stockUpdateSchema,
} from './products.validator';
import * as productsController from './products.controller';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG and WebP images are allowed'));
    }
  },
});

const router = Router();

router.get('/', validate(productQuerySchema), productsController.getPublicProducts);
router.get('/featured', productsController.getFeaturedProducts);
router.get('/categories', productsController.getCategories);
router.get('/:slug', productsController.getProductBySlug);

router.post(
  '/admin',
  verifyToken,
  verifyAdmin,
  upload.array('images', 8),
  validate(createProductSchema),
  productsController.createProduct
);

router.put(
  '/admin/:id',
  verifyToken,
  verifyAdmin,
  upload.array('images', 8),
  validate(updateProductSchema),
  productsController.updateProduct
);

router.delete(
  '/admin/:id',
  verifyToken,
  verifyAdmin,
  productsController.deleteProduct
);

router.delete(
  '/admin/:id/images',
  verifyToken,
  verifyAdmin,
  productsController.removeProductImage
);

router.get(
  '/admin/all',
  verifyToken,
  verifyAdmin,
  validate(productQuerySchema),
  productsController.getAdminProducts
);

router.patch(
  '/admin/:id/stock',
  verifyToken,
  verifyAdmin,
  validate(stockUpdateSchema),
  productsController.updateStock
);

export default router;