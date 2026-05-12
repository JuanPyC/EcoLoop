import prisma from "../prismaClient";

export const listProfiles = async (filter?: { role?: string }) => {
  const where: any = {};
  if (filter?.role) where.role = filter.role;
  return prisma.profiles.findMany({ where, orderBy: { created_at: 'desc' } });
};

export const getProfileById = async (id: string) => {
  return prisma.profiles.findUnique({ where: { id } });
};

export const findProfileByEmail = async (email: string) => {
  return prisma.profiles.findFirst({ where: { email } });
};

export const createProfile = async (data: { email: string; full_name?: string | null; role?: string; eco_points?: number }) => {
  return prisma.profiles.create({
    data: {
      email: data.email,
      full_name: data.full_name ?? null,
      role: (data.role as any) ?? "user",
      eco_points: data.eco_points ?? 0,
    },
  });
};

export const updateProfile = async (id: string, data: any) => {
  return prisma.profiles.update({ where: { id }, data });
};
