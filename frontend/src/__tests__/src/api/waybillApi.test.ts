import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchWaybills,
  fetchWaybillById,
  fetchWaybillByNumber,
  fetchWaybillStats,
  fetchUnloadingWaybills,
  fetchUnloadingParcels,
  updateWaybillStatus,
  fetchWaybillsByLocationStats,
  fetchWaybillsByLocation,
} from "@/api/waybillApi";
import type { Waybill, WaybillStatus } from "@/types";

// fetch 모킹
const mockFetch = vi.fn();
global.fetch = mockFetch;

// mock 데이터 모킹
vi.mock("@/data/mockWaybills", () => ({
  getMockUnloadingParcelsWithTimestamps: () => [
    {
      id: 1,
      waybillId: "WB-001",
      status: "PENDING_UNLOAD",
      createdAt: "2024-01-01T00:00:00.000Z",
      declaredValue: 10000,
    },
  ],
}));

describe("waybillApi", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchWaybills", () => {
    it("운송장 목록을 성공적으로 조회한다", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 1,
            number: "WB-001",
            unloadDate: "2024-01-01",
            locationId: 1,
            status: "PENDING_UNLOAD",
            isAccident: false,
          },
        ] as Waybill[],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchWaybills({ page: 1, limit: 20 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/waybills?page=1&limit=20"),
        expect.objectContaining({
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(result).toEqual({
        waybills: mockResponse.data,
        total: mockResponse.pagination.total,
        page: mockResponse.pagination.page,
        pageSize: mockResponse.pagination.limit,
      });
    });

    it("필터 파라미터와 함께 호출할 수 있다", async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await fetchWaybills({
        page: 1,
        limit: 20,
        status: "NORMAL",
        search: "WB-001",
        operatorId: 1,
        locationId: 1,
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        getAll: true,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/status=NORMAL/),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/search=WB-001/),
        expect.any(Object)
      );
    });

    it("API 에러 시 예외를 발생시킨다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Internal Server Error",
      });

      await expect(fetchWaybills()).rejects.toThrow(
        "Failed to fetch waybills: Internal Server Error"
      );
    });
  });

  describe("fetchWaybillById", () => {
    it("운송장 상세 정보를 성공적으로 조회한다", async () => {
      const mockWaybill: Waybill = {
        id: 1,
        number: "WB-001",
        unloadDate: "2024-01-01",
        locationId: 1,
        status: "PENDING_UNLOAD",
        isAccident: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockWaybill }),
      });

      const result = await fetchWaybillById(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/waybills/1"),
        expect.objectContaining({
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(result).toEqual(mockWaybill);
    });

    it("API 에러 시 예외를 발생시킨다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
      });

      await expect(fetchWaybillById(999)).rejects.toThrow(
        "Failed to fetch waybill: Not Found"
      );
    });
  });

  describe("fetchWaybillByNumber", () => {
    it("운송장 번호로 성공적으로 조회한다", async () => {
      const mockWaybill: Waybill = {
        id: 1,
        number: "WB-001",
        unloadDate: "2024-01-01",
        locationId: 1,
        status: "PENDING_UNLOAD",
        isAccident: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockWaybill }),
      });

      const result = await fetchWaybillByNumber("WB-001");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/waybills/number/WB-001"),
        expect.objectContaining({
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(result).toEqual(mockWaybill);
    });
  });

  describe("fetchWaybillStats", () => {
    it("운송장 통계를 성공적으로 조회한다", async () => {
      const mockStats = {
        total: 1000,
        byStatus: [
          { status: "PENDING_UNLOAD" as WaybillStatus, count: 100 },
          { status: "NORMAL" as WaybillStatus, count: 800 },
          { status: "ACCIDENT" as WaybillStatus, count: 100 },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockStats }),
      });

      const result = await fetchWaybillStats();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/waybills/stats"),
        expect.objectContaining({
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(result).toEqual(mockStats);
    });
  });

  describe("fetchUnloadingWaybills", () => {
    it("하차 예정 운송장 목록을 성공적으로 조회한다", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 1,
            number: "WB-001",
            unloadDate: "2024-01-01",
            locationId: 1,
            status: "PENDING_UNLOAD",
            isAccident: false,
          },
        ] as Waybill[],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchUnloadingWaybills();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("status=PENDING_UNLOAD&getAll=true"),
        expect.any(Object)
      );
      expect(result).toEqual({
        waybills: mockResponse.data,
        total: mockResponse.pagination.total,
        page: mockResponse.pagination.page,
        pageSize: mockResponse.pagination.limit,
      });
    });
  });

  describe("fetchUnloadingParcels", () => {
    it("하차 예정 소포 목록을 성공적으로 조회한다", async () => {
      const result = await fetchUnloadingParcels();

      expect(result).toEqual({
        parcels: [
          {
            id: 1,
            waybillId: "WB-001",
            status: "PENDING_UNLOAD",
            createdAt: "2024-01-01T00:00:00.000Z",
            declaredValue: 10000,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 1,
      });
    });
  });

  describe("updateWaybillStatus", () => {
    it("운송장 상태를 성공적으로 업데이트한다", async () => {
      const mockWaybill: Waybill = {
        id: 1,
        number: "WB-001",
        unloadDate: "2024-01-01",
        locationId: 1,
        status: "NORMAL",
        isAccident: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockWaybill }),
      });

      const result = await updateWaybillStatus(1, "NORMAL", 1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/waybills/1"),
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining('"status":"NORMAL"'),
        })
      );
      expect(result).toEqual(mockWaybill);
    });

    it("API 에러 시 예외를 발생시킨다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Bad Request",
      });

      await expect(updateWaybillStatus(1, "NORMAL")).rejects.toThrow(
        "Failed to update waybill status: Bad Request"
      );
    });
  });

  describe("fetchWaybillsByLocationStats", () => {
    it("지역별 운송장 통계를 성공적으로 조회한다", async () => {
      const mockStats = [
        {
          locationId: 1,
          locationName: "서울",
          count: 100,
          status: "NORMAL" as WaybillStatus,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockStats }),
      });

      const result = await fetchWaybillsByLocationStats({
        status: "NORMAL",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/status=NORMAL/)
      );
      expect(result).toEqual(mockStats);
    });

    it("API 에러 시 예외를 발생시킨다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchWaybillsByLocationStats()).rejects.toThrow(
        "HTTP error! status: 500"
      );
    });
  });

  describe("fetchWaybillsByLocation", () => {
    it("특정 지역의 운송장 목록을 성공적으로 조회한다", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            number: "WB-001",
            locationId: 1,
            status: "NORMAL",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchWaybillsByLocation(1, {
        status: "NORMAL",
        page: 1,
        limit: 20,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/waybills/by-location/1")
      );
      expect(result).toEqual(mockResponse);
    });

    it("API 에러 시 예외를 발생시킨다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(fetchWaybillsByLocation(999)).rejects.toThrow(
        "HTTP error! status: 404"
      );
    });
  });
});

