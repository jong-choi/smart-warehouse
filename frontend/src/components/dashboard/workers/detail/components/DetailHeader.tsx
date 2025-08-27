import type { OperatorDetail } from "@/types/operator";

interface DetailHeaderProps {
  operator: OperatorDetail;
}

export function DetailHeader({ operator }: DetailHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {operator.name} ({operator.code})
          </h1>
          <p className="text-muted-foreground">작업자 상세 정보 및 처리 내역</p>
        </div>
      </div>
    </div>
  );
}
