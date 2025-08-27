import { WaybillFilters } from "@typings/index";
import { WaybillQueryParams, WaybillParams } from "./types";

export class WaybillValidators {
  static parseId(params: WaybillParams): number {
    const id = params.id || params.locationId;
    return id ? parseInt(id) : 0;
  }

  static validateId(id: number): boolean {
    return !isNaN(id) && id > 0;
  }

  static parseDateRange(query: WaybillQueryParams): {
    startDate?: Date;
    endDate?: Date;
  } {
    const result: { startDate?: Date; endDate?: Date } = {};

    if (query.startDate) {
      result.startDate = new Date(query.startDate);
    }
    if (query.endDate) {
      result.endDate = new Date(query.endDate);
    }

    if (query.date) {
      const date = new Date(query.date);
      result.startDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      result.endDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1
      );
    }

    return result;
  }

  static buildWaybillFilters(query: WaybillQueryParams): WaybillFilters {
    const filters: WaybillFilters = {};

    if (query.search) {
      filters.search = query.search;
    }

    if (query.status) {
      filters.status = query.status as
        | "PENDING_UNLOAD"
        | "UNLOADED"
        | "NORMAL"
        | "ACCIDENT";
    }

    const { startDate, endDate } = this.parseDateRange(query);
    if (startDate) {
      filters.startDate = startDate;
    }
    if (endDate) {
      filters.endDate = endDate;
    }

    return filters;
  }
}
