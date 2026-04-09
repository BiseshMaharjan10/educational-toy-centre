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

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate =
      attempt === 0 ? baseSlug : `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;

    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
    });

    if (!existing) return candidate;
  }

  const fallback = `${baseSlug}-${Date.now()}`;
  return fallback;
};