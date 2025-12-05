/**
 * Additions & Deductions Step
 * Step 4 of pay run wizard - Add one-time additions (bonuses) and deductions
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { usePayRun } from '@/hooks/use-pay-run';
import { Addition, Deduction } from '@/types/payroll';
import { PlusCircle, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/hooks/use-payroll';
import { v4 as uuidv4 } from 'uuid';

export function AdditionsDeductionsStep() {
  const {
    selectedEmployeeList,
    additions,
    deductions,
    addAddition,
    removeAddition,
    addDeduction,
    removeDeduction,
    getTotalAdditions,
    getTotalDeductions,
  } = usePayRun();

  const [showAdditionForm, setShowAdditionForm] = useState(false);
  const [showDeductionForm, setShowDeductionForm] = useState(false);

  // Addition form state
  const [additionEmployee, setAdditionEmployee] = useState('');
  const [additionType, setAdditionType] = useState<Addition['type']>('bonus');
  const [additionDescription, setAdditionDescription] = useState('');
  const [additionAmount, setAdditionAmount] = useState('');
  const [additionTaxable, setAdditionTaxable] = useState(true);

  // Deduction form state
  const [deductionEmployee, setDeductionEmployee] = useState('');
  const [deductionType, setDeductionType] = useState<Deduction['type']>('other');
  const [deductionDescription, setDeductionDescription] = useState('');
  const [deductionAmount, setDeductionAmount] = useState('');
  const [deductionPretax, setDeductionPretax] = useState(false);

  const handleAddAddition = () => {
    if (!additionEmployee || !additionDescription || !additionAmount) return;

    const newAddition: Addition = {
      id: uuidv4(),
      employeeUuid: additionEmployee,
      type: additionType,
      description: additionDescription,
      amount: additionAmount,
      taxable: additionTaxable,
    };

    addAddition(newAddition);
    resetAdditionForm();
    setShowAdditionForm(false);
  };

  const handleAddDeduction = () => {
    if (!deductionEmployee || !deductionDescription || !deductionAmount) return;

    const newDeduction: Deduction = {
      id: uuidv4(),
      employeeUuid: deductionEmployee,
      type: deductionType,
      description: deductionDescription,
      amount: deductionAmount,
      pretax: deductionPretax,
    };

    addDeduction(newDeduction);
    resetDeductionForm();
    setShowDeductionForm(false);
  };

  const resetAdditionForm = () => {
    setAdditionEmployee('');
    setAdditionType('bonus');
    setAdditionDescription('');
    setAdditionAmount('');
    setAdditionTaxable(true);
  };

  const resetDeductionForm = () => {
    setDeductionEmployee('');
    setDeductionType('other');
    setDeductionDescription('');
    setDeductionAmount('');
    setDeductionPretax(false);
  };

  const getEmployeeName = (uuid: string) => {
    const employee = selectedEmployeeList.find((e) => e.employeeUuid === uuid);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Additions & Deductions</h3>
        <p className="text-muted-foreground">
          Add one-time bonuses, commissions, reimbursements, or deductions for this pay period.
        </p>
      </div>

      {/* Additions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle>Additions</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdditionForm(!showAdditionForm)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Bonus/Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAdditionForm && (
            <Card className="border-2 border-dashed">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Employee</Label>
                    <Select value={additionEmployee} onValueChange={setAdditionEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedEmployeeList.map((emp) => (
                          <SelectItem key={emp.employeeUuid} value={emp.employeeUuid}>
                            {emp.firstName} {emp.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={additionType} onValueChange={(v) => setAdditionType(v as Addition['type'])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bonus">Bonus</SelectItem>
                        <SelectItem value="commission">Commission</SelectItem>
                        <SelectItem value="reimbursement">Reimbursement</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="e.g., Q4 Performance Bonus"
                    value={additionDescription}
                    onChange={(e) => setAdditionDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={additionAmount}
                      onChange={(e) => setAdditionAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Taxable</Label>
                    <div className="flex items-center space-x-2 h-10">
                      <Checkbox
                        checked={additionTaxable}
                        onCheckedChange={(checked) => setAdditionTaxable(checked as boolean)}
                      />
                      <Label className="cursor-pointer">Subject to taxes</Label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddAddition} className="flex-1">
                    Add Addition
                  </Button>
                  <Button variant="outline" onClick={() => {
                    resetAdditionForm();
                    setShowAdditionForm(false);
                  }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {additions.length > 0 ? (
            <div className="space-y-2">
              {additions.map((addition) => (
                <div
                  key={addition.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{getEmployeeName(addition.employeeUuid)}</p>
                      <Badge variant="outline" className="capitalize">
                        {addition.type}
                      </Badge>
                      {addition.taxable && (
                        <Badge variant="secondary">Taxable</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{addition.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-green-600">
                      +{formatCurrency(addition.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAddition(addition.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-2 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Additions</p>
                  <p className="text-xl font-bold text-green-600">
                    +{formatCurrency(getTotalAdditions())}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No additions for this pay period
            </p>
          )}
        </CardContent>
      </Card>

      {/* Deductions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-amber-600" />
              <CardTitle>Deductions</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeductionForm(!showDeductionForm)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Deduction
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showDeductionForm && (
            <Card className="border-2 border-dashed">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Employee</Label>
                    <Select value={deductionEmployee} onValueChange={setDeductionEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedEmployeeList.map((emp) => (
                          <SelectItem key={emp.employeeUuid} value={emp.employeeUuid}>
                            {emp.firstName} {emp.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={deductionType} onValueChange={(v) => setDeductionType(v as Deduction['type'])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="loan">Loan Repayment</SelectItem>
                        <SelectItem value="advance">Advance Repayment</SelectItem>
                        <SelectItem value="garnishment">Garnishment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="e.g., Loan Repayment - Week 3"
                    value={deductionDescription}
                    onChange={(e) => setDeductionDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={deductionAmount}
                      onChange={(e) => setDeductionAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Pre-tax</Label>
                    <div className="flex items-center space-x-2 h-10">
                      <Checkbox
                        checked={deductionPretax}
                        onCheckedChange={(checked) => setDeductionPretax(checked as boolean)}
                      />
                      <Label className="cursor-pointer">Deduct before taxes</Label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddDeduction} className="flex-1">
                    Add Deduction
                  </Button>
                  <Button variant="outline" onClick={() => {
                    resetDeductionForm();
                    setShowDeductionForm(false);
                  }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {deductions.length > 0 ? (
            <div className="space-y-2">
              {deductions.map((deduction) => (
                <div
                  key={deduction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{getEmployeeName(deduction.employeeUuid)}</p>
                      <Badge variant="outline" className="capitalize">
                        {deduction.type}
                      </Badge>
                      {deduction.pretax && (
                        <Badge variant="secondary">Pre-tax</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{deduction.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-amber-600">
                      -{formatCurrency(deduction.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDeduction(deduction.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-2 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Deductions</p>
                  <p className="text-xl font-bold text-amber-600">
                    -{formatCurrency(getTotalDeductions())}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No deductions for this pay period
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
