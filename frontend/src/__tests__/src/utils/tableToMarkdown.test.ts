import { describe, it, expect } from "vitest";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { renderHook } from "@testing-library/react";
import { generateMarkdownTable } from "@/utils/tableToMarkdown";

type Row = { a: string; b: number; c?: string };

describe("tableToMarkdown", () => {
  it("헤더와 행을 마크다운 문자열로 생성한다", () => {
    const rows: Row[] = [
      { a: "x", b: 1 },
      { a: "y", b: 2, c: "z" },
    ];
    const { result } = renderHook(() => {
      const col = createColumnHelper<Row>();
      const columns = [
        col.accessor("a", { header: "A" }),
        col.accessor("b", { header: "B" }),
        col.accessor("c", {
          header: "C",
          cell: ({ getValue }) => getValue() ?? "-",
        }),
      ];
      return useReactTable({
        data: rows,
        columns,
        getCoreRowModel: getCoreRowModel(),
      });
    });
    const md = generateMarkdownTable(result.current);
    expect(md).toContain("| A | B | C |");
    expect(md).toContain("| --- | --- | --- |");
    expect(md).toContain("| x | 1 | - |");
    expect(md).toContain("| y | 2 | z |");
  });
});
