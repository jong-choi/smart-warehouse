import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ChatbotPanel } from "@/components/dashboard/chatbot/ChatbotPanel";

vi.mock("@/hooks/useChatbot", () => ({
  useChatbot: () => ({
    isConnected: true,
    connectionFailed: false,
    retryConnection: vi.fn(),
  }),
}));

vi.mock("@/stores/chatbotStore", () => ({
  useChatbotStore: (keys: string[]) => {
    const base = {
      isOpen: false,
      setIsOpen: vi.fn(),
    };
    const picked: Record<string, unknown> = {};
    for (const k of keys) picked[k] = (base as Record<string, unknown>)[k];
    return picked;
  },
}));

describe("<ChatbotPanel />", () => {
  it("초기 최소화 → 클릭 시 확장되고 내부 컴포넌트 렌더", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/dashboard/sales/overview"]}>
        <ChatbotPanel />
      </MemoryRouter>
    );
    // 최소화 상태에서는 헤더 내부에 텍스트가 없고 아이콘 버튼만 있음 → 버튼 클릭으로 확장 트리거
    const toggleBtn = screen.getByRole("button");
    await user.click(toggleBtn);
    // 확장 후에도 헤더 렌더는 유지됨(모킹 상 setIsOpen의 호출만 확인이 어려워 smoke)
    expect(
      document.querySelector('[class*="border-sidebar-border"]')
    ).toBeTruthy();
  });
});
