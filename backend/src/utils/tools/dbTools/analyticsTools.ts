import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { PrismaClient } from "@generated/prisma";

const prisma = new PrismaClient();

export const dashboardQueryTool = tool(
  async ({ period = "weekly", compareWithPrevious = true }) => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let startDate: Date;
      let endDate: Date = today;
      let prevStartDate: Date;
      let prevEndDate: Date;

      // 기간 설정
      switch (period) {
        case "daily":
          startDate = new Date(today);
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
          prevStartDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
          prevEndDate = new Date(today);
          break;
        case "weekly":
          const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = weekStart;
          prevStartDate = new Date(
            weekStart.getTime() - 7 * 24 * 60 * 60 * 1000
          );
          prevEndDate = weekStart;
          break;
        case "monthly":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          prevEndDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          prevStartDate = new Date(
            startDate.getTime() - 7 * 24 * 60 * 60 * 1000
          );
          prevEndDate = startDate;
      }

      // 현재 기간 데이터
      const [waybills, operators, locations, _waybillStats, salesStats] =
        await Promise.all([
          // 운송장 현황
          prisma.waybill.findMany({
            where: {
              processedAt: { gte: startDate, lt: endDate },
            },
            include: {
              parcel: { select: { declaredValue: true } },
            },
          }),

          // 활성 작업자
          prisma.operator.findMany({
            include: {
              operatorsStats: true,
              waybills: {
                where: { processedAt: { gte: startDate, lt: endDate } },
                select: { id: true, status: true },
              },
            },
          }),

          // 배송지 현황
          prisma.location.findMany({
            include: {
              waybills: {
                where: { processedAt: { gte: startDate, lt: endDate } },
                select: { id: true, status: true },
              },
            },
          }),

          // 통계 데이터
          prisma.waybillStats.findMany({
            where: {
              date: {
                gte: startDate.toISOString().split("T")[0],
                lt: endDate.toISOString().split("T")[0],
              },
            },
            include: { location: { select: { name: true } } },
          }),

          prisma.salesStats.findMany({
            where: {
              date: {
                gte: startDate.toISOString().split("T")[0],
                lt: endDate.toISOString().split("T")[0],
              },
            },
            include: { location: { select: { name: true } } },
          }),
        ]);

      // 이전 기간 데이터 (비교용)
      let previousData = null;
      if (compareWithPrevious) {
        const [prevWaybills, _prevWaybillStats, prevSalesStats] =
          await Promise.all([
            prisma.waybill.findMany({
              where: {
                processedAt: { gte: prevStartDate, lt: prevEndDate },
              },
              include: {
                parcel: { select: { declaredValue: true } },
              },
            }),

            prisma.waybillStats.findMany({
              where: {
                date: {
                  gte: prevStartDate.toISOString().split("T")[0],
                  lt: prevEndDate.toISOString().split("T")[0],
                },
              },
            }),

            prisma.salesStats.findMany({
              where: {
                date: {
                  gte: prevStartDate.toISOString().split("T")[0],
                  lt: prevEndDate.toISOString().split("T")[0],
                },
              },
            }),
          ]);

        previousData = {
          totalWaybills: prevWaybills.length,
          normalWaybills: prevWaybills.filter((w) => w.status === "NORMAL")
            .length,
          accidentWaybills: prevWaybills.filter((w) => w.status === "ACCIDENT")
            .length,
          totalValue: prevWaybills.reduce(
            (sum, w) => sum + (w.parcel?.declaredValue || 0),
            0
          ),
          totalRevenue: prevSalesStats.reduce(
            (sum, s) => sum + s.totalSales,
            0
          ),
        };
      }

      // 현재 기간 집계
      const currentData = {
        totalWaybills: waybills.length,
        normalWaybills: waybills.filter((w) => w.status === "NORMAL").length,
        accidentWaybills: waybills.filter((w) => w.status === "ACCIDENT")
          .length,
        pendingWaybills: waybills.filter((w) => w.status === "PENDING_UNLOAD")
          .length,
        totalValue: waybills.reduce(
          (sum, w) => sum + (w.parcel?.declaredValue || 0),
          0
        ),
        totalRevenue: salesStats.reduce((sum, s) => sum + s.totalSales, 0),
        accidentRate:
          waybills.length > 0
            ? (
                (waybills.filter((w) => w.status === "ACCIDENT").length /
                  waybills.length) *
                100
              ).toFixed(2) + "%"
            : "0%",
      };

      // 작업자 성과 분석
      const activeOperators = operators.filter((op) => op.waybills.length > 0);
      const operatorPerformance = {
        totalOperators: operators.length,
        activeOperators: activeOperators.length,
        humanOperators: activeOperators.filter((op) => op.type === "HUMAN")
          .length,
        machineOperators: activeOperators.filter((op) => op.type === "MACHINE")
          .length,
        topPerformers: activeOperators
          .sort((a, b) => b.waybills.length - a.waybills.length)
          .slice(0, 5)
          .map((op) => ({
            name: op.name,
            code: op.code,
            type: op.type,
            processedCount: op.waybills.length,
            normalCount: op.waybills.filter((w) => w.status === "NORMAL")
              .length,
          })),
      };

      // 배송지별 현황
      const activeLocations = locations.filter(
        (loc) => loc.waybills.length > 0
      );
      const locationAnalysis = {
        totalLocations: locations.length,
        activeLocations: activeLocations.length,
        topLocationsByVolume: activeLocations
          .sort((a, b) => b.waybills.length - a.waybills.length)
          .slice(0, 5)
          .map((loc) => ({
            name: loc.name,
            processedCount: loc.waybills.length,
            normalCount: loc.waybills.filter((w) => w.status === "NORMAL")
              .length,
            accidentCount: loc.waybills.filter((w) => w.status === "ACCIDENT")
              .length,
          })),
      };

      // 변화율 계산
      const changes = previousData
        ? {
            waybillChange:
              previousData.totalWaybills > 0
                ? (
                    ((currentData.totalWaybills - previousData.totalWaybills) /
                      previousData.totalWaybills) *
                    100
                  ).toFixed(1) + "%"
                : "N/A",
            revenueChange:
              previousData.totalRevenue > 0
                ? (
                    ((currentData.totalRevenue - previousData.totalRevenue) /
                      previousData.totalRevenue) *
                    100
                  ).toFixed(1) + "%"
                : "N/A",
            accidentChange:
              previousData.accidentWaybills > 0
                ? (
                    ((currentData.accidentWaybills -
                      previousData.accidentWaybills) /
                      previousData.accidentWaybills) *
                    100
                  ).toFixed(1) + "%"
                : "N/A",
          }
        : null;

      return JSON.stringify({
        period,
        dateRange: {
          start: startDate.toISOString().split("T")[0],
          end: endDate.toISOString().split("T")[0],
        },
        currentData,
        operatorPerformance,
        locationAnalysis,
        ...(compareWithPrevious && { previousData, changes }),
        insights: {
          busyLocations:
            activeLocations.length > 0
              ? `총 ${activeLocations.length}개 배송지가 활성화되어 있습니다.`
              : "활성 배송지가 없습니다.",
          efficiency: currentData.accidentRate
            ? `사고율이 ${currentData.accidentRate}입니다.`
            : "사고가 발생하지 않았습니다.",
          productivity:
            operatorPerformance.activeOperators > 0
              ? `${operatorPerformance.activeOperators}명의 작업자가 활동 중입니다.`
              : "활동 중인 작업자가 없습니다.",
        },
      });
    } catch (error) {
      return `대시보드 데이터 조회 중 오류 발생: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  },
  {
    name: "dashboard_query",
    description:
      "스마트 창고의 종합 대시보드 데이터를 조회합니다. 운송장, 작업자, 배송지 현황을 한눈에 볼 수 있고, 이전 기간과의 비교 분석도 제공합니다.",
    schema: z.object({
      period: z
        .enum(["daily", "weekly", "monthly"])
        .default("weekly")
        .describe("조회 기간 (daily: 일별, weekly: 주별, monthly: 월별)"),
      compareWithPrevious: z
        .boolean()
        .default(true)
        .describe("이전 기간과 비교 여부"),
    }),
  }
);

export const customQueryTool = tool(
  async ({ queryType, conditions, groupBy, orderBy, limit = 100 }) => {
    try {
      let result: any;

      switch (queryType) {
        case "waybill_analysis":
          const waybillWhere: any = {};

          // 조건 파싱
          if (conditions.status) waybillWhere.status = conditions.status;
          if (conditions.startDate || conditions.endDate) {
            waybillWhere.processedAt = {};
            if (conditions.startDate)
              waybillWhere.processedAt.gte = new Date(conditions.startDate);
            if (conditions.endDate)
              waybillWhere.processedAt.lte = new Date(conditions.endDate);
          }
          if (conditions.operatorId)
            waybillWhere.operatorId = conditions.operatorId;
          if (conditions.locationId)
            waybillWhere.locationId = conditions.locationId;
          if (conditions.minValue)
            waybillWhere.parcel = {
              declaredValue: { gte: conditions.minValue },
            };

          result = await prisma.waybill.findMany({
            where: waybillWhere,
            include: {
              operator: { select: { name: true, code: true, type: true } },
              location: { select: { name: true } },
              parcel: { select: { declaredValue: true } },
            },
            orderBy:
              orderBy === "date"
                ? { processedAt: "desc" }
                : orderBy === "value"
                ? { parcel: { declaredValue: "desc" } }
                : { processedAt: "desc" },
            take: Math.min(limit, 200),
          });

          // 그룹핑 처리
          if (groupBy === "operator") {
            const grouped = result.reduce((acc: any, item: any) => {
              const key = item.operator?.name || "미배정";
              if (!acc[key]) acc[key] = [];
              acc[key].push(item);
              return acc;
            }, {});
            result = { groupedData: grouped, totalRecords: result.length };
          } else if (groupBy === "location") {
            const grouped = result.reduce((acc: any, item: any) => {
              const key = item.location.name;
              if (!acc[key]) acc[key] = [];
              acc[key].push(item);
              return acc;
            }, {});
            result = { groupedData: grouped, totalRecords: result.length };
          }
          break;

        case "performance_analysis":
          // 작업자 성과 분석
          const performanceData = await prisma.operatorWork.findMany({
            where: {
              ...(conditions.startDate && {
                date: { gte: new Date(conditions.startDate) },
              }),
              ...(conditions.endDate && {
                date: { lte: new Date(conditions.endDate) },
              }),
              ...(conditions.operatorId && {
                operatorId: conditions.operatorId,
              }),
              ...(conditions.locationId && {
                locationId: conditions.locationId,
              }),
            },
            include: {
              operator: { select: { name: true, code: true, type: true } },
              location: { select: { name: true } },
            },
          });

          if (groupBy === "operator") {
            const grouped = performanceData.reduce((acc: any, work: any) => {
              const key = work.operator.name;
              if (!acc[key]) {
                acc[key] = {
                  operatorName: key,
                  operatorCode: work.operator.code,
                  operatorType: work.operator.type,
                  totalDays: 0,
                  totalProcessed: 0,
                  totalRevenue: 0,
                  totalAccidents: 0,
                };
              }
              acc[key].totalDays += 1;
              acc[key].totalProcessed += work.processedCount;
              acc[key].totalRevenue += work.revenue;
              acc[key].totalAccidents += work.accidentCount;
              return acc;
            }, {});

            Object.values(grouped).forEach((summary: any) => {
              summary.avgProcessedPerDay =
                summary.totalDays > 0
                  ? (summary.totalProcessed / summary.totalDays).toFixed(1)
                  : "0";
              summary.accidentRate =
                summary.totalProcessed > 0
                  ? (
                      (summary.totalAccidents / summary.totalProcessed) *
                      100
                    ).toFixed(2) + "%"
                  : "0%";
            });

            result = {
              groupedPerformance: Object.values(grouped),
              totalRecords: performanceData.length,
            };
          } else {
            result = performanceData;
          }
          break;

        case "trend_analysis":
          // 트렌드 분석
          const trendData = await prisma.waybillStats.findMany({
            where: {
              ...(conditions.startDate && {
                date: { gte: conditions.startDate },
              }),
              ...(conditions.endDate && { date: { lte: conditions.endDate } }),
              ...(conditions.locationId && {
                locationId: conditions.locationId,
              }),
            },
            include: {
              location: { select: { name: true } },
            },
            orderBy: { date: "asc" },
          });

          if (groupBy === "location") {
            const grouped = trendData.reduce((acc: any, stat: any) => {
              const key = stat.location.name;
              if (!acc[key]) acc[key] = [];
              acc[key].push(stat);
              return acc;
            }, {});
            result = {
              trendByLocation: grouped,
              totalRecords: trendData.length,
            };
          } else {
            result = trendData;
          }
          break;

        default:
          return `지원하지 않는 쿼리 타입입니다: ${queryType}`;
      }

      return JSON.stringify({
        queryType,
        conditions,
        groupBy,
        orderBy,
        resultCount: Array.isArray(result)
          ? result.length
          : result.totalRecords || 0,
        data: result,
      });
    } catch (error) {
      return `커스텀 쿼리 실행 중 오류 발생: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  },
  {
    name: "custom_query",
    description:
      "복합 조건으로 자유롭게 데이터를 조회하고 분석합니다. 운송장 분석, 성과 분석, 트렌드 분석 등 다양한 쿼리 타입을 지원합니다.",
    schema: z.object({
      queryType: z
        .enum(["waybill_analysis", "performance_analysis", "trend_analysis"])
        .describe(
          "쿼리 타입 (waybill_analysis: 운송장 분석, performance_analysis: 성과 분석, trend_analysis: 트렌드 분석)"
        ),
      conditions: z
        .object({
          startDate: z.string().optional().describe("시작 날짜 (YYYY-MM-DD)"),
          endDate: z.string().optional().describe("종료 날짜 (YYYY-MM-DD)"),
          operatorId: z.number().optional().describe("작업자 ID"),
          locationId: z.number().optional().describe("배송지 ID"),
          status: z
            .enum(["PENDING_UNLOAD", "UNLOADED", "NORMAL", "ACCIDENT"])
            .optional()
            .describe("운송장 상태"),
          minValue: z.number().optional().describe("최소 운송장 가치"),
        })
        .describe("쿼리 조건"),
      groupBy: z
        .enum(["operator", "location", "date"])
        .optional()
        .describe("그룹핑 기준"),
      orderBy: z
        .enum(["date", "value", "count"])
        .optional()
        .describe("정렬 기준"),
      limit: z.number().default(100).describe("결과 제한 수 (최대 200)"),
    }),
  }
);
