export function parseStringQuery(query: any, key: string): string | undefined {
  const value = query[key];
  return typeof value === "string" ? value : undefined;
}

export function parseNumberQuery(query: any, key: string): number | undefined {
  const value = query[key];
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

export function parseDateQuery(query: any, key: string): Date | undefined {
  const value = query[key];
  if (typeof value === "string") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
}

export function parseBooleanQuery(
  query: any,
  key: string
): boolean | undefined {
  const value = query[key];
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return undefined;
}

export function parseEnumQuery<T extends string>(
  query: any,
  key: string,
  validValues: readonly T[]
): T | undefined {
  const value = query[key];
  if (typeof value === "string" && validValues.includes(value as T)) {
    return value as T;
  }
  return undefined;
}

export function parsePaginationQuery(query: any): {
  page?: number;
  limit?: number;
  getAll?: boolean;
} {
  const getAll = parseBooleanQuery(query, "getAll");

  if (getAll) {
    return {
      getAll: true,
    };
  }

  const page = parseNumberQuery(query, "page") || 1;
  const limit = parseNumberQuery(query, "limit") || 20;

  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)),
    getAll: false,
  };
}
