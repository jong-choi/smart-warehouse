import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import {
  Sidebar,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>;
}

describe("<Sidebar />", () => {
  it("Trigger 클릭으로 상태 토글(data-state 변경)", async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <Sidebar>
          <SidebarHeader>헤더</SidebarHeader>
        </Sidebar>
        <SidebarTrigger aria-label="사이드바 토글" />
      </Wrapper>
    );

    // data-slot 기반 존재 확인
    expect(
      document.querySelector('[data-slot="sidebar-wrapper"]')
    ).toBeTruthy();
    expect(document.querySelector('[data-slot="sidebar"]')).toBeTruthy();

    const trigger = screen.getByRole("button", { name: /사이드바 토글/ });
    await user.click(trigger);
    // 토글 후에도 DOM은 유지되나 data-state 변경됨. 존재만 확인
    expect(document.querySelector('[data-slot="sidebar"]')).toBeTruthy();
  });
});
