import { useState } from 'react';
import { Search, Filter, X, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface SearchProps {
  onSearch: (query: string) => void;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  creationTimeFilter: string;
}

export function CollectiveSearch({
  onSearch,
  onFilterChange,
  searchQuery,
  creationTimeFilter
}: SearchProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const handleSearch = () => {
    onSearch(localSearchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
      {/* Search Input */}
      <div className="relative w-full md:w-64">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search collectives..."
          className="pl-8"
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          onKeyUp={handleKeyPress}
        />
        {localSearchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full aspect-square rounded-l-none"
            onClick={() => {
              setLocalSearchQuery('');
              onSearch('');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter by Creation Time */}
      <Select
        value={creationTimeFilter}
        onValueChange={onFilterChange}
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by creation" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="year">This Year</SelectItem>
        </SelectContent>
      </Select>

      {/* Search Button (Mobile Only) */}
      <Button
        variant="default"
        size="sm"
        onClick={handleSearch}
        className="md:hidden"
      >
        Search
      </Button>
    </div>
  );
}