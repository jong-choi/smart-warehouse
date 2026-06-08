import express from "express";
import SSEChatbotController from "@controllers/sseChatbotControllers/controller";

export const createSSEChatbotRouter = (controller: SSEChatbotController) => {
  const router = express.Router();

  router.post("/session", controller.createSession);
  router.get("/stream", controller.openStream);
  router.post("/send", controller.sendMessage);
  router.post("/clear", controller.clearHistory);

  return router;
};
