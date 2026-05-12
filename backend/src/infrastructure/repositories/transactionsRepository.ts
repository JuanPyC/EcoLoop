import prisma from "../prismaClient";

export const findTransactions = async (filter?: { user_id?: string }) => {
  const where: any = {};
  if (filter?.user_id) where.user_id = filter.user_id;
  return prisma.transactions.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: { user: { select: { full_name: true, email: true } }, bin: { select: { waste_type: true, qr_code: true } } },
  });
};

export const findBinByQr = async (qr: string) => {
  return prisma.waste_bins.findUnique({ where: { qr_code: qr } });
};

export const createTransaction = async (data: { user_id: string; bin_id: string; points_earned: number; waste_type: any }) => {
  return prisma.transactions.create({ data });
};

export const getProfilePoints = async (user_id: string) => {
  const p = await prisma.profiles.findUnique({ where: { id: user_id }, select: { eco_points: true } });
  return p?.eco_points ?? 0;
};

export const updateProfilePoints = async (user_id: string, newPoints: number) => {
  return prisma.profiles.update({ where: { id: user_id }, data: { eco_points: newPoints } });
};
