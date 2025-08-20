import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import DashboardStats from "@/components/dashboard/home/stats/DashboardStats";

vi.mock("@/stores/unloadingParcelsStore", () => ({
  useUnloadingParcelsStore: () => ({
    parcels: [
      { status: "PENDING_UNLOAD", declaredValue: 100 },
      { status: "UNLOADED", declaredValue: 100 },
      { status: "NORMAL", declaredValue: 200 },
      { status: "ACCIDENT", declaredValue: 50 },
    ],
  }),
}));

vi.mock("@/stores/workersStore", () => ({
  useWorkersStore: () => ({
    workers: [
      {
        workStartedAt: new Date().toISOString(),
        processedCount: 1,
        totalWorkTime: 60_000,
      },
      {
        workStartedAt: new Date().toISOString(),
        processedCount: 2,
        totalWorkTime: 120_000,
      },
    ],
  }),
}));

describe("<DashboardStats />", () => {
  it("핵심 카드 타이틀이 렌더된다", () => {
    const spy = vi.fn();
    render(
      <DashboardStats isCollecting={false} setDashaboardStatsMessage={spy} />
    );
    expect(screen.getByText("실시간 통계")).toBeInTheDocument();
    expect(screen.getByText("작업 진척도")).toBeInTheDocument();
    expect(screen.getByText("처리율")).toBeInTheDocument();
    expect(screen.getByText("매출")).toBeInTheDocument();
  });
});
