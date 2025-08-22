// 운송장 관련 툴들
export { waybillSearchTool, waybillStatsTool } from './waybillTools';

// 작업자 관련 툴들
export { operatorSearchTool, operatorWorkTool } from './operatorTools';

// 배송지 관련 툴들
export { locationSearchTool, salesStatsTool } from './locationTools';

// 분석 툴들
export { dashboardQueryTool, customQueryTool } from './analyticsTools';

// 개별 툴들을 import
import { waybillSearchTool, waybillStatsTool } from './waybillTools';
import { operatorSearchTool, operatorWorkTool } from './operatorTools';
import { locationSearchTool, salesStatsTool } from './locationTools';
import { dashboardQueryTool, customQueryTool } from './analyticsTools';

// 모든 DB 툴들을 배열로 export
export const allDbTools = [
  // 운송장 툴들
  waybillSearchTool,
  waybillStatsTool,
  
  // 작업자 툴들
  operatorSearchTool,
  operatorWorkTool,
  
  // 배송지 툴들
  locationSearchTool,
  salesStatsTool,
  
  // 분석 툴들
  dashboardQueryTool,
  customQueryTool
];