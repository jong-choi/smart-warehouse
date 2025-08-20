import { describe, it, expect } from "vitest";
import { getScreenName, generateUserId } from "@/utils/chatbot";

describe("chatbot 유틸", () => {
  it("getScreenName: 정적 경로를 올바르게 매핑한다", () => {
    expect(getScreenName("/dashboard/sales/overview")).toBe("매출 개요");
    expect(getScreenName("/dashboard/location/waybills")).toBe("지역별 운송장");
  });

  it("getScreenName: 동적 경로를 처리한다", () => {
    expect(getScreenName("/dashboard/workers/OP001")).toBe("작업자 상세");
    expect(getScreenName("/dashboard/waybills/1")).toBe("운송장 상세");
  });

  it("generateUserId: 고유 포맷을 생성한다", () => {
    const id = generateUserId();
    expect(id.startsWith("user-")).toBe(true);
  });
});
