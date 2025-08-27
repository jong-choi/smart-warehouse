import { PrismaClient } from "@generated/prisma";

const prisma = new PrismaClient();

export class LocationRepository {
  async findManyWithCount(pagination?: {
    page?: number;
    limit?: number;
    getAll?: boolean;
  }) {
    if (pagination?.getAll) {
      const data = await prisma.location.findMany({
        include: {
          _count: {
            select: {
              waybills: true,
              operatorWorks: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
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
      prisma.location.findMany({
        include: {
          _count: {
            select: {
              waybills: true,
              operatorWorks: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.location.count(),
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
    return await prisma.location.findUnique({
      where: { id },
      include: {
        waybills: {
          include: {
            operator: {
              select: {
                id: true,
                name: true,
                code: true,
                type: true,
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
          take: 20,
        },
        operatorWorks: {
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
          take: 20,
        },
      },
    });
  }

  async findAll() {
    return await prisma.location.findMany({
      include: {
        _count: {
          select: {
            waybills: true,
            operatorWorks: true,
          },
        },
      },
    });
  }

  async findWaybillsByLocation(locationId: number, limit = 50) {
    return await prisma.waybill.findMany({
      where: { locationId },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
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
      take: limit,
    });
  }

  async findWorksByLocation(
    locationId: number,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: any = { locationId };

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

  async getWaybillStatsByLocation(locationId: number, dateFilter: any) {
    const pendingUnloadCount = await prisma.waybill.count({
      where: {
        locationId,
        status: "PENDING_UNLOAD",
        ...(Object.keys(dateFilter).length > 0 && {
          processedAt: dateFilter,
        }),
      },
    });

    const totalProcessedCount = await prisma.waybill.count({
      where: {
        locationId,
        status: { in: ["NORMAL", "ACCIDENT"] },
        ...(Object.keys(dateFilter).length > 0 && {
          processedAt: dateFilter,
        }),
      },
    });

    const accidentCount = await prisma.waybill.count({
      where: {
        locationId,
        status: "ACCIDENT",
        ...(Object.keys(dateFilter).length > 0 && {
          processedAt: dateFilter,
        }),
      },
    });

    const normalWaybillsWithParcels = await prisma.waybill.findMany({
      where: {
        locationId,
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
        locationId,
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

    return {
      pendingUnloadCount,
      totalProcessedCount,
      accidentCount,
      totalRevenue,
      accidentAmount,
    };
  }
}
