export { googleSearchTool } from "./googleSearchTool";

export { mathTool } from "./mathTool";

export {
  waybillSearchTool,
  waybillStatsTool,
  operatorSearchTool,
  operatorWorkTool,
  locationSearchTool,
  salesStatsTool,
  dashboardQueryTool,
  customQueryTool,
  allDbTools,
} from "./dbTools";

import { googleSearchTool } from "./googleSearchTool";
import { mathTool } from "./mathTool";
import { allDbTools } from "./dbTools";

export const getAvailableTools = () => {
  return [googleSearchTool, mathTool, ...allDbTools];
};
