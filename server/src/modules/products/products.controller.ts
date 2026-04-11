import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../utils/asyncHandler';
import * as productsService from './products.service';
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
  StockUpdateInput,
} from './products.validator';

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  const product = await productsService.createProduct(
    req.body as CreateProductInput,
    files ?? []
  );
  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Product created successfully',
    data: { product },
  });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  const productId = req.params.id as string;
  const product = await productsService.updateProduct(
    productId,
    req.body as UpdateProductInput,
    files ?? []
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Product updated successfully',
    data: { product },
  });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const productId = req.params.id as string;
  const result = await productsService.deleteProduct(productId);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: result.message,
  });
});

export const removeProductImage = asyncHandler(async (req: Request, res: Response) => {
  const { imageUrl } = req.body;
  const productId = req.params.id as string;
  const product = await productsService.removeProductImage(productId, imageUrl);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Image removed successfully',
    data: { product },
  });
});

export const getAdminProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await productsService.getAdminProducts(
    req.query as unknown as ProductQueryInput
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    data: result,
  });
});

export const getPublicProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await productsService.getPublicProducts(
    req.query as unknown as ProductQueryInput
  );
  return res.status(StatusCodes.OK).json({
    success: true,
    data: result,
  });
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const product = await productsService.getProductBySlug(slug);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: { product },
  });
});

export const getFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await productsService.getFeaturedProducts();
  return res.status(StatusCodes.OK).json({
    success: true,
    data: { products },
  });
});

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await productsService.getCategories();
  return res.status(StatusCodes.OK).json({
    success: true,
    data: { categories },
  });
});

export const updateStock = asyncHandler(async (req: Request, res: Response) => {
  const { stock } = req.body as StockUpdateInput;
  const productId = req.params.id as string;
  const product = await productsService.updateStock(productId, stock);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Stock updated successfully',
    data: { product },
  });
});