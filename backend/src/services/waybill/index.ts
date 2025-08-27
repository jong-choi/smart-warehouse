import { WaybillFilters, WaybillStats } from "@typings/index";
import { WaybillRepository } from "./repository";
import { WaybillStatsService } from "./stats";
import { WaybillCalendarService } from "./calendar";
import {
  WaybillCalendarData,
  WaybillLocationStats,
  WaybillLocationCalendarData,
  WaybillQueryResult,
} from "./types";

export class WaybillService {
  private repository: WaybillRepository;
  private statsService: WaybillStatsService;
  private calendarService: WaybillCalendarService;

  constructor() {
    this.repository = new WaybillRepository();
    this.statsService = new WaybillStatsService();
    this.calendarService = new WaybillCalendarService();
  }

  async getAllWaybills(
    filters: WaybillFilters = {},
    pagination?: { page?: number; limit?: number; getAll?: boolean }
  ): Promise<WaybillQueryResult> {
    const where = this.repository.buildWhereClause(filters);

    if (pagination?.getAll) {
      const data = await this.repository.findAll(where);
      return {
        data,
        pagination: {
          page: 1,
          limit: data.length,
          total: data.length,
          totalPages: 1,
        },
      };
    }

    return await this.repository.findManyWithPagination(where, pagination);
  }

  async getWaybillById(id: number) {
    return await this.repository.findById(id);
  }

  async getWaybillByNumber(number: string) {
    return await this.repository.findByNumber(number);
  }

  async getWaybillStats(): Promise<WaybillStats> {
    return await this.repository.getStats();
  }

  async getWaybillCalendarData(
    startDate?: Date,
    endDate?: Date
  ): Promise<WaybillCalendarData[]> {
    return await this.statsService.getWaybillCalendarData(startDate, endDate);
  }

  async getWaybillsByLocationStats(
    filters: WaybillFilters = {}
  ): Promise<WaybillLocationStats[]> {
    return await this.statsService.getWaybillsByLocationStats(filters);
  }

  async getWaybillsByLocation(
    locationId: number,
    filters: WaybillFilters = {},
    pagination?: { page?: number; limit?: number; getAll?: boolean }
  ): Promise<WaybillQueryResult> {
    const where = this.repository.buildWhereClause(filters);

    if (pagination?.getAll) {
      const data = await this.repository.findAll({ ...where, locationId });
      return {
        data,
        pagination: {
          page: 1,
          limit: data.length,
          total: data.length,
          totalPages: 1,
        },
      };
    }

    return await this.repository.findByLocationWithPagination(
      locationId,
      where,
      pagination
    );
  }

  async getWaybillsByLocationCalendarData(
    filters: WaybillFilters = {}
  ): Promise<WaybillLocationCalendarData[]> {
    return await this.calendarService.getWaybillsByLocationCalendarData(
      filters
    );
  }
}
