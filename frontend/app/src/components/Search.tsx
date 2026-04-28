import { Search as SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchProps {
  searchInput: string;
  setSearchInput: (value: string) => void;
  searchQuery?: string;
  total?: number;
  clearSearch: () => void;
  placeholder?: string;
}

export default function Search({
  searchInput,
  setSearchInput,
  searchQuery,
  total,
  clearSearch,
  placeholder = '搜索作品名或作者...',
}: SearchProps) {
  return (
    <div className="mb-6">
      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchInput && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {searchQuery && (
        <p className="mt-2 text-sm text-muted-foreground">
          搜索 "{searchQuery}" 的结果：{total} 个作品
        </p>
      )}
    </div>
  );
}
