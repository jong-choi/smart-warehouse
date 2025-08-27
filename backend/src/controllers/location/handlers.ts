import { Response } from "express";
import { LocationService } from "@services/location";
import { LocationValidators } from "./validators";
import { LocationRequest, LocationResponse } from "./types";
import { parsePaginationQuery } from "@utils/queryParser";

export class LocationHandlers {
  private locationService: LocationService;

  constructor() {
    this.locationService = new LocationService();
  }

  async getAllLocations(req: LocationRequest, res: Response): Promise<void> {
    try {
      const pagination = parsePaginationQuery(req.query);
      const result = await this.locationService.getAllLocations(pagination);

      const response: LocationResponse = {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({
        success: false,
        message: "배송지 목록 조회 중 오류가 발생했습니다.",
      });
    }
  }

  async getLocationById(req: LocationRequest, res: Response): Promise<void> {
    try {
      const id = LocationValidators.parseId(req.params);

      if (!LocationValidators.validateId(id)) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 배송지 ID입니다.",
        });
        return;
      }

      const location = await this.locationService.getLocationById(id);

      if (!location) {
        res.status(404).json({
          success: false,
          message: "해당 배송지를 찾을 수 없습니다.",
        });
        return;
      }

      res.json({
        success: true,
        data: location,
      });
    } catch (error) {
      console.error("Error fetching location:", error);
      res.status(500).json({
        success: false,
        message: "배송지 조회 중 오류가 발생했습니다.",
      });
    }
  }

  async getLocationStats(req: LocationRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = LocationValidators.parseDateRange(
        req.query
      );
      const stats = await this.locationService.getLocationStats(
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching location stats:", error);
      res.status(500).json({
        success: false,
        message: "배송지 통계 조회 중 오류가 발생했습니다.",
      });
    }
  }

  async getLocationWaybills(
    req: LocationRequest,
    res: Response
  ): Promise<void> {
    try {
      const locationId = LocationValidators.parseId(req.params);

      if (!LocationValidators.validateId(locationId)) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 배송지 ID입니다.",
        });
        return;
      }

      const limit = LocationValidators.parseLimit(req.query);
      const waybills = await this.locationService.getLocationWaybills(
        locationId,
        limit
      );

      res.json({
        success: true,
        data: waybills,
        count: waybills.length,
      });
    } catch (error) {
      console.error("Error fetching location waybills:", error);
      res.status(500).json({
        success: false,
        message: "배송지 운송장 목록 조회 중 오류가 발생했습니다.",
      });
    }
  }

  async getLocationWorks(req: LocationRequest, res: Response): Promise<void> {
    try {
      const locationId = LocationValidators.parseId(req.params);

      if (!LocationValidators.validateId(locationId)) {
        res.status(400).json({
          success: false,
          message: "유효하지 않은 배송지 ID입니다.",
        });
        return;
      }

      const { startDate, endDate } = LocationValidators.parseDateRange(
        req.query
      );
      const works = await this.locationService.getLocationWorks(
        locationId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: works,
        count: works.length,
      });
    } catch (error) {
      console.error("Error fetching location works:", error);
      res.status(500).json({
        success: false,
        message: "배송지 작업 통계 조회 중 오류가 발생했습니다.",
      });
    }
  }
}
