import { Request, Response } from "express";
import { LocationHandlers } from "./handlers";

export class LocationController {
  private handlers: LocationHandlers;

  constructor() {
    this.handlers = new LocationHandlers();
  }

  async getAllLocations(req: Request, res: Response): Promise<void> {
    await this.handlers.getAllLocations(req, res);
  }

  async getLocationById(req: Request, res: Response): Promise<void> {
    await this.handlers.getLocationById(req, res);
  }

  async getLocationStats(req: Request, res: Response): Promise<void> {
    await this.handlers.getLocationStats(req, res);
  }

  async getLocationWaybills(req: Request, res: Response): Promise<void> {
    await this.handlers.getLocationWaybills(req, res);
  }

  async getLocationWorks(req: Request, res: Response): Promise<void> {
    await this.handlers.getLocationWorks(req, res);
  }
}
