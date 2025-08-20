# useWarehouseStats 훅 SPECS

- 목적: 브로드캐스트 채널 메시지(`하차된 물건`, `작업자 처리`, `물건 파손`)를 집계하고, TanStack Query로 가져오는 하차 예정 수량과 합쳐 실시간 지표를 계산한다.
- 입력:
  - TanStack Query: `useUnloadingParcels()` → `{ total }`
  - BroadcastMessage: `msg` ∈ {"하차된 물건","작업자 처리","물건 파손"}, `ts`: number(epoch ms)
- 출력:
  - `{ unloadExpected, unloadCompleted, processedCount, accidentRate, isLoading, error }`
- 규칙:
  - `하차된 물건` → `unloadCompleted` +1, `totalProcessed` +1
  - `작업자 처리` → `workerProcessed` +1, `totalProcessed` +1, 최근 처리시간 100개까지 유지
  - `물건 파손` → `accidentCount` +1
  - `accidentRate` = totalProcessed>0 ? (accidentCount/totalProcessed\*100).toFixed(2)+"%" : "0.00%"
  - `unloadExpected`는 TanStack Query의 `total`(기본 2000)

## 테스트 시나리오

1. 초기값: Query total=2000, 모든 카운터 0, accidentRate "0.00%"
2. 메시지 수신:
   - `하차된 물건` 2회 → unloadCompleted 2, processedCount 0, accidentRate "0.00%"
   - `작업자 처리` 3회 → processedCount 3, totalProcessed 5, accidentRate "0.00%"
   - `물건 파손` 1회 → accidentRate "20.00%" (1/5)
3. Query total=1234일 때 unloadExpected=1234
