import prisma from "../prismaClient";

export const listNews = async (filter?: { published?: boolean }) => {
  const where: any = {};
  if (filter?.published) where.published = true;
  return prisma.news_articles.findMany({ where, orderBy: { created_at: 'desc' } });
};

export const getNewsById = async (id: string) => {
  return prisma.news_articles.findUnique({ where: { id } });
};

export const createNews = async (data: any) => {
  return prisma.news_articles.create({ data });
};

export const deleteNews = async (id: string) => {
  return prisma.news_articles.delete({ where: { id } });
};
