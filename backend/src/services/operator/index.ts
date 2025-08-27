import { OperatorFilters } from "@typings/index";
import { OperatorRepository } from "./repository";
import { OperatorStatsService } from "./stats";
import { OperatorSorting } from "./types";

export class OperatorService {
  private repository: OperatorRepository;
  private statsService: OperatorStatsService;

  constructor() {
    this.repository = new OperatorRepository();
    this.statsService = new OperatorStatsService(this.repository);
  }

  async getAllOperators(
    filters: OperatorFilters = {},
    pagination?: { page?: number; limit?: number; getAll?: boolean },
    sorting?: OperatorSorting
  ) {
    const where = this.repository.buildWhereClause(filters);
    const orderBy = this.repository.buildOrderBy(sorting);
    return await this.repository.findManyWithPagination(
      where,
      orderBy,
      pagination
    );
  }

  async getOperatorById(id: number) {
    return await this.repository.findById(id);
  }

  async getOperatorByCode(
    code: string,
    pagination?: { page?: number; limit?: number },
    filters?: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const operator = await this.repository.findByCode(code);

    if (!operator) {
      return null;
    }

    const waybillWhere: any = {};

    if (filters?.status && filters.status !== "all") {
      waybillWhere.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      waybillWhere.processedAt = {};
      if (filters.startDate) {
        waybillWhere.processedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        waybillWhere.processedAt.lte = filters.endDate;
      }
    }

    const { waybills, pagination: waybillsPagination } =
      await this.repository.findOperatorWaybills(
        operator.id,
        waybillWhere,
        pagination
      );

    return {
      ...operator,
      waybills,
      waybillsPagination,
    };
  }

  async getOperatorStats(startDate?: Date, endDate?: Date) {
    return await this.statsService.getOperatorStats(startDate, endDate);
  }

  async getOperatorShifts(
    operatorId: number,
    startDate?: Date,
    endDate?: Date
  ) {
    return await this.repository.getShifts(operatorId, startDate, endDate);
  }

  async getOperatorWorks(operatorId: number, startDate?: Date, endDate?: Date) {
    return await this.repository.getWorks(operatorId, startDate, endDate);
  }

  async getAllOperatorsStats() {
    return await this.repository.getAllOperatorsStats();
  }
}
