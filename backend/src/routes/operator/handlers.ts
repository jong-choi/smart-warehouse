import { Router } from "express";
import { OperatorController } from "@controllers/operator";

export function setupOperatorRoutes(): Router {
  const router = Router();
  const operatorController = new OperatorController();

  /**
   * @swagger
   * /api/operators:
   *   get:
   *     summary: 모든 작업자 목록 조회 (페이지네이션 지원)
   *     description: 필터링 옵션과 페이지네이션을 사용하여 작업자 목록을 조회합니다.
   *     tags: [작업자 (Operators)]
   *     parameters:
   *       - $ref: '#/components/parameters/OperatorType'
   *       - $ref: '#/components/parameters/StartDate'
   *       - $ref: '#/components/parameters/EndDate'
   *       - $ref: '#/components/parameters/Page'
   *       - $ref: '#/components/parameters/Limit'
   *       - $ref: '#/components/parameters/GetAll'
   *     responses:
   *       200:
   *         description: 성공적으로 작업자 목록을 조회했습니다.
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
   *                     $ref: '#/components/schemas/Operator'
   *                 pagination:
   *                   $ref: '#/components/schemas/PaginationInfo'
   */
  router.get("/", (req, res) => operatorController.getAllOperators(req, res));

  /**
   * @swagger
   * /api/operators/stats:
   *   get:
   *     summary: 작업자별 통계 조회
   *     description: 작업자별 상세 통계 정보를 조회합니다. 날짜 범위를 지정하면 해당 기간의 통계를 조회하고, 지정하지 않으면 전체 기간의 통계를 조회합니다.
   *     tags: [작업자 (Operators)]
   *     parameters:
   *       - $ref: '#/components/parameters/StartDate'
   *       - $ref: '#/components/parameters/EndDate'
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
   *                   $ref: '#/components/schemas/OperatorStats'
   */
  router.get("/stats", (req, res) =>
    operatorController.getOperatorStats(req, res)
  );

  /**
   * @swagger
   * /api/operators/stats/summary:
   *   get:
   *     summary: 모든 작업자 통계 요약 조회
   *     description: 모든 작업자의 통계 요약 정보를 조회합니다. 작업일수, 정상처리 갯수, 사고처리 갯수, 최초 작업일 등의 정보를 포함합니다.
   *     tags: [작업자 (Operators)]
   *     responses:
   *       200:
   *         description: 성공적으로 작업자 통계 요약을 조회했습니다.
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
   *                     $ref: '#/components/schemas/OperatorsStats'
   *                 count:
   *                   type: integer
   *                   example: 5
   */
  router.get("/stats/summary", (req, res) =>
    operatorController.getAllOperatorsStats(req, res)
  );

  /**
   * @swagger
   * /api/operators/code/{code}:
   *   get:
   *     summary: 작업자 코드로 조회
   *     description: 작업자 코드로 특정 작업자를 조회합니다.
   *     tags: [작업자 (Operators)]
   *     parameters:
   *       - name: code
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: 작업자 코드
   *     responses:
   *       200:
   *         description: 성공적으로 작업자를 조회했습니다.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Operator'
   *       404:
   *         description: 작업자를 찾을 수 없음
   */
  router.get("/code/:code", (req, res) =>
    operatorController.getOperatorByCode(req, res)
  );

  /**
   * @swagger
   * /api/operators/{operatorId}/shifts:
   *   get:
   *     summary: 작업자의 근무 기록 조회
   *     description: |
   *       특정 작업자의 근무 기록을 조회합니다.
   *
   *       **근무 기록 정보:**
   *       - `date`: 근무 날짜 (하루 단위)
   *       - `startTime`: 해당 날의 근무 시작 시간
   *       - `endTime`: 해당 날의 근무 종료 시간
   *
   *       **조회 파라미터:**
   *       - `startDate`: 조회 시작 날짜 (YYYY-MM-DD)
   *       - `endDate`: 조회 종료 날짜 (YYYY-MM-DD)
   *
   *       **예시:** 2024-12-01부터 2024-12-07까지의 근무 기록 조회
   *     tags: [작업자 (Operators)]
   *     parameters:
   *       - name: operatorId
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *         description: 작업자 ID
   *       - name: startDate
   *         in: query
   *         schema:
   *           type: string
   *           format: date
   *         description: 조회 시작 날짜 (YYYY-MM-DD) - 해당 날짜부터의 근무 기록 조회
   *         example: "2024-12-01"
   *       - name: endDate
   *         in: query
   *         schema:
   *           type: string
   *           format: date
   *         description: 조회 종료 날짜 (YYYY-MM-DD) - 해당 날짜까지의 근무 기록 조회
   *         example: "2024-12-07"
   *     responses:
   *       200:
   *         description: 성공적으로 근무 기록을 조회했습니다.
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
   *                     $ref: '#/components/schemas/OperatorShift'
   *                 count:
   *                   type: integer
   *                   example: 1
   *       400:
   *         description: 잘못된 요청
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: 유효하지 않은 작업자 ID입니다.
   */
  router.get("/:operatorId/shifts", (req, res) =>
    operatorController.getOperatorShifts(req, res)
  );

  /**
   * @swagger
   * /api/operators/{operatorId}/works:
   *   get:
   *     summary: 작업자의 작업 통계 조회
   *     description: |
   *       특정 작업자의 작업 통계를 조회합니다.
   *
   *       **작업 통계 정보:**
   *       - `date`: 작업 날짜 (하루 단위)
   *       - `processedCount`: 처리한 소포 수
   *       - `accidentCount`: 사고 처리 건수
   *       - `revenue`: 발생 매출
   *       - `errorCount`: 기타 오류 수
   *
   *       **조회 파라미터:**
   *       - `startDate`: 조회 시작 날짜 (YYYY-MM-DD)
   *       - `endDate`: 조회 종료 날짜 (YYYY-MM-DD)
   *
   *       **예시:** 2024-12-01부터 2024-12-07까지의 작업 통계 조회
   *     tags: [작업자 (Operators)]
   *     parameters:
   *       - name: operatorId
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *         description: 작업자 ID
   *       - name: startDate
   *         in: query
   *         schema:
   *           type: string
   *           format: date
   *         description: 조회 시작 날짜 (YYYY-MM-DD) - 해당 날짜부터의 작업 통계 조회
   *         example: "2024-12-01"
   *       - name: endDate
   *         in: query
   *         schema:
   *           type: string
   *           format: date
   *         description: 조회 종료 날짜 (YYYY-MM-DD) - 해당 날짜까지의 작업 통계 조회
   *         example: "2024-12-07"
   *     responses:
   *       200:
   *         description: 성공적으로 작업 통계를 조회했습니다.
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
   *                     $ref: '#/components/schemas/OperatorWork'
   *                 count:
   *                   type: integer
   *                   example: 1
   *       400:
   *         description: 잘못된 요청
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: 유효하지 않은 작업자 ID입니다.
   */
  router.get("/:operatorId/works", (req, res) =>
    operatorController.getOperatorWorks(req, res)
  );

  /**
   * @swagger
   * /api/operators/{id}:
   *   get:
   *     summary: 특정 작업자 상세 조회
   *     description: ID로 특정 작업자의 상세 정보를 조회합니다.
   *     tags: [작업자 (Operators)]
   *     parameters:
   *       - $ref: '#/components/parameters/OperatorId'
   *     responses:
   *       200:
   *         description: 성공적으로 작업자 정보를 조회했습니다.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Operator'
   *       404:
   *         description: 작업자를 찾을 수 없음
   */
  router.get("/:id", (req, res) =>
    operatorController.getOperatorById(req, res)
  );

  return router;
}
