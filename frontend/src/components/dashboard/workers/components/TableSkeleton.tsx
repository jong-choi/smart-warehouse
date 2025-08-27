import { Table, TableBody, TableCell, TableHead, TableRow } from "@ui/table";

interface TableSkeletonProps {
  rows?: number;
}

export function TableSkeleton({ rows = 5 }: TableSkeletonProps) {
  return (
    <div className="bg-white rounded-lg border">
      <div className="p-6 border-b">
        {/* <h2 className="text-lg font-semibold">작업자 정보</h2> */}
        <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
      </div>
      <div className="p-6">
        <Table>
          <thead>
            <TableRow>
              <TableHead className="bg-gray-200 rounded animate-pulse" />
              <TableHead className="bg-gray-200 rounded animate-pulse" />
              <TableHead className="bg-gray-200 rounded animate-pulse" />
              <TableHead className="bg-gray-200 rounded animate-pulse" />
              <TableHead className="bg-gray-200 rounded animate-pulse" />
              <TableHead className="bg-gray-200 rounded animate-pulse" />
              <TableHead className="bg-gray-200 rounded animate-pulse" />
              <TableHead className="bg-gray-200 rounded animate-pulse" />
            </TableRow>
          </thead>
          <TableBody>
            {Array.from({ length: rows }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-12"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-12"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* 페이징 네비게이션 스켈레톤 */}
        <div className="flex items-center justify-between mt-6">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-12"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-12"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
