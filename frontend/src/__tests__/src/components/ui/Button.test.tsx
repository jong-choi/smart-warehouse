import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { Button } from "@/components/ui/button";

describe("<Button />", () => {
  it("children 렌더 및 클릭 이벤트 처리", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>확인</Button>);
    const btn = screen.getByRole("button", { name: "확인" });
    await user.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("variant/size 조합에 따른 클래스 적용", () => {
    const { rerender } = render(<Button>기본</Button>);
    const btn1 = screen.getByRole("button", { name: "기본" });
    expect(btn1.className).toMatch(/bg-primary/);

    rerender(<Button variant="destructive">위험</Button>);
    const btn2 = screen.getByRole("button", { name: "위험" });
    expect(btn2.className).toMatch(/bg-destructive/);

    rerender(
      <Button variant="outline" size="icon">
        아이콘
      </Button>
    );
    const btn3 = screen.getByRole("button", { name: "아이콘" });
    expect(btn3.className).toMatch(/border-dashboard-border/);
    expect(btn3.className).toMatch(/w-10/);
  });

  it("disabled 상태에서 클릭/키보드 입력 무시", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        비활성
      </Button>
    );
    const btn = screen.getByRole("button", { name: "비활성" });
    await user.click(btn);
    btn.focus();
    await user.keyboard("{Enter}");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("forwardRef로 실제 button 요소 참조", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>참조</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
