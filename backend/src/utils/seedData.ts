import { PrismaClient, OperatorType, WaybillStatus } from "@generated/prisma";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();
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
  number: string;
};

function getWeekdaysBetween(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
function createWaybillEntry({
  date,
  index,
  operatorCount,
  locationCount,
}: WaybillSeedInput): WaybillEntry {
  const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, "");
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
  processedAt.setDate(date.getDate() + 1);
  processedAt.setHours(faker.number.int({ min: 8, max: 17 }));
  processedAt.setMinutes(faker.number.int({ min: 0, max: 59 }));

  const declaredValue = faker.number.int({ min: 30000, max: 100000 });

  return {
    number,
    unloadDate: date,
    operatorIndex,
    locationIndex,
    status,
    processedAt,
    isAccident,
    declaredValue,
  };
}
function generateWaybillData(
  operatorCount: number,
  locationCount: number
): WaybillEntry[] {
  const start = new Date("2025-04-01");
  const end = new Date("2025-07-15");
  const allWeekdays = getWeekdaysBetween(start, end);

  const shuffled = faker.helpers.shuffle(allWeekdays);
  const selectedDates = shuffled.slice(0, 60);

  const result: WaybillEntry[] = [];

  for (const date of selectedDates) {
    const dateStr = date.toISOString().slice(0, 10);
    const count = faker.number.int({ min: 600, max: 900 });

    for (let i = 0; i < count; i++) {
      const number = `WB${dateStr.replace(/-/g, "")}${String(i + 1).padStart(
        5,
        "0"
      )}`;
      result.push(
        createWaybillEntry({
          date,
          index: i,
          operatorCount,
          locationCount,
          number,
        })
      );
    }
  }

  return result;
}
export async function chunkedPromiseAll<T>(
  promises: Promise<T>[],
  chunkSize = 1000
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < promises.length; i += chunkSize) {
    const chunk = promises.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(chunk);
    results.push(...chunkResults);
  }

  return results;
}
async function seedData() {
  try {
    await prisma.parcel.deleteMany();
    await prisma.operatorWork.deleteMany();
    await prisma.operatorShift.deleteMany();
    await prisma.waybill.deleteMany();
    await prisma.operator.deleteMany();
    await prisma.location.deleteMany();

    const SEOUL_LOCATIONS = [
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
    ];

    const locations = await chunkedPromiseAll(
      SEOUL_LOCATIONS.map((loc) =>
        prisma.location.create({
          data: loc,
        })
      )
    );

    const operators = await chunkedPromiseAll<never>([]);

    const machineCodes = [];
    for (let i = 1; i <= 10; i++) {
      machineCodes.push(`A${i}`);
    }
    for (let i = 1; i <= 10; i++) {
      machineCodes.push(`B${i}`);
    }

    const machines = await chunkedPromiseAll(
      machineCodes.map((code) =>
        prisma.operator.create({
          data: {
            name: `자동분류기-${code.replace(
              /([A-Z])(\d+)/,
              (match, letter, num) => `${letter}${num.padStart(2, "0")}`
            )}`,
            code: code,
            type: OperatorType.MACHINE,
          },
        })
      )
    );

    const allOperators = [...operators, ...machines];

    const waybillData = generateWaybillData(
      allOperators.length,
      locations.length
    );

    const waybills = await chunkedPromiseAll(
      waybillData.map((data) =>
        prisma.waybill.create({
          data: {
            number: data.number,
            unloadDate: data.unloadDate,
            operatorId: allOperators[data.operatorIndex].id,
            locationId: locations[data.locationIndex].id,
            status: data.status,
            processedAt: data.processedAt,
            isAccident: data.isAccident,
          },
        })
      )
    );

    const _parcels = await chunkedPromiseAll(
      waybillData.map((data, _index) =>
        prisma.parcel.create({
          data: {
            waybillId: waybills[_index].id,
            declaredValue: data.declaredValue,
          },
        })
      )
    );

    const _shifts = await chunkedPromiseAll([
      prisma.operatorShift.create({
        data: {
          operatorId: allOperators[0].id,
          date: new Date("2024-12-02"),
          startTime: new Date("2024-12-02T08:00:00Z"),
          endTime: new Date("2024-12-02T18:00:00Z"),
        },
      }),
      prisma.operatorShift.create({
        data: {
          operatorId: allOperators[1].id,
          date: new Date("2024-12-02"),
          startTime: new Date("2024-12-02T09:00:00Z"),
          endTime: new Date("2024-12-02T19:00:00Z"),
        },
      }),
      prisma.operatorShift.create({
        data: {
          operatorId: allOperators[2].id,
          date: new Date("2024-12-02"),
          startTime: new Date("2024-12-02T00:00:00Z"),
          endTime: new Date("2024-12-02T23:59:59Z"),
        },
      }),
    ]);

    const workStatsMap = new Map<
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

    waybillData.forEach((waybill, _index) => {
      const operator = allOperators[waybill.operatorIndex];
      const location = locations[waybill.locationIndex];
      const dateKey = `${operator.id}-${
        waybill.unloadDate.toISOString().split("T")[0]
      }-${location.id}`;

      if (!workStatsMap.has(dateKey)) {
        workStatsMap.set(dateKey, {
          operatorId: operator.id,
          date: waybill.unloadDate,
          locationId: location.id,
          processedCount: 0,
          accidentCount: 0,
          revenue: 0,
          errorCount: 0,
        });
      }

      const stats = workStatsMap.get(dateKey)!;
      stats.processedCount += 1;

      if (waybill.isAccident) {
        stats.accidentCount += 1;
        stats.errorCount += 1;
      }

      stats.revenue += waybill.declaredValue;
    });

    const _works = await chunkedPromiseAll(
      Array.from(workStatsMap.values()).map((stats) =>
        prisma.operatorWork.create({
          data: stats,
        })
      )
    );
  } catch (error) {
    console.error("❌ 샘플 데이터 생성 중 오류 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedData();
}

export { seedData };
