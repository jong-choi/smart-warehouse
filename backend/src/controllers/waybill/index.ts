import { Request, Response } from "express";
import { WaybillHandlers } from "./handlers";

export class WaybillController {
  private handlers: WaybillHandlers;

  constructor() {
    this.handlers = new WaybillHandlers();
    
    this.getAllWaybills = this.getAllWaybills.bind(this);
    this.getWaybillById = this.getWaybillById.bind(this);
    this.getWaybillByNumber = this.getWaybillByNumber.bind(this);
    this.getWaybillStats = this.getWaybillStats.bind(this);
    this.getWaybillCalendarData = this.getWaybillCalendarData.bind(this);
    this.getWaybillsByLocationStats = this.getWaybillsByLocationStats.bind(this);
    this.getWaybillsByLocation = this.getWaybillsByLocation.bind(this);
    this.getWaybillsByLocationCalendarData = this.getWaybillsByLocationCalendarData.bind(this);
  }

  async getAllWaybills(req: Request, res: Response): Promise<void> {
    await this.handlers.getAllWaybills(req, res);
  }

  async getWaybillById(req: Request, res: Response): Promise<void> {
    await this.handlers.getWaybillById(req, res);
  }

  async getWaybillByNumber(req: Request, res: Response): Promise<void> {
    await this.handlers.getWaybillByNumber(req, res);
  }

  async getWaybillStats(req: Request, res: Response): Promise<void> {
    await this.handlers.getWaybillStats(req, res);
  }

  async getWaybillCalendarData(req: Request, res: Response): Promise<void> {
    await this.handlers.getWaybillCalendarData(req, res);
  }

  async getWaybillsByLocationStats(req: Request, res: Response): Promise<void> {
    await this.handlers.getWaybillsByLocationStats(req, res);
  }

  async getWaybillsByLocation(req: Request, res: Response): Promise<void> {
    await this.handlers.getWaybillsByLocation(req, res);
  }

  async getWaybillsByLocationCalendarData(
    req: Request,
    res: Response
  ): Promise<void> {
    await this.handlers.getWaybillsByLocationCalendarData(req, res);
  }
}
