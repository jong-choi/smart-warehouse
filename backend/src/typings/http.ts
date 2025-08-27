import type { Request, Response } from "express";
import type {
  RouteParams,
  RouteQuery,
  ControllerResponse,
  LocationControllerResponse,
  OperatorControllerResponse,
  SalesControllerResponse,
  WaybillControllerResponse,
} from "@typings/index";

// Route-scoped Params/Query derived from generic SSOT types
export type OperatorRouteParams = Pick<
  RouteParams,
  "id" | "code" | "operatorId"
>;
export type OperatorRouteQuery = Pick<
  RouteQuery,
  | "type"
  | "search"
  | "startDate"
  | "endDate"
  | "page"
  | "limit"
  | "sortField"
  | "sortDirection"
  | "status"
>;

export interface OperatorRouteRequest extends Request {
  query: OperatorRouteQuery;
  params: OperatorRouteParams;
}
export type OperatorRouteHandler = (
  req: OperatorRouteRequest,
  res: Response
) => Promise<void>;

export type LocationRouteParams = Pick<RouteParams, "id" | "locationId">;
export type LocationRouteQuery = Pick<
  RouteQuery,
  "page" | "limit" | "getAll" | "startDate" | "endDate"
>;
export interface LocationRouteRequest extends Request {
  query: LocationRouteQuery;
  params: LocationRouteParams;
}
export type LocationRouteHandler = (
  req: LocationRouteRequest,
  res: Response
) => Promise<void>;

export type WaybillRouteParams = Pick<
  RouteParams,
  "id" | "number" | "locationId"
>;
export type WaybillRouteQuery = Pick<
  RouteQuery,
  "search" | "status" | "startDate" | "endDate" | "date"
>;
export interface WaybillRouteRequest extends Request {
  query: WaybillRouteQuery;
  params: WaybillRouteParams;
}
export type WaybillRouteHandler = (
  req: WaybillRouteRequest,
  res: Response
) => Promise<void>;

export type SalesRouteParams = Pick<RouteParams, never> & {
  year?: string;
  month?: string;
};
export type SalesRouteQuery = Pick<RouteQuery, "year" | "month">;
export interface SalesRouteRequest extends Request {
  query: SalesRouteQuery;
  params: SalesRouteParams;
}
export type SalesRouteHandler = (
  req: SalesRouteRequest,
  res: Response
) => Promise<void>;

// Controller-level request/response aliases built on SSOT types
export type OperatorRequest = OperatorRouteRequest;
export type OperatorResponse = OperatorControllerResponse & ControllerResponse;
export type OperatorHandler = OperatorRouteHandler;

export type LocationRequest = LocationRouteRequest;
export type LocationResponse = LocationControllerResponse & ControllerResponse;
export type LocationHandler = LocationRouteHandler;

export type WaybillRequest = WaybillRouteRequest;
export type WaybillResponse = WaybillControllerResponse & ControllerResponse;
export type WaybillHandler = WaybillRouteHandler;

export type SalesRequest = SalesRouteRequest;
export type SalesResponse = SalesControllerResponse & ControllerResponse;
export type SalesHandler = SalesRouteHandler;

