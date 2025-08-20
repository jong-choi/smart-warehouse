# useWarehouse2D 훅 SPECS

- 목적: 2D 창고 시뮬레이션의 이동 박스/벨트/프레임 루프 상태와 API 제공
- 출력: `{ boxes, addBox, removeBox, updateBox, tick, reset, isRunning, start, stop }`

## 테스트 시나리오

1. 초기 상태

- boxes 빈 배열, isRunning=false

2. 박스 추가/수정/삭제

- addBox 후 길이 증가, updateBox로 좌표/속성 갱신, removeBox로 감소

3. tick 프레임 진행

- tick(n) 호출 시 위치가 속도\*Δt 만큼 업데이트

4. 실행 제어

- start/stop으로 isRunning 토글, reset으로 초기화
