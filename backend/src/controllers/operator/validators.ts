import { OperatorFilters, OperatorType } from "@/typings";
import { OperatorQueryParams, OperatorParams } from "./types";
import { OperatorFilterOptions } from "@/typings";

export class OperatorValidators {
  static parseId(params: OperatorParams): number {
    const id = params.id || params.operatorId;
    return id ? parseInt(id) : 0;
  }

  static validateId(id: number): boolean {
    return !isNaN(id) && id > 0;
  }

  static parseOperatorType(
    query: OperatorQueryParams
  ): OperatorType | undefined {
    return query.type as OperatorType;
  }

  static parseDateRange(query: OperatorQueryParams): {
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

  static parseSorting(
    query: OperatorQueryParams
  ): { field: string; direction: "asc" | "desc" } | undefined {
    if (query.sortField && query.sortDirection) {
      return {
        field: query.sortField,
        direction: query.sortDirection,
      };
    }
    return undefined;
  }

  static parseWaybillFilters(query: OperatorQueryParams): {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  } {
    const filters: any = {};

    if (query.status && query.status !== "all") {
      filters.status = query.status;
    }

    if (query.startDate) {
      filters.startDate = new Date(query.startDate);
    }

    if (query.endDate) {
      filters.endDate = new Date(query.endDate);
    }

    return filters;
  }

  static buildOperatorFilters(query: OperatorQueryParams): OperatorFilters {
    const filters: OperatorFilters = {};

    const type = this.parseOperatorType(query);
    if (type) {
      filters.type = type;
    }

    if (query.search) {
      filters.search = query.search;
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

  static buildFilterOptions(query: OperatorQueryParams): OperatorFilterOptions {
    const filters = this.buildOperatorFilters(query);

    const pagination =
      query.page || query.limit
        ? {
            page: query.page ? parseInt(query.page) : undefined,
            limit: query.limit ? parseInt(query.limit) : undefined,
          }
        : undefined;

    const sorting = this.parseSorting(query);

    return {
      filters,
      pagination,
      sorting,
    };
  }
}
