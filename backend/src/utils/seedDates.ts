export const DEFAULT_SEED_TIME_ZONE = "Asia/Seoul";
export const SEED_MONTH_RANGE = 6;

const toUtcDate = (year: number, month: number, day: number): Date =>
  new Date(Date.UTC(year, month - 1, day));

const getDateParts = (
  date: Date,
  timeZone: string
): { year: number; month: number; day: number } => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
  };
};

export const addUtcDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

export const addUtcMonthsClamped = (date: Date, months: number): Date => {
  const originalDay = date.getUTCDate();
  const result = new Date(date);

  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);

  const lastDayOfTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();
  result.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));

  return result;
};

export const getSeedDateRange = (
  deploymentTime = new Date(),
  timeZone = DEFAULT_SEED_TIME_ZONE
): { start: Date; end: Date } => {
  const { year, month, day } = getDateParts(deploymentTime, timeZone);
  const deploymentDay = toUtcDate(year, month, day);
  const end = addUtcDays(deploymentDay, -1);
  const start = addUtcMonthsClamped(end, -SEED_MONTH_RANGE);

  return { start, end };
};

export const getWeekdaysBetween = (start: Date, end: Date): Date[] => {
  const dates: Date[] = [];

  for (
    let current = new Date(start);
    current <= end;
    current = addUtcDays(current, 1)
  ) {
    const day = current.getUTCDay();
    if (day !== 0 && day !== 6) {
      dates.push(current);
    }
  }

  return dates;
};

export const formatSeedDate = (date: Date): string =>
  date.toISOString().slice(0, 10);
