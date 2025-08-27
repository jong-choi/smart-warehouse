export type {
  Operator,
  OperatorShift,
  OperatorWork,
  Location,
  Waybill,
  Parcel,
} from "@generated/prisma";
export type {
  OperatorType,
  WaybillStatus,
  DateRangeFilter,
  CreateOperatorRequest,
  CreateLocationRequest,
  CreateWaybillRequest,
  CreateParcelRequest,
  CreateOperatorShiftRequest,
  CreateOperatorWorkRequest,
  OperatorFilters,
  WaybillFilters,
  UpdateOperatorRequest,
  UpdateLocationRequest,
  UpdateWaybillRequest,
  UpdateParcelRequest,
  PaginationParams,
} from "@utils/validation";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface OperatorStats {
  total: number;
  byType: Array<{
    type: "HUMAN" | "MACHINE";
    count: number;
  }>;
  operators: Array<{
    id: number;
    name: string;
    code: string;
    type: "HUMAN" | "MACHINE";
    totalProcessedCount: number;
    accidentCount: number;
    totalRevenue: number;
    accidentAmount: number;
    averageDailyProcessed: number;
  }>;
}
export interface WaybillStats {
  total: number;
  byStatus: Array<{
    status: "PENDING_UNLOAD" | "UNLOADED" | "NORMAL" | "ACCIDENT";
    count: number;
  }>;
  accidentCount: number;
}
export interface LocationStats {
  total: number;
  locations: Array<{
    id: number;
    name: string;
    address: string | null;
    waybillCount: number;
    workCount: number;
    pendingUnloadCount: number;
    totalProcessedCount: number;
    accidentCount: number;
    totalRevenue: number;
    accidentAmount: number;
  }>;
}
export interface SalesData {
  period: string;
  unloadCount: number;
  totalShippingValue: number;
  avgShippingValue: number;
  normalProcessCount: number;
  processValue: number;
  accidentCount: number;
  accidentValue: number;
}
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
export interface WaybillCalendarData {
  date: string;
  count: number;
}
export interface WaybillLocationStats {
  locationId: number;
  locationName: string;
  address: string;
  count: number;
  statuses: { [key: string]: number };
}
export interface WaybillLocationCalendarData {
  date: string;
  count: number;
  statuses: { [key: string]: number };
  locations: { name: string; count: number }[];
}

export interface WaybillLocationCalendarInternalData {
  count: number;
  statuses: { [key: string]: number };
  locations: { [key: string]: { name: string; count: number } };
}
export interface WaybillQueryResult {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface OperatorWorkStats {
  operatorId: number;
  workCount: number;
  totalProcessedCount: number;
  accidentCount: number;
  totalRevenue: number;
  accidentAmount: number;
  averageDailyProcessed: number;
}
export interface OperatorSorting {
  field: string;
  direction: "asc" | "desc";
}
export interface ControllerResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
export interface PaginatedControllerResponse<T>
  extends ControllerResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface SalesMeta {
  year: number;
  totalMonths?: number;
  month?: number;
  totalDays?: number;
}
export interface SalesControllerResponse extends ControllerResponse {
  meta?: SalesMeta;
}
export interface LocationControllerResponse extends ControllerResponse {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  count?: number;
}
export interface OperatorControllerResponse extends ControllerResponse {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  waybillsPagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  count?: number;
}
export interface WaybillControllerResponse extends ControllerResponse {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface OperatorWhereInput {
  type?: "HUMAN" | "MACHINE";
  search?: string;
  OR?: Array<{
    code?: { contains: string };
    name?: { contains: string };
  }>;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}
export interface WaybillWhereInput {
  status?: "PENDING_UNLOAD" | "UNLOADED" | "NORMAL" | "ACCIDENT";
  operatorId?: number;
  locationId?: number;
  search?: string;
  OR?: Array<{
    number?: { contains: string };
  }>;
  unloadDate?: {
    gte?: Date;
    lte?: Date;
  };
  processedAt?: {
    gte?: Date;
    lte?: Date;
  };
  isAccident?: boolean;
}
export interface OperatorShiftWhereInput {
  operatorId: number;
  date?: {
    gte?: Date;
    lte?: Date;
  };
}
export interface OperatorWorkWhereInput {
  operatorId?: number;
  locationId?: number;
  date?: {
    gte?: Date;
    lte?: Date;
  };
}
export interface RouteParams {
  id?: string;
  code?: string;
  number?: string;
  locationId?: string;
  operatorId?: string;
}
export interface RouteQuery {
  page?: string;
  limit?: string;
  getAll?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  year?: string;
  month?: string;
  type?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  status?: string;
}
export interface RouteRequest {
  query: RouteQuery;
  params: RouteParams;
}
export interface RouteResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  count?: number;
  meta?: {
    year?: number;
    totalMonths?: number;
    month?: number;
    totalDays?: number;
  };
}

export interface OperatorParams {
  id?: string;
  operatorId?: string;
}

export interface OperatorQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  status?: string;
}

export interface OperatorResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OperatorFilterOptions {
  filters: OperatorWhereInput;
  pagination?: {
    page?: number;
    limit?: number;
  };
  sorting?: OperatorSorting;
}

export interface SalesQueryParams {
  year?: string;
  month?: string;
}

export interface LocationQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  getAll?: string;
}

export interface LocationParams {
  id?: string;
  locationId?: string;
}

export interface WaybillQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  operatorId?: string;
  locationId?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
}

export interface WaybillParams {
  id?: string;
  number?: string;
  locationId?: string;
}

export interface LocationWorkStats {
  locationId: number;
  locationName: string;
  workCount: number;
  totalProcessedCount: number;
  accidentCount: number;
  totalRevenue: number;
  accidentAmount: number;
}
