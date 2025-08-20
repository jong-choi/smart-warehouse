import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense } from "react";
import {
  useDailySales,
  useMonthlySales,
  useSalesOverview,
  useLocationSales,
} from "@/hooks/useSales";
import type { DailySalesResponse, MonthlySalesResponse } from "@/types/sales";

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

describe("useSales* 훅", () => {
  vi.mock("@/api/salesApi", () => ({
    fetchMonthlySales: (year: number): Promise<MonthlySalesResponse> =>
      Promise.resolve({
        success: true,
        data: [
          {
            period: `${year}.01`,
            unloadCount: 1,
            totalShippingValue: 100,
            avgShippingValue: 100,
            normalProcessCount: 1,
            processValue: 100,
            accidentCount: 0,
            accidentValue: 0,
          },
        ],
        meta: { year, totalMonths: 12 },
      }),
    fetchDailySales: (
      year: number,
      month: number
    ): Promise<DailySalesResponse> =>
      Promise.resolve({
        success: true,
        data: [
          {
            period: "1일",
            unloadCount: 1,
            totalShippingValue: 100,
            avgShippingValue: 100,
            normalProcessCount: 1,
            processValue: 100,
            accidentCount: 0,
            accidentValue: 0,
          },
        ],
        meta: { year, month, totalDays: 31 },
      }),
    fetchSalesOverview: () =>
      Promise.resolve({
        success: true,
        data: {
          totalRevenue: 1000,
          avgShippingValue: 100,
          accidentLossRate: 0.1,
          monthlyGrowthRate: 0.05,
          totalProcessedCount: 10,
          totalAccidentCount: 1,
          currentMonthRevenue: 500,
          previousMonthRevenue: 475,
        },
      }),
    fetchLocationSales: () =>
      Promise.resolve({
        success: true,
        data: [
          {
            locationId: 1,
            locationName: "서울",
            revenue: 600,
            processedCount: 6,
            accidentCount: 0,
          },
        ],
      }),
  }));

  it("useMonthlySales: 성공 응답을 사용한다", async () => {
    const wrapper = wrapperFactory();
    const { result } = renderHook(() => useMonthlySales(2024), { wrapper });
    await waitFor(() => {
      expect(result.current.data.meta.year).toBe(2024);
      expect(result.current.data.data[0].period).toBe("2024.01");
    });
  });

  it("useDailySales: 성공 응답을 사용한다", async () => {
    const wrapper = wrapperFactory();
    const { result } = renderHook(() => useDailySales(2024, 1), { wrapper });
    await waitFor(() => {
      expect(result.current.data.meta.month).toBe(1);
      expect(result.current.data.data[0].unloadCount).toBe(1);
    });
  });

  it("useSalesOverview/useLocationSales: 성공 응답을 사용한다", async () => {
    const wrapper = wrapperFactory();
    const { result: r1 } = renderHook(() => useSalesOverview(2024), {
      wrapper,
    });
    const { result: r2 } = renderHook(() => useLocationSales(2024), {
      wrapper,
    });
    await waitFor(() => {
      expect(r1.current.data.data.totalRevenue).toBe(1000);
      expect(r2.current.data.data[0].locationName).toBe("서울");
    });
  });
});
