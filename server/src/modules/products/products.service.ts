import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import prisma from '../../config/prisma';
import cloudinary from '../../config/cloudinary';
import { AppError } from '../../middleware/errorHandler';
import { createUniqueSlug } from '../../utils/slug';

import type {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
} from './products.validator';

export const createProduct = async (
    data : CreateProductInput,
    imageFiles: Express.Multer.File[]
) => {
    if (imageFiles.length === 0) {
        throw new AppError('At least one product image is required', StatusCodes.BAD_REQUEST);
    }
    const imageUrls = await uploadImages(imageFiles)
    const slug = await createUniqueSlug(data.name);

     const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      price: parseFloat(data.price),
      category: data.category,
      ageGroup: data.ageGroup,
      material: data.material ?? 'Wood',
      stock: parseInt(data.stock),
      images: imageUrls,
      isFeatured: data.isFeatured === 'true',
      isActive: true,
    },
  });
    return product;
;}

