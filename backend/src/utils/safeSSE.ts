import type { Response as ExpressResponse } from "express";

type WritableLike = ExpressResponse & {
  write: (chunk: any) => boolean;
  writableEnded?: boolean;
  finished?: boolean;
  destroyed?: boolean;
};

const isWritable = (res?: ExpressResponse): res is WritableLike => {
  if (!res) return false;
  const r = res as Partial<WritableLike>;
  const base = r as Record<string, unknown>;
  if (!("write" in base) || typeof (base.write as unknown) !== "function") {
    return false;
  }
  const ended =
    typeof base.writableEnded === "boolean"
      ? (base.writableEnded as boolean)
      : false;
  const finished =
    typeof base.finished === "boolean" ? (base.finished as boolean) : false;
  const destroyed =
    typeof base.destroyed === "boolean" ? (base.destroyed as boolean) : false;
  return !ended && !finished && !destroyed;
};

const safeSSEWrite = (
  res: ExpressResponse | undefined,
  chunk: string
): boolean => {
  try {
    if (!isWritable(res)) return false;
    res.write(chunk);
    return true;
  } catch {
    return false;
  }
};

export const safeSSEvent = (
  res: ExpressResponse | undefined,
  event: string,
  data?: unknown
): boolean => {
  const body =
    `event: ${event}\n` +
    (typeof data !== "undefined" ? `data: ${JSON.stringify(data)}\n` : "") +
    "\n";
  return safeSSEWrite(res, body);
};
