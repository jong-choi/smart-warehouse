import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Stat } from "@/components/ui/stat";

describe("<Stat />", () => {
  it("컨테이너/헤드/그리드/카드를 렌더한다", () => {
    render(
      <Stat.Container>
        <Stat.Head>통계</Stat.Head>
        <Stat.Grid cols={2}>
          <Stat.Card title="작업 진척도" value={50} />
          <Stat.Card title="매출" value={1000} variant="purple" />
        </Stat.Grid>
      </Stat.Container>
    );
    expect(screen.getByText("통계")).toBeInTheDocument();
    expect(screen.getByText("작업 진척도")).toBeInTheDocument();
    expect(screen.getByText("매출")).toBeInTheDocument();
  });
});
