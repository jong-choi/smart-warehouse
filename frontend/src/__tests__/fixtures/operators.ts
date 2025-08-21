import type { Operator, OperatorDetail, OperatorParcel } from "@/types";

export const operatorList: Operator[] = [
  {
    id: 1,
    name: "홍길동",
    code: "OP001",
    type: "HUMAN",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    name: "산타",
    code: "OP002",
    type: "MACHINE",
    createdAt: "2024-01-02T00:00:00.000Z",
  },
];

export const operatorDetail: OperatorDetail = {
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

export const operatorParcels: OperatorParcel[] = [
  {
    id: 10,
    waybillId: 100,
    number: "WB-100",
    operatorId: 1,
    locationId: 7,
    status: "NORMAL",
    declaredValue: 123000,
    processedAt: "2024-01-03T00:00:00.000Z",
    isAccident: false,
    location: { id: 7, name: "서울", address: "대한민국" },
    waybill: { id: 100, number: "WB-100", status: "NORMAL" },
  },
];
