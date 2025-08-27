import { PrismaClient } from "@generated/prisma";
import { OperatorFilters, OperatorWhereInput } from "@/typings";
import { OperatorSorting } from "./types";

const prisma = new PrismaClient();

export class OperatorRepository {
  buildWhereClause(filters: OperatorFilters = {}): OperatorWhereInput {
    const where: OperatorWhereInput = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return where;
  }

  buildOrderBy(sorting?: OperatorSorting) {
    if (!sorting) return { name: "asc" as const };

    if (
      sorting.field === "normalWaybills" ||
      sorting.field === "accidentWaybills"
    ) {
      return {
        waybills: {
          _count: sorting.direction,
        },
      };
    }

    return { [sorting.field]: sorting.direction };
  }

  async findManyWithPagination(
    where: OperatorWhereInput,
    orderBy: any,
    pagination?: { page?: number; limit?: number; getAll?: boolean }
  ) {
    if (pagination?.getAll) {
      const data = await prisma.operator.findMany({
        where,
        include: {
          _count: {
            select: {
              shifts: true,
              works: true,
              waybills: true,
            },
          },
          waybills: {
            select: {
              status: true,
              isAccident: true,
            },
          },
        },
        orderBy,
      });

      return {
        data,
        pagination: {
          page: 1,
          limit: data.length,
          total: data.length,
          totalPages: 1,
        },
      };
    }

    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.operator.findMany({
        where,
        include: {
          _count: {
            select: {
              shifts: true,
              works: true,
              waybills: true,
            },
          },
          waybills: {
            select: {
              status: true,
              isAccident: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.operator.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number) {
    return await prisma.operator.findUnique({
      where: { id },
      include: {
        shifts: {
          orderBy: {
            date: "desc",
          },
          take: 10,
        },
        works: {
          include: {
            location: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
          take: 10,
        },
        waybills: {
          include: {
            location: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
            parcel: {
              select: {
                id: true,
                declaredValue: true,
              },
            },
          },
          orderBy: {
            processedAt: "desc",
          },
          take: 10,
        },
      },
    });
  }

  async findByCode(code: string) {
    const operators = await prisma.operator.findMany({
      where: {
        OR: [
          { code: code.toUpperCase() },
          { code: code.toLowerCase() },
          { code: code },
        ],
      },
      include: {
        shifts: {
          orderBy: {
            date: "desc",
          },
          take: 10,
        },
        works: {
          include: {
            location: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
          take: 10,
        },
        _count: {
          select: {
            shifts: true,
            works: true,
            waybills: true,
          },
        },
      },
    });

    return operators[0] || null;
  }

  async findOperatorWaybills(
    operatorId: number,
    where: any,
    pagination?: { page?: number; limit?: number }
  ) {
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const waybillWhere = {
      operatorId,
      ...where,
    };

    const [waybills, totalWaybills] = await Promise.all([
      prisma.waybill.findMany({
        where: waybillWhere,
        include: {
          location: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          parcel: {
            select: {
              id: true,
              declaredValue: true,
            },
          },
        },
        orderBy: {
          processedAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.waybill.count({ where: waybillWhere }),
    ]);

    return {
      waybills,
      pagination: {
        page,
        limit,
        total: totalWaybills,
        totalPages: Math.ceil(totalWaybills / limit),
      },
    };
  }

  async findAll() {
    return await prisma.operator.findMany();
  }

  async getShifts(operatorId: number, startDate?: Date, endDate?: Date) {
    const where: any = { operatorId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = startDate;
      }
      if (endDate) {
        where.date.lte = endDate;
      }
    }

    return await prisma.operatorShift.findMany({
      where,
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });
  }

  async getWorks(operatorId: number, startDate?: Date, endDate?: Date) {
    const where: any = { operatorId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = startDate;
      }
      if (endDate) {
        where.date.lte = endDate;
      }
    }

    return await prisma.operatorWork.findMany({
      where,
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });
  }

  async getAllOperatorsStats() {
    return await prisma.operatorsStats.findMany({
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }
}
