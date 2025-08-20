import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@/components/ui";

describe("<Input />", () => {
  it("placeholder와 값 렌더 및 onChange 호출", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Input aria-label="email" placeholder="이메일" onChange={onChange} />
    );
    const textbox = screen.getByLabelText("email");
    expect(textbox).toHaveAttribute("placeholder", "이메일");
    await user.type(textbox, "a@b.co");
    expect(onChange).toHaveBeenCalled();
  });

  it("type 속성 별 렌더", () => {
    const { rerender, container } = render(<Input />);
    const input = container.querySelector("input")!;
    expect(input.getAttribute("type")).toBeNull(); // type prop이 없으면 DOM에서 null 반환
    rerender(<Input type="email" />);
    const email = container.querySelector("input")!;
    expect(email.getAttribute("type")).toBe("email");
  });

  it("disabled 상태에서 입력 불가", async () => {
    const user = userEvent.setup();
    render(<Input disabled aria-label="x" />);
    const textbox = screen.getByLabelText("x");
    expect(textbox).toBeDisabled();
    await user.type(textbox, "123");
    expect((textbox as HTMLInputElement).value).toBe("");
  });
});
