import { Suspense, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { useOperatorDetailSuspense } from "@/hooks/useOperator";
import { useChatUiStore } from "@stores/chatUiStore";
import { Stat } from "@components/ui";
import { Input } from "@components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@ui/table";
import { STATUS_MAP } from "@utils/stautsMap";
import { StatusBadge } from "@ui/status-badge";
import { formatCurrency } from "@utils/formatString";
import { Link } from "react-router-dom";
import { LoadingSkeleton } from "@components/dashboard/home/waybills";
import { OperatorInfoCards } from "@components/dashboard/workers/detail/components/OperatorInfoCards";
import { DetailHeader } from "@components/dashboard/workers/detail/components/DetailHeader";

function WorkerDetailContent() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  // Suspense 데이터 패칭
  const { data: operator } = useOperatorDetailSuspense(
    code || "",
    page,
    pageSize,
    statusFilter,
    startDate || undefined,
    endDate || undefined
  );
  const { setSystemContext, isCollecting, setIsMessagePending } =
    useChatUiStore(["setSystemContext", "isCollecting", "setIsMessagePending"]);
  // 챗봇 컨텍스트 업데이트
  useEffect(() => {
    if (!operator || !isCollecting) return;
    // operator 주요 정보
    const info =
      `작업자 상세 정보 (/dashboard/workers/detail/${operator.code})\n\n` +
      `⦁ 이름: ${operator.name}\n` +
      `⦁ 코드: ${operator.code}\n` +
      `⦁ 타입: ${operator.type === "HUMAN" ? "사람" : "로봇"}\n` +
      `⦁ 등록일: ${new Date(operator.createdAt).toLocaleDateString(
        "ko-KR"
      )}\n` +
      `⦁ 총 처리 건수: ${operator.waybills.length}건\n`;
    // 필터 정보
    const filters = `\n⦁ 적용된 필터:\n- 상태: ${
      statusFilter === "all" ? "전체" : statusFilter
    }\n- 시작일: ${startDate || "(미지정)"}\n- 종료일: ${
      endDate || "(미지정)"
    }`;
    // 테이블(waybills) 마크다운
    const tableHeader = `| 운송장 번호 | 상태 | 배송지 | 운송가액 | 처리일시 |\n|---|---|---|---|---|`;
    const tableRows = operator.waybills
      .map((parcel) => {
        const statusLabel =
          parcel.status === "NORMAL"
            ? "정상"
            : parcel.status === "ACCIDENT"
            ? "사고"
            : parcel.status === "UNLOADED"
            ? "하차완료"
            : parcel.status === "PENDING_UNLOAD"
            ? "하차대기"
            : parcel.status;
        const declaredValue = parcel.parcel?.declaredValue ?? 0;
        return `| ${parcel.waybill?.number ?? "-"} | ${statusLabel} | ${
          parcel.location.name
        } | ${declaredValue.toLocaleString()}원 | ${new Date(
          parcel.processedAt
        ).toLocaleString("ko-KR")} |`;
      })
      .join("\n");
    const table = `\n⦁ 처리 내역 (최대 20건):\n${tableHeader}\n${tableRows}`;
    // 전체 context
    const context = `${info}${filters}${table}`;
    setSystemContext(context);
    setIsMessagePending(false);
  }, [
    operator,
    statusFilter,
    startDate,
    endDate,
    isCollecting,
    setSystemContext,
    setIsMessagePending,
  ]);
  if (!operator) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            작업자 정보를 불러오는데 실패했습니다.
          </p>
        </div>
      </div>
    );
  }
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };
  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setPage(1);
  };
  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setPage(1);
  };
  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1);
  };
  return (
    <div className="space-y-6">
      <DetailHeader operator={operator} />
      <OperatorInfoCards operator={operator} />

      <Stat.Container>
        <div className="flex items-center justify-between mb-4">
          <Stat.Head className="mb-0">처리 내역</Stat.Head>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              총 {operator.waybillsPagination?.total || 0}개
            </span>
          </div>
        </div>

        {/* 필터링 섹션 */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">상태:</span>
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="NORMAL">정상</SelectItem>
                <SelectItem value="ACCIDENT">사고</SelectItem>
                <SelectItem value="UNLOADED">하차완료</SelectItem>
                <SelectItem value="PENDING_UNLOAD">하차대기</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">시작일:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">종료일:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        {/* 테이블 */}
        <Table>
          <thead>
            <tr>
              <th className="px-4 py-3 text-left font-medium">운송장 번호</th>
              <th className="px-4 py-3 text-left font-medium">상태</th>
              <th className="px-4 py-3 text-left font-medium">배송지</th>
              <th className="px-4 py-3 text-left font-medium">운송가액</th>
              <th className="px-4 py-3 text-left font-medium">처리일시</th>
            </tr>
          </thead>
          <TableBody>
            {operator.waybills.map((parcel) => {
              return (
                <TableRow
                  key={parcel.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/dashboard/waybills/${parcel.id}`)}
                >
                  <TableCell className="font-medium">
                    <Link to={`/dashboard/waybills/${parcel.id}`}>
                      {parcel.number ?? parcel.id ?? "-"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge color={STATUS_MAP[parcel.status].color}>
                      {STATUS_MAP[parcel.status].text}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{parcel.location.name}</TableCell>
                  <TableCell>
                    {formatCurrency(parcel.parcel?.declaredValue ?? 0)}
                  </TableCell>
                  <TableCell>
                    {new Date(parcel.processedAt).toLocaleString("ko-KR")}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* 페이징 */}
        {operator.waybillsPagination && (
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                페이지당 행 수:
              </span>
              <Select
                value={pageSize.toString()}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                이전
              </Button>
              <span className="text-sm">
                {page} / {operator.waybillsPagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= operator.waybillsPagination.totalPages}
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </Stat.Container>
    </div>
  );
}

export function DashboardWorkerDetailPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <WorkerDetailContent />
    </Suspense>
  );
}
