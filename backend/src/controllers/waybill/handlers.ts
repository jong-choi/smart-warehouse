import { Response } from "express";
import { WaybillService } from "@services/waybill";
import { WaybillValidators } from "./validators";
import { WaybillRequest, WaybillResponse } from "./types";
import { parsePaginationQuery } from "@utils/queryParser";

export class WaybillHandlers {
  private waybillService: WaybillService;

  constructor() {
    this.waybillService = new WaybillService();
  }

  async getAllWaybills(req: WaybillRequest, res: Response): Promise<void> {
    try {
      const filters = WaybillValidators.buildWaybillFilters(req.query);
      const pagination = parsePaginationQuery(req.query);

      const result = await this.waybillService.getAllWaybills(
        filters,
        pagination
      );

      const response: WaybillResponse = {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching waybills:", error);
      res.status(500).json({
        success: false,
        message: "운송장 목록 조회 중 오류가 발생했습니다.",
      });
    }
  }

  async getWaybillById(req: WaybillRequest, res: Response): Promise<void> {
    try {
      const id = WaybillValidators.parseId(req.params);

      if (!WaybillValidators.validateId(id)) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 운송장 ID입니다.",
        });
        return;
      }

      const waybill = await this.waybillService.getWaybillById(id);

      if (!waybill) {
        res.status(404).json({
          success: false,
          message: "해당 운송장을 찾을 수 없습니다.",
        });
        return;
      }

      res.json({
        success: true,
        data: waybill,
      });
    } catch (error) {
      console.error("Error fetching waybill:", error);
      res.status(500).json({
        success: false,
        message: "운송장 조회 중 오류가 발생했습니다.",
      });
    }
  }

  async getWaybillByNumber(req: WaybillRequest, res: Response): Promise<void> {
    try {
      const { number } = req.params;

      if (!number) {
        res.status(400).json({
          success: false,
          message: "운송장 번호가 필요합니다.",
        });
        return;
      }

      const waybill = await this.waybillService.getWaybillByNumber(number);

      if (!waybill) {
        res.status(404).json({
          success: false,
          message: "해당 운송장을 찾을 수 없습니다.",
        });
        return;
      }

      res.json({
        success: true,
        data: waybill,
      });
    } catch (error) {
      console.error("Error fetching waybill by number:", error);
      res.status(500).json({
        success: false,
        message: "운송장 조회 중 오류가 발생했습니다.",
      });
    }
  }

  async getWaybillStats(req: WaybillRequest, res: Response): Promise<void> {
    try {
      const stats = await this.waybillService.getWaybillStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching waybill stats:", error);
      res.status(500).json({
        success: false,
        message: "운송장 통계 조회 중 오류가 발생했습니다.",
      });
    }
  }

  async getWaybillCalendarData(
    req: WaybillRequest,
    res: Response
  ): Promise<void> {
    try {
      const { startDate, endDate } = WaybillValidators.parseDateRange(
        req.query
      );

      let start: Date | undefined;
      let end: Date | undefined;

      if (startDate) {
        start = startDate;
      }
      if (endDate) {
        end = new Date(endDate);
        end.setDate(end.getDate() + 1);
      }

      const calendarData = await this.waybillService.getWaybillCalendarData(
        start,
        end
      );

      res.json({
        success: true,
        data: calendarData,
      });
    } catch (error) {
      console.error("Error fetching waybill calendar data:", error);
      res.status(500).json({
        success: false,
        message: "운송장 달력 데이터 조회 중 오류가 발생했습니다.",
      });
    }
  }

  async getWaybillsByLocationStats(
    req: WaybillRequest,
    res: Response
  ): Promise<void> {
    try {
      const filters = WaybillValidators.buildWaybillFilters(req.query);
      const stats = await this.waybillService.getWaybillsByLocationStats(
        filters
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching waybills by location stats:", error);
      res.status(500).json({
        success: false,
        message: "지역별 운송장 통계 조회 중 오류가 발생했습니다.",
      });
    }
  }

  async getWaybillsByLocation(
    req: WaybillRequest,
    res: Response
  ): Promise<void> {
    try {
      const locationId = WaybillValidators.parseId(req.params);

      if (!WaybillValidators.validateId(locationId)) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 지역 ID입니다.",
        });
        return;
      }

      const filters = WaybillValidators.buildWaybillFilters(req.query);
      const pagination = parsePaginationQuery(req.query);

      const result = await this.waybillService.getWaybillsByLocation(
        locationId,
        filters,
        pagination
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error fetching waybills by location:", error);
      res.status(500).json({
        success: false,
        message: "지역별 운송장 목록 조회 중 오류가 발생했습니다.",
      });
    }
  }

  async getWaybillsByLocationCalendarData(
    req: WaybillRequest,
    res: Response
  ): Promise<void> {
    try {
      const filters = WaybillValidators.buildWaybillFilters(req.query);
      const calendarData =
        await this.waybillService.getWaybillsByLocationCalendarData(filters);

      res.json({
        success: true,
        data: calendarData,
      });
    } catch (error) {
      console.error(
        "Error fetching waybills by location calendar data:",
        error
      );
      res.status(500).json({
        success: false,
        message: "지역별 운송장 달력 데이터 조회 중 오류가 발생했습니다.",
      });
    }
  }
}
