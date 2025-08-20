import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardDailySalesTable } from "@/components/dashboard/sales/daily/DashboardDailySalesTable";

vi.mock("@/hooks/useSales", () => ({
  useDailySalesSuspense: (_year: number, month: number) => ({
    data: {
      data: [
        {
          period: `${month}일`,
          unloadCount: 2,
          totalShippingValue: 200,
          avgShippingValue: 100,
          normalProcessCount: 2,
          processValue: 200,
          accidentCount: 0,
          accidentValue: 0,
        },
      ],
    },
  }),
}));

describe("<DashboardDailySalesTable />", () => {
  it("헤더와 데이터가 렌더된다", () => {
    const setMsg = vi.fn();
    render(
      <MemoryRouter>
        <DashboardDailySalesTable
          currentYear={2024}
          currentMonth={1}
          isCollecting={false}
          setTableMessage={setMsg}
        />
      </MemoryRouter>
    );
    expect(screen.getByText("일")).toBeInTheDocument();
    expect(screen.getByText("하차물량")).toBeInTheDocument();
    expect(screen.getByText("총 운송가액")).toBeInTheDocument();
    expect(screen.getByText("1일")).toBeInTheDocument();
  });

  it("수집 모드에서 마크다운 메시지를 생성한다", () => {
    const setMsg = vi.fn();
    render(
      <MemoryRouter>
        <DashboardDailySalesTable
          currentYear={2024}
          currentMonth={1}
          isCollecting
          setTableMessage={setMsg}
        />
      </MemoryRouter>
    );
    expect(setMsg).toHaveBeenCalled();
  });
});
