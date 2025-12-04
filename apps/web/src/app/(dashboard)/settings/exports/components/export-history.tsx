'use client';

import { useState } from 'react';
import { Download, Trash2, RefreshCw, FileText, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useExports, useDownloadExport, useDeleteExport } from '@/hooks/use-exports';
import { ExportStatus, ExportFormat, ExportResponse } from '@/lib/api/exports';
import { cn } from '@/lib/utils';

const statusConfig: Record<ExportStatus, { label: string; icon: any; variant: string }> = {
  [ExportStatus.PENDING]: {
    label: 'Pending',
    icon: Clock,
    variant: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  },
  [ExportStatus.PROCESSING]: {
    label: 'Processing',
    icon: RefreshCw,
    variant: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  [ExportStatus.VALIDATING]: {
    label: 'Validating',
    icon: RefreshCw,
    variant: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  [ExportStatus.READY]: {
    label: 'Ready',
    icon: CheckCircle2,
    variant: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  [ExportStatus.COMPLETED]: {
    label: 'Completed',
    icon: CheckCircle2,
    variant: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  [ExportStatus.DOWNLOADED]: {
    label: 'Downloaded',
    icon: CheckCircle2,
    variant: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  [ExportStatus.FAILED]: {
    label: 'Failed',
    icon: AlertCircle,
    variant: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
  [ExportStatus.EXPIRED]: {
    label: 'Expired',
    icon: AlertCircle,
    variant: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  },
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export function ExportHistory() {
  const [deleteExport, setDeleteExport] = useState<ExportResponse | null>(null);
  const { data: exportsData, isLoading, refetch } = useExports();
  const downloadMutation = useDownloadExport();
  const deleteMutation = useDeleteExport();

  const handleDownload = (exportItem: ExportResponse) => {
    downloadMutation.mutate({ id: exportItem.id, format: exportItem.format });
  };

  const handleDelete = () => {
    if (deleteExport) {
      deleteMutation.mutate(
        { id: deleteExport.id, format: deleteExport.format },
        {
          onSuccess: () => {
            setDeleteExport(null);
            refetch();
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
          <CardDescription>Loading exports...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const exports = exportsData?.data || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Export History</CardTitle>
              <CardDescription>
                View and download your previous exports
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {exports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No exports yet</h3>
              <p className="text-sm text-muted-foreground">
                Create your first export using the wizard above
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Format</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exports.map((exportItem) => {
                    const StatusIcon = statusConfig[exportItem.status]?.icon || FileText;
                    const canDownload =
                      exportItem.status === ExportStatus.READY ||
                      exportItem.status === ExportStatus.COMPLETED;

                    return (
                      <TableRow key={exportItem.id}>
                        <TableCell>
                          <Badge variant="outline">{exportItem.format}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {exportItem.filename}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon
                              className={cn(
                                'h-4 w-4',
                                exportItem.status === ExportStatus.PROCESSING ||
                                  exportItem.status === ExportStatus.VALIDATING
                                  ? 'animate-spin'
                                  : ''
                              )}
                            />
                            <Badge
                              className={statusConfig[exportItem.status]?.variant}
                              variant="outline"
                            >
                              {statusConfig[exportItem.status]?.label || exportItem.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatFileSize(exportItem.fileSize)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(exportItem.createdAt), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(exportItem)}
                              disabled={!canDownload || downloadMutation.isPending}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteExport(exportItem)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteExport} onOpenChange={(open) => !open && setDeleteExport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Export</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this export? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
