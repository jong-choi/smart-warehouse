import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui";

describe("<Card />", () => {
  it("Card 컨테이너와 하위 컴포넌트 렌더", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>제목</CardTitle>
          <CardDescription>설명</CardDescription>
        </CardHeader>
        <CardContent>본문</CardContent>
        <CardFooter>푸터</CardFooter>
      </Card>
    );

    expect(screen.getByText("제목")).toBeInTheDocument();
    expect(screen.getByText("설명")).toBeInTheDocument();
    expect(screen.getByText("본문")).toBeInTheDocument();
    expect(screen.getByText("푸터")).toBeInTheDocument();
  });
});
