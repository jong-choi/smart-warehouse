import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardMonthlySalesTable } from "@/components/dashboard/sales/monthly/DashboardMonthlySalesTable";

vi.mock("@/hooks/useSales", () => ({
  useMonthlySalesSuspense: (year: number) => ({
    data: {
      data: [
        {
          period: `${year}.01`,
          unloadCount: 3,
          totalShippingValue: 300,
          avgShippingValue: 100,
          normalProcessCount: 3,
          processValue: 300,
          accidentCount: 0,
          accidentValue: 0,
        },
      ],
    },
  }),
}));

describe("<DashboardMonthlySalesTable />", () => {
  it("헤더와 데이터가 렌더된다", () => {
    const setMsg = vi.fn();
    render(
      <MemoryRouter>
        <DashboardMonthlySalesTable
          currentYear={2024}
          isCollecting={false}
          setTableMessage={setMsg}
        />
      </MemoryRouter>
    );
    expect(screen.getByText("월")).toBeInTheDocument();
    expect(screen.getByText("하차물량")).toBeInTheDocument();
    expect(screen.getByText("총 운송가액")).toBeInTheDocument();
    expect(screen.getByText("2024.01")).toBeInTheDocument();
  });

  it("수집 모드에서 마크다운 메시지를 생성한다", () => {
    const setMsg = vi.fn();
    render(
      <MemoryRouter>
        <DashboardMonthlySalesTable
          currentYear={2024}
          isCollecting
          setTableMessage={setMsg}
        />
      </MemoryRouter>
    );
    expect(setMsg).toHaveBeenCalled();
  });
});
