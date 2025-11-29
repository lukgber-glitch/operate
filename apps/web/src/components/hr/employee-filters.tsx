'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { EmployeeFilters as Filters } from '@/lib/api/employees';

interface EmployeeFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onReset: () => void;
}

export function EmployeeFilters({ filters, onFilterChange, onReset }: EmployeeFiltersProps) {
  const [search, setSearch] = useState(filters.search || '');

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({ ...filters, search: value || undefined });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({ ...filters, status: value === 'all' ? undefined : value });
  };

  const handleDepartmentChange = (value: string) => {
    onFilterChange({ ...filters, department: value === 'all' ? undefined : value });
  };

  const handleCountryChange = (value: string) => {
    onFilterChange({ ...filters, countryCode: value === 'all' ? undefined : value });
  };

  const activeFiltersCount = [
    filters.search,
    filters.status,
    filters.department,
    filters.countryCode,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or employee number..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <Select
            value={filters.status || 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="ON_LEAVE">On Leave</SelectItem>
              <SelectItem value="TERMINATED">Terminated</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.department || 'all'}
            onValueChange={handleDepartmentChange}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.countryCode || 'all'}
            onValueChange={handleCountryChange}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              <SelectItem value="DE">Germany</SelectItem>
              <SelectItem value="AT">Austria</SelectItem>
              <SelectItem value="CH">Switzerland</SelectItem>
            </SelectContent>
          </Select>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              onClick={onReset}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
