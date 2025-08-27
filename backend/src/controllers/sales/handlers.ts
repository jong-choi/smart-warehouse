import { Response } from "express";
import { SalesService } from "@services/sales";
import { SalesValidators } from "./validators";
import { SalesRequest, SalesResponse } from "./types";

export class SalesHandlers {
  private salesService: SalesService;

  constructor() {
    this.salesService = new SalesService();
  }

  async getMonthlySales(req: SalesRequest, res: Response): Promise<void> {
    try {
      const year = SalesValidators.parseYear(req.query);
      const salesData = await this.salesService.getMonthlySales(year);

      const response: SalesResponse = {
        success: true,
        data: salesData,
        meta: {
          year,
          totalMonths: salesData.length,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching monthly sales:", error);
      res.status(500).json({
        success: false,
        message: "월별 매출 데이터를 가져오는 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getDailySales(req: SalesRequest, res: Response): Promise<void> {
    try {
      const year = SalesValidators.parseYear(req.query);
      const month = SalesValidators.parseMonth(req.query);

      if (!SalesValidators.validateMonth(month)) {
        res.status(400).json({
          success: false,
          message: "월은 1부터 12 사이의 값이어야 합니다.",
        });
        return;
      }

      const salesData = await this.salesService.getDailySales(year, month);

      const response: SalesResponse = {
        success: true,
        data: salesData,
        meta: {
          year,
          month,
          totalDays: salesData.length,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching daily sales:", error);
      res.status(500).json({
        success: false,
        message: "일별 매출 데이터를 가져오는 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getSalesOverview(req: SalesRequest, res: Response): Promise<void> {
    try {
      const year = SalesValidators.parseYear(req.query);
      const overviewData = await this.salesService.getSalesOverview(year);

      res.json({
        success: true,
        data: overviewData,
      });
    } catch (error) {
      console.error("Error fetching sales overview:", error);
      res.status(500).json({
        success: false,
        message: "매출 개요 데이터를 불러오는데 실패했습니다.",
      });
    }
  }

  async getLocationSales(req: SalesRequest, res: Response): Promise<void> {
    try {
      const year = SalesValidators.parseYear(req.query);
      const locationData = await this.salesService.getLocationSales(year);

      res.json({
        success: true,
        data: locationData,
      });
    } catch (error) {
      console.error("Error fetching location sales:", error);
      res.status(500).json({
        success: false,
        message: "지역별 매출 데이터를 불러오는데 실패했습니다.",
      });
    }
  }
}
