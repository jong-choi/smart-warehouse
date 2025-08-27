import { Router } from "express";
import {
  getMonthlySales,
  getDailySales,
  SalesController,
} from "@controllers/sales";

export function setupSalesRoutes(): Router {
  const router = Router();
  const salesController = new SalesController();

  /**
   * @swagger
   * /api/sales/monthly:
   *   get:
   *     summary: 월별 매출 통계 조회
   *     tags: [Sales]
   *     parameters:
   *       - in: query
   *         name: year
   *         schema:
   *           type: integer
   *         description: 조회할 연도 (기본값은 현재 연도)
   *     responses:
   *       200:
   *         description: 월별 매출 데이터
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       period:
   *                         type: string
   *                         example: "2024.01"
   *                       unloadCount:
   *                         type: number
   *                         description: 하차물량(운송장 수)
   *                       totalShippingValue:
   *                         type: number
   *                         description: 총 운송가액
   *                       avgShippingValue:
   *                         type: number
   *                         description: 운송장별 평균 운송가액
   *                       normalProcessCount:
   *                         type: number
   *                         description: 정상처리건수
   *                       processValue:
   *                         type: number
   *                         description: 처리가액
   *                       accidentCount:
   *                         type: number
   *                         description: 사고건수
   *                       accidentValue:
   *                         type: number
   *                         description: 사고가액
   *                 meta:
   *                   type: object
   *                   properties:
   *                     year:
   *                       type: number
   *                     totalMonths:
   *                       type: number
   */
  router.get("/monthly", getMonthlySales);

  /**
   * @swagger
   * /api/sales/daily:
   *   get:
   *     summary: 일별 매출 통계 조회
   *     tags: [Sales]
   *     parameters:
   *       - in: query
   *         name: year
   *         schema:
   *           type: integer
   *         description: 조회할 연도 (기본값은 현재 연도)
   *       - in: query
   *         name: month
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 12
   *         description: 조회할 월 (기본값은 현재 월)
   *     responses:
   *       200:
   *         description: 일별 매출 데이터
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       period:
   *                         type: string
   *                         example: "1일"
   *                       unloadCount:
   *                         type: number
   *                         description: 하차물량(운송장 수)
   *                       totalShippingValue:
   *                         type: number
   *                         description: 총 운송가액
   *                       avgShippingValue:
   *                         type: number
   *                         description: 운송장별 평균 운송가액
   *                       normalProcessCount:
   *                         type: number
   *                         description: 정상처리건수
   *                       processValue:
   *                         type: number
   *                         description: 처리가액
   *                       accidentCount:
   *                         type: number
   *                         description: 사고건수
   *                       accidentValue:
   *                         type: number
   *                         description: 사고가액
   *                 meta:
   *                   type: object
   *                   properties:
   *                     year:
   *                       type: number
   *                     month:
   *                       type: number
   *                     totalDays:
   *                       type: number
   */
  router.get("/daily", getDailySales);

  /**
   * @swagger
   * /api/sales/overview:
   *   get:
   *     summary: 매출 개요 조회
   *     description: 전체 매출 현황과 지역별 매출 통계를 조회합니다.
   *     tags: [Sales]
   *     parameters:
   *       - in: query
   *         name: year
   *         schema:
   *           type: integer
   *         description: 조회할 연도 (기본값은 현재 연도)
   *       - in: query
   *         name: month
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 12
   *         description: 조회할 월 (기본값은 현재 월)
   *     responses:
   *       200:
   *         description: 매출 개요 데이터
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalRevenue:
   *                       type: number
   *                       description: 총 매출액
   *                     totalProcessedCount:
   *                       type: number
   *                       description: 총 처리 건수
   *                     totalAccidentCount:
   *                       type: number
   *                       description: 총 사고 건수
   *                     totalAccidentAmount:
   *                       type: number
   *                       description: 총 사고 금액
   *                     locationSales:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           locationId:
   *                             type: integer
   *                           locationName:
   *                             type: string
   *                           revenue:
   *                             type: number
   *                           processedCount:
   *                             type: number
   *                           accidentCount:
   *                             type: number
   *                           accidentAmount:
   *                             type: number
   */
  router.get("/overview", (req, res) =>
    salesController.getSalesOverview(req, res)
  );

  /**
   * @swagger
   * /api/sales/location:
   *   get:
   *     summary: 지역별 매출 조회
   *     description: 지역별 매출 통계를 조회합니다.
   *     tags: [Sales]
   *     parameters:
   *       - in: query
   *         name: year
   *         schema:
   *           type: integer
   *         description: 조회할 연도 (기본값은 현재 연도)
   *       - in: query
   *         name: month
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 12
   *         description: 조회할 월 (기본값은 현재 월)
   *     responses:
   *       200:
   *         description: 지역별 매출 데이터
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       locationId:
   *                         type: integer
   *                       locationName:
   *                         type: string
   *                       revenue:
   *                         type: number
   *                       processedCount:
   *                         type: number
   *                       accidentCount:
   *                         type: number
   *                       accidentAmount:
   *                         type: number
   */
  router.get("/location", (req, res) =>
    salesController.getLocationSales(req, res)
  );

  return router;
}
