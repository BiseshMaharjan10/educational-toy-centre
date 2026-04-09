import crypto from 'crypto';
import prisma from '../config/prisma';

export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const createUniqueSlug = async (name: string): Promise<string> => {
  const baseSlug = generateSlug(name);

  const existing = await prisma.product.findUnique({
    where: { slug: baseSlug },
  });

  if (!existing) return baseSlug;

  const suffix = crypto.randomBytes(3).toString('hex');
  return `${baseSlug}-${suffix}`;
};