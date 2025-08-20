import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchOperators,
  fetchOperatorById,
  fetchOperatorDetail,
  fetchOperatorParcels,
  fetchOperatorsStats,
} from "@/api/operatorApi";
import type { Operator, OperatorDetail, OperatorParcel } from "@/types";

// fetch 모킹
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("operatorApi", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchOperators", () => {
    it("작업자 목록을 성공적으로 조회한다", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            name: "홍길동",
            code: "OP001",
            type: "HUMAN",
            createdAt: "2024-01-01T00:00:00.000Z",
          },
        ] as Operator[],
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

      const result = await fetchOperators({ page: 1, limit: 20 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/operators?page=1&limit=20")
      );
      expect(result).toEqual(mockResponse);
    });

    it("파라미터 없이 호출할 수 있다", async () => {
      const mockResponse = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchOperators();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/operators?")
      );
      expect(result).toEqual(mockResponse);
    });

    it("API 에러 시 예외를 발생시킨다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchOperators()).rejects.toThrow(
        "작업자 목록을 불러오는데 실패했습니다."
      );
    });
  });

  describe("fetchOperatorById", () => {
    it("작업자 상세 정보를 성공적으로 조회한다", async () => {
      const mockOperator: Operator = {
        id: 1,
        name: "홍길동",
        code: "OP001",
        type: "HUMAN",
        createdAt: "2024-01-01T00:00:00.000Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockOperator }),
      });

      const result = await fetchOperatorById("1");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/operators/1")
      );
      expect(result).toEqual(mockOperator);
    });

    it("API 에러 시 예외를 발생시킨다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(fetchOperatorById("999")).rejects.toThrow(
        "작업자 정보를 불러오는데 실패했습니다."
      );
    });
  });

  describe("fetchOperatorDetail", () => {
    it("작업자 상세 정보를 성공적으로 조회한다", async () => {
      const mockDetail: OperatorDetail = {
        id: 1,
        name: "홍길동",
        code: "OP001",
        type: "HUMAN",
        createdAt: "2024-01-01T00:00:00.000Z",
        shifts: [],
        works: [],
        waybills: [],
        waybillsPagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDetail }),
      });

      const result = await fetchOperatorDetail("OP001", 1, 20, "all");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/operators/code/OP001")
      );
      expect(result).toEqual(mockDetail);
    });

    it("필터 파라미터와 함께 호출할 수 있다", async () => {
      const mockDetail: OperatorDetail = {
        id: 1,
        name: "홍길동",
        code: "OP001",
        type: "HUMAN",
        createdAt: "2024-01-01T00:00:00.000Z",
        shifts: [],
        works: [],
        waybills: [],
        waybillsPagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDetail }),
      });

      await fetchOperatorDetail(
        "OP001",
        1,
        20,
        "NORMAL",
        "2024-01-01",
        "2024-01-31"
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/status=NORMAL/)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/startDate=2024-01-01/)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/endDate=2024-01-31/)
      );
    });
  });

  describe("fetchOperatorParcels", () => {
    it("작업자가 처리한 소포 목록을 성공적으로 조회한다", async () => {
      const mockResponse = {
        data: [] as OperatorParcel[],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchOperatorParcels("1", 1, 20, "all");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/parcels")
      );
      expect(result).toEqual(mockResponse);
    });

    it("상태 필터와 함께 호출할 수 있다", async () => {
      const mockResponse = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await fetchOperatorParcels("1", 1, 20, "NORMAL");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/status=NORMAL/)
      );
    });
  });

  describe("fetchOperatorsStats", () => {
    it("작업자 통계를 성공적으로 조회한다", async () => {
      const mockStats = {
        data: [
          {
            operatorId: 1,
            code: "OP001",
            name: "홍길동",
            type: "HUMAN" as const,
            workDays: 5,
            normalCount: 10,
            accidentCount: 1,
            firstWorkDate: "2024-01-01",
            operator: {
              id: 1,
              name: "홍길동",
              code: "OP001",
              type: "HUMAN" as const,
            },
          },
        ],
        count: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const result = await fetchOperatorsStats();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/operators/stats/summary")
      );
      expect(result).toEqual(mockStats);
    });

    it("API 에러 시 예외를 발생시킨다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchOperatorsStats()).rejects.toThrow(
        "작업자 통계를 불러오는데 실패했습니다."
      );
    });
  });
});
