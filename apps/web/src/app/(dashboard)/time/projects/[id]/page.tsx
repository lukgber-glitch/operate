'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, DollarSign, Users, TrendingUp, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useProject, useTimeEntries, formatDuration, formatHours } from '@/hooks/use-time-tracking';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusColors = {
  ACTIVE: 'bg-green-600 text-white',
  PAUSED: 'bg-yellow-600 text-white',
  COMPLETED: 'bg-blue-600 text-white',
  ARCHIVED: 'bg-gray-600 text-white',
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { project, isLoading, fetchProject } = useProject(projectId);
  const { entries, fetchEntries } = useTimeEntries({ projectId, pageSize: 100 });

  useEffect(() => {
    fetchProject();
    fetchEntries();
  }, [fetchProject, fetchEntries]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-gray-400">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-gray-400">Project not found</div>
      </div>
    );
  }

  const budgetPercentage = project.usedBudgetPercentage || 0;
  const isOverBudget = budgetPercentage > 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/time/projects">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-6 w-6 rounded-full" style={{ backgroundColor: project.color || '#6b7280' }} />
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
              <Badge className={statusColors[project.status]}>{project.status}</Badge>
            </div>
            {project.client && <p className="text-gray-300">Client: {project.client.name}</p>}
          </div>
        </div>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Edit Project
        </Button>
      </div>

      {/* Description */}
      {project.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-300">{project.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatHours(project.totalHours || 0)}</div>
            {project.budgetHours && (
              <p className="text-xs text-gray-400 mt-1">Budget: {formatHours(project.budgetHours * 3600)}</p>
            )}
          </CardContent>
        </Card>

        {project.billable && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                Total Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${((project.totalAmount || 0) / 100).toFixed(2)}</div>
              {project.budgetAmount && (
                <p className="text-xs text-gray-400 mt-1">Budget: ${(project.budgetAmount / 100).toFixed(2)}</p>
              )}
            </CardContent>
          </Card>
        )}

        {project.hourlyRate && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-purple-400" />
                Hourly Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${(project.hourlyRate / 100).toFixed(2)}</div>
              <p className="text-xs text-gray-400 mt-1">per hour</p>
            </CardContent>
          </Card>
        )}

        {project.profitability !== undefined && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-yellow-400" />
                Profitability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  'text-2xl font-bold',
                  project.profitability > 0 ? 'text-green-400' : 'text-red-400'
                )}
              >
                {project.profitability > 0 ? '+' : ''}
                {project.profitability.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Budget Progress */}
      {project.budgetHours && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">
                  {formatHours(project.totalHours || 0)} of {formatHours(project.budgetHours * 3600)} used
                </span>
                <span className={cn('font-medium', isOverBudget ? 'text-red-400' : 'text-white')}>
                  {budgetPercentage.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={Math.min(budgetPercentage, 100)}
                className={cn('h-3', isOverBudget && '[&>div]:bg-red-500')}
              />
              {isOverBudget && (
                <p className="text-sm text-red-400">Over budget by {(budgetPercentage - 100).toFixed(1)}%</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead>Billable</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                    No time entries yet
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(new Date(entry.startTime), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="max-w-xs truncate">{entry.description || '-'}</TableCell>
                    <TableCell>{entry.user?.name || '-'}</TableCell>
                    <TableCell className="text-right font-mono">{formatDuration(entry.duration)}</TableCell>
                    <TableCell>
                      {entry.billable ? (
                        <Badge variant="default" className="bg-green-600">
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.amount ? `$${(entry.amount / 100).toFixed(2)}` : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
