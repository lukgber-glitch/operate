'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Eye, ArrowRight, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AutopilotAction } from '@/hooks/use-autopilot';
import {
  AutopilotActionIcon,
  getActionTypeLabel,
  getActionTypeColor,
} from './AutopilotActionIcon';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface PendingApprovalCardProps {
  action: AutopilotAction;
  onApprove: (actionId: string) => Promise<void>;
  onReject: (actionId: string) => Promise<void>;
  isLoading?: boolean;
}

export function PendingApprovalCard({
  action,
  onApprove,
  onReject,
  isLoading = false,
}: PendingApprovalCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      await onApprove(action.id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    setActionLoading('reject');
    try {
      await onReject(action.id);
    } finally {
      setActionLoading(null);
    }
  };

  const confidenceColor = action.confidence >= 90
    ? 'text-green-400'
    : action.confidence >= 75
    ? 'text-yellow-400'
    : 'text-orange-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      layout
    >
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm transition-colors hover:bg-white/10">
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Action type icon */}
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-lg',
                getActionTypeColor(action.type)
              )}
            >
              <AutopilotActionIcon type={action.type} className="h-6 w-6" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">
                      {getActionTypeLabel(action.type)}
                    </h3>
                    <Badge
                      variant="outline"
                      className={cn('border-white/20', confidenceColor)}
                    >
                      <TrendingUp className="mr-1 h-3 w-3" />
                      {action.confidence}% confident
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-400">{action.description}</p>

                  {/* Entity info */}
                  {action.entityType && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <span className="capitalize">{action.entityType}</span>
                      {action.metadata && (
                        <>
                          <span>•</span>
                          {action.metadata.amount && (
                            <span className="font-mono">
                              €{action.metadata.amount.toFixed(2)}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Old → New value preview */}
                  {action.oldValue && action.newValue && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <span className="text-gray-500">{JSON.stringify(action.oldValue)}</span>
                      <ArrowRight className="h-4 w-4 text-gray-500" />
                      <span className="text-white font-medium">{JSON.stringify(action.newValue)}</span>
                    </div>
                  )}
                </div>

                <div className="text-right text-xs text-gray-500">
                  {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={isLoading || actionLoading !== null}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  {actionLoading === 'approve' ? (
                    'Approving...'
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReject}
                  disabled={isLoading || actionLoading !== null}
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  {actionLoading === 'reject' ? (
                    'Rejecting...'
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-gray-400"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {showDetails ? 'Hide' : 'View'} Details
                </Button>
              </div>

              {/* Detailed metadata */}
              {showDetails && action.metadata && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 rounded-lg bg-white/5 p-4"
                >
                  <pre className="text-xs text-gray-400 overflow-auto">
                    {JSON.stringify(action.metadata, null, 2)}
                  </pre>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
