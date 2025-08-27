import { Router } from "express";
import { WaybillController } from "@controllers/waybill";

export function setupWaybillRoutes(): Router {
  const router = Router();
  const waybillController = new WaybillController();

  /**
   * @swagger
   * /api/waybills:
   *   get:
   *     summary: 모든 운송장 목록 조회 (페이지네이션 지원)
   *     description: 필터링 옵션과 페이지네이션을 사용하여 운송장 목록을 조회합니다.
   *     tags: [운송장 (Waybills)]
   *     parameters:
   *       - $ref: '#/components/parameters/WaybillStatus'
   *       - $ref: '#/components/parameters/StartDate'
   *       - $ref: '#/components/parameters/EndDate'
   *       - $ref: '#/components/parameters/Page'
   *       - $ref: '#/components/parameters/Limit'
   *       - $ref: '#/components/parameters/GetAll'
   *     responses:
   *       200:
   *         description: 성공적으로 운송장 목록을 조회했습니다.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Waybill'
   *                 pagination:
   *                   $ref: '#/components/schemas/PaginationInfo'
   */
  router.get("/", (req, res) => waybillController.getAllWaybills(req, res));

  /**
   * @swagger
   * /api/waybills/stats:
   *   get:
   *     summary: 운송장 상태별 통계 조회
   *     description: 운송장의 상태별 통계 정보를 조회합니다.
   *     tags: [운송장 (Waybills)]
   *     responses:
   *       200:
   *         description: 성공적으로 통계를 조회했습니다.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                       example: 4
   *                     byStatus:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           status:
   *                             type: string
   *                             example: DELIVERED
   *                           count:
   *                             type: integer
   *                             example: 1
   */
  router.get("/stats", (req, res) =>
    waybillController.getWaybillStats(req, res)
  );

  /**
   * @swagger
   * /api/waybills/calendar:
   *   get:
   *     summary: 운송장 달력 데이터 조회
   *     description: 특정 기간의 운송장 날짜별 통계를 조회합니다.
   *     tags: [운송장 (Waybills)]
   *     parameters:
   *       - name: startDate
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           format: date
   *         description: 시작 날짜 (YYYY-MM-DD)
   *       - name: endDate
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           format: date
   *         description: 종료 날짜 (YYYY-MM-DD)
   *     responses:
   *       200:
   *         description: 성공적으로 달력 데이터를 조회했습니다.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       date:
   *                         type: string
   *                         format: date
   *                         example: "2025-01-15"
   *                       count:
   *                         type: integer
   *                         example: 3
   *                       statuses:
   *                         type: object
   *                         properties:
   *                           DELIVERED:
   *                             type: integer
   *                             example: 1
   *                           IN_TRANSIT:
   *                             type: integer
   *                             example: 2
   */
  router.get("/calendar", (req, res) =>
    waybillController.getWaybillCalendarData(req, res)
  );

  /**
   * @swagger
   * /api/waybills/number/{number}:
   *   get:
   *     summary: 운송장 번호로 조회
   *     description: 운송장 번호로 특정 운송장을 조회합니다.
   *     tags: [운송장 (Waybills)]
   *     parameters:
   *       - name: number
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: 운송장 번호
   *     responses:
   *       200:
   *         description: 성공적으로 운송장을 조회했습니다.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Waybill'
   *       404:
   *         description: 운송장을 찾을 수 없음
   */
  router.get("/number/:number", (req, res) =>
    waybillController.getWaybillByNumber(req, res)
  );

  /**
   * @swagger
   * /api/waybills/{id}:
   *   get:
   *     summary: 특정 운송장 상세 조회
   *     description: ID로 특정 운송장의 상세 정보를 조회합니다.
   *     tags: [운송장 (Waybills)]
   *     parameters:
   *       - $ref: '#/components/parameters/WaybillId'
   *     responses:
   *       200:
   *         description: 성공적으로 운송장 정보를 조회했습니다.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Waybill'
   *       404:
   *         description: 운송장을 찾을 수 없음
   */
  /**
   * @swagger
   * /api/waybills/by-location/stats:
   *   get:
   *     summary: 지역별 운송장 통계 조회
   *     description: 지역별로 운송장 개수와 상태별 통계를 조회합니다.
   *     tags: [운송장 (Waybills)]
   *     parameters:
   *       - $ref: '#/components/parameters/WaybillStatus'
   *       - $ref: '#/components/parameters/StartDate'
   *       - $ref: '#/components/parameters/EndDate'
   *     responses:
   *       200:
   *         description: 성공적으로 지역별 운송장 통계를 조회했습니다.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       locationId:
   *                         type: number
   *                       locationName:
   *                         type: string
   *                       address:
   *                         type: string
   *                       count:
   *                         type: number
   *                       statuses:
   *                         type: object
   */
  router.get("/by-location/stats", (req, res) =>
    waybillController.getWaybillsByLocationStats(req, res)
  );

  /**
   * @swagger
   * /api/waybills/by-location/calendar:
   *   get:
   *     summary: 지역별 운송장 달력 데이터 조회
   *     description: 지역별 운송장의 날짜별 통계 데이터를 조회합니다.
   *     tags: [운송장 (Waybills)]
   *     parameters:
   *       - $ref: '#/components/parameters/WaybillStatus'
   *       - $ref: '#/components/parameters/StartDate'
   *       - $ref: '#/components/parameters/EndDate'
   *     responses:
   *       200:
   *         description: 성공적으로 지역별 운송장 달력 데이터를 조회했습니다.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       date:
   *                         type: string
   *                       count:
   *                         type: number
   *                       statuses:
   *                         type: object
   *                       locations:
   *                         type: array
   */
  router.get("/by-location/calendar", (req, res) =>
    waybillController.getWaybillsByLocationCalendarData(req, res)
  );

  /**
   * @swagger
   * /api/waybills/by-location/{locationId}:
   *   get:
   *     summary: 특정 지역의 운송장 목록 조회
   *     description: 특정 지역에 배송되는 운송장 목록을 조회합니다.
   *     tags: [운송장 (Waybills)]
   *     parameters:
   *       - in: path
   *         name: locationId
   *         required: true
   *         schema:
   *           type: integer
   *         description: 지역 ID
   *       - $ref: '#/components/parameters/WaybillStatus'
   *       - $ref: '#/components/parameters/StartDate'
   *       - $ref: '#/components/parameters/EndDate'
   *       - $ref: '#/components/parameters/Page'
   *       - $ref: '#/components/parameters/Limit'
   *       - $ref: '#/components/parameters/GetAll'
   *     responses:
   *       200:
   *         description: 성공적으로 지역별 운송장 목록을 조회했습니다.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Waybill'
   */
  router.get("/by-location/:locationId", (req, res) =>
    waybillController.getWaybillsByLocation(req, res)
  );

  router.get("/:id", (req, res) => waybillController.getWaybillById(req, res));

  return router;
}
