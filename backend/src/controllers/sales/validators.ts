import { SalesQueryParams } from "./types";

export class SalesValidators {
  static parseYear(query: any): number {
    return parseInt(query.year as string) || new Date().getFullYear();
  }

  static parseMonth(query: any): number {
    return parseInt(query.month as string) || new Date().getMonth() + 1;
  }

  static validateMonth(month: number): boolean {
    return month >= 1 && month <= 12;
  }

  static buildQueryParams(query: any): SalesQueryParams {
    const params: SalesQueryParams = {};

    if (query.year) {
      params.year = query.year;
    }

    return params;
  }
}
