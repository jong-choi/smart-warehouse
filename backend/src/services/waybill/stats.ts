import { PrismaClient } from "@generated/prisma";
import { WaybillFilters } from "@/typings";
import { WaybillLocationStats } from "./types";

const prisma = new PrismaClient();

export class WaybillStatsService {
  async getWaybillCalendarData(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate) where.date = { gte: startDate.toISOString().split("T")[0] };
    if (endDate)
      where.date = {
        ...(where.date || {}),
        lte: endDate.toISOString().split("T")[0],
      };

    const stats = await prisma.waybillStats.findMany({
      where,
      select: {
        date: true,
        totalCount: true,
      },
      orderBy: { date: "asc" },
    });

    const dateMap = new Map<string, number>();
    stats.forEach((row) => {
      dateMap.set(row.date, (dateMap.get(row.date) || 0) + row.totalCount);
    });

    return Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }

  async getWaybillsByLocationStats(filters: WaybillFilters = {}) {
    const where: any = {};
    if (filters.startDate)
      where.date = { gte: filters.startDate.toISOString().split("T")[0] };
    if (filters.endDate)
      where.date = {
        ...(where.date || {}),
        lte: filters.endDate.toISOString().split("T")[0],
      };

    const stats = await prisma.waybillStats.findMany({
      where,
      select: {
        locationId: true,
        totalCount: true,
        location: { select: { name: true, address: true } },
      },
    });

    const locMap = new Map<number, WaybillLocationStats>();

    stats.forEach((row) => {
      if (!locMap.has(row.locationId)) {
        locMap.set(row.locationId, {
          locationId: row.locationId,
          locationName: row.location.name,
          address: row.location.address || "",
          count: 0,
          statuses: {},
        });
      }
      locMap.get(row.locationId)!.count += row.totalCount;
    });

    const waybills = await prisma.waybill.findMany({
      where: {
        locationId: { in: Array.from(locMap.keys()) },
        ...(filters.startDate || filters.endDate
          ? {
              unloadDate: {
                ...(filters.startDate && { gte: filters.startDate }),
                ...(filters.endDate && { lte: filters.endDate }),
              },
            }
          : {}),
      },
      select: {
        locationId: true,
        status: true,
      },
    });

    waybills.forEach((wb) => {
      const loc = locMap.get(wb.locationId);
      if (loc) {
        loc.statuses[wb.status] = (loc.statuses[wb.status] || 0) + 1;
      }
    });

    return Array.from(locMap.values()).sort((a, b) => b.count - a.count);
  }
}
