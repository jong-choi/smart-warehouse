import { Request, Response } from "express";
import { SalesHandlers } from "./handlers";

export class SalesController {
  private handlers: SalesHandlers;

  constructor() {
    this.handlers = new SalesHandlers();
  }

  async getSalesOverview(req: Request, res: Response): Promise<void> {
    await this.handlers.getSalesOverview(req, res);
  }

  async getLocationSales(req: Request, res: Response): Promise<void> {
    await this.handlers.getLocationSales(req, res);
  }
}

export const getMonthlySales = async (
  req: Request,
  res: Response
): Promise<void> => {
  const handlers = new SalesHandlers();
  await handlers.getMonthlySales(req, res);
};

export const getDailySales = async (
  req: Request,
  res: Response
): Promise<void> => {
  const handlers = new SalesHandlers();
  await handlers.getDailySales(req, res);
};
