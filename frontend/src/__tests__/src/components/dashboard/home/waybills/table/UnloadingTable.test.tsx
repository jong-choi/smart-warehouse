import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UnloadingTable } from "@/components/dashboard/home/waybills/table/UnloadingTable";
import React from "react";
import type { UnloadingParcel } from "@/components/dashboard/home/waybills/types";

// zustand store 기능 중 선택자 버전 훅을 실제 구현 그대로 사용하되, 초기 상태를 통제하기 위해 간단한 모킹 적용
vi.mock("@/stores/unloadingTableStore", async (orig) => {
  const mod = await orig();
  const state = {
    pageIndex: 0,
    pageSize: 10,
    lastPageIndex: 0,
    globalFilter: "",
    statusFilter: "all" as const,
    sorting: [{ id: "waybillId", desc: false }],
  };
  // 원래 훅 시그니처: (keys: K[]) => Pick<T, K>
  return {
    ...mod,
    useUnloadingTableStore: (keys: string[]) => {
      const setters = {
        setPageIndex: (v: number) => {
          state.pageIndex = v;
        },
        setPageSize: (v: number) => {
          state.pageSize = v;
          state.pageIndex = 0;
        },
        setLastPageIndex: (v: number) => {
          state.lastPageIndex = v;
        },
        setGlobalFilter: (v: string) => {
          state.globalFilter = v;
        },
        setStatusFilter: (
          v: "all" | "PENDING_UNLOAD" | "UNLOADED" | "NORMAL" | "ACCIDENT"
        ) => {
          state.statusFilter = v;
        },
        setSorting: (v: Array<{ id: string; desc: boolean }>) => {
          state.sorting = v;
        },
      };
      const full = { ...state, ...setters };
      const picked: Record<string, unknown> = {};
      for (const k of keys) picked[k] = (full as Record<string, unknown>)[k];
      return picked;
    },
  };
});

const parcels: UnloadingParcel[] = [
  {
    id: 1,
    waybillId: 1,
    status: "PENDING_UNLOAD",
    createdAt: "2024-01-01T00:00:00.000Z",
    declaredValue: 1000,
  },
  {
    id: 2,
    waybillId: 2,
    status: "NORMAL",
    createdAt: "2024-01-01T00:00:00.000Z",
    declaredValue: 2000,
  },
];

describe("<UnloadingTable />", () => {
  it("총 개수와 새로고침 버튼을 렌더하고 클릭을 처리한다", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    const setCtx = vi.fn();
    render(
      <UnloadingTable
        parcels={parcels}
        onRefresh={onRefresh}
        isCollecting={false}
        setTableContextMessage={setCtx}
      />
    );
    expect(screen.getByText(/총 2개/)).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: /새로고침/ });
    await user.click(btn);
    expect(onRefresh).toHaveBeenCalled();
  });

  it("빈 데이터 + all 상태에서 안내 문구를 표시한다", () => {
    const onRefresh = vi.fn();
    const setCtx = vi.fn();
    render(
      <UnloadingTable
        parcels={[]}
        onRefresh={onRefresh}
        isCollecting={false}
        setTableContextMessage={setCtx}
      />
    );
    expect(
      screen.getByText(/하차 대기 중인 운송장이 없습니다/)
    ).toBeInTheDocument();
  });

  it("수집 모드에서 컨텍스트 메시지를 생성한다", () => {
    const onRefresh = vi.fn();
    const setCtx = vi.fn();
    render(
      <UnloadingTable
        parcels={parcels}
        onRefresh={onRefresh}
        isCollecting={true}
        setTableContextMessage={setCtx}
      />
    );
    expect(setCtx).toHaveBeenCalled();
    // 마크다운 테이블 일부 키워드가 포함되는지 간단 확인
    const call = setCtx.mock.calls[0]?.[0] as string;
    expect(call).toMatch(/운송장 현황 테이블/);
  });
});
