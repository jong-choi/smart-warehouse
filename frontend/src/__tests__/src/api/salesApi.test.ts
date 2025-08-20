import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchMonthlySales,
  fetchDailySales,
  fetchSalesOverview,
  fetchLocationSales,
} from "@/api/salesApi";
import type { MonthlySalesResponse, DailySalesResponse } from "@/types/sales";

// fetch 모킹
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("salesApi", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchMonthlySales", () => {
    it("월별 매출 데이터를 성공적으로 조회한다", async () => {
      const mockResponse: MonthlySalesResponse = {
        success: true,
        data: [
          {
            period: "2024.01",
            unloadCount: 100,
            totalShippingValue: 1000000,
            avgShippingValue: 10000,
            normalProcessCount: 95,
            processValue: 950000,
            accidentCount: 5,
            accidentValue: 50000,
          },
        ],
        meta: {
          year: 2024,
          totalMonths: 12,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchMonthlySales(2024);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/sales/monthly?year=2024")
      );
      expect(result).toEqual(mockResponse);
    });

    it("API 에러 시 예외를 발생시킨다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchMonthlySales(2024)).rejects.toThrow(
        "월별 매출 데이터 조회 실패: 500"
      );
    });
  });

  describe("fetchDailySales", () => {
    it("일별 매출 데이터를 성공적으로 조회한다", async () => {
      const mockResponse: DailySalesResponse = {
        success: true,
        data: [
          {
            period: "1일",
            unloadCount: 10,
            totalShippingValue: 100000,
            avgShippingValue: 10000,
            normalProcessCount: 9,
            processValue: 90000,
            accidentCount: 1,
            accidentValue: 10000,
          },
        ],
        meta: {
          year: 2024,
          month: 1,
          totalDays: 31,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchDailySales(2024, 1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/sales/daily?year=2024&month=1")
      );
      expect(result).toEqual(mockResponse);
    });

    it("API 에러 시 예외를 발생시킨다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(fetchDailySales(2024, 13)).rejects.toThrow(
        "일별 매출 데이터 조회 실패: 404"
      );
    });
  });

  describe("fetchSalesOverview", () => {
    it("매출 개요 데이터를 성공적으로 조회한다", async () => {
      const mockResponse = {
        success: true,
        data: {
          totalRevenue: 10000000,
          avgShippingValue: 15000,
          accidentLossRate: 0.05,
          monthlyGrowthRate: 0.12,
          totalProcessedCount: 5000,
          totalAccidentCount: 50,
          currentMonthRevenue: 1200000,
          previousMonthRevenue: 1100000,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchSalesOverview(2024);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/sales/overview?year=2024")
      );
      expect(result).toEqual(mockResponse);
    });

    it("연도 파라미터 없이 호출할 수 있다", async () => {
      const mockResponse = {
        success: true,
        data: {
          totalRevenue: 10000000,
          avgShippingValue: 15000,
          accidentLossRate: 0.05,
          monthlyGrowthRate: 0.12,
          totalProcessedCount: 5000,
          totalAccidentCount: 50,
          currentMonthRevenue: 1200000,
          previousMonthRevenue: 1100000,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchSalesOverview();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/sales/overview?")
      );
      expect(result).toEqual(mockResponse);
    });

    it("API 에러 시 예외를 발생시킨다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchSalesOverview()).rejects.toThrow(
        "매출 개요 데이터를 불러오는데 실패했습니다."
      );
    });
  });

  describe("fetchLocationSales", () => {
    it("지역별 매출 데이터를 성공적으로 조회한다", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            locationId: 1,
            locationName: "서울",
            revenue: 5000000,
            processedCount: 2500,
            accidentCount: 25,
          },
          {
            locationId: 2,
            locationName: "부산",
            revenue: 3000000,
            processedCount: 1500,
            accidentCount: 15,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchLocationSales(2024);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/sales/location?year=2024")
      );
      expect(result).toEqual(mockResponse);
    });

    it("연도 파라미터 없이 호출할 수 있다", async () => {
      const mockResponse = {
        success: true,
        data: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchLocationSales();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/sales/location?")
      );
      expect(result).toEqual(mockResponse);
    });

    it("API 에러 시 예외를 발생시킨다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await expect(fetchLocationSales()).rejects.toThrow(
        "지역별 매출 데이터를 불러오는데 실패했습니다."
      );
    });
  });
});
