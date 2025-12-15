'use client';

import Link from 'next/link';
import { Clock, DollarSign, Users, MoreVertical, Archive, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatHours } from '@/hooks/use-time-tracking';
import type { Project } from '@/lib/api/time-tracking';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onArchive?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

const statusColors = {
  ACTIVE: 'bg-green-600 text-white',
  PAUSED: 'bg-yellow-600 text-white',
  COMPLETED: 'bg-blue-600 text-white',
  ARCHIVED: 'bg-gray-600 text-white',
};

export function ProjectCard({ project, onEdit, onArchive, onDelete }: ProjectCardProps) {
  const budgetPercentage = project.usedBudgetPercentage || 0;
  const isOverBudget = budgetPercentage > 100;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-4 w-4 rounded-full flex-shrink-0" style={{ backgroundColor: project.color || '#6b7280' }} />
              <CardTitle className="text-lg truncate">
                <Link href={`/time/projects/${project.id}`} className="hover:underline">
                  {project.name}
                </Link>
              </CardTitle>
            </div>
            {project.client && <p className="text-sm text-gray-300">{project.client.name}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[project.status]}>{project.status}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(project)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onArchive && project.status !== 'ARCHIVED' && (
                  <DropdownMenuItem onClick={() => onArchive(project)}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={() => onDelete(project)} className="text-red-400">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {project.description && <p className="text-sm text-gray-400 mt-2 line-clamp-2">{project.description}</p>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Budget Progress */}
          {project.budgetHours && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Budget Progress</span>
                <span className={cn('font-medium', isOverBudget ? 'text-red-400' : 'text-white')}>
                  {formatHours(project.totalHours || 0)} / {formatHours(project.budgetHours * 3600)}
                </span>
              </div>
              <Progress
                value={Math.min(budgetPercentage, 100)}
                className={cn(isOverBudget && '[&>div]:bg-red-500')}
              />
              {isOverBudget && (
                <p className="text-xs text-red-400">Over budget by {(budgetPercentage - 100).toFixed(1)}%</p>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-gray-300">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Total Hours</span>
              </div>
              <p className="text-xl font-bold text-white">{formatHours(project.totalHours || 0)}</p>
            </div>
            {project.billable && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-gray-300">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs">Total Amount</span>
                </div>
                <p className="text-xl font-bold text-white">
                  ${((project.totalAmount || 0) / 100).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Profitability */}
          {project.profitability !== undefined && (
            <div className="pt-3 border-t border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Profitability</span>
                <span
                  className={cn(
                    'font-medium',
                    project.profitability > 0 ? 'text-green-400' : 'text-red-400'
                  )}
                >
                  {project.profitability > 0 ? '+' : ''}
                  {project.profitability.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
