/**
 * Payroll Employee Row Component
 * Displays employee information in payroll processing
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/hooks/use-payroll';
import { PayrollEmployee } from '@/types/payroll';
import { User } from 'lucide-react';

interface PayrollEmployeeRowProps {
  employee: PayrollEmployee;
  isSelected?: boolean;
  onToggleSelect?: (employeeUuid: string) => void;
  hours?: number;
  onHoursChange?: (employeeUuid: string, hours: number) => void;
  grossPay?: number;
  netPay?: number;
  showHours?: boolean;
  showPay?: boolean;
  showCheckbox?: boolean;
  readOnly?: boolean;
}

export function PayrollEmployeeRow({
  employee,
  isSelected = false,
  onToggleSelect,
  hours,
  onHoursChange,
  grossPay,
  netPay,
  showHours = false,
  showPay = false,
  showCheckbox = false,
  readOnly = false,
}: PayrollEmployeeRowProps) {
  const handleHoursChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    if (onHoursChange && numValue >= 0 && numValue <= 168) {
      onHoursChange(employee.employeeUuid, numValue);
    }
  };

  return (
    <div className="flex items-center gap-4 py-3 px-4 hover:bg-muted/50 rounded-lg transition-colors">
      {showCheckbox && onToggleSelect && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(employee.employeeUuid)}
          disabled={!employee.isActive}
        />
      )}

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">
              {employee.firstName} {employee.lastName}
            </p>
            {!employee.isActive && (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="truncate">{employee.jobTitle}</span>
            {employee.department && (
              <>
                <span>•</span>
                <span className="truncate">{employee.department}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <Badge
            variant={employee.compensationType === 'hourly' ? 'outline' : 'secondary'}
            className="text-xs"
          >
            {employee.compensationType === 'hourly' ? 'Hourly' : 'Salary'}
          </Badge>
          {employee.compensationType === 'hourly' && employee.hourlyRate && (
            <p className="text-sm text-muted-foreground mt-1">
              {formatCurrency(employee.hourlyRate)}/hr
            </p>
          )}
        </div>

        {showHours && employee.compensationType === 'hourly' && (
          <div className="w-24">
            {readOnly ? (
              <div className="text-right font-medium">{hours || 0} hrs</div>
            ) : (
              <Input
                type="number"
                min="0"
                max="168"
                step="0.25"
                value={hours || ''}
                onChange={(e) => handleHoursChange(e.target.value)}
                placeholder="0.00"
                className="text-right"
                disabled={!isSelected}
              />
            )}
          </div>
        )}

        {showPay && (
          <div className="w-32 text-right space-y-1">
            {grossPay !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Gross</p>
                <p className="font-medium">{formatCurrency(grossPay)}</p>
              </div>
            )}
            {netPay !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Net</p>
                <p className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(netPay)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
