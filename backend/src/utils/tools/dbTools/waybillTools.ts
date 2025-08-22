import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { PrismaClient } from "@generated/prisma";

const prisma = new PrismaClient();

export const waybillSearchTool = tool(
  async ({
    waybillNumber,
    status,
    startDate,
    endDate,
    operatorId,
    locationId,
    limit = 50,
  }) => {
    try {
      const where: any = {};

      if (waybillNumber) {
        where.number = { contains: waybillNumber };
      }

      if (status) {
        where.status = status;
      }

      if (startDate || endDate) {
        where.processedAt = {};
        if (startDate) where.processedAt.gte = new Date(startDate);
        if (endDate) where.processedAt.lte = new Date(endDate);
      }

      if (operatorId) {
        where.operatorId = operatorId;
      }

      if (locationId) {
        where.locationId = locationId;
      }

      const waybills = await prisma.waybill.findMany({
        where,
        include: {
          operator: {
            select: { name: true, code: true, type: true },
          },
          location: {
            select: { name: true, address: true },
          },
          parcel: {
            select: { declaredValue: true },
          },
        },
        orderBy: { processedAt: "desc" },
        take: Math.min(limit, 100), // 최대 100개로 제한
      });

      const summary = {
        totalCount: waybills.length,
        normalCount: waybills.filter((w) => w.status === "NORMAL").length,
        accidentCount: waybills.filter((w) => w.status === "ACCIDENT").length,
        pendingCount: waybills.filter((w) => w.status === "PENDING_UNLOAD")
          .length,
        unloadedCount: waybills.filter((w) => w.status === "UNLOADED").length,
        totalValue: waybills.reduce(
          (sum, w) => sum + (w.parcel?.declaredValue || 0),
          0
        ),
      };

      return JSON.stringify({
        summary,
        waybills: waybills.map((w) => ({
          id: w.id,
          number: w.number,
          status: w.status,
          processedAt: w.processedAt,
          isAccident: w.isAccident,
          operator: w.operator
            ? `${w.operator.name}(${w.operator.code})`
            : "미배정",
          location: w.location.name,
          declaredValue: w.parcel?.declaredValue || 0,
        })),
      });
    } catch (error) {
      return `운송장 검색 중 오류 발생: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  },
  {
    name: "waybill_search",
    description:
      "운송장을 검색하고 상세 정보를 조회합니다. 운송장 번호, 상태, 날짜 범위, 작업자, 배송지 등으로 필터링 가능합니다.",
    schema: z.object({
      waybillNumber: z
        .string()
        .optional()
        .describe("운송장 번호 (부분 검색 가능)"),
      status: z
        .enum(["PENDING_UNLOAD", "UNLOADED", "NORMAL", "ACCIDENT"])
        .optional()
        .describe("운송장 상태"),
      startDate: z
        .string()
        .optional()
        .describe("검색 시작 날짜 (YYYY-MM-DD 형식)"),
      endDate: z
        .string()
        .optional()
        .describe("검색 종료 날짜 (YYYY-MM-DD 형식)"),
      operatorId: z.number().optional().describe("작업자 ID"),
      locationId: z.number().optional().describe("배송지 ID"),
      limit: z.number().default(50).describe("검색 결과 제한 수 (최대 100)"),
    }),
  }
);

export const waybillStatsTool = tool(
  async ({ period, startDate, endDate, locationId, groupBy = "date" }) => {
    try {
      let stats: any[] = [];

      if (period === "daily" || (!period && startDate && endDate)) {
        // 일별 통계
        const where: any = {};
        if (startDate) where.date = { gte: startDate };
        if (endDate) where.date = { lte: endDate };
        if (locationId) where.locationId = locationId;

        stats = await prisma.waybillStats.findMany({
          where,
          include: {
            location: { select: { name: true } },
          },
          orderBy: { date: "desc" },
        });
      } else if (period === "monthly") {
        // 월별 통계
        const where: any = {};
        if (locationId) where.locationId = locationId;

        stats = await prisma.waybillMonthlyStats.findMany({
          where,
          include: {
            location: { select: { name: true } },
          },
          orderBy: [{ year: "desc" }, { month: "desc" }],
        });
      } else if (period === "yearly") {
        // 연별 통계
        const where: any = {};
        if (locationId) where.locationId = locationId;

        stats = await prisma.waybillYearlyStats.findMany({
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
              totalCount: 0,
              normalCount: 0,
              accidentCount: 0,
            };
          }
          acc[key].totalCount += stat.totalCount;
          acc[key].normalCount += stat.normalCount;
          acc[key].accidentCount += stat.accidentCount;
          return acc;
        }, {});
      }

      const summary = {
        totalRecords: stats.length,
        totalWaybills: stats.reduce((sum, s) => sum + s.totalCount, 0),
        totalNormal: stats.reduce((sum, s) => sum + s.normalCount, 0),
        totalAccidents: stats.reduce((sum, s) => sum + s.accidentCount, 0),
        accidentRate:
          stats.length > 0
            ? (
                (stats.reduce((sum, s) => sum + s.accidentCount, 0) /
                  stats.reduce((sum, s) => sum + s.totalCount, 0)) *
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
          accidentRate:
            s.totalCount > 0
              ? ((s.accidentCount / s.totalCount) * 100).toFixed(2) + "%"
              : "0%",
        })),
      });
    } catch (error) {
      return `운송장 통계 조회 중 오류 발생: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  },
  {
    name: "waybill_stats",
    description:
      "운송장 처리 통계를 조회합니다. 일별/월별/연별 통계를 지원하며, 배송지별 그룹핑도 가능합니다.",
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
