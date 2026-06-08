import type { MonthlySalesResponse, DailySalesResponse } from "@/types/sales";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL ?? ""}/api`;

/**
 * 월별 매출 통계를 조회합니다.
 * @param year 조회할 연도
 * @returns 월별 매출 데이터
 */
export const fetchMonthlySales = async (
  year: number
): Promise<MonthlySalesResponse> => {
  const response = await fetch(`${API_BASE_URL}/sales/monthly?year=${year}`);

  if (!response.ok) {
    throw new Error(`월별 매출 데이터 조회 실패: ${response.status}`);
  }

  return response.json();
};

/**
 * 일별 매출 통계를 조회합니다.
 * @param year 조회할 연도
 * @param month 조회할 월
 * @returns 일별 매출 데이터
 */
export const fetchDailySales = async (
  year: number,
  month: number
): Promise<DailySalesResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/sales/daily?year=${year}&month=${month}`
  );

  if (!response.ok) {
    throw new Error(`일별 매출 데이터 조회 실패: ${response.status}`);
  }

  return response.json();
};

export interface SalesOverviewData {
  totalRevenue: number;
  avgShippingValue: number;
  accidentLossRate: number;
  monthlyGrowthRate: number;
  totalProcessedCount: number;
  totalAccidentCount: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
}

export interface LocationSalesData {
  locationId: number;
  locationName: string;
  revenue: number;
  processedCount: number;
  accidentCount: number;
}

/**
 * 매출 개요 데이터를 조회합니다.
 */
export async function fetchSalesOverview(year?: number): Promise<{
  success: boolean;
  data: SalesOverviewData;
}> {
  const params = new URLSearchParams();
  if (year) {
    params.append("year", year.toString());
  }

  const response = await fetch(`${API_BASE_URL}/sales/overview?${params}`);
  if (!response.ok) {
    throw new Error("매출 개요 데이터를 불러오는데 실패했습니다.");
  }

  return response.json();
}

/**
 * 지역별 매출 데이터를 조회합니다.
 */
export async function fetchLocationSales(year?: number): Promise<{
  success: boolean;
  data: LocationSalesData[];
}> {
  const params = new URLSearchParams();
  if (year) {
    params.append("year", year.toString());
  }

  const response = await fetch(`${API_BASE_URL}/sales/location?${params}`);
  if (!response.ok) {
    throw new Error("지역별 매출 데이터를 불러오는데 실패했습니다.");
  }

  return response.json();
}
