import { Suspense, useState, useCallback, useMemo, useEffect } from "react";
import { fetchOperatorsStats } from "@/api/operatorApi";
import {
  sortOperatorsStatsByNormalParcels,
  sortOperatorsStatsByAccidentParcels,
  getNormalParcelCountFromStats,
  getAccidentParcelCountFromStats,
} from "@/utils/operatorUtils";
import { Stat, PageLayout } from "@components/ui";
import { Search } from "lucide-react";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Table } from "@ui/table";
import React from "react";
import { LoadingSkeleton } from "@components/dashboard/home/waybills";
import type { OperatorsStats } from "@/types/operator";
import { useWorkersListMessage } from "@components/dashboard/workers/list/hooks";
import { PageHeader } from "@components/dashboard/workers/components/PageHeader";
import { WorkersTable } from "@components/dashboard/workers/components/WorkersTable";

function WorkersListContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sorting, setSorting] = useState<Array<{ id: string; desc: boolean }>>([
    { id: "name", desc: false },
  ]);

  // 챗봇 context hook
  const { setTableMessage, isCollecting } = useWorkersListMessage();

  // 새로운 API를 사용해서 통계 데이터 가져오기
  const [operatorsStats, setOperatorsStats] = useState<OperatorsStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로딩
  React.useEffect(() => {
    const loadOperatorsStats = async () => {
      try {
        setIsLoading(true);
        const result = await fetchOperatorsStats();
        setOperatorsStats(result.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "데이터를 불러오는데 실패했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadOperatorsStats();
  }, []);

  // 검색 필터링
  const filteredOperators = useMemo(() => {
    if (!appliedSearch) return operatorsStats;

    return operatorsStats.filter(
      (operator) =>
        operator.code.toLowerCase().includes(appliedSearch.toLowerCase()) ||
        operator.name.toLowerCase().includes(appliedSearch.toLowerCase())
    );
  }, [operatorsStats, appliedSearch]);

  // 정렬 처리
  const currentSort = sorting[0];
  const sortedOperators = useMemo(() => {
    if (!currentSort) return filteredOperators;

    if (currentSort.id === "normalCount") {
      return sortOperatorsStatsByNormalParcels(
        filteredOperators,
        currentSort.desc
      );
    } else if (currentSort.id === "accidentCount") {
      return sortOperatorsStatsByAccidentParcels(
        filteredOperators,
        currentSort.desc
      );
    } else if (currentSort.id === "name") {
      return [...filteredOperators].sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return currentSort.desc ? -comparison : comparison;
      });
    } else if (currentSort.id === "code") {
      return [...filteredOperators].sort((a, b) => {
        const comparison = a.code.localeCompare(b.code);
        return currentSort.desc ? -comparison : comparison;
      });
    }

    return filteredOperators;
  }, [filteredOperators, currentSort]);

  const handleSearch = useCallback(() => {
    setAppliedSearch(searchTerm);
  }, [searchTerm]);

  const handleSearchTermChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleSort = useCallback((columnId: string) => {
    setSorting((prev) => {
      const currentSort = prev.find((sort) => sort.id === columnId);
      if (currentSort) {
        return prev.map((sort) =>
          sort.id === columnId ? { ...sort, desc: !sort.desc } : sort
        );
      } else {
        return [{ id: columnId, desc: false }];
      }
    });
  }, []);

  // 챗봇 메시지 설정
  useEffect(() => {
    if (isCollecting && sortedOperators.length > 0) {
      // 테이블 데이터를 마크다운으로 변환
      const headers = [
        "코드",
        "이름",
        "타입",
        "근무일수",
        "정상처리",
        "사고처리",
        "최초작업일",
      ];
      const rows = sortedOperators.map((operator) => [
        operator.code,
        operator.name,
        operator.type,
        `${operator.workDays}일`,
        `${getNormalParcelCountFromStats(operator)}개`,
        `${getAccidentParcelCountFromStats(operator)}개`,
        operator.firstWorkDate
          ? new Date(operator.firstWorkDate).toLocaleDateString("ko-KR")
          : "-",
      ]);

      const mdHeader = `| ${headers.join(" | ")} |`;
      const mdDivider = `| ${headers.map(() => "---").join(" | ")} |`;
      const mdRows = rows.map((cells) => `| ${cells.join(" | ")} |`).join("\n");
      const markdownTable = [mdHeader, mdDivider, mdRows].join("\n");

      setTableMessage(markdownTable);
    }
  }, [isCollecting, sortedOperators, setTableMessage]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <PageLayout>
        <div className="text-center text-red-500">
          <p>오류가 발생했습니다: {error}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader total={sortedOperators.length} isLoading={false} />
      <Stat.Container>
        <div className="flex items-center justify-between mb-4">
          <Stat.Head className="mb-0">작업자 목록</Stat.Head>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              총 {sortedOperators.length}명
            </span>
          </div>
        </div>

        {/* 필터링 섹션 */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="작업자 코드, 이름으로 검색..."
              value={searchTerm}
              onChange={(e) => handleSearchTermChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="max-w-sm"
            />
          </div>
          <Button onClick={handleSearch}>검색</Button>
        </div>

        {/* 테이블 */}
        <Table>
          <WorkersTable
            operators={sortedOperators}
            sorting={sorting}
            onSort={handleSort}
          />
        </Table>
      </Stat.Container>
    </PageLayout>
  );
}

export function DashboardWorkersListPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <WorkersListContent />
    </Suspense>
  );
}
