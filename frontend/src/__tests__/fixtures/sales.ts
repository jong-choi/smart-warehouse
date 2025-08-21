import type { DailySalesResponse, MonthlySalesResponse } from '@/types/sales'

export const monthlySales: MonthlySalesResponse = {
  success: true,
  data: [
    { period: '2024.01', unloadCount: 10, totalShippingValue: 1000, avgShippingValue: 100, normalProcessCount: 9, processValue: 900, accidentCount: 1, accidentValue: 100 },
  ],
  meta: { year: 2024, totalMonths: 12 },
}

export const dailySales: DailySalesResponse = {
  success: true,
  data: [
    { period: '1일', unloadCount: 1, totalShippingValue: 100, avgShippingValue: 100, normalProcessCount: 1, processValue: 100, accidentCount: 0, accidentValue: 0 },
  ],
  meta: { year: 2024, month: 1, totalDays: 31 },
}

export const salesOverview = {
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
}

export const locationSales = {
  success: true,
  data: [
    { locationId: 1, locationName: '서울', revenue: 600, processedCount: 6, accidentCount: 1 },
  ],
}



