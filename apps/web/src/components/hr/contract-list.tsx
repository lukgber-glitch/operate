'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Contract } from '@/lib/api/employees';
import { cn } from '@/lib/utils';

interface ContractListProps {
  contracts: Contract[];
  onEdit?: (contract: Contract) => void;
  onDelete?: (id: string) => void;
}

export function ContractList({ contracts, onEdit, onDelete }: ContractListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (deleteId && onDelete) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatPeriod = (period: string) => {
    return period.charAt(0) + period.slice(1).toLowerCase();
  };

  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[200px] items-center justify-center">
          <p className="text-muted-foreground">No contracts found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {contracts.map((contract) => (
          <Card
            key={contract.id}
            className={cn(
              'transition-all',
              contract.isActive && 'border-primary'
            )}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{contract.jobTitle}</CardTitle>
                    {contract.isActive && (
                      <Badge className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {contract.contractType?.name || 'Unknown Contract Type'}
                  </CardDescription>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(contract)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(contract.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-muted-foreground">Department</dt>
                  <dd className="mt-1">{contract.department || '-'}</dd>
                </div>

                <div>
                  <dt className="font-medium text-muted-foreground">Salary</dt>
                  <dd className="mt-1">
                    {formatCurrency(contract.salaryAmount, contract.salaryCurrency)}{' '}
                    {formatPeriod(contract.salaryPeriod)}
                  </dd>
                </div>

                <div>
                  <dt className="font-medium text-muted-foreground">Start Date</dt>
                  <dd className="mt-1">
                    {new Date(contract.startDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>

                <div>
                  <dt className="font-medium text-muted-foreground">End Date</dt>
                  <dd className="mt-1">
                    {contract.endDate
                      ? new Date(contract.endDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Ongoing'}
                  </dd>
                </div>

                {contract.probationEndDate && (
                  <div>
                    <dt className="font-medium text-muted-foreground">
                      Probation End Date
                    </dt>
                    <dd className="mt-1">
                      {new Date(contract.probationEndDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="font-medium text-muted-foreground">Weekly Hours</dt>
                  <dd className="mt-1">{contract.weeklyHours} hours</dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="font-medium text-muted-foreground">Working Days</dt>
                  <dd className="mt-1">
                    <div className="flex flex-wrap gap-1">
                      {contract.workingDays.map((day) => (
                        <Badge key={day} variant="secondary">
                          {day.charAt(0) + day.slice(1).toLowerCase()}
                        </Badge>
                      ))}
                    </div>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the contract
              record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
