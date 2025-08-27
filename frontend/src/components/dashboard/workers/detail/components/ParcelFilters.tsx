import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";

interface ParcelFiltersProps {
  statusFilter: string;
  startDate: string;
  endDate: string;
  onStatusFilterChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}

export function ParcelFilters({
  statusFilter,
  startDate,
  endDate,
  onStatusFilterChange,
  onStartDateChange,
  onEndDateChange,
}: ParcelFiltersProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">상태:</span>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
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
        <span className="text-sm font-medium">시작일:</span>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="w-40"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">종료일:</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="w-40"
        />
      </div>
    </div>
  );
}
