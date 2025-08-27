import { SalesRepository } from "./repository";
import { SalesCalculator } from "./calculator";
import { SalesData, SalesOverviewData, LocationSalesData } from "./types";

export class SalesService {
  private repository: SalesRepository;
  private calculator: SalesCalculator;

  constructor() {
    this.repository = new SalesRepository();
    this.calculator = new SalesCalculator(this.repository);
  }

  async getMonthlySales(year: number): Promise<SalesData[]> {
    const salesStats = await this.repository.getMonthlySalesStats(year);
    return salesStats.map((row) =>
      this.calculator.calculateSalesDataFromMonthlyStats(row, year)
    );
  }

  async getDailySales(year: number, month: number): Promise<SalesData[]> {
    const salesStats = await this.repository.getDailySalesStats(year, month);
    return salesStats.map((row) =>
      this.calculator.calculateSalesDataFromDailyStats(row)
    );
  }

  async getSalesOverview(year: number): Promise<SalesOverviewData> {
    const stats = await this.repository.getYearlySalesStats(year);
    const monthlyStats = await this.repository.getMonthlyStatsForYear(year);
    return this.calculator.calculateOverviewData(stats, monthlyStats);
  }

  async getLocationSales(year: number): Promise<LocationSalesData[]> {
    const salesStats = await this.repository.getLocationSalesStats(year);
    return this.calculator.calculateLocationSalesData(salesStats);
  }
}
