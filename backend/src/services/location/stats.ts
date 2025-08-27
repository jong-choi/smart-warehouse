import { LocationStats } from "@typings/index";
import { LocationRepository } from "./repository";

export class LocationStatsService {
  constructor(private repository: LocationRepository) {}

  async getLocationStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<LocationStats> {
    const dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) {
        dateFilter.gte = startDate;
      }
      if (endDate) {
        dateFilter.lte = endDate;
      }
    }

    const locations = await this.repository.findAll();

    const locationStats = await Promise.all(
      locations.map(async (location) => {
        const stats = await this.repository.getWaybillStatsByLocation(
          location.id,
          dateFilter
        );

        return {
          id: location.id,
          name: location.name,
          address: location.address,
          waybillCount: location._count.waybills,
          workCount: location._count.operatorWorks,
          pendingUnloadCount: stats.pendingUnloadCount,
          totalProcessedCount: stats.totalProcessedCount,
          accidentCount: stats.accidentCount,
          totalRevenue: stats.totalRevenue,
          accidentAmount: stats.accidentAmount,
        };
      })
    );

    return {
      total: locations.length,
      locations: locationStats,
    };
  }
}
