'use client';

import { ArrowLeft, Plus, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LeaveBalanceCard } from '@/components/hr/leave-balance-card';
import { LeaveCalendar } from '@/components/hr/leave-calendar';
import { LeaveRequestForm } from '@/components/hr/leave-request-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useLeave } from '@/hooks/use-leave';
import { cn } from '@/lib/utils';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export default function EmployeeLeavePage() {
  const params = useParams();
  const { toast } = useToast();
  const employeeId = params.id as string;

  const {
    balances,
    requests,
    isLoading,
    error,
    fetchBalances,
    fetchRequests,
    createRequest,
    cancelRequest,
  } = useLeave(employeeId);

  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    fetchBalances();
    fetchRequests();
  }, [fetchBalances, fetchRequests]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleSubmit = async (data: any) => {
    try {
      await createRequest(data);
      toast({
        title: 'Success',
        description: 'Leave request submitted successfully',
      });
      setShowDialog(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit leave request',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelRequest(id);
      toast({
        title: 'Success',
        description: 'Leave request cancelled successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel leave request',
        variant: 'destructive',
      });
    }
  };

  if (isLoading && balances.length === 0 && requests.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-[150px]" />
          <Skeleton className="h-[150px]" />
          <Skeleton className="h-[150px]" />
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
              <Link href={`/hr/employees/${employeeId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl text-white font-semibold tracking-tight">Leave Management</h1>
              <p className="text-muted-foreground">View balances and manage leave requests</p>
            </div>
          </div>

          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Request Leave
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {balances.map((balance) => (
            <LeaveBalanceCard key={balance.id} balance={balance} />
          ))}
        </div>

        <Card className="rounded-[24px]">
          <CardContent className="p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <LeaveCalendar requests={requests} />

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Leave History</h2>

              {requests.length === 0 ? (
                <div className="rounded-lg border p-8 text-center">
                  <p className="text-muted-foreground">No leave requests found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.leaveType?.name}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(request.startDate).toLocaleDateString()} -{' '}
                            {new Date(request.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{request.days}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn(statusColors[request.status])}
                            >
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {request.status === 'PENDING' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancel(request.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Leave</DialogTitle>
          </DialogHeader>
          <LeaveRequestForm
            onSubmit={handleSubmit}
            onCancel={() => setShowDialog(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
