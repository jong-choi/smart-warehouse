import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui";

describe("<Dialog />", () => {
  it("trigger 클릭으로 열리고 닫기 버튼으로 닫힌다", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>열기</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>제목</DialogTitle>
            <DialogDescription>설명</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByRole("button", { name: "열기" });
    await user.click(trigger);
    // Radix Dialog는 role="dialog"를 가짐
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // 닫기 버튼: sr-only 텍스트가 포함되어 있음
    const close = screen.getByRole("button", { name: /close/i });
    await user.click(close);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
