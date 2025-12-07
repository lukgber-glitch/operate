'use client';

import { Plus, Download } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { EmployeeFilters } from '@/components/hr/employee-filters';
import { EmployeeTable } from '@/components/hr/employee-table';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Button } from '@/components/ui/button';
import { HeadlineOutside } from '@/components/ui/headline-outside';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useEmployees } from '@/hooks/use-employees';

export default function EmployeesPage() {
  const { toast } = useToast();
  const [pageSize, setPageSize] = useState(10);

  const {
    employees,
    total,
    page,
    totalPages,
    isLoading,
    error,
    filters,
    setFilters,
    fetchEmployees,
    deleteEmployee,
  } = useEmployees({ page: 1, limit: pageSize });

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...newFilters, page: 1 });
    fetchEmployees({ ...newFilters, page: 1 });
  };

  const handleReset = () => {
    const resetFilters = { page: 1, limit: pageSize };
    setFilters(resetFilters);
    fetchEmployees(resetFilters);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEmployee(id);
      toast({
        title: 'Success',
        description: 'Employee deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete employee',
        variant: 'destructive',
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    fetchEmployees(newFilters);
  };

  const handlePageSizeChange = (newSize: string) => {
    const size = parseInt(newSize);
    setPageSize(size);
    const newFilters = { ...filters, page: 1, limit: size };
    setFilters(newFilters);
    fetchEmployees(newFilters);
  };

  const handleExport = () => {
    toast({
      title: 'Export',
      description: 'Export functionality coming soon',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <HeadlineOutside subtitle="Manage your organization's employees">
          Employees
        </HeadlineOutside>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <Link href="/hr/employees/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Link>
          </Button>
        </div>
      </div>

      <AnimatedCard variant="elevated" padding="lg">
        <div className="space-y-6">
          <EmployeeFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {employees.length} of {total} employees
              </p>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <EmployeeTable
              employees={employees}
              isLoading={isLoading}
              onDelete={handleDelete}
            />

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      // Show first, last, current, and adjacent pages
                      return (
                        p === 1 ||
                        p === totalPages ||
                        (p >= page - 1 && p <= page + 1)
                      );
                    })
                    .map((p, i, arr) => {
                      // Add ellipsis for gaps
                      const prev = arr[i - 1];
                      const showEllipsis = prev && p - prev > 1;

                      return (
                        <div key={p} className="flex items-center gap-1">
                          {showEllipsis && <span className="px-2">...</span>}
                          <Button
                            variant={page === p ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(p)}
                            className="min-w-[40px]"
                          >
                            {p}
                          </Button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
}
