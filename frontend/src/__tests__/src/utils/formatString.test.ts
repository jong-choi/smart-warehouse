import { describe, it, expect } from "vitest";
import { formatCurrency, formatNumber } from "@/utils/formatString";

describe("formatString 유틸", () => {
  it("formatCurrency: 원화 포맷을 반환한다", () => {
    expect(formatCurrency(123456)).toBe("₩123,456");
  });

  it("formatNumber: 천단위 구분을 적용한다", () => {
    expect(formatNumber(9876543)).toBe("9,876,543");
  });
});
