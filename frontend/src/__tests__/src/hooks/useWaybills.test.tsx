import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense } from "react";
import {
  useUnloadingWaybills,
  useUnloadingParcels,
  useWaybillDetail,
  useUpdateWaybillStatus,
} from "@/hooks/useWaybills";
import type { Waybill, WaybillListResponse } from "@/types";

// 모듈 전역 목킹 (테스트 전역 적용)
const waybillListMock: WaybillListResponse = {
  waybills: [
    {
      id: 1,
      number: "WB-1",
      unloadDate: "2024-01-01",
      locationId: 1,
      status: "PENDING_UNLOAD",
      isAccident: false,
    },
    {
      id: 2,
      number: "WB-2",
      unloadDate: "2024-01-02",
      locationId: 2,
      status: "NORMAL",
      isAccident: false,
    },
  ],
  total: 2,
  page: 1,
  pageSize: 2,
};
const waybillDetailMock: Waybill = {
  id: 10,
  number: "WB-10",
  unloadDate: "2024-01-01",
  locationId: 1,
  status: "NORMAL",
  isAccident: false,
};

vi.mock("@/api/waybillApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/waybillApi")>();
  return {
    ...actual,
    fetchUnloadingWaybills: (): Promise<WaybillListResponse> =>
      Promise.resolve(waybillListMock),
    fetchUnloadingParcels: () =>
      Promise.resolve({ parcels: [], total: 0, page: 1, pageSize: 0 }),
    fetchWaybillById: (id: number): Promise<Waybill> =>
      Promise.resolve({ ...waybillDetailMock, id }),
    updateWaybillStatus: (id: number) =>
      Promise.resolve({ ...waybillDetailMock, id }),
  };
});

function wrapperFactory() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      <Suspense fallback={null}>{children}</Suspense>
    </QueryClientProvider>
  );
}

describe("useWaybills* 훅", () => {
  it("useUnloadingWaybills: 목록과 pagination을 반환한다", async () => {
    const wrapper = wrapperFactory();
    const { result } = renderHook(() => useUnloadingWaybills(), { wrapper });
    await waitFor(() => {
      expect(result.current.data.total).toBe(2);
      expect(result.current.data.waybills[0].number).toBe("WB-1");
    });
  });

  it("useUnloadingParcels: 총합을 반환한다", async () => {
    const wrapper = wrapperFactory();
    const { result } = renderHook(() => useUnloadingParcels(), { wrapper });
    await waitFor(() => {
      expect(result.current.data.total).toBe(0);
    });
  });

  it("useWaybillDetail: 상세를 반환한다", async () => {
    const wrapper = wrapperFactory();
    const { result } = renderHook(() => useWaybillDetail(10), { wrapper });
    await waitFor(() => {
      expect(result.current.data.id).toBe(10);
    });
  });

  it("useUpdateWaybillStatus: 성공 시 관련 쿼리 invalidate를 수행한다", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const spyInvalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateWaybillStatus(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ parcelId: 1, status: "NORMAL" });
    });

    expect(spyInvalidate).toHaveBeenCalled();
  });
});
