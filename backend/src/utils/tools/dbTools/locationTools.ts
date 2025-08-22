import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { PrismaClient } from "@generated/prisma";

const prisma = new PrismaClient();

export const locationSearchTool = tool(
  async ({ name, address, includeStats = true, limit = 50 }) => {
    try {
      const where: any = {};

      if (name) {
        where.name = { contains: name };
      }

      if (address) {
        where.address = { contains: address };
      }

      const locations = await prisma.location.findMany({
        where,
        include: {
          ...(includeStats && {
            waybills: {
              select: {
                id: true,
                status: true,
                processedAt: true,
                isAccident: true,
              },
              orderBy: { processedAt: "desc" },
              take: 20, // 최근 20개만
            },
            waybillStats: {
              orderBy: { date: "desc" },
              take: 7, // 최근 7일 통계
            },
            salesStats: {
              orderBy: { date: "desc" },
              take: 7, // 최근 7일 매출
            },
          }),
        },
        orderBy: { createdAt: "desc" },
        take: Math.min(limit, 100),
      });

      const summary = {
        totalLocations: locations.length,
        activeLocations: locations.filter(
          (l) => l.waybills && l.waybills.length > 0
        ).length,
      };

      return JSON.stringify({
        summary,
        locations: locations.map((loc) => ({
          id: loc.id,
          name: loc.name,
          address: loc.address,
          createdAt: loc.createdAt,
          ...(includeStats && {
            recentActivity: {
              totalWaybills: loc.waybills?.length || 0,
              recentNormal:
                loc.waybills?.filter((w) => w.status === "NORMAL").length || 0,
              recentAccidents:
                loc.waybills?.filter((w) => w.status === "ACCIDENT").length ||
                0,
              lastActivity: loc.waybills?.[0]?.processedAt,
            },
            weeklyStats: loc.waybillStats?.length
              ? {
                  avgDailyWaybills: (
                    loc.waybillStats.reduce((sum, s) => sum + s.totalCount, 0) /
                    loc.waybillStats.length
                  ).toFixed(1),
                  totalWeeklyWaybills: loc.waybillStats.reduce(
                    (sum, s) => sum + s.totalCount,
                    0
                  ),
                  weeklyAccidents: loc.waybillStats.reduce(
                    (sum, s) => sum + s.accidentCount,
                    0
                  ),
                }
              : null,
            weeklySales: loc.salesStats?.length
              ? {
                  totalWeeklySales: loc.salesStats.reduce(
                    (sum, s) => sum + s.totalSales,
                    0
                  ),
                  avgDailySales: (
                    loc.salesStats.reduce((sum, s) => sum + s.totalSales, 0) /
                    loc.salesStats.length
                  ).toFixed(0),
                }
              : null,
          }),
        })),
      });
    } catch (error) {
      return `배송지 검색 중 오류 발생: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  },
  {
    name: "location_search",
    description:
      "배송지를 검색하고 상세 정보를 조회합니다. 배송지명, 주소로 필터링하고 최근 활동 및 통계 정보도 함께 조회할 수 있습니다.",
    schema: z.object({
      name: z.string().optional().describe("배송지명 (부분 검색 가능)"),
      address: z.string().optional().describe("주소 (부분 검색 가능)"),
      includeStats: z.boolean().default(true).describe("통계 정보 포함 여부"),
      limit: z.number().default(50).describe("검색 결과 제한 수 (최대 100)"),
    }),
  }
);

export const salesStatsTool = tool(
  async ({ period, startDate, endDate, locationId, groupBy = "date" }) => {
    try {
      let stats: any[] = [];

      if (period === "daily" || (!period && startDate && endDate)) {
        // 일별 매출 통계
        const where: any = {};
        if (startDate) where.date = { gte: startDate };
        if (endDate) where.date = { lte: endDate };
        if (locationId) where.locationId = locationId;

        stats = await prisma.salesStats.findMany({
          where,
          include: {
            location: { select: { name: true } },
          },
          orderBy: { date: "desc" },
        });
      } else if (period === "monthly") {
        // 월별 매출 통계
        const where: any = {};
        if (locationId) where.locationId = locationId;

        stats = await prisma.salesMonthlyStats.findMany({
          where,
          include: {
            location: { select: { name: true } },
          },
          orderBy: [{ year: "desc" }, { month: "desc" }],
        });
      } else if (period === "yearly") {
        // 연별 매출 통계
        const where: any = {};
        if (locationId) where.locationId = locationId;

        stats = await prisma.salesYearlyStats.findMany({
          where,
          include: {
            location: { select: { name: true } },
          },
          orderBy: { year: "desc" },
        });
      }

      // 그룹별 집계
      let groupedStats: any = {};
      if (groupBy === "location") {
        groupedStats = stats.reduce((acc, stat) => {
          const key = stat.location.name;
          if (!acc[key]) {
            acc[key] = {
              locationName: key,
              totalSales: 0,
              totalCount: 0,
              normalCount: 0,
              normalValue: 0,
              accidentCount: 0,
              accidentValue: 0,
            };
          }
          acc[key].totalSales += stat.totalSales;
          acc[key].totalCount += stat.totalCount;
          acc[key].normalCount += stat.normalCount;
          acc[key].normalValue += stat.normalValue;
          acc[key].accidentCount += stat.accidentCount;
          acc[key].accidentValue += stat.accidentValue;
          return acc;
        }, {});
      }

      // 추가 분석 지표 계산
      Object.values(groupedStats).forEach((summary: any) => {
        summary.avgValuePerWaybill =
          summary.totalCount > 0
            ? Math.round(summary.totalSales / summary.totalCount)
            : 0;
        summary.accidentRate =
          summary.totalCount > 0
            ? ((summary.accidentCount / summary.totalCount) * 100).toFixed(2) +
              "%"
            : "0%";
        summary.accidentValueRate =
          summary.totalSales > 0
            ? ((summary.accidentValue / summary.totalSales) * 100).toFixed(2) +
              "%"
            : "0%";
      });

      const summary = {
        totalRecords: stats.length,
        totalSales: stats.reduce((sum, s) => sum + s.totalSales, 0),
        totalWaybills: stats.reduce((sum, s) => sum + s.totalCount, 0),
        totalNormalValue: stats.reduce((sum, s) => sum + s.normalValue, 0),
        totalAccidentValue: stats.reduce((sum, s) => sum + s.accidentValue, 0),
        avgSalesPerWaybill:
          stats.length > 0
            ? Math.round(
                stats.reduce((sum, s) => sum + s.totalSales, 0) /
                  stats.reduce((sum, s) => sum + s.totalCount, 0)
              )
            : 0,
        accidentValueImpact:
          stats.length > 0
            ? (
                (stats.reduce((sum, s) => sum + s.accidentValue, 0) /
                  stats.reduce((sum, s) => sum + s.totalSales, 0)) *
                100
              ).toFixed(2) + "%"
            : "0%",
      };

      return JSON.stringify({
        summary,
        period,
        groupBy,
        ...(groupBy === "location"
          ? { groupedStats: Object.values(groupedStats) }
          : {}),
        detailStats: stats.map((s) => ({
          ...s,
          locationName: s.location.name,
          avgValuePerWaybill:
            s.totalCount > 0 ? Math.round(s.totalSales / s.totalCount) : 0,
          accidentRate:
            s.totalCount > 0
              ? ((s.accidentCount / s.totalCount) * 100).toFixed(2) + "%"
              : "0%",
          normalValueRate:
            s.totalSales > 0
              ? ((s.normalValue / s.totalSales) * 100).toFixed(2) + "%"
              : "0%",
        })),
      });
    } catch (error) {
      return `매출 통계 조회 중 오류 발생: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  },
  {
    name: "sales_stats",
    description:
      "배송지별 매출 통계를 조회합니다. 일별/월별/연별 매출을 지원하며, 정상/사고 운송장의 가치 분석도 포함됩니다.",
    schema: z.object({
      period: z
        .enum(["daily", "monthly", "yearly"])
        .optional()
        .describe("통계 기간 (daily: 일별, monthly: 월별, yearly: 연별)"),
      startDate: z
        .string()
        .optional()
        .describe("시작 날짜 (YYYY-MM-DD 형식, daily용)"),
      endDate: z
        .string()
        .optional()
        .describe("종료 날짜 (YYYY-MM-DD 형식, daily용)"),
      locationId: z.number().optional().describe("특정 배송지 ID로 필터링"),
      groupBy: z
        .enum(["date", "location"])
        .default("date")
        .describe("그룹핑 기준 (date: 날짜별, location: 배송지별)"),
    }),
  }
);
