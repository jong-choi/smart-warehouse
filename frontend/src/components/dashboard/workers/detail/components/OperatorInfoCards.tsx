import type { OperatorDetail } from "@/types/operator";

interface OperatorInfoCardsProps {
  operator: OperatorDetail;
}

export function OperatorInfoCards({ operator }: OperatorInfoCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-card rounded-lg border p-4">
        <h3 className="font-semibold text-sm text-muted-foreground mb-2">
          작업자 타입
        </h3>
        <p className="text-lg font-medium">
          {operator.type === "HUMAN" ? "사람" : "로봇"}
        </p>
      </div>
      <div className="bg-card rounded-lg border p-4">
        <h3 className="font-semibold text-sm text-muted-foreground mb-2">
          등록일
        </h3>
        <p className="text-lg font-medium">
          {new Date(operator.createdAt).toLocaleDateString("ko-KR")}
        </p>
      </div>
      <div className="bg-card rounded-lg border p-4">
        <h3 className="font-semibold text-sm text-muted-foreground mb-2">
          총 처리 건수
        </h3>
        <p className="text-lg font-medium">{operator.waybills.length}건</p>
      </div>
    </div>
  );
}
