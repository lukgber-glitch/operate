'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AutopilotAction, AutopilotActionStatus, AutopilotActionType } from '@/hooks/use-autopilot';
import {
  AutopilotActionIcon,
  getActionTypeLabel,
  getActionTypeColor,
} from './AutopilotActionIcon';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

interface AutopilotActivityFeedProps {
  actions: AutopilotAction[];
  isLoading?: boolean;
}

function getStatusBadge(status: AutopilotActionStatus) {
  const variants: Record<AutopilotActionStatus, { label: string; className: string }> = {
    EXECUTED: { label: 'Executed', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    APPROVED: { label: 'Approved', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    REJECTED: { label: 'Rejected', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
    FAILED: { label: 'Failed', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    PENDING: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  };

  const variant = variants[status];
  return (
    <Badge variant="outline" className={cn('border', variant.className)}>
      {variant.label}
    </Badge>
  );
}

function ActivityItem({ action }: { action: AutopilotAction }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-white/5 last:border-0"
    >
      <div className="flex items-start gap-4 p-4 hover:bg-white/5 transition-colors">
        {/* Timeline line */}
        <div className="relative flex flex-col items-center">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              getActionTypeColor(action.type)
            )}
          >
            <AutopilotActionIcon type={action.type} className="h-4 w-4" />
          </div>
          {!expanded && (
            <div className="absolute top-8 h-full w-px bg-white/10" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-white">
                  {getActionTypeLabel(action.type)}
                </span>
                {getStatusBadge(action.status)}
              </div>
              <p className="mt-1 text-sm text-gray-400">{action.description}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <span>{formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}</span>
                {action.executedAt && (
                  <>
                    <span>•</span>
                    <span>Executed {formatDistanceToNow(new Date(action.executedAt), { addSuffix: true })}</span>
                  </>
                )}
              </div>
            </div>

            {/* Expand button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400"
            >
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  expanded && 'rotate-180'
                )}
              />
            </Button>
          </div>

          {/* Expanded details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <div className="rounded-lg bg-white/5 p-4 space-y-3">
                  {action.confidence && (
                    <div>
                      <span className="text-xs text-gray-500">Confidence:</span>
                      <span className="ml-2 text-sm text-white">{action.confidence}%</span>
                    </div>
                  )}

                  {action.entityType && (
                    <div>
                      <span className="text-xs text-gray-500">Entity:</span>
                      <span className="ml-2 text-sm text-white capitalize">{action.entityType}</span>
                      {action.entityId && (
                        <span className="ml-2 text-xs text-gray-500 font-mono">
                          ({action.entityId})
                        </span>
                      )}
                    </div>
                  )}

                  {action.metadata && (
                    <div>
                      <span className="text-xs text-gray-500 block mb-2">Metadata:</span>
                      <pre className="text-xs text-gray-400 overflow-auto">
                        {JSON.stringify(action.metadata, null, 2)}
                      </pre>
                    </div>
                  )}

                  {action.rejectionReason && (
                    <div className="rounded bg-red-500/10 border border-red-500/20 p-3">
                      <span className="text-xs text-red-400">Rejection Reason:</span>
                      <p className="mt-1 text-sm text-red-300">{action.rejectionReason}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/10 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{format(new Date(action.createdAt), 'PPp')}</span>
                    </div>
                    {action.executedAt && (
                      <div className="flex justify-between mt-1">
                        <span>Executed:</span>
                        <span>{format(new Date(action.executedAt), 'PPp')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export function AutopilotActivityFeed({ actions, isLoading }: AutopilotActivityFeedProps) {
  const [filterType, setFilterType] = useState<AutopilotActionType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AutopilotActionStatus | 'all'>('all');

  const filteredActions = actions.filter((action) => {
    if (filterType !== 'all' && action.type !== filterType) return false;
    if (filterStatus !== 'all' && action.status !== filterStatus) return false;
    return true;
  });

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Activity Feed</h3>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
              <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CATEGORIZE_TRANSACTION">Categorize</SelectItem>
                <SelectItem value="CREATE_INVOICE">Create Invoice</SelectItem>
                <SelectItem value="SEND_REMINDER">Send Reminder</SelectItem>
                <SelectItem value="RECONCILE_TRANSACTION">Reconcile</SelectItem>
                <SelectItem value="EXTRACT_RECEIPT">Extract Receipt</SelectItem>
                <SelectItem value="PAY_BILL">Pay Bill</SelectItem>
                <SelectItem value="FILE_EXPENSE">File Expense</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
              <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="EXECUTED">Executed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading activity...</div>
        ) : filteredActions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No activity to display</div>
        ) : (
          <div>
            {filteredActions.map((action) => (
              <ActivityItem key={action.id} action={action} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
