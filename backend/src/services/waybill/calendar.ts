import { PrismaClient } from "@generated/prisma";
import { WaybillFilters, WaybillLocationCalendarData, WaybillLocationCalendarInternalData } from "@typings/index";

const prisma = new PrismaClient();

export class WaybillCalendarService {
  async getWaybillsByLocationCalendarData(filters: WaybillFilters = {}) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.unloadDate = {};
      if (filters.startDate) {
        where.unloadDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.unloadDate.lte = filters.endDate;
      }
    }

    const waybills = await prisma.waybill.findMany({
      where,
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const dateMap = new Map<string, WaybillLocationCalendarInternalData>();

    waybills.forEach((waybill) => {
      const dateStr = waybill.unloadDate.toISOString().split("T")[0];

      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { count: 0, statuses: {}, locations: {} });
      }

      const dateData = dateMap.get(dateStr)!;
      dateData.count++;
      dateData.statuses[waybill.status] =
        (dateData.statuses[waybill.status] || 0) + 1;

      const locationName = waybill.location?.name || "미지정";
      if (!dateData.locations[locationName]) {
        dateData.locations[locationName] = { name: locationName, count: 0 };
      }
      dateData.locations[locationName].count++;
    });

    const result: WaybillLocationCalendarData[] = Array.from(dateMap.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      statuses: data.statuses,
      locations: Object.values(data.locations),
    }));

    return result;
  }
}
