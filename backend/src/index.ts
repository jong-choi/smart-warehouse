import express from "express";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { createServer } from "http";
import "module-alias/register";
import {
  waybillRoutes,
  operatorRoutes,
  locationRoutes,
  salesRoutes,
} from "@src/routes";
import { setupChatbotSocket } from "@src/routes/chatbotRoutes";
import { specs } from "@src/config/swagger";
import sseChatbotRoutes from "@src/routes/sseChatbotRoutes";

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 4000;

// 미들웨어
app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN || "http://localhost:3000",
      "http://localhost:5173", // Vite 개발 서버
      "http://localhost:4173", // Vite 프리뷰 서버
      "http://localhost:3050", // 팩토리 도커
      "https://factory.jongchoi.com", // 프로덕션 도메인
      "http://factory.jongchoi.com", // HTTP 프로덕션 도메인
      "https://smartfactory.jongchoi.com", // 스마트팩토리 도메인
      "http://smartfactory.jongchoi.com", // HTTP 스마트팩토리 도메인
      "https://warehouse.jongchoi.com", // 창고 도메인
      "http://warehouse.jongchoi.com", // HTTP 창고 도메인
    ],
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Swagger 문서
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "택배 관리 시스템 API 문서",
  })
);

// 라우트
app.use("/api/waybills", waybillRoutes);
app.use("/api/operators", operatorRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/chat", sseChatbotRoutes);

// 헬스 체크
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 택배 관리 시스템 API가 정상적으로 실행 중입니다",
    timestamp: new Date().toISOString(),
    endpoints: {
      waybills: "/api/waybills",
      operators: "/api/operators",
      locations: "/api/locations",
    },
  });
});

// 404 핸들러
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// 글로벌 에러 핸들러
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Error:", error);

    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
);

// 웹소켓 서버 설정
setupChatbotSocket(server);

server.listen(Number(PORT), "0.0.0.0", () => {
  // Server started successfully
  console.log(`Server is running on port ${PORT}`);
});
