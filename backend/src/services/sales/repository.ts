import { PrismaClient } from "@generated/prisma";

const prisma = new PrismaClient();

export class SalesRepository {
  async getMonthlySalesStats(year: number) {
    return await prisma.salesMonthlyStats.groupBy({
      by: ["month"],
      where: { year },
      _sum: {
        totalSales: true,
        totalCount: true,
        normalCount: true,
        normalValue: true,
        accidentCount: true,
        accidentValue: true,
      },
      orderBy: { month: "asc" },
    });
  }

  async getDailySalesStats(year: number, month: number) {
    const monthStr = String(month).padStart(2, "0");
    return await prisma.salesStats.groupBy({
      by: ["date"],
      where: {
        date: {
          gte: `${year}-${monthStr}-01`,
          lte: `${year}-${monthStr}-31`,
        },
      },
      _sum: {
        totalSales: true,
        totalCount: true,
        normalCount: true,
        normalValue: true,
        accidentCount: true,
        accidentValue: true,
      },
      orderBy: { date: "asc" },
    });
  }

  async getSalesStatsForPeriod(startDate: Date, endDate: Date) {
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];
    return await prisma.salesStats.findMany({
      where: {
        date: { gte: start, lt: end },
      },
    });
  }

  async getYearlySalesStats(year: number) {
    const yearStr = year.toString();
    return await prisma.salesStats.findMany({
      where: { date: { gte: `${yearStr}-01-01`, lte: `${yearStr}-12-31` } },
    });
  }

  async getMonthlyStatsForYear(year: number) {
    return await prisma.salesMonthlyStats.findMany({
      where: { year },
      orderBy: { month: "asc" },
    });
  }

  async getLocationSalesStats(year: number) {
    const yearStr = year.toString();
    return await prisma.salesStats.findMany({
      where: { date: { gte: `${yearStr}-01-01`, lte: `${yearStr}-12-31` } },
      select: {
        locationId: true,
        totalSales: true,
        totalCount: true,
        accidentCount: true,
        location: { select: { name: true } },
      },
    });
  }
}
