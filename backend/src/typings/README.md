# 타입 시스템 가이드

이 프로젝트는 Prisma 스키마를 중심으로 한 타입 안전한 백엔드 시스템을 제공합니다.

## 구조

### 1. Prisma 스키마 기반 타입 (`@generated/prisma`)

- 데이터베이스 모델 타입들: `Operator`, `Location`, `Waybill`, `Parcel` 등
- Prisma에서 자동 생성되는 타입들

### 2. Zod 검증 스키마 (`@utils/validation`)

- API 요청/응답 검증을 위한 Zod 스키마
- 런타임 타입 안전성 보장
- 한국어 에러 메시지 제공

### 3. 중앙화된 타입 정의 (`@/typings`)

- 모든 타입을 한 곳에서 관리
- Prisma와 Zod 타입을 통합
- API 응답, 통계, 필터 타입 정의

## 사용법

### 서비스 레이어에서 타입 사용

```typescript
import { PrismaClient } from "@generated/prisma";
import { OperatorFilters, OperatorWhereInput, OperatorStats } from "@/typings";

export class OperatorService {
  async getAllOperators(filters: OperatorFilters = {}) {
    const where: OperatorWhereInput = {};

    if (filters.type) {
      where.type = filters.type; // 타입 안전성 보장
    }

    // Prisma 쿼리 실행
    return await prisma.operator.findMany({ where });
  }

  async getOperatorStats(): Promise<OperatorStats> {
    // 통계 데이터 반환 (타입 안전성 보장)
    return {
      total: 100,
      byType: [
        { type: "HUMAN", count: 80 },
        { type: "MACHINE", count: 20 },
      ],
    };
  }
}
```

### 컨트롤러에서 타입 사용

```typescript
import { Request, Response } from "express";
import { OperatorFilters } from "@/typings";

export class OperatorController {
  async getAllOperators(req: Request, res: Response) {
    const filters: OperatorFilters = {};

    if (req.query.type) {
      filters.type = req.query.type as "HUMAN" | "MACHINE";
    }

    // 서비스 호출
    const operators = await operatorService.getAllOperators(filters);

    res.json({
      success: true,
      data: operators,
    });
  }
}
```

### API 요청 검증

```typescript
import { CreateOperatorSchema } from "@utils/validation";

// 요청 데이터 검증
const validatedData = CreateOperatorSchema.parse(requestBody);

// 검증된 데이터로 작업 수행
const operator = await prisma.operator.create({
  data: validatedData,
});
```

## 타입 카테고리

### 1. Enum 타입들

- `OperatorType`: "HUMAN" | "MACHINE"
- `ParcelStatus`: "PENDING_UNLOAD" | "UNLOADED" | "NORMAL" | "ACCIDENT"
- `WaybillStatus`: "IN_TRANSIT" | "DELIVERED" | "RETURNED" | "ERROR"

### 2. 필터 타입들

- `OperatorFilters`: 작업자 조회 필터
- `WaybillFilters`: 운송장 조회 필터
- `ParcelFilters`: 소포 조회 필터
- `DateRangeFilter`: 날짜 범위 필터

### 3. API 요청 타입들

- `CreateOperatorRequest`: 작업자 생성 요청
- `UpdateOperatorRequest`: 작업자 업데이트 요청
- 기타 CRUD 작업 요청 타입들

### 4. 통계 타입들

- `OperatorStats`: 작업자 통계
- `WaybillStats`: 운송장 통계
- `ParcelStats`: 소포 통계
- `LocationStats`: 배송지 통계

### 5. Where 조건 타입들

- `OperatorWhereInput`: Prisma where 조건 (타입 안전성)
- `WaybillWhereInput`: 운송장 where 조건
- `ParcelWhereInput`: 소포 where 조건

## 장점

1. **타입 안전성**: 컴파일 타임에 타입 오류 감지
2. **자동완성**: IDE에서 정확한 타입 힌트 제공
3. **리팩토링 안전성**: 스키마 변경 시 타입 오류로 안전하게 리팩토링
4. **문서화**: 타입 정의가 곧 API 문서 역할
5. **검증**: Zod를 통한 런타임 데이터 검증

## 주의사항

1. **any 타입 사용 금지**: 모든 곳에서 명시적 타입 사용
2. **타입 중복 정의 금지**: 중앙화된 타입 정의 사용
3. **Prisma 스키마 변경 시**: `npx prisma generate` 실행 필수
4. **Zod 스키마 변경 시**: 타입 추론이 자동으로 업데이트됨

## 확장 방법

새로운 엔티티나 API를 추가할 때:

1. Prisma 스키마에 모델 추가
2. `npx prisma generate` 실행
3. `@utils/validation.ts`에 Zod 스키마 추가
4. `@/typings.ts`에서 타입 재export
5. 서비스와 컨트롤러에서 타입 사용
