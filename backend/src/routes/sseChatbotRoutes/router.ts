import express from "express";
import SSEChatbotController from "@controllers/sseChatbotControllers/controller";

const router = express.Router();
const controller = new SSEChatbotController();

router.post("/session", controller.createSession);
router.get("/stream", controller.openStream);
router.post("/send", controller.sendMessage);
router.post("/clear", controller.clearHistory);

export default router;
