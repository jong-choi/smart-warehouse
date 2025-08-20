import { describe, it, expect } from "vitest";
import { navigationData } from "@/utils/navigationData";

describe("navigationData", () => {
  it("최상위 메뉴와 중첩 구조가 올바르다", () => {
    expect(navigationData.length).toBeGreaterThan(0);
    const titles = navigationData.map((v) => v.title);
    expect(titles).toEqual(
      expect.arrayContaining([
        "금일 현황",
        "매출 관리",
        "운송장 관리",
        "작업자 관리",
      ])
    );
    const first = navigationData[0];
    expect(Array.isArray(first.children)).toBe(true);
    expect(first.children?.[0]?.url).toMatch(/^\//);
  });
});
