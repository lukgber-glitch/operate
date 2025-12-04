/**
 * Employee List Step
 * Step 2 of pay run wizard - Select employees to include in payroll
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { usePayrollEmployees } from '@/hooks/use-payroll';
import { usePayRun } from '@/hooks/use-pay-run';
import { PayrollEmployeeRow } from '../PayrollEmployeeRow';
import { Users, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EmployeeListStepProps {
  companyUuid: string;
}

export function EmployeeListStep({ companyUuid }: EmployeeListStepProps) {
  const { data: employees, isLoading } = usePayrollEmployees(companyUuid);
  const {
    setEmployees,
    selectedEmployees,
    toggleEmployee,
    selectAllEmployees,
    deselectAllEmployees,
  } = usePayRun();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (employees) {
      setEmployees(employees);
    }
  }, [employees, setEmployees]);

  const filteredEmployees = employees?.filter((emp) => {
    const query = searchQuery.toLowerCase();
    return (
      emp.firstName.toLowerCase().includes(query) ||
      emp.lastName.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      emp.jobTitle.toLowerCase().includes(query)
    );
  });

  const allSelected = filteredEmployees?.every((emp) =>
    selectedEmployees.includes(emp.employeeUuid)
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!employees || employees.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Employees Found</h3>
        <p className="text-muted-foreground">
          No active employees found. Please add employees first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Employees</h3>
        <p className="text-muted-foreground">
          Choose which employees to include in this pay run. All active employees are selected by default.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => allSelected ? deselectAllEmployees() : selectAllEmployees()}
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredEmployees?.map((employee) => (
              <PayrollEmployeeRow
                key={employee.employeeUuid}
                employee={employee}
                isSelected={selectedEmployees.includes(employee.employeeUuid)}
                onToggleSelect={toggleEmployee}
                showCheckbox
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Selected Employees</p>
              <p className="text-sm text-muted-foreground">
                {selectedEmployees.length} of {employees.length} employees selected
              </p>
            </div>
            <Badge variant="default" className="text-lg px-4 py-2">
              {selectedEmployees.length}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
