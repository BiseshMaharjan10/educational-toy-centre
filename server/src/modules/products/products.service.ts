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
  data: CreateProductInput,
  imageFiles: Express.Multer.File[]
) => {
  if (imageFiles.length === 0) {
    throw new AppError('At least one image is required', StatusCodes.BAD_REQUEST);
  }

  const imageUrls = await uploadImages(imageFiles);
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
};

export const updateProduct = async (
  id: string,
  data: UpdateProductInput,
  imageFiles: Express.Multer.File[]
) => {
  const existing = await prisma.product.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError('Product not found', StatusCodes.NOT_FOUND);
  }

  let images = existing.images;

  if (imageFiles.length > 0) {
    const newUrls = await uploadImages(imageFiles);
    images = [...existing.images, ...newUrls];
  }

  if (images.length > 8) {
    throw new AppError('Maximum 8 images allowed per product', StatusCodes.BAD_REQUEST);
  }

  const updateData: Prisma.ProductUpdateInput = { images };

  if (data.name) {
    updateData.name = data.name;
    updateData.slug = await createUniqueSlug(data.name);
  }
  if (data.description) updateData.description = data.description;
  if (data.price) updateData.price = parseFloat(data.price);
  if (data.category) updateData.category = data.category;
  if (data.ageGroup) updateData.ageGroup = data.ageGroup;
  if (data.material) updateData.material = data.material;
  if (data.stock !== undefined) updateData.stock = parseInt(data.stock);
  if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured === 'true';
  if (data.isActive !== undefined) updateData.isActive = data.isActive === 'true';

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
  });

  return product;
};

export const deleteProduct = async (id: string) => {
  const existing = await prisma.product.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError('Product not found', StatusCodes.NOT_FOUND);
  }

  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  return { message: 'Product removed from store successfully' };
};

export const removeProductImage = async (id: string, imageUrl: string) => {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw new AppError('Product not found', StatusCodes.NOT_FOUND);
  }

  if (!product.images.includes(imageUrl)) {
    throw new AppError('Image not found on this product', StatusCodes.NOT_FOUND);
  }

  if (product.images.length <= 1) {
    throw new AppError('Cannot remove the last image', StatusCodes.BAD_REQUEST);
  }

  const updatedImages = product.images.filter((img) => img !== imageUrl);

  const publicId = extractPublicId(imageUrl);
  if (publicId) {
    await cloudinary.uploader.destroy(publicId);
  }

  return prisma.product.update({
    where: { id },
    data: { images: updatedImages },
  });
};

export const getAdminProducts = async (query: ProductQueryInput) => {
  const page = parseInt(query.page ?? '1');
  const limit = parseInt(query.limit ?? '12');
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { category: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.category) where.category = query.category;

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPublicProducts = async (query: ProductQueryInput) => {
  const page = parseInt(query.page ?? '1');
  const limit = parseInt(query.limit ?? '12');
  const skip = (page - 1) * limit;
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.category) where.category = query.category;
  if (query.ageGroup) where.ageGroup = query.ageGroup;

  if (query.minPrice || query.maxPrice) {
    where.price = {};
    if (query.minPrice) where.price.gte = parseFloat(query.minPrice);
    if (query.maxPrice) where.price.lte = parseFloat(query.maxPrice);
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    query.sort === 'price-asc' ? { price: 'asc' }
    : query.sort === 'price-desc' ? { price: 'desc' }
    : query.sort === 'featured' ? { isFeatured: 'desc' }
    : { createdAt: 'desc' };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        category: true,
        ageGroup: true,
        material: true,
        stock: true,
        images: true,
        isFeatured: true,
        createdAt: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getProductBySlug = async (slug: string) => {
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      category: true,
      ageGroup: true,
      material: true,
      stock: true,
      images: true,
      isFeatured: true,
      createdAt: true,
    },
  });

  if (!product) {
    throw new AppError('Product not found', StatusCodes.NOT_FOUND);
  }

  return product;
};

export const getFeaturedProducts = async () => {
  return prisma.product.findMany({
    where: { isFeatured: true, isActive: true },
    take: 8,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      images: true,
      category: true,
      stock: true,
    },
  });
};

export const getCategories = async () => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ['category'],
  });

  return products.map((p) => p.category);
};

export const updateStock = async (id: string, stock: number) => {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw new AppError('Product not found', StatusCodes.NOT_FOUND);
  }

  if (stock < 0) {
    throw new AppError('Stock cannot be negative', StatusCodes.BAD_REQUEST);
  }

  return prisma.product.update({
    where: { id },
    data: { stock },
  });
};

const uploadImages = async (files: Express.Multer.File[]): Promise<string[]> => {
  const uploadPromises = files.map((file) => {
    return new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'educational-toy-centre/products',
          transformation: [{ width: 800, height: 800, crop: 'limit' }],
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result.secure_url);
        }
      ).end(file.buffer);
    });
  });

  return Promise.all(uploadPromises);
};

const extractPublicId = (url: string): string | null => {
  try {
    const pathParts = new URL(url).pathname.split('/').filter(Boolean);
    const uploadIndex = pathParts.indexOf('upload');

    if (uploadIndex === -1 || uploadIndex === pathParts.length - 1) {
      return null;
    }

    let publicIdParts = pathParts.slice(uploadIndex + 1);

    // Cloudinary URLs usually include a version segment like v1712345678.
    if (/^v\d+$/.test(publicIdParts[0])) {
      publicIdParts = publicIdParts.slice(1);
    }

    if (publicIdParts.length === 0) {
      return null;
    }

    const lastIndex = publicIdParts.length - 1;
    publicIdParts[lastIndex] = publicIdParts[lastIndex].replace(/\.[^/.]+$/, '');

    return publicIdParts.join('/');
  } catch {
    return null;
  }
};