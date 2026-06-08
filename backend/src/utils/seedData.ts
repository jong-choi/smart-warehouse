import "dotenv/config";
import { PrismaClient, OperatorType, WaybillStatus } from "@generated/prisma";
import { faker } from "@faker-js/faker";
import {
  formatSeedDate,
  getSeedDateRange,
  getWeekdaysBetween,
} from "./seedDates";

const prisma = new PrismaClient();
const BULK_INSERT_CHUNK_SIZE = 250;
const WAYBILLS_PER_WEEKDAY = {
  min: 250,
  max: 450,
};

type WaybillEntry = {
  number: string;
  unloadDate: Date;
  operatorIndex: number;
  locationIndex: number;
  status: WaybillStatus;
  processedAt: Date;
  isAccident: boolean;
  declaredValue: number;
};

type WaybillSeedInput = {
  date: Date;
  index: number;
  operatorCount: number;
  locationCount: number;
};

const chunkArray = <T>(items: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  return chunks;
};

const createManyInChunks = async <T>(
  items: T[],
  createMany: (chunk: T[]) => Promise<unknown>,
  label: string
): Promise<void> => {
  const chunks = chunkArray(items, BULK_INSERT_CHUNK_SIZE);

  for (let i = 0; i < chunks.length; i++) {
    await createMany(chunks[i]);

    if ((i + 1) % 20 === 0 || i === chunks.length - 1) {
      console.log(
        `[seed] ${label}: ${Math.min(
          (i + 1) * BULK_INSERT_CHUNK_SIZE,
          items.length
        ).toLocaleString()} / ${items.length.toLocaleString()}`
      );
    }
  }
};

const createWaybillEntry = ({
  date,
  index,
  operatorCount,
  locationCount,
}: WaybillSeedInput): WaybillEntry => {
  const formattedDate = formatSeedDate(date).replace(/-/g, "");
  const number = `WB${formattedDate}${String(index + 1).padStart(5, "0")}`;
  const operatorIndex = faker.number.int({
    min: 0,
    max: operatorCount - 1,
  });
  const locationIndex = faker.number.int({
    min: 0,
    max: locationCount - 1,
  });
  const isAccident = faker.number.float({ min: 0, max: 1 }) < 0.07;
  const status = isAccident
    ? WaybillStatus.ACCIDENT
    : faker.helpers.arrayElement([
        WaybillStatus.NORMAL,
        WaybillStatus.UNLOADED,
      ]);
  const processedAt = new Date(date);
  processedAt.setUTCHours(
    faker.number.int({ min: 8, max: 17 }),
    faker.number.int({ min: 0, max: 59 }),
    0,
    0
  );

  return {
    number,
    unloadDate: date,
    operatorIndex,
    locationIndex,
    status,
    processedAt,
    isAccident,
    declaredValue: faker.number.int({ min: 30000, max: 100000 }),
  };
};

const generateWaybillData = (
  operatorCount: number,
  locationCount: number
): WaybillEntry[] => {
  const { start, end } = getSeedDateRange();
  const weekdays = getWeekdaysBetween(start, end);
  const result: WaybillEntry[] = [];

  for (const date of weekdays) {
    const count = faker.number.int(WAYBILLS_PER_WEEKDAY);

    for (let i = 0; i < count; i++) {
      result.push(
        createWaybillEntry({
          date,
          index: i,
          operatorCount,
          locationCount,
        })
      );
    }
  }

  console.log(
    `[seed] 기간: ${formatSeedDate(start)} ~ ${formatSeedDate(
      end
    )}, 평일 ${weekdays.length.toLocaleString()}일, 운송장 ${result.length.toLocaleString()}건`
  );

  return result;
};

const resetSeedTables = async (): Promise<void> => {
  await prisma.salesMonthlyStats.deleteMany();
  await prisma.salesYearlyStats.deleteMany();
  await prisma.waybillMonthlyStats.deleteMany();
  await prisma.waybillYearlyStats.deleteMany();
  await prisma.salesStats.deleteMany();
  await prisma.waybillStats.deleteMany();
  await prisma.operatorsStats.deleteMany();
  await prisma.parcel.deleteMany();
  await prisma.operatorWork.deleteMany();
  await prisma.operatorShift.deleteMany();
  await prisma.waybill.deleteMany();
  await prisma.operator.deleteMany();
  await prisma.location.deleteMany();
};

export async function chunkedPromiseAll<T>(
  promises: Promise<T>[],
  chunkSize = 1000
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < promises.length; i += chunkSize) {
    const chunkResults = await Promise.all(
      promises.slice(i, i + chunkSize)
    );
    results.push(...chunkResults);
  }

  return results;
}

export async function seedData(): Promise<void> {
  await resetSeedTables();

  const locations = await chunkedPromiseAll(
    [
      { name: "서울시 강남구", address: "서울시 강남구 학동로 426" },
      { name: "서울시 강동구", address: "서울시 강동구 성내로 25" },
      { name: "서울시 강북구", address: "서울시 강북구 도봉로89길 13" },
      { name: "서울시 강서구", address: "서울시 강서구 화곡로 302" },
      { name: "서울시 관악구", address: "서울시 관악구 관악로 145" },
      { name: "서울시 광진구", address: "서울시 광진구 자양로 117" },
      { name: "서울시 구로구", address: "서울시 구로구 가마산로 245" },
      { name: "서울시 금천구", address: "서울시 금천구 시흥대로73길 70" },
      { name: "서울시 노원구", address: "서울시 노원구 노해로 437" },
      { name: "서울시 도봉구", address: "서울시 도봉구 마들로 656" },
      { name: "서울시 동대문구", address: "서울시 동대문구 천호대로 145" },
      { name: "서울시 동작구", address: "서울시 동작구 장승배기로 161" },
      { name: "서울시 마포구", address: "서울시 마포구 월드컵로 212" },
      { name: "서울시 서대문구", address: "서울시 서대문구 연희로 248" },
      { name: "서울시 서초구", address: "서울시 서초구 남부순환로 2584" },
      { name: "서울시 성동구", address: "서울시 성동구 고산자로 270" },
      { name: "서울시 성북구", address: "서울시 성북구 보문로 168" },
      { name: "서울시 송파구", address: "서울시 송파구 올림픽로 326" },
      { name: "서울시 양천구", address: "서울시 양천구 목동동로 105" },
      { name: "서울시 영등포구", address: "서울시 영등포구 당산로 123" },
      { name: "서울시 용산구", address: "서울시 용산구 녹사평대로 150" },
      { name: "서울시 은평구", address: "서울시 은평구 은평로 195" },
      { name: "서울시 종로구", address: "서울시 종로구 삼봉로 43" },
      { name: "서울시 중구", address: "서울시 중구 창경궁로 17" },
      { name: "서울시 중랑구", address: "서울시 중랑구 봉화산로 179" },
    ].map((location) => prisma.location.create({ data: location }))
  );

  const machineCodes = [
    ...Array.from({ length: 10 }, (_, index) => `A${index + 1}`),
    ...Array.from({ length: 10 }, (_, index) => `B${index + 1}`),
  ];
  const operators = await chunkedPromiseAll(
    machineCodes.map((code) =>
      prisma.operator.create({
        data: {
          name: `자동분류기-${code.replace(
            /([A-Z])(\d+)/,
            (_match, letter: string, number: string) =>
              `${letter}${number.padStart(2, "0")}`
          )}`,
          code,
          type: OperatorType.MACHINE,
        },
      })
    )
  );

  const waybillData = generateWaybillData(
    operators.length,
    locations.length
  );

  await createManyInChunks(
    waybillData.map((entry) => ({
      number: entry.number,
      unloadDate: entry.unloadDate,
      operatorId: operators[entry.operatorIndex].id,
      locationId: locations[entry.locationIndex].id,
      status: entry.status,
      processedAt: entry.processedAt,
      isAccident: entry.isAccident,
    })),
    (data) => prisma.waybill.createMany({ data }),
    "waybills"
  );

  const waybillIdByNumber = new Map<string, number>();
  for (const numbers of chunkArray(
    waybillData.map((entry) => entry.number),
    BULK_INSERT_CHUNK_SIZE
  )) {
    const waybills = await prisma.waybill.findMany({
      where: { number: { in: numbers } },
      select: { id: true, number: true },
    });
    waybills.forEach((waybill) =>
      waybillIdByNumber.set(waybill.number, waybill.id)
    );
  }

  await createManyInChunks(
    waybillData.map((entry) => {
      const waybillId = waybillIdByNumber.get(entry.number);
      if (!waybillId) {
        throw new Error(`운송장 id를 찾을 수 없습니다: ${entry.number}`);
      }

      return {
        waybillId,
        declaredValue: entry.declaredValue,
      };
    }),
    (data) => prisma.parcel.createMany({ data }),
    "parcels"
  );

  const latestDate = waybillData.reduce(
    (latest, entry) =>
      entry.unloadDate > latest ? entry.unloadDate : latest,
    waybillData[0].unloadDate
  );
  const shiftTimes = [
    [8, 18],
    [9, 19],
    [0, 23],
  ];

  await chunkedPromiseAll(
    shiftTimes.map(([startHour, endHour], index) => {
      const startTime = new Date(latestDate);
      startTime.setUTCHours(startHour, 0, 0, 0);
      const endTime = new Date(latestDate);
      endTime.setUTCHours(endHour, endHour === 23 ? 59 : 0, 0, 0);

      return prisma.operatorShift.create({
        data: {
          operatorId: operators[index].id,
          date: latestDate,
          startTime,
          endTime,
        },
      });
    })
  );

  const workStats = new Map<
    string,
    {
      operatorId: number;
      date: Date;
      locationId: number;
      processedCount: number;
      accidentCount: number;
      revenue: number;
      errorCount: number;
    }
  >();

  for (const entry of waybillData) {
    const operator = operators[entry.operatorIndex];
    const location = locations[entry.locationIndex];
    const key = `${operator.id}-${formatSeedDate(entry.unloadDate)}-${
      location.id
    }`;
    const stats = workStats.get(key) ?? {
      operatorId: operator.id,
      date: entry.unloadDate,
      locationId: location.id,
      processedCount: 0,
      accidentCount: 0,
      revenue: 0,
      errorCount: 0,
    };

    stats.processedCount += 1;
    stats.revenue += entry.declaredValue;
    if (entry.isAccident) {
      stats.accidentCount += 1;
      stats.errorCount += 1;
    }
    workStats.set(key, stats);
  }

  await createManyInChunks(
    Array.from(workStats.values()),
    (data) => prisma.operatorWork.createMany({ data }),
    "operator_works"
  );
}

if (require.main === module) {
  seedData()
    .catch((error) => {
      console.error("[seed] failed", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
