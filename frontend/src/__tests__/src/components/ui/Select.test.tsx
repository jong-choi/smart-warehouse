import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

describe("<Select />", () => {
  it("트리거 렌더 및 아이템 선택 시 onValueChange 호출", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger aria-label="도시 선택">
          <SelectValue placeholder="선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="seoul">서울</SelectItem>
          <SelectItem value="busan">부산</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole("combobox", { name: /도시 선택/i });
    await user.click(trigger);
    // Radix Select portal 컨텐츠는 role=listbox, item은 role=option
    const listbox = await screen.findByRole("listbox");
    const option = within(listbox).getByRole("option", { name: "부산" });
    await user.click(option);
    expect(onValueChange).toHaveBeenCalledWith("busan");
  });
});
