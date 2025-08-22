import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { PrismaClient } from "@generated/prisma";

const prisma = new PrismaClient();

export const operatorSearchTool = tool(
  async ({ name, code, type, includeStats = true, limit = 50 }) => {
    try {
      const where: any = {};

      if (name) {
        where.name = { contains: name };
      }

      if (code) {
        where.code = { contains: code };
      }

      if (type) {
        where.type = type;
      }

      const operators = await prisma.operator.findMany({
        where,
        include: {
          ...(includeStats && {
            operatorsStats: true,
            waybills: {
              select: {
                id: true,
                status: true,
                processedAt: true,
                isAccident: true,
              },
              orderBy: { processedAt: "desc" },
              take: 10, // 최근 10개 운송장만
            },
            shifts: {
              select: {
                date: true,
                startTime: true,
                endTime: true,
              },
              orderBy: { date: "desc" },
              take: 5, // 최근 5일 근무기록만
            },
          }),
        },
        orderBy: { createdAt: "desc" },
        take: Math.min(limit, 100),
      });

      const summary = {
        totalOperators: operators.length,
        humanOperators: operators.filter((o) => o.type === "HUMAN").length,
        machineOperators: operators.filter((o) => o.type === "MACHINE").length,
      };

      return JSON.stringify({
        summary,
        operators: operators.map((op) => ({
          id: op.id,
          name: op.name,
          code: op.code,
          type: op.type,
          createdAt: op.createdAt,
          ...(includeStats &&
            op.operatorsStats && {
              stats: {
                workDays: op.operatorsStats.workDays,
                normalCount: op.operatorsStats.normalCount,
                accidentCount: op.operatorsStats.accidentCount,
                accidentRate:
                  op.operatorsStats.normalCount +
                    op.operatorsStats.accidentCount >
                  0
                    ? (
                        (op.operatorsStats.accidentCount /
                          (op.operatorsStats.normalCount +
                            op.operatorsStats.accidentCount)) *
                        100
                      ).toFixed(2) + "%"
                    : "0%",
                firstWorkDate: op.operatorsStats.firstWorkDate,
              },
            }),
          ...(includeStats && {
            recentWaybills: op.waybills?.length || 0,
            recentShifts: op.shifts?.length || 0,
            lastWorkDate: op.shifts?.[0]?.date,
          }),
        })),
      });
    } catch (error) {
      return `작업자 검색 중 오류 발생: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  },
  {
    name: "operator_search",
    description:
      "작업자나 기계를 검색하고 상세 정보를 조회합니다. 이름, 코드, 유형으로 필터링하고 통계 정보도 함께 조회할 수 있습니다.",
    schema: z.object({
      name: z.string().optional().describe("작업자 이름 (부분 검색 가능)"),
      code: z.string().optional().describe("작업자 코드/사번 (부분 검색 가능)"),
      type: z
        .enum(["HUMAN", "MACHINE"])
        .optional()
        .describe("작업자 유형 (HUMAN: 사람, MACHINE: 기계)"),
      includeStats: z.boolean().default(true).describe("통계 정보 포함 여부"),
      limit: z.number().default(50).describe("검색 결과 제한 수 (최대 100)"),
    }),
  }
);

export const operatorWorkTool = tool(
  async ({
    operatorId,
    startDate,
    endDate,
    locationId,
    includeDetails = false,
  }) => {
    try {
      const where: any = {};

      if (operatorId) {
        where.operatorId = operatorId;
      }

      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }

      if (locationId) {
        where.locationId = locationId;
      }

      const works = await prisma.operatorWork.findMany({
        where,
        include: {
          operator: {
            select: { name: true, code: true, type: true },
          },
          location: {
            select: { name: true, address: true },
          },
        },
        orderBy: { date: "desc" },
      });

      // 작업자별 집계
      const operatorSummary = works.reduce((acc, work) => {
        const key = work.operatorId;
        if (!acc[key]) {
          acc[key] = {
            operatorId: key,
            operatorName: work.operator.name,
            operatorCode: work.operator.code,
            operatorType: work.operator.type,
            totalDays: 0,
            totalProcessed: 0,
            totalAccidents: 0,
            totalRevenue: 0,
            totalErrors: 0,
            locations: new Set(),
          };
        }
        acc[key].totalDays += 1;
        acc[key].totalProcessed += work.processedCount;
        acc[key].totalAccidents += work.accidentCount;
        acc[key].totalRevenue += work.revenue;
        acc[key].totalErrors += work.errorCount;
        acc[key].locations.add(work.location.name);
        return acc;
      }, {} as any);

      // Set을 배열로 변환
      Object.values(operatorSummary).forEach((summary: any) => {
        summary.locations = Array.from(summary.locations);
        summary.avgProcessedPerDay =
          summary.totalDays > 0
            ? (summary.totalProcessed / summary.totalDays).toFixed(1)
            : "0";
        summary.accidentRate =
          summary.totalProcessed > 0
            ? ((summary.totalAccidents / summary.totalProcessed) * 100).toFixed(
                2
              ) + "%"
            : "0%";
        summary.avgRevenuePerDay =
          summary.totalDays > 0
            ? Math.round(summary.totalRevenue / summary.totalDays)
            : 0;
      });

      const overallSummary = {
        totalWorkRecords: works.length,
        uniqueOperators: Object.keys(operatorSummary).length,
        totalProcessed: works.reduce((sum, w) => sum + w.processedCount, 0),
        totalAccidents: works.reduce((sum, w) => sum + w.accidentCount, 0),
        totalRevenue: works.reduce((sum, w) => sum + w.revenue, 0),
        avgProcessedPerRecord:
          works.length > 0
            ? (
                works.reduce((sum, w) => sum + w.processedCount, 0) /
                works.length
              ).toFixed(1)
            : "0",
      };

      return JSON.stringify({
        overallSummary,
        operatorSummaries: Object.values(operatorSummary),
        ...(includeDetails && {
          detailRecords: works.map((w) => ({
            date: w.date,
            operatorName: w.operator.name,
            operatorCode: w.operator.code,
            locationName: w.location.name,
            processedCount: w.processedCount,
            accidentCount: w.accidentCount,
            revenue: w.revenue,
            errorCount: w.errorCount,
            createdAt: w.createdAt,
          })),
        }),
      });
    } catch (error) {
      return `작업자 업무 통계 조회 중 오류 발생: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  },
  {
    name: "operator_work",
    description:
      "작업자의 업무 성과와 통계를 조회합니다. 특정 기간이나 배송지별로 필터링하여 작업자별 성과 분석이 가능합니다.",
    schema: z.object({
      operatorId: z.number().optional().describe("특정 작업자 ID로 필터링"),
      startDate: z
        .string()
        .optional()
        .describe("조회 시작 날짜 (YYYY-MM-DD 형식)"),
      endDate: z
        .string()
        .optional()
        .describe("조회 종료 날짜 (YYYY-MM-DD 형식)"),
      locationId: z.number().optional().describe("특정 배송지 ID로 필터링"),
      includeDetails: z
        .boolean()
        .default(false)
        .describe("상세 레코드 포함 여부"),
    }),
  }
);
