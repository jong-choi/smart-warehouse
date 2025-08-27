import { PrismaClient } from "@generated/prisma";
import { OperatorStats } from "@typings/index";
import { OperatorRepository } from "./repository";
import { OperatorWorkStats } from "./types";

const prisma = new PrismaClient();

export class OperatorStatsService {
  constructor(private repository: OperatorRepository) {}

  async getOperatorStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<OperatorStats> {
    const dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) {
        dateFilter.gte = startDate;
      }
      if (endDate) {
        dateFilter.lte = endDate;
      }
    }

    const stats = await prisma.operator.groupBy({
      by: ["type"],
      _count: {
        id: true,
      },
    });

    const totalCount = await prisma.operator.count();
    const operators = await this.repository.findAll();

    const operatorStats = await Promise.all(
      operators.map(async (operator) => {
        const workStats = await this.getOperatorWorkStats(operator.id, dateFilter);
        return {
          id: operator.id,
          name: operator.name,
          code: operator.code,
          type: operator.type,
          totalProcessedCount: workStats.totalProcessedCount,
          accidentCount: workStats.accidentCount,
          totalRevenue: workStats.totalRevenue,
          accidentAmount: workStats.accidentAmount,
          averageDailyProcessed: workStats.averageDailyProcessed,
        };
      })
    );

    return {
      total: totalCount,
      byType: stats.map((stat) => ({
        type: stat.type,
        count: stat._count.id,
      })),
      operators: operatorStats,
    };
  }

  private async getOperatorWorkStats(
    operatorId: number,
    dateFilter: any
  ): Promise<OperatorWorkStats> {
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
      },
    });

    if (!operator) {
      throw new Error(`Operator with id ${operatorId} not found`);
    }

    const totalProcessedCount = await prisma.waybill.count({
      where: {
        operatorId,
        status: { in: ["NORMAL", "ACCIDENT"] },
        ...(Object.keys(dateFilter).length > 0 && {
          processedAt: dateFilter,
        }),
      },
    });

    const accidentCount = await prisma.waybill.count({
      where: {
        operatorId,
        status: "ACCIDENT",
        ...(Object.keys(dateFilter).length > 0 && {
          processedAt: dateFilter,
        }),
      },
    });

    const normalWaybillsWithParcels = await prisma.waybill.findMany({
      where: {
        operatorId,
        status: "NORMAL",
        ...(Object.keys(dateFilter).length > 0 && {
          processedAt: dateFilter,
        }),
      },
      include: {
        parcel: {
          select: {
            declaredValue: true,
          },
        },
      },
    });

    const totalRevenue = normalWaybillsWithParcels.reduce(
      (sum, waybill) => sum + (waybill.parcel?.declaredValue || 0),
      0
    );

    const accidentWaybillsWithParcels = await prisma.waybill.findMany({
      where: {
        operatorId,
        status: "ACCIDENT",
        ...(Object.keys(dateFilter).length > 0 && {
          processedAt: dateFilter,
        }),
      },
      include: {
        parcel: {
          select: {
            declaredValue: true,
          },
        },
      },
    });

    const accidentAmount = accidentWaybillsWithParcels.reduce(
      (sum, waybill) => sum + (waybill.parcel?.declaredValue || 0),
      0
    );

    let averageDailyProcessed = 0;
    if (Object.keys(dateFilter).length > 0) {
      const start = dateFilter.gte || new Date(0);
      const end = dateFilter.lte || new Date();
      const daysDiff = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff > 0) {
        averageDailyProcessed = Math.round(totalProcessedCount / daysDiff);
      }
    }

    return {
      operatorId: operator.id,
      workCount: 0,
      totalProcessedCount,
      accidentCount,
      totalRevenue,
      accidentAmount,
      averageDailyProcessed,
    };
  }
}
