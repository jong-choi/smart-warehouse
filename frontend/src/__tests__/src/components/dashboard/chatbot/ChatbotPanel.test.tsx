import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ChatbotPanel } from "@/components/dashboard/chatbot/ChatbotPanel";

const setIsOpen = vi.fn();

vi.mock("@/hooks/useChatStreamEffect", () => ({
  useChatStreamEffect: vi.fn(),
}));

vi.mock("@/hooks/useChatConnection", () => ({
  useChatConnection: () => ({
    isConnected: true,
    isLoading: false,
    connectionFailed: false,
    resetConnection: vi.fn(),
  }),
}));

vi.mock("@/stores/chatUiStore", () => ({
  useChatUiStore: (keys: string[]) => {
    const base = {
      isOpen: false,
      setIsOpen,
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
    expect(setIsOpen).toHaveBeenCalledWith(true);
  });
});
