import prisma from "../prismaClient";

export const listStations = async () => {
  return prisma.waste_stations.findMany({ include: { waste_bins: true }, orderBy: { created_at: 'desc' } });
};

export const getStationById = async (id: string) => {
  return prisma.waste_stations.findUnique({ where: { id }, include: { waste_bins: true } });
};

export const createStation = async (data: any) => {
  return prisma.waste_stations.create({ data });
};

export const updateStation = async (id: string, data: any) => {
  return prisma.waste_stations.update({ where: { id }, data });
};

export const deleteStation = async (id: string) => {
  return prisma.waste_stations.delete({ where: { id } });
};
