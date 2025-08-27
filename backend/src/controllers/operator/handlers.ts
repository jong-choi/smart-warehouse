import { Response } from "express";
import { OperatorService } from "@services/operator";
import { OperatorValidators } from "./validators";
import { OperatorRequest } from "./types";
import { OperatorResponse, OperatorFilterOptions } from "@typings/index";
import { parsePaginationQuery } from "@utils/queryParser";

export class OperatorHandlers {
  private operatorService: OperatorService;

  constructor() {
    this.operatorService = new OperatorService();
  }

  async getAllOperators(req: OperatorRequest, res: Response): Promise<void> {
    try {
      const filterOptions: OperatorFilterOptions = OperatorValidators.buildFilterOptions(req.query);
      const result = await this.operatorService.getAllOperators(
        filterOptions.filters,
        filterOptions.pagination,
        filterOptions.sorting
      );

      const response: OperatorResponse = {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching operators:", error);
      res.status(500).json({
        success: false,
        message: "작업자 목록 조회 중 오류가 발생했습니다.",
      });
    }
  }

  async getOperatorById(req: OperatorRequest, res: Response): Promise<void> {
    try {
      const id = OperatorValidators.parseId(req.params);

      if (!OperatorValidators.validateId(id)) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 작업자 ID입니다.",
        });
        return;
      }

      const operator = await this.operatorService.getOperatorById(id);

      if (!operator) {
        res.status(404).json({
          success: false,
          message: "해당 작업자를 찾을 수 없습니다.",
        });
        return;
      }

      res.json({
        success: true,
        data: operator,
      });
    } catch (error) {
      console.error("Error fetching operator:", error);
      res.status(500).json({
        success: false,
        message: "작업자 조회 중 오류가 발생했습니다.",
      });
    }
  }

  async getOperatorByCode(req: OperatorRequest, res: Response): Promise<void> {
    try {
      const { code } = req.params;

      if (!code) {
        res.status(400).json({
          success: false,
          message: "작업자 코드가 필요합니다.",
        });
        return;
      }

      const pagination = parsePaginationQuery(req.query);
      const filters = OperatorValidators.parseWaybillFilters(req.query);

      const operator = await this.operatorService.getOperatorByCode(
        code,
        pagination,
        filters
      );

      if (!operator) {
        res.status(404).json({
          success: false,
          message: "해당 작업자를 찾을 수 없습니다.",
        });
        return;
      }

      res.json({
        success: true,
        data: operator,
      });
    } catch (error) {
      console.error("Error fetching operator by code:", error);
      res.status(500).json({
        success: false,
        message: "작업자 조회 중 오류가 발생했습니다.",
      });
    }
  }

  async getOperatorStats(req: OperatorRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = OperatorValidators.parseDateRange(
        req.query
      );
      const stats = await this.operatorService.getOperatorStats(
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching operator stats:", error);
      res.status(500).json({
        success: false,
        message: "작업자 통계 조회 중 오류가 발생했습니다.",
      });
    }
  }

  async getOperatorShifts(req: OperatorRequest, res: Response): Promise<void> {
    try {
      const operatorId = OperatorValidators.parseId(req.params);

      if (!OperatorValidators.validateId(operatorId)) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 작업자 ID입니다.",
        });
        return;
      }

      const { startDate, endDate } = OperatorValidators.parseDateRange(
        req.query
      );
      const shifts = await this.operatorService.getOperatorShifts(
        operatorId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: shifts,
        count: shifts.length,
      });
    } catch (error) {
      console.error("Error fetching operator shifts:", error);
      res.status(500).json({
        success: false,
        message: "근무 기록 조회 중 오류가 발생했습니다.",
      });
    }
  }

  async getOperatorWorks(req: OperatorRequest, res: Response): Promise<void> {
    try {
      const operatorId = OperatorValidators.parseId(req.params);

      if (!OperatorValidators.validateId(operatorId)) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 작업자 ID입니다.",
        });
        return;
      }

      const { startDate, endDate } = OperatorValidators.parseDateRange(
        req.query
      );
      const works = await this.operatorService.getOperatorWorks(
        operatorId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: works,
        count: works.length,
      });
    } catch (error) {
      console.error("Error fetching operator works:", error);
      res.status(500).json({
        success: false,
        message: "작업 통계 조회 중 오류가 발생했습니다.",
      });
    }
  }

  async getAllOperatorsStats(
    req: OperatorRequest,
    res: Response
  ): Promise<void> {
    try {
      const stats = await this.operatorService.getAllOperatorsStats();

      res.json({
        success: true,
        data: stats,
        count: stats.length,
      });
    } catch (error) {
      console.error("Error fetching operators stats:", error);
      res.status(500).json({
        success: false,
        message: "작업자 통계 조회 중 오류가 발생했습니다.",
      });
    }
  }
}
