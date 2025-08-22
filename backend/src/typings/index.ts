/**
 * 중앙화된 타입 정의 파일
 *
 * 이 파일은 Prisma 스키마를 기반으로 한 타입 시스템을 제공합니다.
 * 모든 API 요청/응답, 필터, 통계 등의 타입이 여기에 정의되어 있습니다.
 */

// ============================================================================
// Prisma 모델 타입들 (데이터베이스 엔티티)
// ============================================================================
export type {
  Operator,
  OperatorShift,
  OperatorWork,
  Location,
  Waybill,
  Parcel,
} from "@generated/prisma";

// ============================================================================
// Zod 검증 스키마에서 추론된 타입들
// ============================================================================
export type {
  // Enum 타입들
  OperatorType,
  WaybillStatus,

  // 기본 필터 타입
  DateRangeFilter,

  // API 요청 타입들
  CreateOperatorRequest,
  CreateLocationRequest,
  CreateWaybillRequest,
  CreateParcelRequest,
  CreateOperatorShiftRequest,
  CreateOperatorWorkRequest,

  // 필터 타입들
  OperatorFilters,
  WaybillFilters,

  // 업데이트 요청 타입들
  UpdateOperatorRequest,
  UpdateLocationRequest,
  UpdateWaybillRequest,
  UpdateParcelRequest,

  // 페이지네이션 타입
  PaginationParams,
} from "@utils/validation";

// ============================================================================
// SSE Chatbot 타입들
// ============================================================================
export type * from "./sseChatbot";

// ============================================================================
// API 응답 타입들
// ============================================================================
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

// ============================================================================
// 통계 타입들
// ============================================================================
export interface OperatorStats {
  total: number;
  byType: Array<{
    type: "HUMAN" | "MACHINE";
    count: number;
  }>;
  // 상세 통계 정보 추가
  operators: Array<{
    id: number;
    name: string;
    code: string;
    type: "HUMAN" | "MACHINE";
    totalProcessedCount: number; // 총 처리한 운송장 수
    accidentCount: number; // 사고 처리 건수
    totalRevenue: number; // 총 처리 금액
    accidentAmount: number; // 사고 금액
    averageDailyProcessed: number; // 일평균 처리량
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
    // 상세 통계 정보 추가
    pendingUnloadCount: number; // 하차 예정 수량
    totalProcessedCount: number; // 전체 처리 개수
    accidentCount: number; // 사고 건수
    totalRevenue: number; // 처리 금액
    accidentAmount: number; // 사고 금액
  }>;
}

// ============================================================================
// Prisma Where 조건 타입들 (타입 안전성을 위한)
// ============================================================================
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
