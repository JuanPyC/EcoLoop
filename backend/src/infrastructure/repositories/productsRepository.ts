import prisma from "../prismaClient";

export const listProducts = async (filter?: { available?: boolean; category?: string }) => {
  const where: any = {};
  if (filter?.available) where.is_available = true;
  if (filter?.category) where.category = filter.category;
  return prisma.products.findMany({ where, orderBy: { name: 'asc' } });
};

export const getProductById = async (id: string) => {
  return prisma.products.findUnique({ where: { id } });
};

export const createProduct = async (data: any) => {
  return prisma.products.create({ data });
};

export const updateProduct = async (id: string, data: any) => {
  return prisma.products.update({ where: { id }, data });
};

export const deleteProduct = async (id: string) => {
  return prisma.products.delete({ where: { id } });
};
