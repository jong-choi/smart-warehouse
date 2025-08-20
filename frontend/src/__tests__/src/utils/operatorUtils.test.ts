import { describe, it, expect } from "vitest";
import {
  getNormalParcelCount,
  getAccidentParcelCount,
  sortOperatorsByNormalParcels,
  sortOperatorsByAccidentParcels,
} from "@/utils/operatorUtils";
import type { Operator } from "@/types/operator";

const ops: Operator[] = [
  {
    id: 1,
    name: "a",
    code: "A",
    type: "HUMAN",
    createdAt: "2024",
    parcels: [
      { status: "NORMAL", isAccident: false },
      { status: "ACCIDENT", isAccident: true },
    ],
  },
  {
    id: 2,
    name: "b",
    code: "B",
    type: "MACHINE",
    createdAt: "2024",
    parcels: [
      { status: "NORMAL", isAccident: false },
      { status: "NORMAL", isAccident: false },
    ],
  },
];

describe("operatorUtils", () => {
  it("정상/사고 개수를 계산한다", () => {
    expect(getNormalParcelCount(ops[0])).toBe(1);
    expect(getAccidentParcelCount(ops[0])).toBe(1);
  });

  it("정상 개수 기준 정렬", () => {
    const sorted = sortOperatorsByNormalParcels(ops);
    expect(sorted[0].code).toBe("A");
    expect(sorted[1].code).toBe("B");
  });

  it("사고 개수 기준 정렬(내림차순)", () => {
    const sorted = sortOperatorsByAccidentParcels(ops, true);
    expect(sorted[0].code).toBe("A");
  });
});
