import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense } from "react";
import {
  useOperator,
  useOperatorDetail,
  useOperatorParcels,
  useOperators,
} from "@/hooks/useOperator";
import type { Operator, OperatorDetail, OperatorParcel } from "@/types";

// 모듈 전역 목킹 (호이스팅)
const operatorsFixture: Operator[] = [
  {
    id: 1,
    name: "홍길동",
    code: "OP001",
    type: "HUMAN",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
];
const operatorFixture: Operator = {
  id: 2,
  name: "산타",
  code: "OP002",
  type: "MACHINE",
  createdAt: "2024-01-02T00:00:00.000Z",
};
const operatorDetailFixture: OperatorDetail = {
  id: 1,
  name: "홍길동",
  code: "OP001",
  type: "HUMAN",
  createdAt: "2024-01-01T00:00:00.000Z",
  shifts: [],
  works: [],
  waybills: [],
  waybillsPagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
};
const parcelsFixture: OperatorParcel[] = [];

vi.mock("@/api/operatorApi", () => ({
  fetchOperators: () =>
    Promise.resolve({
      data: operatorsFixture,
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }),
  fetchOperatorById: (id: string) =>
    Promise.resolve({ ...operatorFixture, id: Number(id) }),
  fetchOperatorDetail: () => Promise.resolve(operatorDetailFixture),
  fetchOperatorParcels: () =>
    Promise.resolve({
      data: parcelsFixture,
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    }),
}));

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

describe("useOperator* 훅", () => {
  it("useOperators: 목록을 반환한다", async () => {
    const wrapper = wrapperFactory();
    const { result } = renderHook(() => useOperators({ page: 1 }), { wrapper });
    await waitFor(() => {
      expect(result.current.data.data.length).toBe(1);
      expect(result.current.data.data[0].code).toBe("OP001");
    });
  });

  it("useOperator: 단건을 반환한다", async () => {
    const wrapper = wrapperFactory();
    const { result } = renderHook(() => useOperator("2"), { wrapper });
    await waitFor(() => {
      expect(result.current.data.id).toBe(2);
    });
  });

  it("useOperatorDetail: 상세를 반환한다", async () => {
    const wrapper = wrapperFactory();
    const { result } = renderHook(
      () => useOperatorDetail("OP001", 1, 20, "all"),
      { wrapper }
    );
    await waitFor(() => {
      expect(result.current.data.code).toBe("OP001");
    });
  });

  it("useOperatorParcels: 페이지네이션 형태로 반환한다", async () => {
    const wrapper = wrapperFactory();
    const { result } = renderHook(() => useOperatorParcels("1", 1, 20, "all"), {
      wrapper,
    });
    await waitFor(() => {
      expect(result.current.data.pagination.page).toBe(1);
    });
  });
});
