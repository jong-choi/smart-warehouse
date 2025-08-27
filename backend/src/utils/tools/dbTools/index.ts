export { waybillSearchTool, waybillStatsTool } from "./waybillTools";

export { operatorSearchTool, operatorWorkTool } from "./operatorTools";

export { locationSearchTool, salesStatsTool } from "./locationTools";

export { dashboardQueryTool, customQueryTool } from "./analyticsTools";

import { waybillSearchTool, waybillStatsTool } from "./waybillTools";
import { operatorSearchTool, operatorWorkTool } from "./operatorTools";
import { locationSearchTool, salesStatsTool } from "./locationTools";
import { dashboardQueryTool, customQueryTool } from "./analyticsTools";

export const allDbTools = [
  waybillSearchTool,
  waybillStatsTool,

  operatorSearchTool,
  operatorWorkTool,

  locationSearchTool,
  salesStatsTool,

  dashboardQueryTool,
  customQueryTool,
];
