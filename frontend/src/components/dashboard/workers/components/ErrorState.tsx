export function ErrorState() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">작업자 목록</h1>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center text-red-600">
          작업자 목록을 불러오는데 실패했습니다.
        </div>
      </div>
    </div>
  );
}
