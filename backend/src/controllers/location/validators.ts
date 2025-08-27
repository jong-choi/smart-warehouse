import { LocationQueryParams, LocationParams } from "./types";

export class LocationValidators {
  static parseId(params: LocationParams): number {
    const id = params.id || params.locationId;
    return id ? parseInt(id) : 0;
  }

  static validateId(id: number): boolean {
    return !isNaN(id) && id > 0;
  }

  static parseLimit(query: LocationQueryParams): number {
    return query.limit ? parseInt(query.limit) : 50;
  }

  static parseDateRange(query: LocationQueryParams): {
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

    return result;
  }

  static buildQueryParams(query: LocationQueryParams): LocationQueryParams {
    return {
      page: query.page,
      limit: query.limit,
      getAll: query.getAll,
      startDate: query.startDate,
      endDate: query.endDate,
    };
  }
}
