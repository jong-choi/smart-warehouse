import type { Operator, OperatorDetail, OperatorParcel } from "@/types";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL ?? ""}/api`;

// 작업자 목록 조회
export async function fetchOperators(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    sortField?: string;
    sortDirection?: "asc" | "desc";
  } = {}
): Promise<{
  data: Operator[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());
  if (params.search) searchParams.append("search", params.search);
  if (params.type) searchParams.append("type", params.type);
  if (params.sortField) searchParams.append("sortField", params.sortField);
  if (params.sortDirection)
    searchParams.append("sortDirection", params.sortDirection);

  const response = await fetch(
    `${API_BASE_URL}/operators?${searchParams.toString()}`
  );
  if (!response.ok) {
    throw new Error("작업자 목록을 불러오는데 실패했습니다.");
  }
  const result = await response.json();
  return result;
}

// 작업자 기본 정보 조회
export async function fetchOperatorById(id: string): Promise<Operator> {
  const response = await fetch(`${API_BASE_URL}/operators/${id}`);
  if (!response.ok) {
    throw new Error("작업자 정보를 불러오는데 실패했습니다.");
  }
  const result = await response.json();
  return result.data;
}

// 작업자 상세 정보 조회 (처리 내역 포함)
export async function fetchOperatorDetail(
  code: string,
  page: number = 1,
  pageSize: number = 20,
  status: string = "all",
  startDate?: string,
  endDate?: string
): Promise<OperatorDetail> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: pageSize.toString(),
  });

  if (status && status !== "all") {
    params.append("status", status);
  }

  if (startDate) {
    params.append("startDate", startDate);
  }

  if (endDate) {
    params.append("endDate", endDate);
  }

  const response = await fetch(
    `${API_BASE_URL}/operators/code/${code}?${params.toString()}`
  );
  if (!response.ok) {
    throw new Error("작업자 상세 정보를 불러오는데 실패했습니다.");
  }
  const result = await response.json();
  return result.data;
}

// 작업자가 처리한 소포 목록 조회 (페이지네이션)
export async function fetchOperatorParcels(
  operatorId: string,
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<{
  data: OperatorParcel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    operatorId: operatorId,
  });

  if (status && status !== "all") {
    params.append("status", status);
  }

  const response = await fetch(`${API_BASE_URL}/parcels?${params.toString()}`);

  if (!response.ok) {
    throw new Error("작업자 처리 내역을 불러오는데 실패했습니다.");
  }

  const result = await response.json();
  return result;
}

// 작업자 통계 요약 조회
export async function fetchOperatorsStats(): Promise<{
  data: Array<{
    operatorId: number;
    code: string;
    name: string;
    type: "HUMAN" | "MACHINE";
    workDays: number;
    normalCount: number;
    accidentCount: number;
    firstWorkDate: string | null;
    operator: {
      id: number;
      name: string;
      code: string;
      type: "HUMAN" | "MACHINE";
    };
  }>;
  count: number;
}> {
  const response = await fetch(`${API_BASE_URL}/operators/stats/summary`);

  if (!response.ok) {
    throw new Error("작업자 통계를 불러오는데 실패했습니다.");
  }

  const result = await response.json();
  return result;
}
