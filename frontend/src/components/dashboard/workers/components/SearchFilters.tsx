import { useCallback, memo } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Search } from "lucide-react";

interface SearchFiltersProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSearch: () => void;
}

export const SearchFilters = memo<SearchFiltersProps>(
  ({ searchTerm, onSearchTermChange, onSearch }) => {
    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        onSearch();
      },
      [onSearch]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSearch();
        }
      },
      [onSearch]
    );

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onSearchTermChange(e.target.value);
      },
      [onSearchTermChange]
    );

    return (
      <div className="bg-white rounded-lg border mb-6">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="작업자 코드, 이름으로 검색..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit">검색</Button>
          </form>
        </div>
      </div>
    );
  }
);

SearchFilters.displayName = "SearchFilters";
