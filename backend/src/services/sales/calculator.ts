import { SalesRepository } from "./repository";

export class SalesCalculator {
  constructor(private repository: SalesRepository) {}

  calculateSalesDataFromStats(stats: any[], period: string) {
    const totalSales = stats.reduce(
      (sum, row) => sum + (row._sum.totalSales || 0),
      0
    );
    const totalCount = stats.reduce(
      (sum, row) => sum + (row._sum.totalCount || 0),
      0
    );

    return {
      period,
      unloadCount: totalCount,
      totalShippingValue: totalSales,
      avgShippingValue:
        totalCount > 0 ? Math.round(totalSales / totalCount) : 0,
      normalProcessCount: stats.reduce(
        (sum, row) => sum + (row._sum.normalCount || 0),
        0
      ),
      processValue: stats.reduce(
        (sum, row) => sum + (row._sum.normalValue || 0),
        0
      ),
      accidentCount: stats.reduce(
        (sum, row) => sum + (row._sum.accidentCount || 0),
        0
      ),
      accidentValue: stats.reduce(
        (sum, row) => sum + (row._sum.accidentValue || 0),
        0
      ),
    };
  }

  calculateSalesDataFromMonthlyStats(row: any, year: number) {
    const totalSales = row._sum.totalSales || 0;
    const totalCount = row._sum.totalCount || 0;

    return {
      period: `${year}.${String(row.month).padStart(2, "0")}`,
      unloadCount: totalCount,
      totalShippingValue: totalSales,
      avgShippingValue:
        totalCount > 0 ? Math.round(totalSales / totalCount) : 0,
      normalProcessCount: row._sum.normalCount || 0,
      processValue: row._sum.normalValue || 0,
      accidentCount: row._sum.accidentCount || 0,
      accidentValue: row._sum.accidentValue || 0,
    };
  }

  calculateSalesDataFromDailyStats(row: any) {
    const day = Number(row.date.split("-")[2]);
    const totalSales = row._sum.totalSales || 0;
    const totalCount = row._sum.totalCount || 0;

    return {
      period: `${day}일`,
      unloadCount: totalCount,
      totalShippingValue: totalSales,
      avgShippingValue:
        totalCount > 0 ? Math.round(totalSales / totalCount) : 0,
      normalProcessCount: row._sum.normalCount || 0,
      processValue: row._sum.normalValue || 0,
      accidentCount: row._sum.accidentCount || 0,
      accidentValue: row._sum.accidentValue || 0,
    };
  }

  calculatePeriodSales(stats: any[]) {
    const unloadCount = stats.reduce((sum, s) => sum + s.totalCount, 0);
    const totalShippingValue = stats.reduce((sum, s) => sum + s.totalSales, 0);
    const avgShippingValue =
      unloadCount > 0 ? totalShippingValue / unloadCount : 0;
    const normalProcessCount = stats.reduce((sum, s) => sum + s.normalCount, 0);
    const processValue = stats.reduce((sum, s) => sum + s.normalValue, 0);
    const accidentCount = stats.reduce((sum, s) => sum + s.accidentCount, 0);
    const accidentValue = stats.reduce((sum, s) => sum + s.accidentValue, 0);

    return {
      unloadCount,
      totalShippingValue,
      avgShippingValue: Math.round(avgShippingValue),
      normalProcessCount,
      processValue,
      accidentCount,
      accidentValue,
    };
  }

  calculateOverviewData(stats: any[], monthlyStats: any[]) {
    const totalRevenue = stats.reduce((sum, s) => sum + s.totalSales, 0);
    const avgShippingValue =
      stats.reduce((sum, s) => sum + s.totalSales, 0) /
      (stats.reduce((sum, s) => sum + s.totalCount, 0) || 1);
    const totalProcessedCount = stats.reduce((sum, s) => sum + s.totalCount, 0);
    const totalAccidentCount = stats.reduce(
      (sum, s) => sum + s.accidentCount,
      0
    );
    const totalAccidentValue = stats.reduce(
      (sum, s) => sum + s.accidentValue,
      0
    );
    const accidentLossRate =
      totalRevenue > 0
        ? Math.round((totalAccidentValue / totalRevenue) * 1000) / 10
        : 0;

    let monthlyGrowthRate = 0;
    let currentMonthRevenue = 0;
    let previousMonthRevenue = 0;

    if (monthlyStats.length >= 2) {
      currentMonthRevenue = monthlyStats[monthlyStats.length - 1].totalSales;
      previousMonthRevenue = monthlyStats[monthlyStats.length - 2].totalSales;
      if (previousMonthRevenue > 0) {
        monthlyGrowthRate =
          Math.round(
            ((currentMonthRevenue - previousMonthRevenue) /
              previousMonthRevenue) *
              1000
          ) / 10;
      }
    }

    return {
      totalRevenue,
      avgShippingValue: Math.round(avgShippingValue),
      accidentLossRate,
      monthlyGrowthRate,
      totalProcessedCount,
      totalAccidentCount,
      currentMonthRevenue,
      previousMonthRevenue,
    };
  }

  calculateLocationSalesData(stats: any[]) {
    const locMap = new Map();

    stats.forEach((row) => {
      if (!locMap.has(row.locationId)) {
        locMap.set(row.locationId, {
          locationId: row.locationId,
          locationName: row.location.name,
          revenue: 0,
          processedCount: 0,
          accidentCount: 0,
        });
      }
      const loc = locMap.get(row.locationId);
      loc.revenue += row.totalSales;
      loc.processedCount += row.totalCount;
      loc.accidentCount += row.accidentCount;
    });

    return Array.from(locMap.values()).sort((a, b) => b.revenue - a.revenue);
  }
}
