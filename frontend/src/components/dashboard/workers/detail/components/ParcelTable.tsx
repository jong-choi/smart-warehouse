import { Link, useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableRow } from "@ui/table";
import type { OperatorParcel } from "@/types/operator";
import { STATUS_MAP } from "@utils/stautsMap";
import { StatusBadge } from "@ui/status-badge";
import { formatCurrency } from "@utils/formatString";

interface ParcelTableProps {
  parcels: OperatorParcel[];
  total: number;
}

export function ParcelTable({ parcels, total }: ParcelTableProps) {
  const navigate = useNavigate();
  const onRowClick = (parcel: OperatorParcel) => {
    navigate(`/dashboard/waybills/${parcel.id}`);
  };

  return (
    <div className="bg-card rounded-lg border">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">처리 내역</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">총 {total}개</span>
          </div>
        </div>

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
            {parcels.map((parcel) => {
              return (
                <TableRow
                  key={parcel.id}
                  onClick={() => onRowClick(parcel)}
                  className="cursor-pointer"
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
      </div>
    </div>
  );
}
