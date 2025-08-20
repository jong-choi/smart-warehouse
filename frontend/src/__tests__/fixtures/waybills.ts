import type { Waybill, WaybillListResponse, WaybillStatus } from '@/types'

export const waybillListResponse: WaybillListResponse = {
  waybills: [
    { id: 1, number: 'WB-1', unloadDate: '2024-01-01', locationId: 1, status: 'PENDING_UNLOAD', isAccident: false },
    { id: 2, number: 'WB-2', unloadDate: '2024-01-02', locationId: 2, status: 'NORMAL', isAccident: false },
  ],
  total: 2,
  page: 1,
  pageSize: 2,
}

export const waybillDetail: Waybill = {
  id: 1,
  number: 'WB-1',
  unloadDate: '2024-01-01',
  locationId: 1,
  status: 'PENDING_UNLOAD',
  isAccident: false,
}

export function makeWaybillStats() {
  return {
    success: true,
    data: {
      total: 3,
      byStatus: [
        { status: 'PENDING_UNLOAD' as WaybillStatus, count: 1 },
        { status: 'UNLOADED' as WaybillStatus, count: 1 },
        { status: 'NORMAL' as WaybillStatus, count: 1 },
      ],
    },
  }
}


