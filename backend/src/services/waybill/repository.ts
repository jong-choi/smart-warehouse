import { PrismaClient } from "@generated/prisma";
import { WaybillFilters, WaybillWhereInput } from "@/typings";

const prisma = new PrismaClient();

export class WaybillRepository {
  buildWhereClause(filters: WaybillFilters = {}): WaybillWhereInput {
    const where: WaybillWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.operatorId) {
      where.operatorId = filters.operatorId;
    }

    if (filters.locationId) {
      where.locationId = filters.locationId;
    }

    if (filters.search) {
      where.OR = [
        {
          number: {
            contains: filters.search,
          },
        },
      ];
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

    return where;
  }

  async findManyWithPagination(
    where: WaybillWhereInput,
    pagination?: { page?: number; limit?: number }
  ) {
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.waybill.findMany({
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
          parcel: {
            select: {
              id: true,
              declaredValue: true,
            },
          },
        },
        orderBy: {
          unloadDate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.waybill.count({ where }),
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

  async findAll(where: WaybillWhereInput) {
    return await prisma.waybill.findMany({
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
        parcel: {
          select: {
            id: true,
            declaredValue: true,
          },
        },
      },
      orderBy: {
        unloadDate: "desc",
      },
    });
  }

  async findById(id: number) {
    return await prisma.waybill.findUnique({
      where: { id },
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
        parcel: {
          select: {
            id: true,
            declaredValue: true,
          },
        },
      },
    });
  }

  async findByNumber(number: string) {
    return await prisma.waybill.findUnique({
      where: { number },
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
        parcel: {
          select: {
            id: true,
            declaredValue: true,
          },
        },
      },
    });
  }

  async getStats() {
    const stats = await prisma.waybill.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    const totalCount = await prisma.waybill.count();
    const accidentCount = await prisma.waybill.count({
      where: { isAccident: true },
    });

    return {
      total: totalCount,
      byStatus: stats.map((stat) => ({
        status: stat.status,
        count: stat._count.id,
      })),
      accidentCount,
    };
  }

  async findByLocationWithPagination(
    locationId: number,
    where: WaybillWhereInput,
    pagination?: { page?: number; limit?: number }
  ) {
    const locationWhere = { ...where, locationId };

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.waybill.findMany({
        where: locationWhere,
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
          unloadDate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.waybill.count({ where: locationWhere }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
