import type {
  WaybillListResponse,
  Waybill,
  WaybillStatus,
  WaybillFilters,
} from "@/types";
import type { UnloadingParcel } from "@components/dashboard/home/waybills/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

// API 응답 타입
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 운송장 목록 조회 (필터링, 페이지네이션 지원)
export async function fetchWaybills(
  params?: WaybillFilters
): Promise<WaybillListResponse> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.search) searchParams.append("search", params.search);
  if (params?.status) searchParams.append("status", params.status);
  if (params?.operatorId)
    searchParams.append("operatorId", params.operatorId.toString());
  if (params?.locationId)
    searchParams.append("locationId", params.locationId.toString());
  // isAccident 파라미터 제거 - status에 ACCIDENT가 있으므로 불필요
  if (params?.startDate) searchParams.append("startDate", params.startDate);
  if (params?.endDate) searchParams.append("endDate", params.endDate);
  if (params?.getAll) searchParams.append("getAll", params.getAll.toString());

  const response = await fetch(
    `${API_BASE_URL}/api/waybills?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch waybills: ${response.statusText}`);
  }

  const result: PaginatedApiResponse<Waybill> = await response.json();

  return {
    waybills: result.data,
    total: result.pagination.total,
    page: result.pagination.page,
    pageSize: result.pagination.limit,
  };
}

// 특정 운송장 상세 조회
export async function fetchWaybillById(id: number): Promise<Waybill> {
  const response = await fetch(`${API_BASE_URL}/api/waybills/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch waybill: ${response.statusText}`);
  }

  const result: ApiResponse<Waybill> = await response.json();
  return result.data;
}

// 운송장 번호로 조회
export async function fetchWaybillByNumber(number: string): Promise<Waybill> {
  const response = await fetch(
    `${API_BASE_URL}/api/waybills/number/${number}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch waybill: ${response.statusText}`);
  }

  const result: ApiResponse<Waybill> = await response.json();
  return result.data;
}

// 운송장 통계 조회
export async function fetchWaybillStats(): Promise<{
  total: number;
  byStatus: Array<{
    status: WaybillStatus;
    count: number;
  }>;
}> {
  const response = await fetch(`${API_BASE_URL}/api/waybills/stats`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch waybill stats: ${response.statusText}`);
  }

  const result: ApiResponse<{
    total: number;
    byStatus: Array<{
      status: WaybillStatus;
      count: number;
    }>;
  }> = await response.json();

  return result.data;
}

// 운송장 달력 데이터 조회
export async function fetchWaybillCalendarData(params?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<
  Array<{
    date: string;
    count: number;
    statuses: Record<string, number>;
  }>
> {
  const searchParams = new URLSearchParams();

  if (params?.startDate) {
    searchParams.append(
      "startDate",
      params.startDate.toISOString().split("T")[0]
    );
  }
  if (params?.endDate) {
    searchParams.append("endDate", params.endDate.toISOString().split("T")[0]);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/waybills/calendar?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch waybill calendar data: ${response.statusText}`
    );
  }

  const result: ApiResponse<
    Array<{
      date: string;
      count: number;
      statuses: Record<string, number>;
    }>
  > = await response.json();

  return result.data;
}

// 하차 예정 운송장 목록 조회 (기존 함수 유지)
export async function fetchUnloadingWaybills(): Promise<WaybillListResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/waybills?status=PENDING_UNLOAD&getAll=true`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch unloading waybills: ${response.statusText}`
    );
  }

  const result: PaginatedApiResponse<Waybill> = await response.json();

  return {
    waybills: result.data,
    total: result.pagination.total,
    page: result.pagination.page,
    pageSize: result.pagination.limit,
  };
}

// 하차 예정 소포 목록 조회 (2000개) - 새로운 타입 사용
export async function fetchUnloadingParcels(): Promise<{
  parcels: UnloadingParcel[];
  total: number;
  page: number;
  pageSize: number;
}> {
  // 실제 API가 구현되면 여기서 호출
  // 현재는 mock 데이터 사용
  const { getMockUnloadingParcelsWithTimestamps } = await import(
    "@/data/mockWaybills"
  );

  const parcels = getMockUnloadingParcelsWithTimestamps();

  return {
    parcels,
    total: parcels.length,
    page: 1,
    pageSize: parcels.length,
  };
}

// 운송장 상태 업데이트 (하차 처리)
export async function updateWaybillStatus(
  waybillId: number,
  status: WaybillStatus,
  operatorId?: number
): Promise<Waybill> {
  const response = await fetch(`${API_BASE_URL}/api/waybills/${waybillId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status,
      operatorId,
      processedAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update waybill status: ${response.statusText}`);
  }

  const result: ApiResponse<Waybill> = await response.json();
  return result.data;
}

export const fetchWaybillsByLocationStats = async (params?: {
  status?: WaybillStatus;
  startDate?: Date;
  endDate?: Date;
}) => {
  const queryParams = new URLSearchParams();

  if (params?.status) {
    queryParams.append("status", params.status);
  }
  if (params?.startDate) {
    queryParams.append("startDate", params.startDate.toISOString());
  }
  if (params?.endDate) {
    queryParams.append("endDate", params.endDate.toISOString());
  }

  const response = await fetch(
    `${API_BASE_URL}/api/waybills/by-location/stats?${queryParams}`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};

export const fetchWaybillsByLocation = async (
  locationId: number,
  params?: {
    status?: WaybillStatus;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
    getAll?: boolean;
  }
) => {
  const queryParams = new URLSearchParams();

  if (params?.status) {
    queryParams.append("status", params.status);
  }
  if (params?.search) {
    queryParams.append("search", params.search);
  }
  if (params?.startDate) {
    queryParams.append("startDate", params.startDate.toISOString());
  }
  if (params?.endDate) {
    queryParams.append("endDate", params.endDate.toISOString());
  }
  if (params?.page) {
    queryParams.append("page", params.page.toString());
  }
  if (params?.limit) {
    queryParams.append("limit", params.limit.toString());
  }
  if (params?.getAll) {
    queryParams.append("getAll", "true");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/waybills/by-location/${locationId}?${queryParams}`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

export const fetchWaybillsByLocationCalendarData = async (params?: {
  status?: WaybillStatus;
  startDate?: Date;
  endDate?: Date;
}) => {
  const queryParams = new URLSearchParams();

  if (params?.status) {
    queryParams.append("status", params.status);
  }
  if (params?.startDate) {
    queryParams.append("startDate", params.startDate.toISOString());
  }
  if (params?.endDate) {
    queryParams.append("endDate", params.endDate.toISOString());
  }

  const response = await fetch(
    `${API_BASE_URL}/api/waybills/by-location/calendar?${queryParams}`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};
