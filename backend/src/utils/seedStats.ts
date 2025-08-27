import { PrismaClient } from "@generated/prisma";

const prisma = new PrismaClient();

async function seedWaybillStats() {
  const waybills = await prisma.waybill.findMany({
    select: {
      unloadDate: true,
      locationId: true,
      status: true,
      isAccident: true,
    },
  });

  const statsMap = new Map<
    string,
    {
      date: string;
      locationId: number;
      totalCount: number;
      normalCount: number;
      accidentCount: number;
    }
  >();

  waybills.forEach((wb) => {
    const date = wb.unloadDate.toISOString().split("T")[0];
    const key = `${date}-${wb.locationId}`;
    if (!statsMap.has(key)) {
      statsMap.set(key, {
        date,
        locationId: wb.locationId,
        totalCount: 0,
        normalCount: 0,
        accidentCount: 0,
      });
    }
    const stat = statsMap.get(key)!;
    stat.totalCount++;
    if (wb.status === "NORMAL" && !wb.isAccident) {
      stat.normalCount++;
    } else if (wb.status === "ACCIDENT" || wb.isAccident) {
      stat.accidentCount++;
    }
  });

  await prisma.waybillStats.deleteMany({});
  await prisma.waybillStats.createMany({
    data: Array.from(statsMap.values()),
  });
  console.log("[완료] waybill_stats 테이블 집계 및 저장");
}

async function seedSalesStats() {
  const waybills = await prisma.waybill.findMany({
    select: {
      unloadDate: true,
      locationId: true,
      status: true,
      isAccident: true,
      parcel: {
        select: {
          declaredValue: true,
        },
      },
    },
  });

  const statsMap = new Map<
    string,
    {
      date: string;
      locationId: number;
      totalSales: number;
      totalCount: number;
      normalCount: number;
      normalValue: number;
      accidentCount: number;
      accidentValue: number;
    }
  >();

  waybills.forEach((wb) => {
    const date = wb.unloadDate.toISOString().split("T")[0];
    const key = `${date}-${wb.locationId}`;
    if (!statsMap.has(key)) {
      statsMap.set(key, {
        date,
        locationId: wb.locationId,
        totalSales: 0,
        totalCount: 0,
        normalCount: 0,
        normalValue: 0,
        accidentCount: 0,
        accidentValue: 0,
      });
    }
    const stat = statsMap.get(key)!;
    const value = wb.parcel?.declaredValue || 0;
    stat.totalSales += value;
    stat.totalCount++;
    if (wb.status === "NORMAL" && !wb.isAccident) {
      stat.normalCount++;
      stat.normalValue += value;
    } else if (wb.status === "ACCIDENT" || wb.isAccident) {
      stat.accidentCount++;
      stat.accidentValue += value;
    }
  });

  await prisma.salesStats.deleteMany({});
  await prisma.salesStats.createMany({
    data: Array.from(statsMap.values()),
  });
  console.log("[완료] sales_stats 테이블 집계 및 저장");
}

async function seedWaybillYearlyStats() {
  const waybills = await prisma.waybill.findMany({
    select: {
      unloadDate: true,
      locationId: true,
      status: true,
      isAccident: true,
    },
  });
  const statsMap = new Map<
    string,
    {
      year: number;
      locationId: number;
      totalCount: number;
      normalCount: number;
      accidentCount: number;
    }
  >();
  waybills.forEach((wb) => {
    const year = wb.unloadDate.getFullYear();
    const key = `${year}-${wb.locationId}`;
    if (!statsMap.has(key)) {
      statsMap.set(key, {
        year,
        locationId: wb.locationId,
        totalCount: 0,
        normalCount: 0,
        accidentCount: 0,
      });
    }
    const stat = statsMap.get(key)!;
    stat.totalCount++;
    if (wb.status === "NORMAL" && !wb.isAccident) {
      stat.normalCount++;
    } else if (wb.status === "ACCIDENT" || wb.isAccident) {
      stat.accidentCount++;
    }
  });
  await prisma.waybillYearlyStats.deleteMany({});
  await prisma.waybillYearlyStats.createMany({
    data: Array.from(statsMap.values()),
  });
  console.log("[완료] waybill_yearly_stats 테이블 집계 및 저장");
}

async function seedWaybillMonthlyStats() {
  const waybills = await prisma.waybill.findMany({
    select: {
      unloadDate: true,
      locationId: true,
      status: true,
      isAccident: true,
    },
  });
  const statsMap = new Map<
    string,
    {
      year: number;
      month: number;
      locationId: number;
      totalCount: number;
      normalCount: number;
      accidentCount: number;
    }
  >();
  waybills.forEach((wb) => {
    const year = wb.unloadDate.getFullYear();
    const month = wb.unloadDate.getMonth() + 1;
    const key = `${year}-${month}-${wb.locationId}`;
    if (!statsMap.has(key)) {
      statsMap.set(key, {
        year,
        month,
        locationId: wb.locationId,
        totalCount: 0,
        normalCount: 0,
        accidentCount: 0,
      });
    }
    const stat = statsMap.get(key)!;
    stat.totalCount++;
    if (wb.status === "NORMAL" && !wb.isAccident) {
      stat.normalCount++;
    } else if (wb.status === "ACCIDENT" || wb.isAccident) {
      stat.accidentCount++;
    }
  });
  await prisma.waybillMonthlyStats.deleteMany({});
  await prisma.waybillMonthlyStats.createMany({
    data: Array.from(statsMap.values()),
  });
  console.log("[완료] waybill_monthly_stats 테이블 집계 및 저장");
}

async function seedSalesYearlyStats() {
  const waybills = await prisma.waybill.findMany({
    select: {
      unloadDate: true,
      locationId: true,
      status: true,
      isAccident: true,
      parcel: { select: { declaredValue: true } },
    },
  });
  const statsMap = new Map<
    string,
    {
      year: number;
      locationId: number;
      totalSales: number;
      totalCount: number;
      normalCount: number;
      normalValue: number;
      accidentCount: number;
      accidentValue: number;
    }
  >();
  waybills.forEach((wb) => {
    const year = wb.unloadDate.getFullYear();
    const key = `${year}-${wb.locationId}`;
    if (!statsMap.has(key)) {
      statsMap.set(key, {
        year,
        locationId: wb.locationId,
        totalSales: 0,
        totalCount: 0,
        normalCount: 0,
        normalValue: 0,
        accidentCount: 0,
        accidentValue: 0,
      });
    }
    const stat = statsMap.get(key)!;
    const value = wb.parcel?.declaredValue || 0;
    stat.totalSales += value;
    stat.totalCount++;
    if (wb.status === "NORMAL" && !wb.isAccident) {
      stat.normalCount++;
      stat.normalValue += value;
    } else if (wb.status === "ACCIDENT" || wb.isAccident) {
      stat.accidentCount++;
      stat.accidentValue += value;
    }
  });
  await prisma.salesYearlyStats.deleteMany({});
  await prisma.salesYearlyStats.createMany({
    data: Array.from(statsMap.values()),
  });
  console.log("[완료] sales_yearly_stats 테이블 집계 및 저장");
}

async function seedSalesMonthlyStats() {
  const waybills = await prisma.waybill.findMany({
    select: {
      unloadDate: true,
      locationId: true,
      status: true,
      isAccident: true,
      parcel: { select: { declaredValue: true } },
    },
  });
  const statsMap = new Map<
    string,
    {
      year: number;
      month: number;
      locationId: number;
      totalSales: number;
      totalCount: number;
      normalCount: number;
      normalValue: number;
      accidentCount: number;
      accidentValue: number;
    }
  >();
  waybills.forEach((wb) => {
    const year = wb.unloadDate.getFullYear();
    const month = wb.unloadDate.getMonth() + 1;
    const key = `${year}-${month}-${wb.locationId}`;
    if (!statsMap.has(key)) {
      statsMap.set(key, {
        year,
        month,
        locationId: wb.locationId,
        totalSales: 0,
        totalCount: 0,
        normalCount: 0,
        normalValue: 0,
        accidentCount: 0,
        accidentValue: 0,
      });
    }
    const stat = statsMap.get(key)!;
    const value = wb.parcel?.declaredValue || 0;
    stat.totalSales += value;
    stat.totalCount++;
    if (wb.status === "NORMAL" && !wb.isAccident) {
      stat.normalCount++;
      stat.normalValue += value;
    } else if (wb.status === "ACCIDENT" || wb.isAccident) {
      stat.accidentCount++;
      stat.accidentValue += value;
    }
  });
  await prisma.salesMonthlyStats.deleteMany({});
  await prisma.salesMonthlyStats.createMany({
    data: Array.from(statsMap.values()),
  });
  console.log("[완료] sales_monthly_stats 테이블 집계 및 저장");
}

async function seedOperatorsStats() {
  const operators = await prisma.operator.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
    },
  });

  const statsData = await Promise.all(
    operators.map(async (operator) => {
      const normalCount = await prisma.waybill.count({
        where: {
          operatorId: operator.id,
          status: "NORMAL",
        },
      });

      const accidentCount = await prisma.waybill.count({
        where: {
          operatorId: operator.id,
          status: "ACCIDENT",
        },
      });

      const workDaysByDateResult = await prisma.$queryRaw<
        Array<{ date: string }>
      >`
        SELECT DISTINCT strftime('%Y-%m-%d', unloadDate/1000, 'unixepoch') as date
        FROM waybills 
        WHERE operatorId = ${operator.id} 
        AND (status = 'NORMAL' OR status = 'ACCIDENT')
      `;

      const workDays = workDaysByDateResult.length;

      const firstWork = await prisma.waybill.findFirst({
        where: { operatorId: operator.id },
        orderBy: { unloadDate: "asc" },
        select: { unloadDate: true },
      });

      return {
        operatorId: operator.id,
        code: operator.code,
        name: operator.name,
        type: operator.type,
        workDays,
        normalCount,
        accidentCount,
        firstWorkDate: firstWork?.unloadDate || null,
      };
    })
  );

  await prisma.operatorsStats.deleteMany({});
  await prisma.operatorsStats.createMany({
    data: statsData,
  });
  console.log("[완료] operators_stats 테이블 집계 및 저장");
}

async function main() {
  await seedWaybillStats();
  await seedSalesStats();
  await seedWaybillYearlyStats();
  await seedWaybillMonthlyStats();
  await seedSalesYearlyStats();
  await seedSalesMonthlyStats();
  await seedOperatorsStats();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
