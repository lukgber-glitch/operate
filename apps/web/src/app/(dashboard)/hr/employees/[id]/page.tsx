'use client';

import { ArrowLeft, Pencil, Trash2, Download } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { EmployeeCard } from '@/components/hr/employee-card';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useEmployee } from '@/hooks/use-employees';
import { employeeApi } from '@/lib/api/employees';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const { employee, isLoading, error, fetchEmployee } = useEmployee(id);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await employeeApi.deleteEmployee(id);
      toast({
        title: 'Success',
        description: 'Employee deleted successfully',
      });
      router.push('/hr/employees');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete employee',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleExport = () => {
    toast({
      title: 'Export',
      description: 'Export functionality coming soon',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Employee not found</p>
          <Button asChild className="mt-4">
            <Link href="/hr/employees">Back to Employees</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/hr/employees">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Employee Details</h1>
              <p className="text-muted-foreground">View and manage employee information</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/hr/employees/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <EmployeeCard employee={employee} />

        <Card className="rounded-[24px]">
          <CardContent className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contracts">Contracts</TabsTrigger>
              <TabsTrigger value="leave">Leave</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <h3 className="mb-4 font-semibold">Personal Information</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Date of Birth</dt>
                      <dd>
                        {employee.dateOfBirth
                          ? new Date(employee.dateOfBirth).toLocaleDateString()
                          : '-'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Gender</dt>
                      <dd>{employee.gender || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Nationality</dt>
                      <dd>{employee.nationality || '-'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-4 font-semibold">Employment Details</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Employee Number</dt>
                      <dd>{employee.employeeNumber}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Hire Date</dt>
                      <dd>{new Date(employee.hireDate).toLocaleDateString()}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Department</dt>
                      <dd>{employee.department || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Status</dt>
                      <dd>{employee.status}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-4 font-semibold">Tax Information</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Tax ID</dt>
                      <dd>{employee.taxId ? '••••••••••' : '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Tax Class</dt>
                      <dd>{employee.taxClass || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Church Tax</dt>
                      <dd>{employee.churchTax ? 'Yes' : 'No'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-4 font-semibold">Banking Information</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Bank Name</dt>
                      <dd>{employee.bankName || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">IBAN</dt>
                      <dd>
                        {employee.iban
                          ? `${employee.iban.slice(0, 4)}••••${employee.iban.slice(-4)}`
                          : '-'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">BIC</dt>
                      <dd>{employee.bic || '-'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contracts">
              <div className="rounded-lg border p-8 text-center">
                <p className="text-muted-foreground">
                  Contracts view coming soon. Navigate to{' '}
                  <Link
                    href={`/hr/employees/${id}/contracts`}
                    className="text-primary underline"
                  >
                    dedicated contracts page
                  </Link>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="leave">
              <div className="rounded-lg border p-8 text-center">
                <p className="text-muted-foreground">
                  Leave view coming soon. Navigate to{' '}
                  <Link
                    href={`/hr/employees/${id}/leave`}
                    className="text-primary underline"
                  >
                    dedicated leave page
                  </Link>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="documents">
              <div className="rounded-lg border p-8 text-center">
                <p className="text-muted-foreground">
                  Documents view coming soon. Navigate to{' '}
                  <Link
                    href={`/hr/employees/${id}/documents`}
                    className="text-primary underline"
                  >
                    dedicated documents page
                  </Link>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="rounded-lg border p-8 text-center">
                <p className="text-muted-foreground">Activity log coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee
              record for {employee.firstName} {employee.lastName} and all associated
              data including contracts, leave requests, and documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Employee'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
