import { Request, Response } from "express";
import { OperatorHandlers } from "./handlers";

export class OperatorController {
  private handlers: OperatorHandlers;

  constructor() {
    this.handlers = new OperatorHandlers();
  }

  async getAllOperators(req: Request, res: Response): Promise<void> {
    await this.handlers.getAllOperators(req, res);
  }

  async getOperatorById(req: Request, res: Response): Promise<void> {
    await this.handlers.getOperatorById(req, res);
  }

  async getOperatorByCode(req: Request, res: Response): Promise<void> {
    await this.handlers.getOperatorByCode(req, res);
  }

  async getOperatorStats(req: Request, res: Response): Promise<void> {
    await this.handlers.getOperatorStats(req, res);
  }

  async getOperatorShifts(req: Request, res: Response): Promise<void> {
    await this.handlers.getOperatorShifts(req, res);
  }

  async getOperatorWorks(req: Request, res: Response): Promise<void> {
    await this.handlers.getOperatorWorks(req, res);
  }

  async getAllOperatorsStats(req: Request, res: Response): Promise<void> {
    await this.handlers.getAllOperatorsStats(req, res);
  }
}
