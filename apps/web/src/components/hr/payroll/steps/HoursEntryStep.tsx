/**
 * Hours Entry Step
 * Step 3 of pay run wizard - Enter hours for hourly employees
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayRun } from '@/hooks/use-pay-run';
import { PayrollEmployeeRow } from '../PayrollEmployeeRow';
import { Clock, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/hooks/use-payroll';

export function HoursEntryStep() {
  const { selectedEmployeeList, hoursData, setHours, getEmployeeGrossPay } = usePayRun();

  const hourlyEmployees = selectedEmployeeList.filter(
    (emp) => emp.compensationType === 'hourly'
  );
  const salaryEmployees = selectedEmployeeList.filter(
    (emp) => emp.compensationType === 'salary'
  );

  const totalHourlyHours = hourlyEmployees.reduce(
    (sum, emp) => sum + (hoursData[emp.employeeUuid] || 0),
    0
  );

  const missingHours = hourlyEmployees.filter(
    (emp) => !hoursData[emp.employeeUuid] || hoursData[emp.employeeUuid] === 0
  );

  const setStandardHours = (hours: number) => {
    hourlyEmployees.forEach((emp) => {
      setHours(emp.employeeUuid, hours);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Enter Hours</h3>
        <p className="text-muted-foreground">
          Enter the hours worked for hourly employees during this pay period.
        </p>
      </div>

      {missingHours.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Missing Hours
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {missingHours.length} employee{missingHours.length > 1 ? 's' : ''} need hours entered
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hourlyEmployees.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <Label>Quick Fill:</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStandardHours(40)}
            >
              40 hrs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStandardHours(80)}
            >
              80 hrs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStandardHours(0)}
            >
              Clear All
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {hourlyEmployees.map((employee) => (
                  <PayrollEmployeeRow
                    key={employee.employeeUuid}
                    employee={employee}
                    isSelected={true}
                    hours={hoursData[employee.employeeUuid]}
                    onHoursChange={setHours}
                    grossPay={getEmployeeGrossPay(employee.employeeUuid)}
                    showHours
                    showPay
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Total Hours</p>
                    <p className="text-sm text-muted-foreground">
                      Across {hourlyEmployees.length} hourly employee{hourlyEmployees.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Badge variant="default" className="text-lg px-4 py-2">
                  {totalHourlyHours.toFixed(2)} hrs
                </Badge>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {salaryEmployees.length > 0 && (
        <>
          <div>
            <h4 className="font-medium mb-2">Salaried Employees</h4>
            <p className="text-sm text-muted-foreground mb-4">
              These employees receive their standard salary amount. No hours entry required.
            </p>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {salaryEmployees.map((employee) => (
                  <PayrollEmployeeRow
                    key={employee.employeeUuid}
                    employee={employee}
                    isSelected={true}
                    grossPay={getEmployeeGrossPay(employee.employeeUuid)}
                    showPay
                    readOnly
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {hourlyEmployees.length === 0 && salaryEmployees.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Employees Selected</h3>
          <p className="text-muted-foreground">
            Please go back and select employees to continue.
          </p>
        </div>
      )}
    </div>
  );
}
