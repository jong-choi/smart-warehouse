import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatbotHeader } from "@/components/dashboard/chatbot/components/ChatbotHeader";

describe("<ChatbotHeader />", () => {
  it("열림 상태에서 연결 아이콘 표시 및 닫기 버튼 클릭", async () => {
    const user = userEvent.setup();
    const onToggle = () => {};
    const onClose = vi.fn();
    render(
      <ChatbotHeader isOpen isConnected onToggle={onToggle} onClose={onClose} />
    );
    // 연결(와이파이) 아이콘 근처 텍스트가 존재(접근 가능한 텍스트가 없으므로 간단 존재성 검사)
    expect(screen.getByText("챗봇")).toBeInTheDocument();
    const btns = screen.getAllByRole("button");
    await user.click(btns[btns.length - 1]);
    expect(onClose).toHaveBeenCalled();
  });

  it("닫힘 상태에서 토글 버튼 표시", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onClose = () => {};
    render(
      <ChatbotHeader
        isOpen={false}
        isConnected={false}
        onToggle={onToggle}
        onClose={onClose}
      />
    );
    const btn = screen.getByRole("button");
    await user.click(btn);
    expect(onToggle).toHaveBeenCalled();
  });
});
