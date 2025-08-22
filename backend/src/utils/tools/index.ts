// 구글 검색 툴
export { googleSearchTool } from "./googleSearchTool";

// 수학 계산 툴
export { mathTool } from "./mathTool";

// DB 관련 툴들
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

// 개별 툴들을 import
import { googleSearchTool } from "./googleSearchTool";
import { mathTool } from "./mathTool";
import { allDbTools } from "./dbTools";

export const getAvailableTools = () => {
  return [googleSearchTool, mathTool, ...allDbTools];
};
