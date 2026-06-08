import SSEChatbotController from "@controllers/sseChatbotControllers/controller";
import { createProductionChatRuntime } from "@controllers/sseChatbotControllers/runtime";
import { createSSEChatbotRouter } from "./router";

export { createSSEChatbotRouter } from "./router";

export default createSSEChatbotRouter(
  new SSEChatbotController(createProductionChatRuntime())
);
