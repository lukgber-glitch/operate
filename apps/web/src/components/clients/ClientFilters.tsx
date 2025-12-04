'use client';

import { Search, X, Calendar, Tag, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { ClientFilters as ClientFilterType } from '@/lib/api/clients';

interface ClientFiltersProps {
  filters: ClientFilterType;
  onFilterChange: (filters: Partial<ClientFilterType>) => void;
  isLoading?: boolean;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function ClientFilters({ filters, onFilterChange, isLoading }: ClientFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 500);

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFilterChange({ search: debouncedSearch || undefined });
    }
  }, [debouncedSearch]);

  const activeFilterCount = [
    filters.status,
    filters.type,
    filters.isVip,
    filters.tags?.length,
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setSearchInput('');
    onFilterChange({
      search: undefined,
      status: undefined,
      type: undefined,
      isVip: undefined,
      tags: undefined,
    });
  };

  const hasActiveFilters = searchInput || activeFilterCount > 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or client number..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-9"
                disabled={isLoading}
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchInput('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Advanced Filters</h4>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                      >
                        Clear all
                      </Button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={filters.status || 'all'}
                      onValueChange={(value) =>
                        onFilterChange({ status: value === 'all' ? undefined : value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="PROSPECT">Prospect</SelectItem>
                        <SelectItem value="CHURNED">Churned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type Filter */}
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={filters.type || 'all'}
                      onValueChange={(value) =>
                        onFilterChange({ type: value === 'all' ? undefined : value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                        <SelectItem value="COMPANY">Company</SelectItem>
                        <SelectItem value="CUSTOMER">Customer</SelectItem>
                        <SelectItem value="LEAD">Lead</SelectItem>
                        <SelectItem value="PROSPECT">Prospect</SelectItem>
                        <SelectItem value="PARTNER">Partner</SelectItem>
                        <SelectItem value="VENDOR">Vendor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* VIP Filter */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="vip-filter" className="cursor-pointer">
                      VIP Clients Only
                    </Label>
                    <Switch
                      id="vip-filter"
                      checked={filters.isVip || false}
                      onCheckedChange={(checked) =>
                        onFilterChange({ isVip: checked ? true : undefined })
                      }
                    />
                  </div>

                  {/* Tags Filter */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {['high-priority', 'vip', 'new', 'enterprise', 'small-business'].map((tag) => {
                        const isSelected = filters.tags?.includes(tag);
                        return (
                          <Badge
                            key={tag}
                            variant={isSelected ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => {
                              const currentTags = filters.tags || [];
                              const newTags = isSelected
                                ? currentTags.filter((t) => t !== tag)
                                : [...currentTags, tag];
                              onFilterChange({ tags: newTags.length > 0 ? newTags : undefined });
                            }}
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchInput && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchInput}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSearchInput('')}
                  />
                </Badge>
              )}
              {filters.status && (
                <Badge variant="secondary" className="gap-1">
                  Status: {filters.status}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => onFilterChange({ status: undefined })}
                  />
                </Badge>
              )}
              {filters.type && (
                <Badge variant="secondary" className="gap-1">
                  Type: {filters.type}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => onFilterChange({ type: undefined })}
                  />
                </Badge>
              )}
              {filters.isVip && (
                <Badge variant="secondary" className="gap-1">
                  VIP Only
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => onFilterChange({ isVip: undefined })}
                  />
                </Badge>
              )}
              {filters.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  Tag: {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() =>
                      onFilterChange({
                        tags: filters.tags?.filter((t) => t !== tag),
                      })
                    }
                  />
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-6 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
