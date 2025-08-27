import { LocationRepository } from "./repository";
import { LocationStatsService } from "./stats";

export class LocationService {
  private repository: LocationRepository;
  private statsService: LocationStatsService;

  constructor() {
    this.repository = new LocationRepository();
    this.statsService = new LocationStatsService(this.repository);
  }

  async getAllLocations(pagination?: {
    page?: number;
    limit?: number;
    getAll?: boolean;
  }) {
    return await this.repository.findManyWithCount(pagination);
  }

  async getLocationById(id: number) {
    return await this.repository.findById(id);
  }

  async getLocationStats(startDate?: Date, endDate?: Date) {
    return await this.statsService.getLocationStats(startDate, endDate);
  }

  async getLocationWaybills(locationId: number, limit = 50) {
    return await this.repository.findWaybillsByLocation(locationId, limit);
  }

  async getLocationWorks(locationId: number, startDate?: Date, endDate?: Date) {
    return await this.repository.findWorksByLocation(
      locationId,
      startDate,
      endDate
    );
  }
}
