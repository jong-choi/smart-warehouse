import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// 각 테스트 후 DOM 정리
afterEach(() => {
  cleanup();
});

// 테스트 중 fetch를 명시적으로 스텁하지 않았다면 실패를 쉽게 찾기 위해 경고 로그 유지
beforeEach(() => {
  // React Query 등에서 발생하는 네트워크 에러가 콘솔을 지나치게 더럽히지 않도록 필요 시 여기에 제어 로직 추가 가능
  vi.unstubAllGlobals();
});

// Radix UI(Select 등)에서 사용하는 Pointer Events Polyfill
// jsdom 환경에 없는 hasPointerCapture/releasePointerCapture를 보완
// 테스트 결정성을 위해 간단한 no-op 구현을 제공
declare global {
  interface Element {
    hasPointerCapture: (pointerId: number) => boolean;
    releasePointerCapture: (pointerId: number) => void;
    scrollIntoView: (arg?: boolean | ScrollIntoViewOptions) => void;
  }
}

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
// Select portal 내 스크롤 동작에 필요한 scrollIntoView polyfill
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
